// Private schema metadata loader. No network access and no real account export.
const fs=require('node:fs');
const quote=s=>'"'+s.replaceAll('"','""')+'"';
async function bootstrapCatalog(db,{before,clone},snapshotQuery,restoreSQL){
 await db.exec('set check_function_bodies=false');
 for(const role of clone.roles)await db.exec(`create role ${quote(role)}`);
 for(const schema of clone.schemas)await db.exec(`create schema ${quote(schema)}`);
 for(const sql of [...clone.enums,...clone.sequences,...clone.tables,...clone.constraints,...clone.helpers])await db.exec(sql);
 for(const sql of clone.schema_grants)await db.exec(sql);
 for(const f of before.snapshot.functions)await db.exec(f.definition);
 for(const r of before.snapshot.relations)await db.exec(`alter table ${r.identity} owner to ${quote(r.owner)}`);
 for(const f of before.snapshot.functions)await db.exec(`alter function ${f.identity} owner to ${quote(f.owner)}`);
 for(const s of before.snapshot.schemas)await db.exec(`alter schema ${quote(s.name)} owner to ${quote(s.owner)}`);
 for(const d of before.snapshot.defaults){
  const kind={r:'TABLES',S:'SEQUENCES',f:'FUNCTIONS'}[d.type];if(!kind)throw Error('Unsupported default kind');
  const prefix=`alter default privileges for role ${quote(d.owner)}${d.schema?' in schema '+quote(d.schema):''}`;
  await db.exec(`${prefix} revoke all on ${kind} from public`);
  for(const a of d.acl)await db.exec(`${prefix} grant ${a.privilege} on ${kind} to ${a.grantee==='PUBLIC'?'PUBLIC':quote(a.grantee)}${a.grantable?' with grant option':''}`);
 }
 const initial=(await db.query(snapshotQuery)).rows[0];await db.exec(restoreSQL(before,initial));
}
module.exports={bootstrapCatalog};
