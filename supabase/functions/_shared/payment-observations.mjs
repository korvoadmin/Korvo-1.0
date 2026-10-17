import {validatePricingSnapshot} from './pricing.mjs';
import {reconcileLegacyRefunds} from './financial-reconciliation.mjs';
const objectId=value=>typeof value==='string'?value:value?.id;
const cents=value=>Number.isSafeInteger(value)&&value>=0&&value<=99999999;
const uuid=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;

// Inject a trusted GET-only adapter, never browser-provided provider facts.
export async function observePayment(payment, get, {providerLivemode,maxPages=20}={}) {
 validatePricingSnapshot(payment);
 if(providerLivemode!==false||!uuid.test(payment.id)
  ||!Number.isSafeInteger(maxPages)||maxPages<1||maxPages>100)throw Error('INVALID_RECONCILIATION_TARGET');
 const findings=new Set();
 const facts={version:1,sandbox:true,state:'needs_review',provider_status:null,source_matches:false,
  gross_cents:null,captured_cents:null,refunded_cents:null,pending_refund_cents:null,transferred_cents:null,reversed_cents:null,
  disputed:null,refunds_complete:false,transfers_complete:false,full_refund_professional_cents:null,full_refund_fee_cents:null,findings:[]};
 const finish=()=>{facts.findings=[...findings].sort();facts.state=findings.has('PROVIDER_UNAVAILABLE')?'provider_unavailable':findings.size?'needs_review':'consistent';return facts;};
 async function pages(path){
  const records=[],seen=new Set();let cursor;
  for(let n=0;n<maxPages;n++){
   const page=await get(path+(path.includes('?')?'&':'?')+'limit=100'+(cursor?'&starting_after='+encodeURIComponent(cursor):''));
   if(!page||!Array.isArray(page.data)||typeof page.has_more!=='boolean')throw Error('INVALID_PROVIDER_PAGE');
   for(const record of page.data){if(!record||typeof record.id!=='string'||seen.has(record.id))throw Error('DUPLICATE_PROVIDER_OBJECT');seen.add(record.id);records.push(record);}
   if(!page.has_more)return records;
   const next=page.data.at(-1)?.id;if(!next||next===cursor)throw Error('INCOMPLETE_PROVIDER_SCAN');cursor=next;
  }
  throw Error('INCOMPLETE_PROVIDER_SCAN');
 }
 if(!payment.stripe_payment_intent_id){findings.add('MISSING_PROVIDER_REFERENCE');return finish();}
 if(!/^pi_[A-Za-z0-9]+$/.test(payment.stripe_payment_intent_id)){findings.add('PAYMENT_SOURCE_MISMATCH');return finish();}
 try{
  const intent=await get('v1/payment_intents/'+payment.stripe_payment_intent_id);
  const states=['requires_payment_method','requires_confirmation','requires_action','processing','requires_capture','canceled','succeeded'];
  if(intent?.livemode!==false||intent.id!==payment.stripe_payment_intent_id||intent.currency!=='usd'
   ||intent.amount!==payment.customer_total_cents||intent.metadata?.korvo_payment_id!==payment.id
   ||intent.metadata?.korvo_pricing_version!==payment.pricing_version||!states.includes(intent.status)){
   findings.add('PAYMENT_SOURCE_MISMATCH');return finish();
  }
  facts.provider_status=intent.status;facts.gross_cents=intent.amount;facts.source_matches=true;
  if(!cents(intent.amount_received)){findings.add('INVALID_PROVIDER_AMOUNTS');return finish();}
  facts.captured_cents=intent.amount_received;
  if(intent.status==='succeeded'&&intent.amount_received!==payment.customer_total_cents)findings.add('CAPTURE_AMOUNT_MISMATCH');
  const chargeId=objectId(intent.latest_charge);
  if(payment.stripe_charge_id&&payment.stripe_charge_id!==chargeId){findings.add('CHARGE_SOURCE_MISMATCH');return finish();}
  if(!chargeId){
   facts.refunded_cents=0;facts.pending_refund_cents=0;facts.disputed=false;facts.refunds_complete=true;
   if(intent.status==='succeeded'||['paid','partially_refunded','refunded','disputed'].includes(payment.status))findings.add('MISSING_PAID_CHARGE');
  }else{
   if(!/^ch_[A-Za-z0-9]+$/.test(chargeId)){findings.add('CHARGE_SOURCE_MISMATCH');return finish();}
   const charge=await get('v1/charges/'+chargeId);
   if(charge?.livemode!==false||charge.id!==chargeId||objectId(charge.payment_intent)!==intent.id
    ||charge.currency!=='usd'||charge.amount!==payment.customer_total_cents||!cents(charge.amount_refunded)
    ||typeof charge.disputed!=='boolean'||typeof charge.paid!=='boolean'||!cents(charge.amount_captured)
    ||charge.amount_captured!==intent.amount_received||(intent.status==='succeeded'&&!charge.paid)||charge.amount_refunded>payment.customer_total_cents){findings.add('CHARGE_SOURCE_MISMATCH');return finish();}
   facts.refunded_cents=charge.amount_refunded;facts.disputed=charge.disputed;
   if(charge.disputed)findings.add('PROVIDER_DISPUTE');
   const refunds=await pages('v1/refunds?payment_intent='+encodeURIComponent(intent.id));
   let succeeded=0,pending=0;
   for(const r of refunds){
    if(!/^re_[A-Za-z0-9]+$/.test(r.id)||r.livemode===true||r.currency!=='usd'||!cents(r.amount)||r.amount===0
     ||objectId(r.charge)!==chargeId||objectId(r.payment_intent)!==intent.id||!['succeeded','pending','requires_action','failed','canceled'].includes(r.status)){
     findings.add('REFUND_SOURCE_MISMATCH');return finish();
    }
    if(r.status==='succeeded')succeeded+=r.amount;else if(['pending','requires_action'].includes(r.status))pending+=r.amount;
   }
   if(!cents(succeeded)||!cents(pending)){findings.add('INVALID_PROVIDER_AMOUNTS');return finish();}
   facts.refunds_complete=true;facts.pending_refund_cents=pending;
   if(succeeded!==charge.amount_refunded)findings.add('PROVIDER_REFUND_TOTAL_MISMATCH');
   if(charge.amount_refunded!==payment.refunded_total_cents)findings.add('DATABASE_REFUND_TOTAL_MISMATCH');
   if(pending)findings.add('PENDING_PROVIDER_REFUND');
   const legacy=reconcileLegacyRefunds({...payment,stripe_charge_id:chargeId},refunds,{scanComplete:true,providerLivemode:false});
   if(legacy.status==='full_refund_verified'){
    facts.full_refund_professional_cents=legacy.professional_refunded_cents;facts.full_refund_fee_cents=legacy.platform_fee_refunded_cents;
   }
   if(payment.refunded_total_cents!==payment.professional_refunded_cents+payment.platform_fee_refunded_cents)findings.add('UNALLOCATED_DATABASE_REFUND');
  }
  const transfers=await pages('v1/transfers');
  let transferred=0,reversed=0;
  for(const t of transfers){
   // Scan every bounded page: a missing group must not hide a transfer from this charge.
   const related=(chargeId&&objectId(t.source_transaction)===chargeId)||t.transfer_group==='korvo_'+payment.id||t.metadata?.korvo_payment_id===payment.id;
   if(!related)continue;
   if(!/^tr_[A-Za-z0-9]+$/.test(t.id)||t.livemode!==false||t.currency!=='usd'||t.transfer_group!=='korvo_'+payment.id
    ||objectId(t.source_transaction)!==chargeId||!cents(t.amount)||!cents(t.amount_reversed)||t.amount_reversed>t.amount){findings.add('TRANSFER_SOURCE_MISMATCH');return finish();}
   transferred+=t.amount;reversed+=t.amount_reversed;
  }
  if(!cents(transferred)||!cents(reversed)){findings.add('INVALID_PROVIDER_AMOUNTS');return finish();}
  facts.transfers_complete=true;facts.transferred_cents=transferred;facts.reversed_cents=reversed;
  if(transferred>payment.professional_gross_cents)findings.add('TRANSFER_EXCEEDS_PROFESSIONAL_GROSS');
  if(transferred&&payment.release_status==='held')findings.add('UNEXPECTED_TRANSFER_ON_HELD_PAYMENT');
  if(payment.release_status==='processing')findings.add('AMBIGUOUS_DATABASE_RELEASE');
  if(payment.status==='disputed'||payment.requires_review)findings.add('DATABASE_REVIEW_HOLD');
  const expected=intent.status==='succeeded'?(facts.disputed?'disputed':facts.refunded_cents===payment.customer_total_cents?'refunded':facts.refunded_cents?'partially_refunded':'paid'):
   intent.status==='processing'?'processing':intent.status==='requires_payment_method'&&intent.last_payment_error?'failed':'awaiting_payment';
  if(payment.status!==expected)findings.add('DATABASE_PAYMENT_STATE_MISMATCH');
  return finish();
 }catch(error){
  findings.add(['INVALID_PROVIDER_PAGE','DUPLICATE_PROVIDER_OBJECT','INCOMPLETE_PROVIDER_SCAN'].includes(error?.message)?error.message:'PROVIDER_UNAVAILABLE');
  return finish();
 }
}
