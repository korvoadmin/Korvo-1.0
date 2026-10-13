# Disabled shift-gig foundation

October 13, 2026. Implemented and locally tested; **not deployed or enabled**.
Korvo's existing project jobs, quotes, messaging, matching, memberships, dashboards,
authentication and project payment schema are preserved.

## What exists

- `gig-pricing.mjs`: fixed/hourly estimate and reconciliation calculations; 100%
  worker gross plus 12%; separate tips; explicit unknown costs; payroll-review guard.
- `gig-scheduling.mjs`: offset timestamps plus IANA timezone validation, overnight
  shifts, DST validation, half-open overlap tests and explicit availability windows.
- `gig-workflow.mjs`: server transition kernel for draft/open/filled/canceled/
  completed/disputed gigs; application, selection, confirmation, attendance, no-show
  review and participant feedback eligibility. Every payment result remains disabled.
- `gig-foundation.html` / `.js`: accessible development estimator with all three
  marketplace category groups, gross/fee/tip breakdown and disabled action buttons.
  No Supabase session, API call, saved draft, booking or charge exists on this preview.
- Private-schema SQL proposal: eight tables for gates, business/worker profiles,
  gigs, applications, assignments, revisioned time records and audit events.

Business display names extend existing customer accounts; worker skills/experience/
areas/availability extend existing professional accounts. The proposal does not create
an admin/business role or allow account-type escalation. Profile fields are self-reported,
not evidence of licensing, certification, background checks or verified experience.

## Storage and authorization boundaries

`supabase/proposals/20261013002039_gig_foundation_disabled.sql` was created through
the CLI and moved outside automatic migrations. It creates a new private schema only.
All eight tables have RLS and explicit client-denial policies, no anon/authenticated
schema access or grants, and service-role access only. Trigger functions are invoker
functions with empty search paths; no public RPC or gig Edge endpoint is introduced.

Server endpoints, ownership-scoped reads/writes and participant notifications are
**not yet connected**. Future endpoints must validate Auth sessions/active standing,
match the verified actor to business/worker ownership and retrieve approval/time/payroll
facts from trusted storage. A browser cannot authorize itself by passing the transition
kernel's `facts` or actor fields. The kernel is not an authentication mechanism.

Public opportunity views must omit private locations and applicant details; selected/
confirmed participants receive only their authorized location/contact/time information.
The existing project payment function accepts an active project-job ID; no conversion
from a shift ID into that payment table or employee Connect route has been added.

## Scheduling and state safety

Assignments copy timestamps from the server's gig row. Worker advisory locks precede
gig row locks to serialize overlapping reservations and capacity checks. Duplicate
applications/assignments have unique constraints. Selected/confirmed/attended/disputed/
no-show-review slots reserve time; canceled slots release it. Existing reservations freeze
schedule, owner, classification and compensation. Adjacent shifts may be scheduled;
travel/rest-buffer policies still require product review.

The disposable PostgreSQL rehearsal verified overlap/capacity/immutability rejection.
It **did not prove concurrent multi-session behavior**: PGlite runs one local connection.
Before adopting this schema, run actual PostgreSQL simultaneous-selection, deadlock/
retry and transaction-abort tests. Multi-row operations must use deterministic worker
ordering and bounded retries; never interpret a database failure as a saved selection.

The pure state kernel returns proposed transitions. Atomic persistence, applicant
notifications, filled-state recalculation after cancellation, attendance evidence,
feedback storage, dispute resolution and employee payroll adapters remain unfinished.
No automatic no-show fine, wage forfeiture, tip forfeiture or cancellation policy exists.

## Deployment gates

1. Review schema and endpoint contracts, concurrent scheduling and privacy tests.
2. Resolve owner employment-model/category/insurance/payroll decisions.
3. Build and verify authenticated participant endpoints and operational controls.
4. Obtain explicit deployment/category enablement approval.
5. Apply the reviewed proposal through a versioned migration and rerun advisors/tests.

The separate broad security proposal remains unapplied pending approval. No new gig
schema was applied this sprint, and no production-facing UI or hospitality booking was
published. Payment execution is hard-disabled in calculation results and schema gates.
