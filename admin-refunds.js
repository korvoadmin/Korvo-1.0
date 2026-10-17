(function(global){'use strict';const el=(tag,text)=>{const x=document.createElement(tag);if(text)x.textContent=text;return x;};
 global.KorvoRefundReview={attach({container,client,enabled=global.KORVO_REFUND_REVIEW_ENABLED===true,ledgerEnabled=global.KORVO_FINANCIAL_LEDGER_ENABLED===true,reconciliationEnabled=global.KORVO_FINANCIAL_RECONCILIATION_ENABLED===true,accountingEnabled=global.KORVO_FULL_REFUND_ACCOUNTING_ENABLED===true}){
  const status=el('p',enabled?'Checking financial access…':'Refund review is not enabled.');status.setAttribute('role','status');container.append(status);const content=el('section');container.append(content);let authorized=false,busy=false;const keys=new Map();
  const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(value);
  const money=c=>Number.isSafeInteger(c)&&c>=0?'$'+(c/100).toFixed(2):'Unavailable';
  async function load(){
   authorized=false;content.replaceChildren();const user=await client.auth.getUser();if(user.error||!user.data?.user)throw Error('Sign in with an authorized financial account.');
   const response=await client.rpc('admin_marketplace_refund_queue');if(response.error||!Array.isArray(response.data))throw Error('Financial access denied or review queue unavailable.');
   let operations=[];
   if(ledgerEnabled){const ledger=await client.rpc('admin_financial_operation_queue');if(ledger.error||!Array.isArray(ledger.data))throw Error('Financial operation queue unavailable. Refresh to reconcile.');operations=ledger.data;}
   let payments=[];
   if(reconciliationEnabled){const reconciliation=await client.rpc('admin_financial_reconciliation_queue');if(reconciliation.error||!Array.isArray(reconciliation.data))throw Error('Provider reconciliation queue unavailable. Refresh to retry.');payments=reconciliation.data;}
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
   if(reconciliationEnabled){const section=el('section');section.append(el('h2','Provider reconciliation'),el('p','Read-only provider checks record observations. They do not execute refunds, correct allocations or release held payments.'));
    for(const payment of payments){const card=el('article');card.append(el('h3','Payment '+payment.payment_id),el('p','Attention: '+payment.attention_reason),el('p','Database state: '+payment.status+'; release: '+payment.release_status),el('p','Last check: '+(payment.checked_at||'Never')));
     for(const finding of payment.facts?.findings||[])card.append(el('p',finding));
     const check=el('button','Check provider status');check.type='button';check.onclick=async()=>{
      if(!authorized||busy)return;busy=true;check.disabled=true;const journal='korvoReconciliation:'+payment.payment_id;
      try{
       let key=keys.get(journal);try{key=key||sessionStorage.getItem(journal);}catch{}
       if(!key){key=crypto.randomUUID();keys.set(journal,key);try{sessionStorage.setItem(journal,key);}catch{}}
       const r=await client.functions.invoke('reconcile-marketplace-payment',{body:{payment_id:payment.payment_id,request_key:key}});
       if(r.error||!uuid(r.data?.report_id)||!['consistent','needs_review','provider_unavailable'].includes(r.data.state)||!Number.isFinite(Date.parse(r.data.checked_at))||r.data.execution_enabled!==false)throw Error('Provider observation was not confirmed. Retry the same check.');
       keys.delete(journal);try{sessionStorage.removeItem(journal);}catch{}
       let failed=false;try{await load();}catch{failed=true;}status.textContent='Observation saved at '+r.data.checked_at+'. No money moved.'+(failed?' Refresh to reload.':'');
      }catch(e){status.textContent=e.message;}finally{busy=false;check.disabled=false;}
     };card.append(check);
     if(accountingEnabled&&uuid(payment.report_id)&&payment.attention_reason==='needs_review'&&payment.refunded_total_cents===payment.customer_total_cents
      &&payment.refunded_total_cents!==payment.professional_refunded_cents+payment.platform_fee_refunded_cents
      &&payment.facts?.full_refund_professional_cents===payment.professional_gross_cents&&payment.facts?.full_refund_fee_cents===payment.platform_fee_cents){
      const note=el('textarea');note.setAttribute('aria-label','Full-refund accounting review note');card.append(el('p','This records the proven aggregate allocation of an existing full refund. It does not issue another refund or clear the payment hold.'),note);
      const record=el('button','Record existing full-refund allocation');record.type='button';record.onclick=async()=>{
       if(!authorized||busy)return;const reason=note.value.trim();if(reason.length<10||reason.length>2000){status.textContent='Enter an accounting review note of 10–2000 characters.';return;}
       busy=true;record.disabled=true;
       try{
        const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([payment.report_id,reason])))),v=>v.toString(16).padStart(2,'0')).join('');const journal='korvoFullRefundAllocation:'+digest;
        let key=keys.get(journal);try{key=key||sessionStorage.getItem(journal);}catch{}if(!key){key=crypto.randomUUID();keys.set(journal,key);try{sessionStorage.setItem(journal,key);}catch{}}
        const r=await client.rpc('admin_record_verified_full_refund_allocation',{p_report_id:payment.report_id,p_request_key:key,p_reason:reason});
        if(r.error||!uuid(r.data?.id)||r.data.state!=='allocation_recorded'||r.data.execution_enabled!==false)throw Error('Accounting update not confirmed. Refresh to reconcile before changing the request.');
        let failed=false;try{await load();}catch{failed=true;}status.textContent='Existing full-refund allocation recorded. Holds preserved. No money moved.'+(failed?' Refresh to reload.':'');
       }catch(e){status.textContent=e.message;}finally{busy=false;record.disabled=false;}
      };card.append(record);
     }
     section.append(card);
    }content.append(section);
   }
  }
  return {ready:enabled?load().catch(e=>{authorized=false;content.replaceChildren();status.textContent=e.message;}):Promise.resolve(),refresh:load};
 }};
})(window);
