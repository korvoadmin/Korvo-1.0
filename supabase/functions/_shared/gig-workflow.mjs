// Server-side transition kernel. Actors/reviews come from verified server state,
// never editable user metadata. Persistence must lock rows and record audit events.
export const GIG_FEATURES = Object.freeze({ publishing:false, bookings:false, payments:false });
export const GIG_CATEGORIES = Object.freeze({
 hospitality:['Bartender','Server','Dishwasher','Busser','Kitchen assistant','Event staff'],
 property:['Handyman','Painter','Cleaner','Mover','Landscaper','Installer'],
 general:['Event setup and breakdown','Warehouse assistance','Furniture assembly','Moving help','General labor'],
});
export function gigTransition(gig, action, actor, facts = {}) {
 if (!actor?.authenticated || !actor.active || !actor.id) throw new Error('AUTHENTICATION_REQUIRED');
 const owner=actor.id===gig.business_id && actor.account_type==='customer';
 const worker=actor.id===facts.worker_id && actor.account_type==='professional';
 const reviewer=actor.trusted_role==='owner' || actor.trusted_role==='admin';
 const next={...gig};
 switch(action) {
  case 'edit_draft':
   if (!owner || gig.state!=='draft') throw new Error('DRAFT_OWNER_REQUIRED');break;
  case 'publish':
   if (!owner || gig.state!=='draft') throw new Error('DRAFT_OWNER_REQUIRED');
   if (facts.publishing_enabled!==true || !facts.category_approved || !facts.classification_review_id
    || gig.classification!=='independent_contractor') throw new Error('PUBLICATION_DISABLED_OR_REVIEW_REQUIRED');
   next.state='open';break;
  case 'apply':
   if (!worker || gig.state!=='open' || actor.id===gig.business_id) throw new Error('ELIGIBLE_WORKER_REQUIRED');
   if (facts.bookings_enabled!==true || facts.eligibility_reviewed!==true || gig.classification!=='independent_contractor') throw new Error('BOOKINGS_DISABLED_OR_REVIEW_REQUIRED');
   next.application_state='applied';break;
  case 'select':
   if (!owner || gig.state!=='open' || facts.application_state!=='applied') throw new Error('BUSINESS_AND_APPLICATION_REQUIRED');
   if (facts.bookings_enabled!==true || gig.classification!=='independent_contractor') throw new Error('BOOKINGS_DISABLED_OR_REVIEW_REQUIRED');
   if (!Number.isInteger(facts.reserved_positions) || !Number.isInteger(gig.positions) || gig.positions<1
    || facts.reserved_positions<0 || facts.reserved_positions>=gig.positions) throw new Error('CAPACITY_REACHED');
   if (facts.schedule_conflict!==false) throw new Error('SCHEDULE_CONFLICT_OR_UNVERIFIED');
   next.assignment_state='selected';
   if (facts.reserved_positions+1===gig.positions) next.state='filled';break;
  case 'withdraw':
   if (!worker || facts.application_state!=='applied') throw new Error('APPLICATION_WORKER_REQUIRED');
   next.application_state='withdrawn';break;
  case 'reject':
   if (!owner || facts.application_state!=='applied') throw new Error('BUSINESS_AND_APPLICATION_REQUIRED');
   next.application_state='declined';break;
  case 'cancel_assignment':
   if ((!owner && !worker) || facts.is_assigned!==true || !['selected','confirmed'].includes(facts.assignment_state)) throw new Error('ASSIGNED_PARTICIPANT_REQUIRED');
   next.assignment_state='canceled';next.compensation_review_required=true;break;
  case 'confirm':
   if (!worker || !['open','filled'].includes(gig.state) || facts.assignment_state!=='selected') throw new Error('SELECTED_WORKER_REQUIRED');
   if (facts.bookings_enabled!==true || gig.classification!=='independent_contractor') throw new Error('BOOKINGS_DISABLED_OR_REVIEW_REQUIRED');
   next.assignment_state='confirmed';break;
  case 'attendance':
   if (!worker || !['open','filled'].includes(gig.state) || facts.assignment_state!=='confirmed') throw new Error('CONFIRMED_WORKER_REQUIRED');
   next.assignment_state='attended';break;
  case 'complete':
   if (!reviewer || !['open','filled'].includes(gig.state) || facts.all_assignments_resolved!==true
    || facts.evidence_verified!==true || facts.payable_time_verified!==true || facts.open_issue!==false) throw new Error('VERIFIED_COMPLETION_REQUIRED');
   next.state='completed';break;
  case 'cancel':
   if (!owner || !['draft','open','filled'].includes(gig.state)) throw new Error('CANCEL_OWNER_REQUIRED');
   next.state='canceled';next.compensation_review_required=true;break;
  case 'dispute':
   if (!owner && !(worker && facts.is_assigned===true)) throw new Error('PARTICIPANT_REQUIRED');
   if (!['open','filled','completed'].includes(gig.state)) throw new Error('INVALID_DISPUTE_STATE');
   next.state='disputed';next.compensation_review_required=true;break;
  case 'no_show':
   if (!owner || facts.is_assigned!==true || !['open','filled'].includes(gig.state)) throw new Error('ASSIGNED_WORKER_REQUIRED');
   next.assignment_state='no_show_review';next.compensation_review_required=true;break;
  case 'feedback':
   if (gig.state!=='completed' || (!owner && !(worker && facts.is_assigned===true))) throw new Error('COMPLETED_PARTICIPANT_REQUIRED');
   next.feedback_allowed=true;break;
  default: throw new Error('UNKNOWN_GIG_ACTION');
 }
 return Object.freeze({...next,payment_execution_enabled:false});
}
