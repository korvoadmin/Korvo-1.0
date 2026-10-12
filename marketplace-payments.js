/* Payment controls consume server-owned allocations; they never mark a job paid. */
(() => {
  'use strict';
  const labels = {not_started:'Payment not started',awaiting_payment:'Awaiting payment',processing:'Payment processing',
    paid:'Payment received',failed:'Payment failed',partially_refunded:'Partially refunded',refunded:'Refunded',disputed:'Payment disputed'};
  const money = cents => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
  window.KorvoPayments = {attach({container,client,activeJobId,role,jobStatus,navigate=url=>window.location.assign(url)}) {
    if (!container || !activeJobId || !['customer','professional'].includes(role)) return;
    const panel=document.createElement('section'); panel.className='marketplace-payment'; panel.setAttribute('aria-label','Job payment');
    const status=document.createElement('p'); status.setAttribute('role','status');
    const amounts=document.createElement('p'), note=document.createElement('p');
    const refresh=document.createElement('button'); refresh.type='button'; refresh.className='small-secondary-button'; refresh.textContent='Refresh payment';
    const pay=document.createElement('button'); pay.type='button'; pay.className='small-primary-button'; pay.textContent='Pay in sandbox'; pay.hidden=true;
    panel.append(status,amounts,note,refresh,pay); container.append(panel);
    let loading=false, paying=false;
    const eligibleJob=String(jobStatus)==='active';
    async function update() {
      if(loading || paying) return;
      loading=true; refresh.disabled=true; pay.hidden=true; amounts.textContent=''; note.textContent=''; status.textContent='Checking payment…';
      try {
        const result=await client.rpc('marketplace_payment_summary',{p_active_job_id:activeJobId});
        if(result.error || !labels[result.data?.status]) throw new Error('PAYMENT_UNAVAILABLE');
        const p=result.data; status.textContent=labels[p.status];
        if(p.status!=='not_started') {
          if(p.currency!=='usd' || ![p.quote_cents,p.professional_gross_cents,p.platform_fee_cents,p.customer_total_cents].every(Number.isSafeInteger)
            || p.quote_cents<1 || p.quote_cents>99999999 || p.platform_fee_cents!==Math.floor((p.quote_cents*12+50)/100)
            || p.professional_gross_cents!==p.quote_cents || p.customer_total_cents!==p.quote_cents+p.platform_fee_cents) throw new Error('PAYMENT_UNAVAILABLE');
          amounts.textContent=role==='customer' ? `Service ${money(p.quote_cents)} + Korvo fee ${money(p.platform_fee_cents)} = total ${money(p.customer_total_cents)}`
            : `Your original quoted gross allocation: ${money(p.professional_gross_cents)}. The customer pays Korvo’s fee separately.`;
          if(['partially_refunded','refunded'].includes(p.status)){
            if(!Number.isSafeInteger(p.refunded_total_cents) || p.refunded_total_cents<1 || p.refunded_total_cents>p.customer_total_cents)throw new Error('PAYMENT_UNAVAILABLE');
            amounts.textContent+=` Original customer charge: ${money(p.customer_total_cents)}. Refunded: ${money(p.refunded_total_cents)}.`;
          }
        }
        note.textContent=p.requires_review ? 'Payment requires support review. Release is on hold.'
          : p.status==='paid' ? 'Customer payment is confirmed. Contractor transfers remain disabled during sandbox testing.'
          : 'Sandbox testing only. The customer pays the full professional quote plus a 12% Korvo fee.';
        pay.hidden=!(role==='customer' && eligibleJob && !p.requires_review && ['not_started','awaiting_payment','failed'].includes(p.status));
      } catch {status.textContent='Payment status could not be loaded. Refresh to try again.'; amounts.textContent='';note.textContent='';pay.hidden=true;}
      finally {loading=false;refresh.disabled=false;}
    }
    pay.addEventListener('click',async()=>{
      if(paying || loading) return; paying=true;pay.disabled=true;refresh.disabled=true;status.textContent='Opening sandbox checkout…';
      try {
        const result=await client.functions.invoke('create-booking-checkout',{body:{active_job_id:activeJobId}});
        if(result.error || result.data?.sandbox!==true) throw new Error('CHECKOUT_UNAVAILABLE');
        if(result.data.already_paid) {paying=false;await update();return;}
        const url=new URL(result.data.checkout_url);
        if(url.protocol!=='https:' || url.hostname!=='checkout.stripe.com' || url.username || url.password) throw new Error('CHECKOUT_UNAVAILABLE');
        navigate(url.href);
      } catch {status.textContent='Checkout could not be opened. Refresh payment status before trying again.';pay.hidden=true;}
      finally {paying=false;pay.disabled=false;refresh.disabled=false;}
    });
    refresh.addEventListener('click',update);
    return {refresh:update,ready:update()};
  }};
})();
