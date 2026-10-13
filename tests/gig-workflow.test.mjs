import test from 'node:test';
import assert from 'node:assert/strict';
import { gigTransition, GIG_FEATURES, GIG_CATEGORIES } from '../supabase/functions/_shared/gig-workflow.mjs';
const owner={id:'business',account_type:'customer',active:true,authenticated:true};
const worker={id:'worker',account_type:'professional',active:true,authenticated:true};
const gig={business_id:'business',state:'draft',positions:2,classification:'independent_contractor'};
const approval={publishing_enabled:true,bookings_enabled:true,category_approved:true,classification_review_id:'legal-review',eligibility_reviewed:true};
test('broader marketplace categories retained; all global feature gates disabled',()=>{
 assert.deepEqual(GIG_FEATURES,{publishing:false,bookings:false,payments:false});assert.equal(GIG_CATEGORIES.hospitality.length,6);assert.ok(GIG_CATEGORIES.general.includes('Warehouse assistance'));
});
test('business draft ownership, session and account permissions enforced',()=>{
 assert.equal(gigTransition(gig,'edit_draft',owner).state,'draft');
 for(const actor of [null,{...owner,active:false},{...owner,authenticated:false},{...owner,id:'other'},{...owner,account_type:'professional'},worker]) assert.throws(()=>gigTransition(gig,'edit_draft',actor));
});
test('publishing requires reviewed contractor category and explicit future gate',()=>{
 assert.throws(()=>gigTransition(gig,'publish',owner),/DISABLED/);
 for(const classification of ['employee','potential_employee','unreviewed']) assert.throws(()=>gigTransition({...gig,classification},'publish',owner,approval),/REVIEW_REQUIRED/);
 assert.equal(gigTransition(gig,'publish',owner,approval).state,'open');
});
test('worker applications require professional, active open opportunity and reviewed eligibility',()=>{
 const open={...gig,state:'open'};const facts={...approval,worker_id:'worker'};
 assert.equal(gigTransition(open,'apply',worker,facts).application_state,'applied');
 for(const actor of [owner,{...worker,id:'other'},{...worker,account_type:'customer'}]) assert.throws(()=>gigTransition(open,'apply',actor,facts));
 assert.throws(()=>gigTransition(open,'apply',worker,{worker_id:'worker'}));assert.throws(()=>gigTransition(gig,'apply',worker,facts));
});
test('business selection checks capacity, actual application and verified schedule conflict',()=>{
 const open={...gig,state:'open'};const f={...approval,application_state:'applied',reserved_positions:1,schedule_conflict:false};
 assert.equal(gigTransition(open,'select',owner,f).state,'filled');
 for(const patch of [{reserved_positions:2},{reserved_positions:-1},{schedule_conflict:true},{schedule_conflict:undefined},{application_state:'withdrawn'},{bookings_enabled:false}]) assert.throws(()=>gigTransition(open,'select',owner,{...f,...patch}));
 assert.throws(()=>gigTransition(open,'select',worker,f));
});
test('selected worker confirms, attendance follows confirmation',()=>{
 const filled={...gig,state:'filled'};const f={...approval,worker_id:'worker',assignment_state:'selected'};
 assert.equal(gigTransition(filled,'confirm',worker,f).assignment_state,'confirmed');
 assert.throws(()=>gigTransition(filled,'confirm',{...worker,id:'other'},f));
 assert.throws(()=>gigTransition(filled,'confirm',worker,{...f,assignment_state:'applied'}));
 assert.equal(gigTransition(filled,'attendance',worker,{...f,assignment_state:'confirmed'}).assignment_state,'attended');
});
test('worker withdraws and business rejects only the matching application',()=>{
 const open={...gig,state:'open'},f={worker_id:'worker',application_state:'applied'};
 assert.equal(gigTransition(open,'withdraw',worker,f).application_state,'withdrawn');
 assert.equal(gigTransition(open,'reject',owner,f).application_state,'declined');
 assert.throws(()=>gigTransition(open,'withdraw',{...worker,id:'other'},f));assert.throws(()=>gigTransition(open,'reject',worker,f));
});
test('participant cancels own reservation with compensation review; outsiders denied',()=>{
 const f={worker_id:'worker',assignment_state:'confirmed',is_assigned:true};
 const result=gigTransition({...gig,state:'filled'},'cancel_assignment',worker,f);
 assert.equal(result.assignment_state,'canceled');assert.equal(result.state,'filled');assert.equal(result.compensation_review_required,true);
 assert.throws(()=>gigTransition(gig,'cancel_assignment',{...worker,id:'other'},f));
});
test('completion requires trusted reviewer, evidence, verified hours and no open issue',()=>{
 const filled={...gig,state:'filled'};const f={all_assignments_resolved:true,evidence_verified:true,payable_time_verified:true,open_issue:false};
 const admin={...owner,trusted_role:'admin'};
 assert.equal(gigTransition(filled,'complete',admin,f).state,'completed');
 for(const actor of [owner,worker,{...admin,trusted_role:'support'}]) assert.throws(()=>gigTransition(filled,'complete',actor,f));
 for(const key of Object.keys(f)) assert.throws(()=>gigTransition(filled,'complete',admin,{...f,[key]:!f[key]}));
});
test('cancellation, no-show and disputes record review, never wage/tip forfeiture or payment',()=>{
 const open={...gig,state:'open'};
 for(const [action,actor,facts] of [['cancel',owner,{}],['no_show',owner,{is_assigned:true}],['dispute',worker,{worker_id:'worker',is_assigned:true}]]) {
  const result=gigTransition(open,action,actor,facts);assert.equal(result.compensation_review_required,true);assert.equal(result.payment_execution_enabled,false);assert.equal(result.worker_gross_compensation_cents,undefined);
 }
 assert.throws(()=>gigTransition(open,'dispute',worker,{worker_id:'worker',is_assigned:false}));
});
test('feedback requires completed gig and participant; unknown actions rejected',()=>{
 assert.equal(gigTransition({...gig,state:'completed'},'feedback',worker,{worker_id:'worker',is_assigned:true}).feedback_allowed,true);
 assert.throws(()=>gigTransition(gig,'feedback',owner));assert.throws(()=>gigTransition(gig,'promote_admin',owner));
});
