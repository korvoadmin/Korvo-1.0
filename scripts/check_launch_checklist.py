"""Validate the authoritative Markdown task register without a second task database."""
import json
from pathlib import Path
import re
import sys
from collections import Counter

ROOT=Path(__file__).resolve().parents[1]
STATUSES=('Complete','In Progress','Blocked','Not Started','Needs Verification')

def validate(text,owner,beta):
    errors=[]
    rows=[]
    for line in text.splitlines():
        cells=[c.strip() for c in line.strip().strip('|').split('|')]
        if re.fullmatch(r'[A-Z]+-\d{3}',cells[0]):
            if len(cells)!=8:errors.append(f'{cells[0]}: expected eight columns');continue
            rows.append(cells)
    ids=[r[0] for r in rows];known=set(ids)
    if not rows:errors.append('no task rows')
    if len(ids)!=len(known):errors.append('duplicate task ID')
    headings=re.findall(r'^## (\d+)\. ',text,re.M)
    if headings!=[str(i) for i in range(1,15)]:errors.append('expected ordered 14 sections')
    evidence=set(re.findall(r'^\| (E\d{2}) \|',text,re.M))
    if not evidence:errors.append('missing evidence registry')
    owner_ids=set(re.findall(r'^\| ((?:D|M|A)\d+)\s*(?:/[^|]*)?\|',owner,re.M))
    for row in rows:
        tid,priority,status,remaining,independent,owner_action,deps,proof=row
        if priority not in ('P0','P1','P2'):errors.append(tid+': invalid priority')
        if status not in STATUSES:errors.append(tid+': invalid status')
        if not all(row):errors.append(tid+': missing required field')
        if not re.search(r'\bE\d{2}\b',proof):errors.append(tid+': no evidence key')
        for key in re.findall(r'\bE\d{2}\b',proof):
            if key not in evidence:errors.append(tid+': unknown evidence '+key)
        for dep in re.findall(r'\b[A-Z]+-\d{3}\b',deps):
            if dep not in known:errors.append(tid+': unknown dependency '+dep)
        for item in re.findall(r'\b(?:D|M|A)\d+\b',owner_action):
            if item not in owner_ids:errors.append(tid+': owner item not registered '+item)
    graph={r[0]:re.findall(r'\b[A-Z]+-\d{3}\b',r[6]) for r in rows}
    visited=set();active=set()
    def visit(node):
        if node in active:
            errors.append('circular dependency: '+node);return
        if node in visited or node not in graph:return
        active.add(node)
        for dependency in graph[node]:visit(dependency)
        active.remove(node);visited.add(node)
    for node in graph:visit(node)
    counts=Counter(r[2] for r in rows)
    total=re.search(r'Total tasks: \*\*(\d+)\*\*',text)
    if not total or int(total[1])!=len(rows):errors.append('total count mismatch')
    for status in STATUSES:
        match=re.search(r'^\| '+re.escape(status)+r' \| (\d+) \|$',text,re.M)
        if not match or int(match[1])!=counts[status]:errors.append('status count mismatch: '+status)
    priorities=Counter(r[1] for r in rows)
    for priority in ('P0','P1','P2'):
        match=re.search(r'\b'+priority+r': (\d+)',text)
        if not match or int(match[1])!=priorities[priority]:errors.append('priority count mismatch: '+priority)
    for name,companion in [('owner',owner),('beta',beta)]:
        if 'KORVO_MASTER_LAUNCH_CHECKLIST.md' not in companion:errors.append(name+': missing authoritative link')
    return {'valid':not errors,'total':len(rows),'statuses':dict(counts),'priorities':dict(priorities),'errors':errors}

if __name__=='__main__':
    text=sys.stdin.read() if '--stdin' in sys.argv else (ROOT/'docs/KORVO_MASTER_LAUNCH_CHECKLIST.md').read_text()
    if '--sync-counts' in sys.argv:
        rows=[line for line in text.splitlines() if re.match(r'^\| [A-Z]+-\d{3} \|',line)]
        cells=[[part.strip() for part in line.strip('|').split('|')] for line in rows]
        if any(len(row)!=8 for row in cells):raise SystemExit('Refusing to sync malformed rows')
        counts=Counter(row[2] for row in cells);priorities=Counter(row[1] for row in cells)
        text=re.sub(r'Total tasks: \*\*\d+\*\*','Total tasks: **'+str(len(rows))+'**',text)
        for status in STATUSES:
            text=re.sub(r'^\| '+re.escape(status)+r' \| \d+ \|$', '| '+status+' | '+str(counts[status])+' |',text,flags=re.M)
        for priority in ('P0','P1','P2'):
            text=re.sub(r'\b'+priority+r': \d+',priority+': '+str(priorities[priority]),text)
    result=validate(text,(ROOT/'docs/OWNER_ACTION_CHECKLIST.md').read_text(),(ROOT/'docs/CLOSED_BETA_READINESS.md').read_text())
    if '--sync-counts' in sys.argv and result['valid']:
        if '--stdin' in sys.argv:raise SystemExit('Count synchronization requires the authoritative file')
        (ROOT/'docs/KORVO_MASTER_LAUNCH_CHECKLIST.md').write_text(text)
    print(json.dumps(result,indent=2))
    raise SystemExit(0 if result['valid'] else 1)
