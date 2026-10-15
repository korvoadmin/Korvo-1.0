// Read-only catalog export for a disposable empty rehearsal. NEVER exports row data.
// Store the result outside Git with the same protections as security snapshots.
export const CLONE_QUERY = `select jsonb_build_object(
'roles',(select jsonb_agg(rolname order by oid) from pg_roles where rolname !~ '^pg_' and rolname<>current_user),
'schemas',(select jsonb_agg(nspname order by nspname) from pg_namespace where nspname in('auth','storage') or nspname like 'korvo%'),
'enums',(select coalesce(jsonb_agg(ddl order by ddl),'[]') from (
 select format('CREATE TYPE %I.%I AS ENUM (%s);',n.nspname,t.typname,string_agg(quote_literal(e.enumlabel),',' order by e.enumsortorder)) ddl
 from pg_type t join pg_namespace n on n.oid=t.typnamespace join pg_enum e on e.enumtypid=t.oid
 where n.nspname in('public','auth','storage') group by n.nspname,t.typname) e),
'sequences',(select coalesce(jsonb_agg(format('CREATE SEQUENCE %I.%I;',n.nspname,c.relname) order by c.relname),'[]')
 from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='S' and n.nspname in('public','auth','storage')
 and not exists(select 1 from pg_depend d where d.objid=c.oid and d.deptype='i')),
'tables',(select jsonb_agg(ddl order by identity) from (
 select format('%I.%I',n.nspname,c.relname) identity,
 format('CREATE TABLE %I.%I (%s);',n.nspname,c.relname,string_agg(format('%I %s%s%s%s',a.attname,format_type(a.atttypid,a.atttypmod),
 case when a.attidentity<>'' then ' GENERATED '||case a.attidentity when 'a' then 'ALWAYS' else 'BY DEFAULT' end||' AS IDENTITY'
 when a.attgenerated<>'' then ' GENERATED ALWAYS AS ('||pg_get_expr(d.adbin,d.adrelid)||') STORED'
 when d.adbin is not null then ' DEFAULT '||pg_get_expr(d.adbin,d.adrelid) else '' end,
 case when a.attnotnull then ' NOT NULL' else '' end,''),',' order by a.attnum)) ddl
 from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_attribute a on a.attrelid=c.oid
 left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum
 where c.relkind='r' and a.attnum>0 and not a.attisdropped and (n.nspname='public' or
 n.nspname='auth' or (n.nspname='storage' and c.relname in('objects','buckets')))
 group by n.nspname,c.relname) t),
'constraints',(select jsonb_agg(format('ALTER TABLE %I.%I ADD CONSTRAINT %I %s;',n.nspname,c.relname,k.conname,pg_get_constraintdef(k.oid)) order by case when k.contype='f' then 1 else 0 end,n.nspname,c.relname,k.conname)
 from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace
 where k.contype in('p','u','c','f') and (n.nspname='public' or n.nspname='auth' or (n.nspname='storage' and c.relname in('objects','buckets')))),
'schema_grants',(select jsonb_agg(format('GRANT %s ON SCHEMA %I TO %s;',a.privilege_type,n.nspname,case when a.grantee=0 then 'PUBLIC' else quote_ident(pg_get_userbyid(a.grantee)) end))
 from pg_namespace n cross join lateral aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) a where n.nspname in('auth','storage') or n.nspname like 'korvo%'),
'helpers',(select jsonb_agg(pg_get_functiondef(p.oid) order by n.nspname,p.proname)
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.prokind='f' and
 (n.nspname like 'korvo%' or (n.nspname='auth' and p.proname in('uid','jwt','role','email')) or (n.nspname='storage' and (p.proname in('foldername','filename','extension') or p.oid in(select tgfoid from pg_trigger where tgrelid='storage.objects'::regclass and not tgisinternal)))))
) clone`;
