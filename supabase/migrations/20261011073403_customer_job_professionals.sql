-- Owner-only customer view; private profile/contact fields never enter the API.
create function korvo_opportunities_private.customer_job_professionals(p_job_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_job public.jobs%rowtype;
  v_recommendations jsonb := '[]'::jsonb;
  v_activity jsonb;
  v_limit integer;
  v_used integer;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into v_job from public.jobs where id=p_job_id and customer_id=auth.uid();
  if not found then raise exception 'Job not found or access denied' using errcode='42501'; end if;

  select max_invitations_per_job into v_limit from public.job_matching_config where id=true;
  if not found then raise exception 'Job matching configuration is unavailable'; end if;
  select count(*)::integer into v_used from public.job_opportunities
    where job_id=p_job_id and invited_at is not null;

  if v_job.status='open' then
    select coalesce(jsonb_agg(c.payload order by c.can_quote desc,c.match_score desc,c.professional_id),'[]'::jsonb)
    into v_recommendations from (
      select r.professional_id,r.can_quote,r.match_score,jsonb_build_object(
        'professional_id',r.professional_id,'business_name',r.business_name,
        'services',coalesce(pp.services,'{}'::text[]),
        'verification_status',r.verification_status,'completed_jobs',r.completed_jobs,
        'review_count',r.review_count,'average_rating',r.average_rating,
        'preferred_area_match',r.preferred_area_match,'can_quote',r.can_quote,
        'has_quote',exists(select 1 from public.quotes q where q.job_id=p_job_id and q.professional_id=r.professional_id)
      ) as payload
      from public.job_recommended_professionals(p_job_id,100) r
      join public.professional_profiles pp on pp.id=r.professional_id
      where not public.is_blocked_between(auth.uid(),r.professional_id)
      order by r.can_quote desc,r.match_score desc,r.professional_id limit 25
    ) c;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'opportunity_id',o.id,'professional_id',o.professional_id,
    'business_name',case when coalesce(pp.is_public,true) and coalesce(p.is_active,false)
      and not public.is_blocked_between(auth.uid(),o.professional_id) then pp.business_name else null end,
    'status',o.status,'matched_at',o.matched_at,'invited_at',o.invited_at,
    'viewed_at',o.viewed_at,'passed_at',o.passed_at,'quoted_at',o.quoted_at,
    'closed_at',o.closed_at,'quote_id',o.quote_id
  ) order by o.created_at desc,o.id),'[]'::jsonb) into v_activity
  from public.job_opportunities o
  left join public.professional_profiles pp on pp.id=o.professional_id
  left join public.profiles p on p.id=o.professional_id
  where o.job_id=p_job_id and o.customer_id=auth.uid();

  return jsonb_build_object(
    'job',jsonb_build_object('id',v_job.id,'title',v_job.title,'category',v_job.category,'status',v_job.status),
    'recommendations',v_recommendations,'activity',v_activity,
    'invitations_used',v_used,'invitation_limit',v_limit,
    'can_invite',v_job.status='open' and public.is_korvo_action_allowed(auth.uid(),'post_job')
      and public.is_korvo_action_allowed(auth.uid(),'message')
  );
end;
$$;

create function public.customer_job_professionals(p_job_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select korvo_opportunities_private.customer_job_professionals(p_job_id); $$;

revoke all on function korvo_opportunities_private.customer_job_professionals(uuid) from public,anon,authenticated,service_role;
revoke all on function public.customer_job_professionals(uuid) from public,anon,authenticated,service_role;
grant execute on function korvo_opportunities_private.customer_job_professionals(uuid) to authenticated;
grant execute on function public.customer_job_professionals(uuid) to authenticated;
