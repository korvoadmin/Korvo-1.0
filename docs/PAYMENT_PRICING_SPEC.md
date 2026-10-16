# Korvo 1.0 authoritative payment pricing

Status: **confirmed by Chris on October 12, 2026**. This specification supersedes
the earlier instruction to deduct 12% from the professional's quoted price and
the earlier fee-only booking/deposit collection design.

- The professional sets the agreed service price.
- Professional gross allocation is **100% of that price**.
- Korvo adds a **12% platform fee on top** of the service price.
- Customer total is service price plus the Korvo fee.
- Korvo's fee is gross revenue before processing costs and approved adjustments.

| Professional quote | Korvo fee | Customer total | Professional gross allocation |
| --- | --- | --- | --- |
| $100.00 | $12.00 | $112.00 | $100.00 |
| $500.00 | $60.00 | $560.00 | $500.00 |
| $1,000.00 | $120.00 | $1,120.00 | $1,000.00 |

## Calculation and persistence

All financial calculations use integer USD cents. Round the 12% fee to the nearest
cent, with a half-cent rounded upward. Customer total is the sum of the exact
service price and the rounded fee; do not independently round a multiplied total.
Quotes containing fractional cents are rejected.

The accepted quote is server-owned. A client cannot supply a charge amount, rate,
professional allocation, destination account, or payout-ready flag. Freeze the
quote, fee and total on the payment record before Checkout. For a $500 quote,
Stripe must charge 56,000 cents and a gross professional transfer must allocate
50,000 cents. The fee must never be taken out of the 50,000-cent professional price.

Persist separate original amounts: `quote_cents`, `platform_fee_cents`,
`customer_total_cents`, and `professional_gross_cents`. Preserve those original
amounts when recording refunds, reversals, disputes or processor costs.

## Processing costs: confirmed founder policy

Korvo absorbs Stripe processing costs from its 12% gross fee. Do not deduct them
from professional gross or add another customer charge. Actual provider costs must
be observed, not guessed; the tested founder-policy accounting helper can represent
negative Korvo margin. Provider-cost ingestion/net reporting remains unfinished.
This specification does not enable payments or change Stripe configuration.

## Refunds and completion release

Manual review is the beta default. Professional cancellation/no-show calls for a full
customer refund recommendation; execution remains separately gated. Other cancellation
deadlines, partial-work remedies and issue-report/non-confirmation timing remain
unresolved. No automatic refund schedule is authorized.

An authorized refund instruction must specify professional-price cents and platform
fee cents separately. A complete refund of an untouched $500 quote plus its fee is
$560. An explicit partial refund of $50 service price and $6 fee is $56; those
amounts are an example of a reviewed adjustment, not an automatic policy. A previous
professional transfer requires reversal/recovery of the approved professional-price
component before the refund is treated as safely settled.

Verified customer confirmation and documented professional completion make a paid job
immediately eligible for evaluation without an added delay. This is eligibility, not
authorization to execute a transfer. Outstanding issues, a chargeback, ambiguous operations,
unreconciled adjustments or incomplete Stripe onboarding must hold release. Moving
funds to the professional's Stripe balance is a **transfer**, not confirmation that
their bank has received a payout. No escrow or indefinite holding promise is made.

## Source and regression checks

Canonical calculation: `supabase/functions/_shared/pricing.mjs`.
Required $100/$500/$1,000 and boundary regressions: `tests/payment-pricing.test.mjs`.
Consumers must validate persisted snapshots against this specification rather than
recalculate from browser-supplied totals.

## Shift and everyday-gig extension

The confirmed 100% gross plus 12% on top policy also applies to hourly/fixed gigs.
See `GIG_PRICING_POLICY.md`: $18/hour × 6 payable hours = $108 worker gross, $12.96
Korvo fee and $120.96 subtotal, before other applicable costs. Roster totals sum
independently rounded worker allocations. Tips are excluded from the fee. Employee
wages require reviewed payroll and cannot use the contractor Connect route.
