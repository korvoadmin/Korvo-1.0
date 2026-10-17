import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
const inventory=JSON.parse(fs.readFileSync('docs/A6_OBJECT_INVENTORY.json','utf8'));
test('A6 inventory pins unchanged canonical scope and every ordered package',()=>{
 assert.equal(inventory.source_sha256,createHash('sha256').update(fs.readFileSync(inventory.source)).digest('hex'));
 assert.equal(inventory.statement_count,464);assert.equal(inventory.packages.length,7);
 for(const p of inventory.packages)assert.equal(p.sha256,createHash('sha256').update(fs.readFileSync('supabase/proposals/security-review/'+p.file)).digest('hex'));
 assert.equal(inventory.packages.reduce((n,p)=>n+p.statements,0),464);
});
test('inventory identifies exact managed owner blockers and guarded objects',()=>{
 assert.deepEqual(inventory.managed_blockers.map(x=>x.policy),['Issue evidence read','Issue evidence upload']);
 assert.ok(inventory.managed_blockers.every(x=>x.owner==='supabase_storage_admin'&&x.table==='storage.objects'));
 assert.equal(inventory.functions.length,103);assert.equal(inventory.altered_functions.length,43);assert.equal(inventory.policies.length,46);assert.equal(inventory.triggers.length,3);assert.equal(inventory.grants.length,257);
 assert.ok(inventory.functions.every(x=>!x.identity.includes('CREATE SCHEMA')&&!x.identity.includes('REVOKE')));
});
test('read-only recovery preflight cannot change managed permissions or infer backup availability',()=>{
 const sql=fs.readFileSync('supabase/tests/a6_readonly_recovery_preflight.sql','utf8');assert.match(sql,/begin read only;/);assert.match(sql,/rollback;/);assert.doesNotMatch(sql,/^\s*(?:alter|create|grant|revoke|insert|update|delete|drop)\s/im);assert.match(sql,/NOT evidence of an available backup/);
});
