import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../supabase/proposals/security-review/',import.meta.url);
const hash=s=>createHash('sha256').update(s).digest('hex');
test('ordered review packages preserve every byte of the approved-for-review canonical proposal',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root),'utf8'));
 const canonical=fs.readFileSync(new URL('../supabase/proposals/20261012160000_harden_korvo_api_permissions.sql',import.meta.url),'utf8');
 const parts=manifest.packages.map((p,i)=>{assert.equal(p.order,i+1);assert.match(p.file,/^\d{14}_review_security_.*\.sql$/);const s=fs.readFileSync(new URL(p.file,root),'utf8');assert.equal(hash(s),p.sha256);return s;});
 assert.equal(parts.join(''),canonical);assert.equal(hash(canonical),manifest.source_sha256);assert.equal(manifest.statements,464);
});
test('security packages remain approval-gated and outside automatic deployment migrations',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root),'utf8'));
 assert.equal(manifest.approval_required,true);assert.equal(manifest.deployment_allowed,false);
 const automatic=fs.readdirSync(new URL('../supabase/migrations/',import.meta.url));
 assert.ok(!automatic.some(f=>f.includes('review_security_')));
});
