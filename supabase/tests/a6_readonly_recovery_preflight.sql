-- Read-only catalog/capability checks only. Never tests ownership by running DDL.
-- WAL archiving is NOT evidence of an available backup or enabled PITR entitlement.
begin read only;
set local lock_timeout='3s';
set local statement_timeout='15s';
select jsonb_build_object(
 'inspection_role',current_user,'server_version',current_setting('server_version'),
 'capabilities',(select jsonb_build_object('superuser',rolsuper,'bypassrls',rolbypassrls,'create_role',rolcreaterole,'create_database',rolcreatedb) from pg_roles where rolname=current_user),
 'a6_namespace_absent',to_regnamespace('korvo_api_private') is null,
 'wal_configuration_only',(select jsonb_object_agg(name,setting) from pg_settings where name in('archive_mode','wal_level')),
 'relations',(select jsonb_agg(jsonb_build_object('relation',format('%I.%I',n.nspname,c.relname),'owner',pg_get_userbyid(c.relowner),'ownership_available',
  (select rolsuper from pg_roles where rolname=current_user) or pg_has_role(current_user,c.relowner,'USAGE')) order by n.nspname,c.relname)
  from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind in('r','p') and (n.nspname='public' or (n.nspname='storage' and c.relname='objects'))),
 'function_owners',(select jsonb_agg(x) from (select pg_get_userbyid(p.proowner) as owner,count(*)::int as functions,
  (select rolsuper from pg_roles where rolname=current_user) or pg_has_role(current_user,p.proowner,'USAGE') as ownership_available
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' group by p.proowner) x),
 'default_acl_scopes',(select jsonb_agg(jsonb_build_object('owner',pg_get_userbyid(d.defaclrole),'kind',d.defaclobjtype,'schema',coalesce(n.nspname,''),'captured_by_current_role',pg_get_userbyid(d.defaclrole)=current_user))
  from pg_default_acl d left join pg_namespace n on n.oid=d.defaclnamespace where n.nspname='public' or d.defaclnamespace=0)
) a6_recovery_preflight;
rollback;
