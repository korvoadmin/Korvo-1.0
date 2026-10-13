# Korvo project, shift and everyday-gig pricing

Authoritative owner policy confirmed October 12–13, 2026. Korvo connects individuals
and businesses with people for projects, shifts and everyday local work. Hospitality,
home/property services and general gigs remain part of the mission.

The worker/professional receives **100% of agreed gross compensation**. Korvo charges
the customer/business **12% on top**. This does not decide worker classification,
payroll withholding, Stripe processing-cost responsibility or employer-cost responsibility.
The former 88/12 deduction model is superseded for every opportunity type.

| Basis | Worker gross | Korvo fee | Compensation + fee |
| --- | ---: | ---: | ---: |
| $18/hour × 6 payable hours | $108.00 | $12.96 | $120.96 |
| Fixed $100 | $100.00 | $12.00 | $112.00 |
| Fixed $500 | $500.00 | $60.00 | $560.00 |
| Fixed $1,000 | $1,000.00 | $120.00 | $1,120.00 |

These are gross subtotals, excluding other applicable costs. Employee gross wages
are not a promise of identical take-home pay after lawful statutory withholding.

## Calculation contract

`gig-pricing.mjs` calculates hourly compensation with integer cents and integer
payable seconds, rounding the final compensation to cents once. The fee uses the
existing project `FEE_BASIS_POINTS` constant and rounds half-cents upward. Project
pricing and its immutable payment records are unchanged.

Estimates use estimated payable time; reconciliation requires a server-verified time
record. The helper does not authenticate an ID or reviewer string: a future endpoint
must fetch and authorize those records from trusted storage, never trust browser flags.
No automatic break deduction, punitive cancellation deduction or time-rounding policy
is selected. A zero-time calculation does not determine every wage obligation.

Employee/potential-employee reconciliation also requires a reviewed payroll record
covering the workweek and regular-rate analysis. Its gross compensation cannot fall
below the agreed base. The engine accepts payroll-reviewed gross (including required
overtime/premiums); it does not infer overtime from this one shift or implement a payroll
provider. Fixed pay does not exempt employee work from wage/hour requirements.

Tips are separate worker money, excluded from the 12% fee. Cost entries support
business/platform/unresolved payers; worker allocation is never reduced by these
entries. Missing processing-cost or applicable payroll-cost decisions yield an
unresolved total, not a zero-cost assumption. Additional obligations, reimbursements,
benefits, insurance and taxes require explicitly reviewed cost entries and terms.

No automated gig refund, cancellation penalty, payroll deduction or no-show wage/tip
forfeiture exists. Keep original gross allocations and obtain the applicable approved
resolution instead of silently reducing compensation.

## Payment and legal boundaries

Classification must reflect the actual arrangement, not a job label, business checkbox,
hourly/fixed selection or a 1099 form. Employee and potentially employee shifts have a
`payroll_required` route. They **never** qualify for contractor Connect payments.
Independent-contractor gig eligibility requires documented classification/category
review and explicit future booking approval; payment execution remains hard-disabled.

All public gig publication, application/booking and payment features remain disabled.
The development preview is an estimator with no backend write. Existing project
Stripe sandbox functions remain available for controlled tests; live payments and
actual transfers remain disabled. No escrow or indefinite funds-holding promise exists.

See `PAYMENT_PRICING_SPEC.md`, `HOSPITALITY_COMPLIANCE_REVIEW.md`,
`GIG_MARKETPLACE_FOUNDATION.md` and `OWNER_ACTION_CHECKLIST.md`.
