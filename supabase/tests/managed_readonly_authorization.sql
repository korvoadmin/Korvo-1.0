-- Hosted READ ONLY smoke checks. No DDL, fixture creation, user writes or migrations.
-- Nonexistent actor + forged editable metadata deliberately cannot represent a real
-- customer/professional/support/owner session. Positive hosted role acceptance is separate.
begin read only;
set local lock_timeout='3s';
set local statement_timeout='15s';
select set_config('request.jwt.claim.sub','90000000-0000-0000-0000-000000000099',true);
select set_config('request.jwt.claims','{"sub":"90000000-0000-0000-0000-000000000099","role":"authenticated","user_metadata":{"role":"owner","is_admin":true}}',true);
do $$
declare role_name text;stmt text;checks integer:=0;denied boolean;n bigint;
begin
 if current_setting('transaction_read_only')<>'on' then raise exception 'Read-only transaction required';end if;
 foreach role_name in array array['anon','authenticated'] loop
  execute 'set local role '||quote_ident(role_name);
  foreach stmt in array array[
   'select * from public.marketplace_payments limit 1',
   'select * from public.stripe_event_receipts limit 1',
   'select public.marketplace_apply_event(null::text,null::text,null::jsonb)',
   'select public.marketplace_prepare_checkout(''90000000-0000-0000-0000-000000000099''::uuid)'
  ] loop
   denied:=false;
   begin execute stmt;
   exception when insufficient_privilege then denied:=true;
    when raise_exception then if sqlerrm ilike '%authentication required%' then denied:=true;else raise;end if;
   end;
   if not denied then raise exception 'Negative authorization failed: % / %',role_name,stmt;end if;
   checks:=checks+1;
  end loop;
  execute 'select count(*) from storage.objects where bucket_id=''project-issue-evidence''' into n;
  if n<>0 then raise exception 'Inactive actor can read issue objects';end if;checks:=checks+1;
  execute 'reset role';
 end loop;
 set local role authenticated;
 foreach stmt in array array[
  'select public.admin_issue_queue()',
  'select public.admin_decide_payment_review(null::uuid,null::text,null::text)',
  'select public.admin_release_professional_job_usage(null::uuid,null::text)',
  'select public.admin_set_professional_membership(null::uuid,null::text,null::text)'
 ] loop
  denied:=false;
  begin execute stmt;
  exception when insufficient_privilege then denied:=true;
   when raise_exception then if sqlerrm ilike '%admin%required%' or sqlerrm ilike '%authentication required%' then denied:=true;else raise;end if;
  end;
  if not denied then raise exception 'Forged metadata reached financial/admin action';end if;checks:=checks+1;
 end loop;
 reset role;
 perform set_config('korvo.readonly_matrix',jsonb_build_object('checks_passed',checks,'transaction_read_only',true,'synthetic_actor_only',true,'user_records_written',0,'positive_role_sessions_verified',false)::text,true);
end;$$;
select current_setting('korvo.readonly_matrix')::jsonb managed_readonly_matrix;
rollback;
