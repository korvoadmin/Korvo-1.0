-- READ ONLY. Operational triage; no provider operation or policy decision.
-- Run administratively. Do not expose raw provider identifiers to public clients.
select jsonb_build_object(
 'review_held',coalesce((select jsonb_agg(jsonb_build_object('payment_id',id,'status',status,'release_status',release_status,'age_hours',floor(extract(epoch from(now()-created_at))/3600)))
   from public.marketplace_payments where requires_review and release_status='held'),'[]'),
 'pricing_invariant_failures',(select count(*) from public.marketplace_payments where professional_gross_cents<>quote_cents or platform_fee_cents<>floor((quote_cents*12+50)/100) or customer_total_cents<>quote_cents+platform_fee_cents),
 'unallocated_provider_refunds',(select count(*) from public.marketplace_payments where refunded_total_cents<>professional_refunded_cents+platform_fee_refunded_cents),
 'stale_checkout_for_reconciliation',(select count(*) from public.marketplace_payments where status in('awaiting_payment','processing','failed') and checkout_started_at<now()-interval '23 hours'),
 'ambiguous_release',(select count(*) from public.marketplace_payments where release_status='processing'),
 'unprocessed_receipts',(select count(*) from public.stripe_event_receipts where processed_at is null),
 'execution_enabled',false,
 'warning','A zero pending-receipt count does not prove webhook delivery health; failed transactions may leave no receipt. Review provider failures and safe logs too.'
) as reconciliation_inventory;
