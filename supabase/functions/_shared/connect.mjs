export function accountStatus(account) {
  const transfers=account.capabilities?.transfers==='active';
  const disabled=account.requirements?.disabled_reason;
  const complete=account.details_submitted===true&&account.payouts_enabled===true&&transfers&&!disabled;
  return {onboarding_status:complete?'complete':disabled&&disabled!=='requirements.pending_verification'?'restricted'
    :account.details_submitted?'in_progress':'pending',charges_enabled:account.charges_enabled===true,
    payouts_enabled:account.payouts_enabled===true,details_submitted:account.details_submitted===true,
    transfers_active:transfers};
}
