#!/usr/bin/env python3
"""Pin reviewable release scope. Does not deploy, merge or change any flag."""
import hashlib
import json
import subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def entry(path):
    return {'path': path, 'sha256': hashlib.sha256((ROOT / path).read_bytes()).hexdigest()}
def build():
    security = json.loads((ROOT / 'supabase/proposals/security-review/manifest.json').read_text())
    diff = subprocess.check_output(['git', 'diff', '--name-only', 'origin/main'], cwd=ROOT, text=True).splitlines()
    diff += subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=ROOT,text=True).splitlines()
    frontend = sorted(p for p in set(diff) if '/' not in p and Path(p).suffix in ('.html','.js','.css'))
    evidence = ['supabase/proposals/20261013174432_private_completion_evidence.sql',
                'supabase/proposals/20261013175001_administrative_refund_review.sql',
                'supabase/proposals/financial_operation_ledger.sql',
                'supabase/proposals/financial_reconciliation_observations.sql',
                'supabase/proposals/completion_release_facts.sql']
    evidence += [str(p.relative_to(ROOT)) for p in sorted((ROOT / 'supabase/functions/verify-completion-photo').glob('*')) if p.is_file()]
    evidence += [str(p.relative_to(ROOT)) for p in sorted((ROOT / 'supabase/functions/reconcile-marketplace-payment').glob('*')) if p.is_file()]
    evidence += ['supabase/functions/_shared/founder-policy.mjs','supabase/functions/_shared/payment-observations.mjs','supabase/functions/_shared/stripe-readonly.mjs','supabase/functions/_shared/release.mjs','supabase/functions/_shared/completion-evidence.mjs','supabase/functions/_shared/financial-reconciliation.mjs']
    return {'deployment_authorized': False,
            'main_baseline': subprocess.check_output(['git','rev-parse','origin/main'],cwd=ROOT,text=True).strip(),
            'A6': [entry(security['source'])] + [entry('supabase/proposals/security-review/'+p['file']) for p in security['packages']],
            'A10': [entry(p) for p in evidence],
            'A8': [entry(p) for p in frontend],
            'flags_default_off': ['COMPLETION_EVIDENCE_ENABLED','KORVO_COMPLETION_EVIDENCE_ENABLED','KORVO_REFUND_REVIEW_ENABLED','KORVO_FINANCIAL_LEDGER_ENABLED','FINANCIAL_RECONCILIATION_ENABLED','KORVO_FINANCIAL_RECONCILIATION_ENABLED','KORVO_FULL_REFUND_ACCOUNTING_ENABLED'],
            'money_execution_enabled': False}
if __name__ == '__main__':
    (ROOT / 'docs/LAUNCH_RELEASE_MANIFEST.json').write_text(json.dumps(build(),indent=2)+'\n')
