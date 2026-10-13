import test from 'node:test';
import assert from 'node:assert/strict';
import { priceGig, priceGigRoster, contractorGigPaymentEligibility } from '../supabase/functions/_shared/gig-pricing.mjs';
import { schedule, overlaps, canReserve, availableDuring } from '../supabase/functions/_shared/gig-scheduling.mjs';
import { priceQuoteCents } from '../supabase/functions/_shared/pricing.mjs';
const hourly = { classification:'potential_employee', stage:'estimate', compensation_type:'hourly', hourly_rate_cents:1800,estimated_payable_seconds:21600 };
test('two dishwashers: each $108 gross; business $241.92 before other costs',()=>{
 const p=priceGigRoster([hourly,hourly]);assert.equal(p.worker_count,2);assert.equal(p.worker_gross_compensation_cents,21600);assert.equal(p.platform_fee_cents,2592);assert.equal(p.compensation_and_fee_cents,24192);
 assert.ok(p.workers.every(w=>w.worker_gross_compensation_cents===10800));assert.equal(p.final_business_total_cents,null);assert.equal(p.payment_execution_enabled,false);
 assert.throws(()=>priceGigRoster([]));
});
test('confirmed $18 x 6h: worker $108, Korvo $12.96, subtotal $120.96',()=>{
 const p=priceGig(hourly);assert.equal(p.worker_gross_compensation_cents,10800);assert.equal(p.platform_fee_cents,1296);assert.equal(p.compensation_and_fee_cents,12096);
 assert.equal(p.final_business_total_cents,null);assert.deepEqual(p.unresolved_costs,['processing','employer_payroll']);assert.equal(p.payment_execution_enabled,false);
});
for(const amount of [100,500,1000]) test(`fixed gig $${amount} preserves existing project quote + fee`,()=>{
 const gig=priceGig({classification:'independent_contractor',stage:'estimate',compensation_type:'fixed',fixed_gross_cents:amount*100});
 const project=priceQuoteCents(amount*100);assert.equal(gig.worker_gross_compensation_cents,project.professional_gross_cents);assert.equal(gig.platform_fee_cents,project.platform_fee_cents);assert.equal(gig.compensation_and_fee_cents,project.customer_total_cents);
});
test('verified payable time replaces estimate, exact fractional hours rounded once',()=>{
 const p=priceGig({...hourly,classification:'independent_contractor',stage:'reconciled',time_record:{id:'time-v2',verified_by:'server-reviewer',payable_seconds:20700}});
 assert.equal(p.worker_gross_compensation_cents,10350);assert.equal(p.compensation_and_fee_cents,11592);
 assert.equal(priceGig({...hourly,hourly_rate_cents:1001,estimated_payable_seconds:1}).worker_gross_compensation_cents,0);
});
test('unverified hours cannot produce reconciled compensation',()=>{
 assert.throws(()=>priceGig({...hourly,stage:'reconciled',time_record:{payable_seconds:21600}}),/VERIFIED_PAYABLE_TIME/);
});
test('employee reconciliation requires reviewed workweek/payroll; overtime affects gross and fee',()=>{
 const input={...hourly,classification:'employee',stage:'reconciled',time_record:{id:'hours',verified_by:'server',payable_seconds:21600}};
 assert.throws(()=>priceGig(input),/VERIFIED_PAYROLL/);
 assert.throws(()=>priceGig({...input,payroll_record:{id:'payroll',verified_by:'server',workweek_reviewed:false,gross_compensation_cents:10800}}),/VERIFIED_PAYROLL/);
 const p=priceGig({...input,payroll_record:{id:'payroll',verified_by:'server',workweek_reviewed:true,gross_compensation_cents:16200}});
 assert.equal(p.platform_fee_cents,1944);assert.equal(p.payment_route,'payroll_required');assert.equal(p.payment_execution_enabled,false);
 assert.throws(()=>priceGig({...input,payroll_record:{id:'payroll',verified_by:'server',workweek_reviewed:true,gross_compensation_cents:9504}}),/BELOW_AGREED/);
});
test('tips are 100% worker allocation, excluded from Korvo fee',()=>{
 const p=priceGig({...hourly,worker_tips_cents:5000});assert.equal(p.worker_tips_cents,5000);assert.equal(p.platform_fee_cents,1296);assert.equal(p.known_business_total_cents,17096);
});
test('known business costs and platform costs disclose totals without worker deductions',()=>{
 const p=priceGig({...hourly,other_costs:[{code:'processing',payer:'platform',amount_cents:400},{code:'employer_payroll',payer:'business',amount_cents:1200}]});
 assert.equal(p.worker_gross_compensation_cents,10800);assert.equal(p.final_business_total_cents,13296);
 assert.throws(()=>priceGig({...hourly,other_costs:[{code:'employer_payroll',payer:'worker',amount_cents:1200}]}),/UNAPPROVED_COST_PAYER/);
});
test('negative/fractional seconds, oversized total, invalid classification and compensation fail closed',()=>{
 for(const v of [-1,1.5,Infinity,Number.MAX_SAFE_INTEGER+1]) assert.throws(()=>priceGig({...hourly,estimated_payable_seconds:v}));
 assert.throws(()=>priceGig({...hourly,hourly_rate_cents:Number.MAX_SAFE_INTEGER}));
 assert.throws(()=>priceGig({...hourly,classification:'1099'}));assert.throws(()=>priceGig({...hourly,compensation_type:'salary'}));
 assert.throws(()=>priceGig({...hourly,stage:'reconciled',time_record:{id:'t',verified_by:'v',payable_seconds:21600},classification:'unreviewed'}),/CLASSIFICATION_REVIEW/);
});
for(const classification of ['employee','potential_employee','unreviewed']) test(`${classification} never qualifies for contractor Connect`,()=>{
 assert.deepEqual(contractorGigPaymentEligibility({classification,review_id:'approved',category_approved:true,bookings_enabled:true}),{eligible_for_future_contractor_route:false,execution_enabled:false});
});
test('reviewed contractor eligibility still cannot execute payments',()=>{
 assert.equal(contractorGigPaymentEligibility({classification:'independent_contractor',category_approved:true,bookings_enabled:true}).eligible_for_future_contractor_route,false);
 assert.equal(contractorGigPaymentEligibility({classification:'independent_contractor',review_id:'r',category_approved:true,bookings_enabled:true}).execution_enabled,false);
});
const shift={starts_at:'2026-10-16T17:00:00-04:00',ends_at:'2026-10-16T23:00:00-04:00',time_zone:'America/New_York'};
test('Atlanta evening and midnight-crossing schedules retain UTC and IANA zone',()=>{
 assert.equal(schedule(shift).scheduled_seconds,21600);assert.equal(schedule({...shift,ends_at:'2026-10-17T01:00:00-04:00'}).scheduled_seconds,28800);
});
test('DST fallback explicitly distinguishes repeated hour, spring gap rejected',()=>{
 assert.equal(schedule({starts_at:'2026-11-01T01:30:00-04:00',ends_at:'2026-11-01T01:30:00-05:00',time_zone:'America/New_York'}).scheduled_seconds,3600);
 assert.throws(()=>schedule({starts_at:'2026-03-08T02:30:00-05:00',ends_at:'2026-03-08T04:00:00-04:00',time_zone:'America/New_York'}),/OFFSET_TIME_ZONE/);
});
test('invalid dates, missing offset, wrong zone/offset and reverse intervals rejected',()=>{
 for(const patch of [{starts_at:'2026-02-30T17:00:00-04:00'},{starts_at:'2026-10-16T17:00:00'},{time_zone:'Not/AZone'},{starts_at:'2026-10-16T17:00:00-05:00'},{ends_at:shift.starts_at}]) assert.throws(()=>schedule({...shift,...patch}));
});
test('selected and confirmed assignments prevent overlap; adjacent and canceled are allowed',()=>{
 const s={starts_at:'2026-10-16T21:00:00Z',ends_at:'2026-10-17T03:00:00Z'};
 assert.equal(overlaps(s,{starts_at:s.ends_at,ends_at:'2026-10-17T04:00:00Z'}),false);
 for(const state of ['selected','confirmed','attended','disputed','no_show_review']) assert.equal(canReserve('worker',s,[{...s,worker_id:'worker',state}]),false);
 assert.equal(canReserve('worker',s,[{...s,worker_id:'other',state:'confirmed'}]),true);
 assert.equal(canReserve('worker',s,[{...s,worker_id:'worker',state:'canceled'}]),true);
 assert.throws(()=>overlaps(s,{starts_at:s.ends_at,ends_at:s.starts_at}),/INVALID_INTERVAL/);
});
test('explicit worker availability covers whole shift; gaps and unprovided windows fail closed',()=>{
 const s={starts_at:'2026-10-16T21:00:00Z',ends_at:'2026-10-17T03:00:00Z'};
 assert.equal(availableDuring(s,[s]),true);assert.equal(availableDuring(s,[]),false);
 assert.equal(availableDuring(s,[{starts_at:s.starts_at,ends_at:'2026-10-17T00:00:00Z'},{starts_at:'2026-10-17T00:00:00Z',ends_at:s.ends_at}]),true);
 assert.equal(availableDuring(s,[{starts_at:s.starts_at,ends_at:'2026-10-17T00:00:00Z'},{starts_at:'2026-10-17T00:01:00Z',ends_at:s.ends_at}]),false);
});
test('duplicate cost lines cannot silently double-charge business',()=>{
 assert.throws(()=>priceGig({...hourly,other_costs:[{code:'processing',payer:'business',amount_cents:10},{code:'processing',payer:'business',amount_cents:10}]}),/DUPLICATE_COST/);
});
