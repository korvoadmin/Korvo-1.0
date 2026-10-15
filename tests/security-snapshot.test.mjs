import test from 'node:test';import assert from 'node:assert/strict';
import {SNAPSHOT_QUERY} from '../scripts/security-snapshot.mjs';
test('catalog ACL fingerprint ordering is portable across role OID assignments',()=>{
 assert.doesNotMatch(SNAPSHOT_QUERY,/order by a\.grantee[, ]/);
 assert.match(SNAPSHOT_QUERY,/order by case when a\.grantee=0 then 'PUBLIC' else pg_get_userbyid\(a\.grantee\) end,a\.privilege_type/);
 assert.match(SNAPSHOT_QUERY,/order by pg_get_userbyid\(d\.defaclrole\),coalesce\(n\.nspname,''\),d\.defaclobjtype/);
});
