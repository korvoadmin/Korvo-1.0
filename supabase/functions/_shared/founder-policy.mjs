import {validatePricingSnapshot,priceQuoteCents} from './pricing.mjs';

// Working product specifications, not feature activation or legal clearance.
export const FOUNDER_POLICY_VERSION='founder_baseline_2026_10_16_v1';
export const FOUNDER_POLICY=Object.freeze({processing_cost_payer:'korvo',refund_mode:'manual_review',
 release_delay_after_verified_confirmation_ms:0,membership_restoration:'manual_once_only',
 owner_model:'sole_founder_no_automatic_grant',support_target:'one_business_day',
 commercial_wage_payer:'direct_employer',commercial_fee_basis_points:1200,
 beta:Object.freeze({geography:'Atlanta',invite_cap:20,money_enabled:false,invitations_enabled:false}),
 commercial_enabled:false,financial_execution_enabled:false});

// Actual provider cost is an input from trusted accounting, never a guessed rate.
export function projectProcessingAllocation(payment,actualProcessingCents){
 validatePricingSnapshot(payment);
 if(!Number.isSafeInteger(actualProcessingCents)||actualProcessingCents<0)throw Error('VERIFIED_PROCESSING_AMOUNT_REQUIRED');
 return Object.freeze({professional_gross_cents:payment.professional_gross_cents,customer_total_cents:payment.customer_total_cents,
  processing_cost_payer:'korvo',processing_cost_cents:actualProcessingCents,
  platform_net_before_other_costs_cents:payment.platform_fee_cents-actualProcessingCents,execution_enabled:false});
}

// Recommendations only; ambiguous/partial/customer cancellations choose no amount.
export function founderRefundReview(payment,event){
 validatePricingSnapshot(payment);
 const full=['professional_canceled','professional_no_show'].includes(event);
 return Object.freeze({review_required:true,recommendation:full?'full_customer_refund':'case_review',
  original_professional_cents:payment.professional_gross_cents,original_fee_cents:payment.platform_fee_cents,
  // Existing refunds must be reconciled by the reservation ledger, not refunded twice.
  original_customer_total_cents:payment.customer_total_cents,execution_enabled:false});
}

// Separate commercial invoice architecture: Korvo never collects employee wages.
// Final fee/refund/attendance terms still need reviewed agreements before activation.
export function commercialEmployerQuote(agreedGrossCents){
 const p=priceQuoteCents(agreedGrossCents);
 return Object.freeze({worker_gross_cents:agreedGrossCents,employer_direct_gross_cents:agreedGrossCents,
  korvo_service_invoice_cents:p.platform_fee_cents,combined_compensation_and_fee_cents:p.customer_total_cents,
  wage_payment_route:'direct_employer_payroll',contractor_connect_allowed:false,
  commercial_enabled:false,fee_refundability:'unresolved',execution_enabled:false});
}

// Server callers must fetch the actor and assignment; no client flag is authority.
export function commercialAttendance(assignment,actor,action){
 if(actor?.server_verified!==true||actor.active!==true||!assignment?.id)throw Error('VERIFIED_ASSIGNMENT_ACTOR_REQUIRED');
 if(!['report_attended','contest_attendance','request_rebooking'].includes(action))throw Error('UNSUPPORTED_ATTENDANCE_ACTION');
 const business=actor.id===assignment.business_id&&actor.account_type==='business';
 const worker=actor.id===assignment.worker_id&&actor.account_type==='professional';
 if(!business&&!worker)throw Error('ASSIGNMENT_PARTICIPANT_REQUIRED');
 if(!['confirmed','attendance_reported','disputed','completed'].includes(assignment.state))throw Error('ASSIGNMENT_STATE_REQUIRED');
 if(action==='request_rebooking'&&(!business||assignment.state!=='completed'))throw Error('COMPLETED_BUSINESS_REBOOK_REQUIRED');
 if(action==='report_attended'&&assignment.state!=='confirmed')throw Error('CONFIRMED_ATTENDANCE_REQUIRED');
 if(action==='contest_attendance'&&assignment.state==='completed')throw Error('SUPPORT_REVIEW_REQUIRED');
 return Object.freeze({assignment_id:assignment.id,
  proposed_state:action==='report_attended'?'attendance_reported':action==='contest_attendance'?'disputed':'new_draft_requested',
  original_assignment_unchanged:true,review_required:true,automatic_wage_adjustment:false,
  booking_enabled:false,execution_enabled:false});
}

// Receipt construction only. Approved documents and authenticated actor must be
// resolved by a future server endpoint; persistence/version revocation remain gates.
export function termsAcceptanceReceipt(document,actor){
 if(document?.approved!==true||!['customer','professional'].includes(document.audience)
  ||typeof document.version!=='string'||!document.version.trim()||document.version.length>100
  ||!/^https:\/\//.test(document.url||'')||!/^([a-f0-9]{64})$/.test(document.sha256||''))throw Error('APPROVED_VERSIONED_TERMS_REQUIRED');
 if(actor?.server_verified!==true||actor.active!==true||!actor.id||actor.account_type!==document.audience)throw Error('TERMS_ACTOR_REQUIRED');
 return Object.freeze({actor_id:actor.id,audience:document.audience,version:document.version,document_sha256:document.sha256,
  policy_version:FOUNDER_POLICY_VERSION,persistence_required:true});
}
