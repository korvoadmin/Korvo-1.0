# Korvo controlled Atlanta beta gates

October 12, 2026: **not ready for money-handling closed beta**. Safe sandbox rehearsal
is possible. Pricing is full professional quote plus 12% on top; no fee-payer choice
or live/transfer enablement is inferred.

| Priority | Gate | Current state / evidence |
| --- | --- | --- |
| P0 | Verified authorization deployment and advisor follow-up | Blocked: broad proposal requires approval and fresh complete regression |
| P0 | Correct full-price customer collection and financial record | Sandbox success/decline/retry/refund/late-issue hold verified; no live enablement |
| P0 | Completed Connect setup reliably synchronized | Genuine thin-event incomplete synchronization verified; complete hosted setup still unverified |
| P0 | Owner financial/support permissions | No owner/admin assigned; new full-price operator queue remains needed |
| P0 | Refund/cancellation and processing-cost rules | Owner decisions; do not enable penalties or nonrefundable fees automatically |
| P0 | Completion proof, approved release delay, reserve and funds aging | Readiness checks tested; ordinary completion evidence not integrated |
| P0 | Transfers, reversals, payout reconciliation | Disabled until safeguards tested and explicit owner approval, including sandbox transfers |
| P0 | Customer protection terms, privacy and support route | Final policy/copy/support channel required; existing footer links do not establish published policies |
| P0 | Genuine email signup, confirmation and recovery | Email confirmation configured; actual email/callback acceptance remains unverified; recovery UI is development-only |
| P0 | Professional trade eligibility/trust policy | License/background/identity category rules not silently enabled; owner defines beta scope |
| P1 | Payment/recovery Pages publication | Browser-tested development code; main/Pages deployment not yet done |
| P1 | Membership billing | Confirmed catalog: one free job, $29.99/3, $49.99/6, $89.99/unlimited; Stripe Billing lifecycle still needed |
| P1 | Mobile and workflow regressions | Five isolated browser suites passed; real API messaging/completion/storage passed; full UI/provider chain still needs final acceptance |
| P1 | Monitoring and operational reconciliation | Use runbook; automatic alerts/admin queue and daily aging review still needed |
| P1 | Leaked-password protection and session policy | Paid feature requires owner approval; Remember-me persistence needs implementation |

## Operational sandbox runbook

Check function failure logs by safe request/event ID, not by dumping headers or
provider payloads. Monitor `stripe_event_receipts.processed_at`, but remember failed
transactions roll back receipts entirely: logs/provider delivery failures also matter.
No pending receipt rows alone does not prove all provider deliveries succeeded.

Reconcile Stripe session/PaymentIntent amounts and currency with frozen marketplace
records, refunded totals, connected-account ownership/capabilities and release holds.
Never repair a balance by changing original gross allocations. Ambiguous provider
operations require reconciliation using the original reference/idempotency key.
Never manufacture a second transfer key after a timeout.

Until a release policy is approved, all contractor release stays held and execution
absent. Do not promise indefinite holding or describe this as escrow. Separate
charges/transfers and bank payouts are different stages; platform available balance,
automatic platform payouts, Stripe restrictions and reserves need explicit validation
before live operation. Reference: https://docs.stripe.com/connect/separate-charges-and-transfers
and https://docs.stripe.com/connect/manual-payouts .

Before inviting beta users, distinguish synthetic profiles/jobs/reviews from genuine
marketplace activity. The retained fixture professional has been hidden/deactivated;
no synthetic review should be presented as a real customer endorsement.

## Next three highest-impact tasks

1. Approve the reviewed authorization deployment scope, rerun the complete updated
   suite, deploy it and verify security/performance advisors and workflow regressions.
2. Finish hosted Connect completion and the full-price financial admin/refund workflow
   after owner role, processing-cost and cancellation decisions.
3. Integrate completion proof and durable release/reversal reconciliation, verify
   reserves/aging rules, then request explicit sandbox transfer enablement approval.
