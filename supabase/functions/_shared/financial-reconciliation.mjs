// Refund objects may omit livemode. providerLivemode MUST come from the trusted
// server API context, never a browser or refund metadata.
// Pure read-only reconciliation. Inject only GET adapters; no provider write API.
// A missing/ambiguous result NEVER licenses retrying an expired idempotency key.
const id = value => typeof value === 'string' ? value : value?.id;
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export async function reconcileRefund(operation, {listRefunds}, {maxPages=20,providerLivemode}={}) {
  if(providerLivemode!==false)throw Error('Verified sandbox provider context required');
  if (!operation || operation.kind !== 'refund' || !uuid.test(operation.id)
    || !uuid.test(operation.payment_id) || operation.currency !== 'usd'
    || !Number.isSafeInteger(operation.amount_cents) || operation.amount_cents <= 0
    || !Number.isSafeInteger(operation.professional_cents) || operation.professional_cents < 0
    || !Number.isSafeInteger(operation.platform_fee_cents) || operation.platform_fee_cents < 0
    || operation.amount_cents !== operation.professional_cents + operation.platform_fee_cents
    || !/^pi_[A-Za-z0-9]+$/.test(operation.payment_intent_id)
    || !/^ch_[A-Za-z0-9]+$/.test(operation.charge_id)
    || !Number.isSafeInteger(maxPages) || maxPages < 1 || maxPages > 100) throw Error('Invalid refund operation');
  const outcome = (state, reason, extra={}) => ({state,reason,execution_enabled:false,retry_allowed:false,...extra});
  const matches = new Map(), cursors = new Set(); let cursor;
  for (let page = 0; page < maxPages; page++) {
    let result;
    try {result = await listRefunds({payment_intent:operation.payment_intent_id,limit:100,...(cursor?{starting_after:cursor}:{})});}
    catch {return outcome('unknown','PROVIDER_READ_FAILED');}
    if (!result || !Array.isArray(result.data) || typeof result.has_more !== 'boolean') return outcome('unknown','INVALID_PROVIDER_PAGE');
    for (const r of result.data) {
      if (!r || !/^re_[A-Za-z0-9]+$/.test(r.id)) return outcome('unknown','INVALID_PROVIDER_OBJECT');
      // Existing legacy refunds without allocation metadata remain explicitly unallocated.
      if (r.id === operation.provider_id || r.metadata?.korvo_operation_id === operation.id) {
        const previous=matches.get(r.id);
        if(previous && JSON.stringify(previous)!==JSON.stringify(r)) return outcome('unknown','INCONSISTENT_PROVIDER_PAGES');
        matches.set(r.id,r);
      }
    }
    if (!result.has_more) {
      if (matches.size !== 1) return outcome('unknown',matches.size?'MULTIPLE_PROVIDER_MATCHES':'NO_PROVEN_PROVIDER_MATCH');
      const r=[...matches.values()][0];
      if (r.livemode === true || r.currency !== operation.currency || r.amount !== operation.amount_cents
        || id(r.payment_intent) !== operation.payment_intent_id || id(r.charge) !== operation.charge_id
        || r.metadata?.korvo_operation_id !== operation.id || r.metadata?.korvo_payment_id !== operation.payment_id
        || (operation.provider_id && operation.provider_id !== r.id)) return outcome('unknown','PROVIDER_ALLOCATION_OR_OWNERSHIP_MISMATCH');
      const states={pending:'pending',requires_action:'pending',succeeded:'succeeded',failed:'failed',canceled:'canceled'};
      if (!Object.hasOwn(states,r.status)) return outcome('unknown','UNRECOGNIZED_PROVIDER_STATE');
      // Digest covers normalized facts, never customer details or arbitrary metadata.
      const facts={id:r.id,amount:r.amount,currency:r.currency,payment_intent:operation.payment_intent_id,
        charge:operation.charge_id,status:r.status,operation_id:operation.id,payment_id:operation.payment_id,livemode:false};
      const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(facts))))).map(b=>b.toString(16).padStart(2,'0')).join('');
      return outcome(states[r.status],'PROVIDER_FACTS_MATCH',{provider_id:r.id,digest});
    }
    const next=result.data.at(-1)?.id;
    if(!next || cursors.has(next)) return outcome('unknown','PROVIDER_CURSOR_STALLED');
    cursors.add(next);cursor=next;
  }
  return outcome('unknown','INCOMPLETE_PROVIDER_SCAN');
}

export function financialAttention(operations, now=Date.now()) {
  return operations.map(o=>{
    const created=Date.parse(o.created_at), age=now-created;
    const reason=!Number.isFinite(created)||age<0?'INVALID_OPERATION_TIME':o.state==='unknown'?'AMBIGUOUS_PROVIDER_OUTCOME':
      ['prepared','pending'].includes(o.state)&&age>=86400000?'STUCK_OPERATION':'REQUIRES_RECONCILIATION';
    return {operation_id:o.id,state:o.state,reason,execution_enabled:false,retry_allowed:false};
  });
}

// Aggregate reconciliation for legacy refunds. A fully refunded original payment
// has a uniquely determined FINAL allocation; individual partial refund splits do not.
export function reconcileLegacyRefunds(payment, refunds, {scanComplete=false,providerLivemode}={}) {
  const unknown=reason=>({status:'needs_review',reason,write_enabled:false});
  if(providerLivemode!==false)return unknown('SANDBOX_PROVIDER_CONTEXT_REQUIRED');
  if(!scanComplete)return unknown('INCOMPLETE_PROVIDER_SCAN');
  const {professional_gross_cents:g,platform_fee_cents:f,customer_total_cents:t}=payment;
  if(![g,f,t,payment.refunded_total_cents].every(Number.isSafeInteger)||g<=0||t>99999999||payment.currency!=='usd'||f!==Math.floor((g*12+50)/100)||t!==g+f)return unknown('INVALID_ORIGINAL_PRICING');
  const seen=new Set();let total=0;
  for(const r of refunds){
    if(!r||!/^re_[A-Za-z0-9]+$/.test(r.id)||seen.has(r.id)||r.livemode===true||r.currency!=='usd'||id(r.payment_intent)!==payment.stripe_payment_intent_id
      ||id(r.charge)!==payment.stripe_charge_id||!Number.isSafeInteger(r.amount)||r.amount<=0)return unknown('INVALID_PROVIDER_REFUND_SET');
    seen.add(r.id);
    if(r.status==='succeeded')total+=r.amount;
    else if(!['failed','canceled'].includes(r.status))return unknown('UNSETTLED_PROVIDER_REFUND');
  }
  if(total!==payment.refunded_total_cents||total>t)return unknown('PROVIDER_DATABASE_TOTAL_MISMATCH');
  if(total!==t)return unknown('PARTIAL_ALLOCATION_REQUIRES_REVIEW');
  return {status:'full_refund_verified',reason:'FINAL_COMPONENT_TOTALS_DETERMINED_BY_ORIGINAL_PAYMENT',
    professional_refunded_cents:g,platform_fee_refunded_cents:f,refunded_total_cents:t,
    individual_refund_allocations_known:false,write_enabled:false};
}
