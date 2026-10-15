# Korvo controlled Atlanta beta gates

October 13, 2026: **not ready for money-handling closed beta**. Safe sandbox rehearsal
is possible. Pricing is full professional quote plus 12% on top; no fee-payer choice
or live/transfer enablement is inferred.

| Priority | Gate | Current state / evidence |
| --- | --- | --- |
| P0 | Verified authorization deployment and advisor follow-up | 134-check complete rollback regression passed; broad proposal still requires explicit approval |
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
| P1 | Mobile and workflow regressions | Seven isolated browser suites passed; real API messaging/completion/storage passed; 20 additional deployed lifecycle checks passed; full UI/provider chain still needs final acceptance |
| P1 | Monitoring and operational reconciliation | Use runbook; automatic alerts/admin queue and daily aging review still needed |
| P1 | Leaked-password protection and session policy | Paid feature requires owner approval; Remember-me persistence needs implementation |
| P0 for shifts | Hospitality/employment/category clearance | All shift booking/payment disabled; employer, payroll, insurance, age/alcohol/local requirements unresolved |
| P1 for shifts | Authenticated gig endpoints and concurrent scheduling | Pricing/workflow/preview/private schema tested locally; no deployed gig API; multi-session lock test still needed |

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

1. Approve the reviewed authorization deployment scope (134-check rehearsal passed),
   deploy it and verify security/performance advisors and workflow regressions.
2. Finish hosted Connect completion and the full-price financial admin/refund workflow
   after owner role, processing-cost and cancellation decisions.
3. Integrate completion proof and durable release/reversal reconciliation, verify
   reserves/aging rules, then request explicit sandbox transfer enablement approval.

## Marketplace scope

Korvo remains a local marketplace for projects, shifts and everyday gigs. Home/property,
hospitality and general work are preserved in the new disabled foundation. Existing
project onboarding/quotes/payments are unchanged. A project-only cleared beta may
precede shift launch; employee staffing must not inherit contractor Connect payments.
The development estimator and unapplied schema are not a functioning shift marketplace.

## Workflow follow-up

Development source now fixes job-submit validation/duplicate clicks, professional
onboarding permissions/cache recovery, conversation response/draft isolation and
completion-response validation. A successful professional completion request remains
saved even when the follow-up dashboard read fails. These changes are tested, not
published to main/Pages. Source-price records and unapproved penalty/refund rules are
unchanged. Ordinary completion evidence and project photo attachments are still not
integrated; the photo controls must not be described as a working upload feature.

## October 14 evidence/control checkpoint

Still not ready for money-handling closed beta. New private evidence and admin refund
review SQL passed 72 isolated database checks; the verifier core and security package
checks are part of 117 passing unit/source tests. Seven real local decoder checks
passed. All new proposals remain unapplied. Completion-photo UI/Edge integration and
hosted acceptance remain development work. Refund recommendations cannot move money.
The security scope/dependency and rollback plan is in proposals/security-review/README.md;
a tested postcommit restore remains required before authorized deployment. No current
owner decision, transfer gate, Connect completion gate or employment gate was cleared.
See SPRINT_REPORT_2026-10-14_EVIDENCE_CONTROLS.md for precise test boundaries.

## October 15 publication and retry checks

Audited development source is published in draft PR #6; initial GitHub CI passed.
No deployment occurred. Additional reservation-key and stale-refund-recommendation
checks expanded the isolated SQL suite to 91 passing checks. Actual hosted sessions,
storage, Edge decoder/UI and concurrent transactions remain unverified. Authorization,
Connect completion, financial policy and transfer gates remain unchanged. Details:
`SPRINT_REPORT_2026-10-15_PUBLICATION.md`.
