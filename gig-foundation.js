import { priceGig, priceGigRoster } from './supabase/functions/_shared/gig-pricing.mjs';
import { dollarsToCents, formatUsd } from './supabase/functions/_shared/pricing.mjs';
const el=id=>document.getElementById(id);
function estimate(event) {
 event?.preventDefault();el('error').textContent='';el('breakdown').replaceChildren();
 try {
  const amount=dollarsToCents(el('amount').value);
  const tips=el('tips').value==='0' || el('tips').value==='0.00' ? 0 : dollarsToCents(el('tips').value);
  const input={classification:'potential_employee',stage:'estimate',compensation_type:el('basis').value,
   hourly_rate_cents:amount,fixed_gross_cents:amount,estimated_payable_seconds:Number(el('minutes').value)*60,worker_tips_cents:tips};
  const positions=Number(el('positions').value);
  if(!Number.isInteger(positions)||positions<1||positions>100) throw new Error('INVALID_POSITIONS');
  const p=priceGig(input),roster=priceGigRoster(Array.from({length:positions},()=>input));
  el('business-name').textContent=`${el('business').value} · ${el('category').value}`;
  for(const [label,value] of [['Worker gross compensation',p.worker_gross_compensation_cents],['Korvo fee (12% added on top)',p.platform_fee_cents],['Compensation + Korvo fee',p.compensation_and_fee_cents],['Worker tips (no Korvo fee)',p.worker_tips_cents],['Known subtotal including tips',p.known_business_total_cents],[`Roster subtotal (${positions} workers, including tips)`,roster.known_business_total_cents]]) {
   const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=formatUsd(value);row.append(dt,dd);el('breakdown').append(row);
  }
  el('cost-note').textContent='Processing costs, employer payroll costs and other applicable obligations require review. Final business total is unavailable.';
 } catch { el('error').textContent='Enter valid compensation, whole payable minutes and tips. No gig or payment has been created.'; }
}
el('estimator').addEventListener('submit',estimate);
el('basis').addEventListener('change',()=>{
 const hourly=el('basis').value==='hourly';el('amount-label').textContent=hourly?'Hourly rate ($)':'Fixed worker gross compensation ($)';
 el('duration-field').hidden=!hourly;el('minutes').required=hourly;estimate();
});
estimate();
