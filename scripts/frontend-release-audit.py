#!/usr/bin/env python3
"""Offline route/asset inventory. No publishing, network calls or invented policies."""
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]

def audit(root=ROOT):
    findings = []
    class Links(HTMLParser):
        def __init__(self, source):
            super().__init__(); self.source = source
        def handle_starttag(self, tag, attrs):
            attrs = dict(attrs)
            for key in ('href', 'src', 'action'):
                value = attrs.get(key)
                if value is None: continue
                parts = urlsplit(value)
                if parts.scheme or parts.netloc: continue
                if not parts.path:
                    if value in ('', '#'):
                        findings.append({'source': str(self.source.relative_to(root)), 'line': self.getpos()[0], 'target': value, 'reason': 'placeholder'})
                    continue
                target = (root / unquote(parts.path).lstrip('/')) if parts.path.startswith('/') else self.source.parent / unquote(parts.path)
                reason = 'missing' if not target.is_file() else 'empty' if target.stat().st_size == 0 else None
                if reason:
                    findings.append({'source': str(self.source.relative_to(root)), 'line': self.getpos()[0], 'target': parts.path, 'reason': reason})
    pages = sorted(root.glob('*.html'))
    for page in pages:
        Links(page).feed(page.read_text())
    return {'layer': 'offline development route and asset inventory', 'pages': len(pages),
            'missing': sum(f['reason'] == 'missing' for f in findings),
            'empty': sum(f['reason'] == 'empty' for f in findings),
            'placeholders': sum(f['reason'] == 'placeholder' for f in findings),
            'published': False, 'findings': findings}

if __name__ == '__main__':
    print(json.dumps(audit(), indent=2))
