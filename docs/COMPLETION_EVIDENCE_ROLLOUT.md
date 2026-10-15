# Completion evidence development contract and A10 rollout

Implemented code is not deployed or enabled. A10 (schema/Edge/Storage), A8 (frontend)
and approved customer/professional policy copy are still required.

## Endpoint

verify-completion-photo validates method/origin, bounds streamed JSON to 1 KiB,
requires server flag COMPLETION_EVIDENCE_ENABLED=true, validates the caller with
Auth getUser and authorizes the photo through the caller-JWT session-checked RPC.
Only then does it use the server client to download the reserved immutable path.
It validates exact bytes/MIME/content with pinned magick-wasm 0.0.44, dimensions,
frame count and resource limits, hashes the bytes and records a service-only attestation.
No client-supplied digest/status/price can attest a file. Errors return safe codes.

JPEG, PNG and WebP decode/corrupt-file tests use the identical WASM adapter locally.
The fixed public dependency URL was downloaded and matched the package SHA-256 locally;
it is also SHA-256 checked at runtime; initialization is single-flight
and retries after failure. Cold-start download/CPU/memory/latency and provider outage
behavior still require local Deno/hosted qualification before A10. No Sharp dependency
is used by the Edge entrypoint. Prefer a reviewed prebundled asset if the approved
packaging environment supports it; do not remove integrity checks to make deployment work.

## Dashboard integration

Both dashboards load completion-evidence.js and call its preflight before their
existing completion RPC. The UI flag defaults off. Flags are rollout controls,
not authorization: database requirements/RPC checks enforce enrolled jobs regardless
of any browser flag. A failed/disabled client cannot bypass a required database gate.

Pro: validate declared type/size; derive a content-based browser journal; preserve a
server request key across retries; reserve; upload with upsert:false; verify even
if an upload response is ambiguous; compare returned digest; refresh validated photos.
A reservation can be abandoned, but a validated immutable photo cannot be replaced.
Customer: private download and successful display are required before explicit checkbox
acknowledgment, the scoped acknowledge RPC and the existing customer confirmation RPC.
The professional never submits customer acceptance. Filenames/reasons render as text.

Photo bytes are not stored in browser persistence. The session journal stores only
request keys keyed by hashes/job/name; when browser storage is blocked, retry identity
survives only within the current widget. Cross-reload recovery in that browser remains
limited; the server summary exposes outstanding reservations so they can be reviewed
or abandoned, not silently duplicated. Retention/metadata policy remains D7/EVI-008.

## Existing jobs

The proposal does not backfill/alter existing active jobs. Its requirements table is
private and client writes are denied. Existing active jobs return required:false and
keep their original completion path. An after-insert trigger enrolls new active jobs
following approved rollout; their status transitions require verified photos and
customer acknowledgment. No client can remove enrollment. Do not grant users an
opt-out. Existing paid jobs still need separate trusted release/manual review; legacy
status is not a claim of verified evidence and never automatically releases funds.

A10 must specifically approve this cohort boundary, final user notice/terms, clean
rollback, and how existing paid/completed records reach support review. Publish the
compatible UI before enrolling new jobs; test unsupported clients fail safely.

## Test limits

New browser components: 16 evidence + 10 refund-review checks. Actual customer/pro
page fixtures each verify photo-preflight denial prevents the completion RPC. Expanded
isolated SQL: 100 checks including legacy completion, new enrollment and opt-out denial.
Endpoint: 9 request/auth/stream/ownership tests; production WASM adapter: 6 full-image
checks. These are local/fixture tests, not real hosted JWT/Storage/Edge acceptance.

## Latest runtime checkpoint

Six actual local Deno 2.5.6 HTTP tests now pass valid/corrupt JPEG/PNG/WebP using the
production WASM adapter and checked binary. Auth/Storage are fixtures; actual managed
Edge resource/cold-start/CDN and signed-URL acceptance are not proven. The exact A10
review scope, rollout prerequisites and populated-data rollback limits are documented
in A10_SANDBOX_ROLLOUT_APPROVAL.md and LAUNCH_RELEASE_MANIFEST.json.
