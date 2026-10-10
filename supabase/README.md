# Korvo backend checkpoint: matched-job alerts and invitations

Applied to the existing Korvo Supabase project on October 10, 2026 UTC
(October 9 in Atlanta). Recorded migration: `20261010014215_add_matched_job_alerts_and_invitations`.

This is an incremental migration. It depends on the existing Korvo profiles,
jobs, quotes, notifications, memberships, Trust & Safety, and matching schema
through `20261010012200_fix_job_match_rule_presence_check`. Those earlier
database migrations predate this source folder. This folder alone cannot
bootstrap a new database; obtain the existing schema/history first.

## Behavior now implemented

- Posting an open job as its authenticated customer records the strongest
  eligible service matches and creates in-app `matched_job` notifications.
- The existing matching engine supplies rankings and eligibility, including
  account standing, blocks, onboarding, visibility, membership capacity, and
  configured verification requirements. Service areas improve ranking without
  becoming a geographic exclusion.
- There is one `job_opportunities` row per job/professional pair. A customer
  may invite an eligible service-matched professional, including a recommended
  professional outside the automatic top five.
- A job/pro pair receives at most one automatic alert and one separate,
  deliberate customer invitation. Retried invitations return the original
  opportunity without creating another alert. A passed opportunity cannot be
  reinvited.
- Professionals can mark their own opportunity viewed or passed. Submitting
  an actual quote records the quote and moves the opportunity to `quoted`.
  Accepting, cancelling, completing, or expiring a job closes its outstanding
  offered/viewed opportunities while retaining passed/quoted history.
- Quote insertion locks the job and rechecks the full existing eligibility
  decision. A block or other eligibility change after an alert therefore takes
  effect when the professional tries to quote. An eligible professional may
  still quote outside their selected services while strict matching is off.
- Participants can SELECT their own opportunity rows under RLS. Clients cannot
  insert, update, delete, change ownership, fabricate scores, or mark an
  opportunity quoted directly. API wrappers are SECURITY INVOKER; the private
  implementations check authenticated identities and ownership.

## Adjustable starting limits

Stored on the existing `public.job_matching_config` singleton:

| Setting | Current default | Meaning |
| --- | --- | --- |
| `automatic_job_alerts_enabled` | `true` | Enables automatic matching alerts |
| `max_matched_alerts_per_job` | `5` | Automatic opportunities over the job's lifetime |
| `max_invitations_per_job` | `5` | Distinct invited professionals over the job's lifetime |
| `max_opportunity_alerts_per_day` | `10` | Combined match/invitation notifications per professional in a rolling 24 hours |

Passing does not reset a job's limits. Refreshing does not resend existing
opportunities. Rate-limited candidates are skipped; an authorized refresh can
fill remaining slots later. There is no scheduled retry worker. Dispatch runs
synchronously in the posting transaction and is intended for the current
small marketplace. Recipient locks serialize the shared daily limit; job locks
serialize dispatch, invitations, responses, quotes, and closure.

`require_service_match_for_quote` remains `false`. Existing category-specific
identity, background, and license requirements remain as configured (off at
this checkpoint). Invitations and automatic alerts always require a service
match, regardless of that separate quoting setting.

## Frontend integration contract

Use the customer's or professional's normal signed-in Supabase client.

| API | Caller | Result |
| --- | --- | --- |
| `my_job_opportunities({p_limit: 50})` | Professional | Their opportunity feed, current quote eligibility, and response timestamps |
| `respond_to_job_opportunity({p_opportunity_id, p_action: 'view'})` | Recipient professional | Marks viewed and marks associated alerts read |
| `respond_to_job_opportunity({p_opportunity_id, p_action: 'pass'})` | Recipient professional | Records a pass and suppresses further invitations |
| `invite_professional_to_job({p_job_id, p_professional_id})` | Job's customer | Creates an invitation or returns `already_invited: true` |
| `refresh_job_opportunities({p_job_id})` | Job's customer or active admin | Fills remaining automatic alert slots within all limits |
| SELECT `job_opportunities` filtered by `job_id` | Job's customer | Viewed/passed/quoted/invited status of that job's opportunities |

Read normal `notifications` for the notification bell. New types are
`matched_job` and `job_invitation`, with `opportunity_id` and `job_id` for navigation.
Invitation/match notification bodies contain no user-supplied contact details.
The professional feed omits opportunities involving blocked users. Historical
participant records remain readable; the feed's `can_quote` is the current
actionability flag, not a payment or booking confirmation.

Frontend work is still pending: dashboard opportunity cards, View/Pass controls,
new notification rendering, and an Invite button beside customer recommendations.
There is no email, SMS, or push transport, no contact unlock, and no automatic
backfill of previously posted jobs in this migration.

## Verification and next checkpoint

`tests/job_opportunities.sql` is an administrative SQL integration test script.
It uses synthetic Auth/profile/job rows and a BEGIN/ROLLBACK transaction. Run it
only in a development/test database with the existing backend and this migration;
the assertions intentionally assume strict service/verification requirements
are still off. All fixtures and temporary configuration changes roll back.

**43 checks passed**, first in a rollback-only migration rehearsal and again
after applying the recorded migration. Covered ranking, outside-area eligibility,
automatic and invitation caps, idempotency, viewed/passed/quoted transitions,
actual quote acceptance/closure, authenticated-role RLS, unauthorized actions,
block handling, and the nonmatching-service quote regression.

The post-change security advisor reported no new findings compared with the
baseline. Existing advisories on older functions/tables and Auth password
protection remain outside this change; this is not a full launch security audit.

Next product step: connect the professional dashboard and customer recommendations
to these APIs, then test the flows through the actual signed-in web UI. The
matching/eligibility and alert/invitation backend layers are now implemented.
