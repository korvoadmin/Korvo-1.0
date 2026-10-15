"""Produce review-only, ordered slices of the canonical security proposal.

Uses the Supabase CLI to allocate migration filenames; never applies a package.
Requires pglast==7.8 for build-time SQL syntax validation.
"""
import hashlib
import json
from pathlib import Path
import subprocess
import time

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'supabase/proposals/20261012160000_harden_korvo_api_permissions.sql'
DEST = ROOT / 'supabase/proposals/security-review'
BOUNDARIES = [
    ('foundation', '-- Reviewed API: admin_add_account_restriction;'),
    ('administrative_apis', '-- Reviewed API: block_korvo_user;'),
    ('customer_and_discovery_apis', '-- Reviewed API: professional_cancel_job;'),
    ('professional_and_trust_apis', '-- Reviewed API: respond_to_quote;'),
    ('quotes_messages_and_private_details', '-- Backend-only table:'),
    ('backend_permissions_and_rls', '-- Protect standing, account type,'),
    ('profile_job_and_transfer_guards', None),
]

def main():
    from pglast import parse_sql
    source = SOURCE.read_text()
    DEST.mkdir(parents=True, exist_ok=True)
    if (DEST / 'manifest.json').exists():
        raise SystemExit('Packages already exist; review rather than regenerate timestamps.')
    entries = []
    start = 0
    for index, (name, marker) in enumerate(BOUNDARIES, 1):
        end = source.index(marker, start) if marker else len(source)
        content = source[start:end]
        statements = len(parse_sql(content))
        subprocess.run(['npx', '--yes', 'supabase@2.120.0', 'migration', 'new', 'review_security_' + name], cwd=ROOT, check=True)
        generated = list((ROOT / 'supabase/migrations').glob('*_review_security_' + name + '.sql'))
        if len(generated) != 1:
            raise SystemExit('Expected one new CLI-generated file')
        target = DEST / generated[0].name
        generated[0].rename(target)
        target.write_text(content)
        entries.append({'order': index, 'name': name, 'file': target.name,
                        'statements': statements, 'sha256': hashlib.sha256(content.encode()).hexdigest()})
        start = end
        time.sleep(1.05)  # Separate CLI migration versions, without inventing timestamps.
    assembled = ''.join((DEST / entry['file']).read_text() for entry in entries)
    assert assembled == source
    (DEST / 'manifest.json').write_text(json.dumps({
        'approval_required': True, 'deployment_allowed': False,
        'source': str(SOURCE.relative_to(ROOT)),
        'source_sha256': hashlib.sha256(source.encode()).hexdigest(),
        'statements': len(parse_sql(source)), 'packages': entries,
    }, indent=2) + '\n')

if __name__ == '__main__':
    main()
