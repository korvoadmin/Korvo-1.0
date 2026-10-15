(function(global){'use strict';const el=(tag,text)=>{const x=document.createElement(tag);if(text)x.textContent=text;return x;};
 global.KorvoRefundReview={attach({container,client,enabled=global.KORVO_REFUND_REVIEW_ENABLED===true,ledgerEnabled=global.KORVO_FINANCIAL_LEDGER_ENABLED===true}){
  const status=el('p',enabled?'Checking financial access…':'Refund review is not enabled.');status.setAttribute('role','status');container.append(status);const content=el('section');container.append(content);let authorized=false,busy=false;const keys=new Map();
  const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(value);
  const money=c=>Number.isSafeInteger(c)&&c>=0?'$'+(c/100).toFixed(2):'Unavailable';
  async function load(){
   authorized=false;content.replaceChildren();const user=await client.auth.getUser();if(user.error||!user.data?.user)throw Error('Sign in with an authorized financial account.');
   const response=await client.rpc('admin_marketplace_refund_queue');if(response.error||!Array.isArray(response.data))throw Error('Financial access denied or review queue unavailable.');
   let operations=[];
   if(ledgerEnabled){const ledger=await client.rpc('admin_financial_operation_queue');if(ledger.error||!Array.isArray(ledger.data))throw Error('Financial operation queue unavailable. Refresh to reconcile.');operations=ledger.data;}
   authorized=true;status.textContent='Financial review queue. All recommendations require separate authorized processing.';
   const refresh=el('button','Refresh reviews');refresh.type='button';refresh.onclick=()=>{if(!busy)load().catch(e=>{status.textContent=e.message;});};content.append(refresh);
   const form=el('form');const fields={};
   for(const [name,label,type] of [['payment','Payment ID','text'],['professional','Professional refund amount (cents)','number'],['fee','Korvo fee refund amount (cents)','number'],['reason','Reason for review','text']]){
    const wrap=el('label',label),input=el('input');input.name=name;input.type=type;input.required=true;if(type==='number'){input.min='0';input.step='1';}wrap.append(input);form.append(wrap);fields[name]=input;
   }
   const send=el('button','Request refund review');send.type='submit';form.append(send);content.append(form);
   form.onsubmit=async event=>{event.preventDefault();if(!authorized||busy)return;
    const p=Number(fields.professional.value),fee=Number(fields.fee.value),reason=fields.reason.value.trim(),payment=fields.payment.value.trim();
    if(!uuid(payment)||!Number.isSafeInteger(p)||!Number.isSafeInteger(fee)||p<0||fee<0||p+fee<=0||reason.length<10||reason.length>2000){status.textContent='Enter a valid payment ID, whole nonnegative cents and a reason of 10–2000 characters.';return;}
    busy=true;send.disabled=true;
    try{
     const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([payment,p,fee,reason])))),v=>v.toString(16).padStart(2,'0')).join('');const journal='korvoRefundReview:'+digest;
     let key=keys.get(journal);try{key=key||sessionStorage.getItem(journal);}catch{}if(!key){key=crypto.randomUUID();keys.set(journal,key);try{sessionStorage.setItem(journal,key);}catch{}}
     const response=await client.rpc('admin_request_marketplace_refund_review',{p_payment_id:payment,p_request_key:key,p_professional_cents:p,p_platform_fee_cents:fee,p_reason:reason});
     if(response.error||!uuid(response.data?.id)||response.data.execution_enabled!==false)throw Error('Review request was not confirmed. Retry the same request.');
     let reloadFailed=false;try{await load();}catch{reloadFailed=true;}status.textContent=reloadFailed?'Review saved; refresh the queue to reload. No refund was executed.':'Review saved. No refund was executed.';
    }catch(e){status.textContent=e.message;}finally{busy=false;send.disabled=false;}
   };
   for(const review of response.data){
    const card=el('article');card.append(el('h2','Payment '+review.payment_id),el('p','Review state: '+review.state),el('p','Professional: '+money(review.professional_cents)+'; Korvo fee: '+money(review.platform_fee_cents)),el('p',review.reason));
    if(['pending','needs_information'].includes(review.state)){
     const note=el('textarea');note.setAttribute('aria-label','Review note');card.append(note);
     for(const [state,label] of [['needs_information','Request information'],['recommended','Recommend refund'],['rejected','Reject recommendation']]){
      const button=el('button',label);button.type='button';button.onclick=async()=>{if(!authorized||busy)return;const value=note.value.trim();if(value.length<10||value.length>2000){status.textContent='Enter a review note of 10–2000 characters.';return;}busy=true;button.disabled=true;
       try{const r=await client.rpc('admin_review_marketplace_refund',{p_review_id:review.id,p_state:state,p_note:value});if(r.error||r.data?.id!==review.id||r.data.state!==state||r.data.execution_enabled!==false)throw Error('Decision was not confirmed. Refresh to reconcile.');let reloadFailed=false;try{await load();}catch{reloadFailed=true;}status.textContent=reloadFailed?'Decision saved; refresh the queue to reload. No money moved.':'Review decision saved. No money moved.';}
       catch(e){status.textContent=e.message;}finally{busy=false;button.disabled=false;}
      };card.append(button);
     }
    }
    if(ledgerEnabled&&review.state==='recommended'&&!operations.some(o=>o.review_id===review.id)){
     const prepare=el('button','Reserve reviewed refund in ledger');prepare.type='button';
     prepare.onclick=async()=>{if(!authorized||busy)return;busy=true;prepare.disabled=true;
      try{const r=await client.rpc('admin_prepare_refund_ledger',{p_review_id:review.id});
       if(r.error||!uuid(r.data?.id)||r.data.review_id!==review.id||r.data.kind!=='refund'||r.data.execution_enabled!==false)throw Error('Ledger reservation not confirmed. Refresh to reconcile.');
       let reloadFailed=false;try{await load();}catch{reloadFailed=true;}status.textContent=reloadFailed?'Ledger reservation saved; refresh to reconcile. No refund executed.':'Ledger reservation saved. No refund executed.';
      }catch(e){status.textContent=e.message;}finally{busy=false;prepare.disabled=false;}
     };card.append(prepare);
    }
    content.append(card);
   }
   if(ledgerEnabled){const section=el('section');section.append(el('h2','Financial operations requiring reconciliation'));
    for(const operation of operations){const card=el('article');card.append(el('h3','Operation '+operation.id),el('p','State: '+operation.state),el('p','Attention: '+operation.attention_reason),el('p','Professional: '+money(operation.professional_cents)+'; Korvo fee: '+money(operation.platform_fee_cents)));section.append(card);}
    content.append(section);
   }
  }
  return {ready:enabled?load().catch(e=>{authorized=false;content.replaceChildren();status.textContent=e.message;}):Promise.resolve(),refresh:load};
 }};
})(window);
