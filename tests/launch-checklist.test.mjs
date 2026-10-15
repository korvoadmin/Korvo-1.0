import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const text=fs.readFileSync(new URL('../docs/KORVO_MASTER_LAUNCH_CHECKLIST.md',import.meta.url),'utf8');
function check(input){const r=spawnSync('python3',['scripts/check_launch_checklist.py','--stdin'],{cwd:root,input,encoding:'utf8'});assert.ok(r.stdout,r.stderr);return JSON.parse(r.stdout);}
test('master checklist counts, evidence, dependencies and owner links are consistent',()=>{const r=check(text);assert.equal(r.valid,true,JSON.stringify(r.errors));assert.equal(r.total,Object.values(r.statuses).reduce((a,b)=>a+b,0));});
test('validator rejects stale task totals',()=>assert.equal(check(text.replace(/Total tasks: \*\*\d+\*\*/,'Total tasks: **999**')).valid,false));
test('validator rejects unknown dependency',()=>assert.equal(check(text.replace('| SEC-005, LEG-001, LEG-002 |','| MISSING-999 |')).valid,false));
test('validator rejects duplicate IDs',()=>assert.equal(check(text.replace('| WEB-002 | P0','| WEB-001 | P0')).valid,false));
test('validator rejects unregistered owner approval',()=>assert.equal(check(text.replace('Approval A8; final policy copy D7','Approval A99; final policy copy D7')).valid,false));
test('validator rejects missing evidence registry key',()=>assert.equal(check(text.replace('| E16 | tests/evidence-refund-database.cjs;','| E99 | tests/evidence-refund-database.cjs;')).valid,false));
test('validator rejects missing required section',()=>assert.equal(check(text.replace('## 14. Public-launch readiness','## Public-launch readiness')).valid,false));
test('repository mission preserves projects, shifts and everyday gigs without enabling payments',()=>{const r=fs.readFileSync(new URL('../README.md',import.meta.url),'utf8');assert.match(r,/projects, shifts and everyday gigs/);assert.match(r,/KORVO_MASTER_LAUNCH_CHECKLIST\.md/);assert.match(r,/remain disabled/);});

test('validator rejects circular task dependencies',()=>assert.equal(check(text.replace('| SEC-005, LEG-001, LEG-002 |','| WEB-002 |')).valid,false));
