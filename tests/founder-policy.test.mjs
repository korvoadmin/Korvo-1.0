import test from 'node:test';import assert from 'node:assert/strict';
import {FOUNDER_POLICY,projectProcessingAllocation,founderRefundReview,commercialEmployerQuote,commercialAttendance,termsAcceptanceReceipt} from '../supabase/functions/_shared/founder-policy.mjs';
import {priceQuote} from '../supabase/functions/_shared/pricing.mjs';
test('Korvo absorbs real processing costs without reducing full professional gross',()=>{
 const p=priceQuote(100),r=projectProcessingAllocation(p,355);assert.equal(r.professional_gross_cents,10000);assert.equal(r.customer_total_cents,11200);assert.equal(r.platform_net_before_other_costs_cents,845);
 assert.equal(projectProcessingAllocation(p,1300).platform_net_before_other_costs_cents,-100);
 for(const v of [undefined,null,-1,1.5])assert.throws(()=>projectProcessingAllocation(p,v));
});
test('professional cancellation/no-show recommend full review without refund execution',()=>{
 for(const event of ['professional_canceled','professional_no_show']){const r=founderRefundReview(priceQuote(100),event);assert.equal(r.recommendation,'full_customer_refund');assert.equal(r.execution_enabled,false);}
 for(const event of ['customer_canceled','partial_work',undefined])assert.equal(founderRefundReview(priceQuote(100),event).recommendation,'case_review');
});
test('commercial employer payroll and Korvo invoice stay separate and disabled',()=>{
 const r=commercialEmployerQuote(10800);assert.equal(r.worker_gross_cents,10800);assert.equal(r.korvo_service_invoice_cents,1296);assert.equal(r.wage_payment_route,'direct_employer_payroll');assert.equal(r.contractor_connect_allowed,false);assert.equal(r.commercial_enabled,false);assert.equal(r.fee_refundability,'unresolved');
});
const a={id:'assignment',business_id:'business',worker_id:'worker',state:'confirmed'};
const business={id:'business',account_type:'business',active:true,server_verified:true};
test('attendance reports do not confirm wages or adjust gross',()=>{const r=commercialAttendance(a,business,'report_attended');assert.equal(r.proposed_state,'attendance_reported');assert.equal(r.automatic_wage_adjustment,false);assert.equal(r.execution_enabled,false);});
test('outsider, forged actor and unsupported attendance action rejected',()=>{
 for(const actor of [{...business,id:'other'},{...business,server_verified:false},{...business,active:false}])assert.throws(()=>commercialAttendance(a,actor,'report_attended'));
 assert.throws(()=>commercialAttendance(a,business,'deduct_no_show_wages'));
});
test('business rebooking creates only a new draft request after completed assignment',()=>{assert.throws(()=>commercialAttendance(a,business,'request_rebooking'));const r=commercialAttendance({...a,state:'completed'},business,'request_rebooking');assert.equal(r.original_assignment_unchanged,true);assert.equal(r.booking_enabled,false);});
test('disputed attendance never auto-forfeits wages',()=>{const r=commercialAttendance(a,{...business,id:'worker',account_type:'professional'},'contest_attendance');assert.equal(r.proposed_state,'disputed');assert.equal(r.automatic_wage_adjustment,false);});
const doc={approved:true,audience:'customer',version:'fixture-v1',url:'https://fixture.invalid/terms',sha256:'a'.repeat(64)};
test('versioned assent receipt binds actual document and actor, needs persistence',()=>{const r=termsAcceptanceReceipt(doc,{...business,id:'customer',account_type:'customer'});assert.equal(r.document_sha256,doc.sha256);assert.equal(r.persistence_required,true);});
test('unapproved legal copy, role mismatch and client-only assent cannot be accepted',()=>{
 assert.throws(()=>termsAcceptanceReceipt({...doc,approved:false},business));assert.throws(()=>termsAcceptanceReceipt(doc,business));assert.throws(()=>termsAcceptanceReceipt(doc,{id:'customer',active:true,account_type:'customer'}));
});
test('founder baseline cannot activate money, invitations or hospitality',()=>{assert.equal(FOUNDER_POLICY.beta.invite_cap,20);assert.equal(FOUNDER_POLICY.beta.money_enabled,false);assert.equal(FOUNDER_POLICY.beta.invitations_enabled,false);assert.equal(FOUNDER_POLICY.commercial_enabled,false);assert.equal(FOUNDER_POLICY.release_delay_after_verified_confirmation_ms,0);assert.ok(Object.isFrozen(FOUNDER_POLICY.beta));});
