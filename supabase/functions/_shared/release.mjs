import {validatePricingSnapshot} from './pricing.mjs';

// Readiness evaluation only. This module cannot call Stripe or move funds.
// Transfer execution is deliberately absent until the owner approves enabling it.
export function evaluateRelease({payment,job,professional,connect,actor,policy,ledger,funds,now=Date.now()}) {
  const reasons=[];
  try {validatePricingSnapshot(payment);} catch {reasons.push('INVALID_PRICING');}
  if(actor?.server_verified!==true || actor?.active!==true || !['owner','admin'].includes(actor?.database_role)) reasons.push('FINANCIAL_ADMIN_REQUIRED');
  if(payment?.livemode!==false) reasons.push('SANDBOX_REQUIRED');
  if(payment?.status!=='paid' || !payment?.stripe_payment_intent_id || !payment?.stripe_charge_id || payment?.verified_paid_event!==true) reasons.push('VERIFIED_FULL_PAYMENT_REQUIRED');
  if(payment?.refunded_total_cents!==0 || payment?.requires_review!==false) reasons.push('PAYMENT_REVIEW_REQUIRED');
  if(!job?.id || job.id!==payment?.active_job_id || job.professional_id!==payment?.professional_id || job.customer_id!==payment?.customer_id) reasons.push('OWNERSHIP_MISMATCH');
  if(job?.status!=='completed' || !job?.professional_completed_at || !job?.customer_confirmed_at || job?.has_open_issue!==false || job?.evidence_verified!==true) reasons.push('VERIFIED_COMPLETION_REQUIRED');
  if(professional?.id!==payment?.professional_id || professional?.active!==true || professional?.restricted!==false) reasons.push('PROFESSIONAL_NOT_ELIGIBLE');
  const checked=Date.parse(connect?.status_checked_at);
  if(connect?.professional_id!==payment?.professional_id || !connect?.stripe_account_id || connect?.onboarding_status!=='complete' || connect?.details_submitted!==true || connect?.payouts_enabled!==true || connect?.transfers_active!==true
     || !Number.isFinite(checked) || checked>now || now-checked>15*60*1000) reasons.push('FRESH_CONNECT_VERIFICATION_REQUIRED');
  if(policy?.owner_approved!==true || policy?.processing_fee_decision_confirmed!==true || !Number.isSafeInteger(policy?.release_delay_ms) || policy.release_delay_ms<0
     || !Number.isSafeInteger(policy?.maximum_age_ms) || policy.maximum_age_ms<=policy.release_delay_ms) reasons.push('OWNER_POLICY_REQUIRED');
  else {
    const completed=Date.parse(job?.customer_confirmed_at),paid=Date.parse(payment?.paid_at);
    if(!Number.isFinite(completed) || completed>now || now-completed<policy.release_delay_ms) reasons.push('RELEASE_WINDOW_NOT_REACHED');
    if(!Number.isFinite(paid) || paid>now || now-paid>policy.maximum_age_ms) reasons.push('AGED_FUNDS_REVIEW_REQUIRED');
  }
  if(payment?.release_status!=='held' || ledger?.state!=='never_attempted') reasons.push('EXISTING_OR_AMBIGUOUS_RELEASE');
  const balanceChecked=Date.parse(funds?.verified_at);
  if(funds?.server_verified!==true || funds?.currency!=='usd' || !Number.isSafeInteger(funds?.available_cents)
    || funds.available_cents<payment?.professional_gross_cents || funds?.platform_reserve_sufficient!==true
    || !Number.isFinite(balanceChecked) || balanceChecked>now || now-balanceChecked>15*60*1000) reasons.push('VERIFIED_FUNDS_AND_RESERVE_REQUIRED');
  // No configuration input can enable execution; another reviewed implementation is required.
  return {eligible:reasons.length===0,execution_enabled:false,reasons,
    professional_gross_cents:payment?.professional_gross_cents,platform_gross_cents:payment?.platform_fee_cents};
}
