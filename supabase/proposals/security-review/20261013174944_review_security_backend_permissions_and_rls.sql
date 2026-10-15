-- Backend-only table: no direct API access, including future accidental grants.
revoke all on public.job_matching_config from public, anon, authenticated, service_role;
create policy backend_only_deny_clients on public.job_matching_config as restrictive for all to anon, authenticated using (false) with check (false);
comment on policy backend_only_deny_clients on public.job_matching_config is 'Intentionally backend-only. Audited private functions authorize access; clients have no direct grants.';

-- Backend-only table: no direct API access, including future accidental grants.
revoke all on public.payment_webhook_events from public, anon, authenticated, service_role;
create policy backend_only_deny_clients on public.payment_webhook_events as restrictive for all to anon, authenticated using (false) with check (false);
comment on policy backend_only_deny_clients on public.payment_webhook_events is 'Intentionally backend-only. Audited private functions authorize access; clients have no direct grants.';

-- Backend-only table: no direct API access, including future accidental grants.
revoke all on public.platform_admins from public, anon, authenticated, service_role;
create policy backend_only_deny_clients on public.platform_admins as restrictive for all to anon, authenticated using (false) with check (false);
comment on policy backend_only_deny_clients on public.platform_admins is 'Intentionally backend-only. Audited private functions authorize access; clients have no direct grants.';

-- Backend-only table: no direct API access, including future accidental grants.
revoke all on public.professional_badges from public, anon, authenticated, service_role;
create policy backend_only_deny_clients on public.professional_badges as restrictive for all to anon, authenticated using (false) with check (false);
comment on policy backend_only_deny_clients on public.professional_badges is 'Intentionally backend-only. Audited private functions authorize access; clients have no direct grants.';

-- Backend-only table: no direct API access, including future accidental grants.
revoke all on public.professional_verification_history from public, anon, authenticated, service_role;
create policy backend_only_deny_clients on public.professional_verification_history as restrictive for all to anon, authenticated using (false) with check (false);
comment on policy backend_only_deny_clients on public.professional_verification_history is 'Intentionally backend-only. Audited private functions authorize access; clients have no direct grants.';

-- Backend-only table: no direct API access, including future accidental grants.
revoke all on public.professional_verifications from public, anon, authenticated, service_role;
create policy backend_only_deny_clients on public.professional_verifications as restrictive for all to anon, authenticated using (false) with check (false);
comment on policy backend_only_deny_clients on public.professional_verifications is 'Intentionally backend-only. Audited private functions authorize access; clients have no direct grants.';

alter policy "Professionals can view own subscription" on public.professional_subscriptions using (((professional_id = (select auth.uid())) OR (select public.is_korvo_admin())));

alter policy "Professionals can view own job usage" on public.professional_job_usage using (((professional_id = (select auth.uid())) OR (select public.is_korvo_admin())));

alter policy "Professionals can view own subscription history" on public.professional_subscription_history using (((professional_id = (select auth.uid())) OR (select public.is_korvo_admin())));

alter policy "Issue evidence read" on storage.objects using (((bucket_id = 'project-issue-evidence'::text) AND ((select public.is_korvo_admin()) OR (EXISTS ( SELECT 1
   FROM project_issues pi
  WHERE (((pi.id)::text = (storage.foldername(objects.name))[1]) AND ((pi.customer_id = (select auth.uid())) OR (pi.professional_id = (select auth.uid())))))))));

alter policy "Issue evidence upload" on storage.objects with check (((bucket_id = 'project-issue-evidence'::text) AND ((storage.foldername(name))[2] = ((select auth.uid()))::text) AND (EXISTS ( SELECT 1
   FROM project_issues pi
  WHERE (((pi.id)::text = (storage.foldername(objects.name))[1]) AND (pi.status = ANY (ARRAY['open'::text, 'under_review'::text])) AND ((pi.customer_id = (select auth.uid())) OR (pi.professional_id = (select auth.uid()))))))));

alter policy "Booking participants can view payment status" on public.booking_payments using ((((select auth.uid()) = customer_id) OR ((select auth.uid()) = professional_id)));

alter policy "Participants can view messages" on public.messages using ((EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.customer_id = (select auth.uid())) OR (c.professional_id = (select auth.uid())))))));

alter policy "Customers and professionals can view relevant reviews" on public.reviews using ((((select auth.uid()) = customer_id) OR ((select auth.uid()) = professional_id)));

alter policy "Participants can view conversations" on public.conversations using ((((select auth.uid()) = customer_id) OR ((select auth.uid()) = professional_id)));

alter policy "Customers and professionals can view active jobs" on public.active_jobs using ((((select auth.uid()) = customer_id) OR ((select auth.uid()) = professional_id)));

alter policy "Users can create own profile" on public.profiles with check (((select auth.uid()) = id));

alter policy "Users can update own profile" on public.profiles using (((select auth.uid()) = id)) with check (((select auth.uid()) = id));

alter policy "Users can view own profile" on public.profiles using (((select auth.uid()) = id));

alter policy "Customers and professionals can view jobs" on public.jobs using ((((select auth.uid()) = customer_id) OR ((status = 'open'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.account_type = 'professional'::text) AND (profiles.is_active = true)))))));

alter policy "Customers can create their own jobs" on public.jobs with check ((((select auth.uid()) = customer_id) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.account_type = 'customer'::text))))));

alter policy "Customers and professionals can view relevant quotes" on public.quotes using ((((select auth.uid()) = customer_id) OR ((select auth.uid()) = professional_id)));

alter policy "Professionals can submit their own quotes" on public.quotes with check ((((select auth.uid()) = professional_id) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (p.account_type = 'professional'::text) AND (p.is_active = true)))) AND (EXISTS ( SELECT 1
   FROM jobs j
  WHERE ((j.id = quotes.job_id) AND (j.customer_id = quotes.customer_id) AND (j.status = 'open'::text))))));

alter policy "Professionals can create own profile" on public.professional_profiles with check (((select auth.uid()) = id));

alter policy "Professionals can update own profile" on public.professional_profiles using (((select auth.uid()) = id)) with check (((select auth.uid()) = id));

alter policy "Professionals can view own profile" on public.professional_profiles using (((select auth.uid()) = id));

alter policy "Customers can insert own private job details" on public.job_private_details with check ((((select auth.uid()) = customer_id) AND (EXISTS ( SELECT 1
   FROM jobs j
  WHERE ((j.id = job_private_details.job_id) AND (j.customer_id = (select auth.uid())))))));

alter policy "Customers can update own private job details" on public.job_private_details using (((select auth.uid()) = customer_id)) with check ((((select auth.uid()) = customer_id) AND (EXISTS ( SELECT 1
   FROM jobs j
  WHERE ((j.id = job_private_details.job_id) AND (j.customer_id = (select auth.uid())))))));

alter policy "Customers can view own private job details" on public.job_private_details using (((select auth.uid()) = customer_id));

alter policy "Project participants can view closures" on public.project_closures using (((EXISTS ( SELECT 1
   FROM jobs j
  WHERE ((j.id = project_closures.job_id) AND (j.customer_id = (select auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM active_jobs aj
  WHERE ((aj.id = project_closures.active_job_id) AND (aj.professional_id = (select auth.uid())))))));

alter policy "Users can update own notifications" on public.notifications using (((select auth.uid()) = user_id)) with check (((select auth.uid()) = user_id));

alter policy "Users can view own notifications" on public.notifications using (((select auth.uid()) = user_id));

alter policy "Project participants and admins can view issues" on public.project_issues using ((((select auth.uid()) = customer_id) OR ((select auth.uid()) = professional_id) OR (select public.is_korvo_admin())));

alter policy "Project participants and admins can view issue messages" on public.project_issue_messages using (((select public.is_korvo_admin()) OR (EXISTS ( SELECT 1
   FROM project_issues pi
  WHERE ((pi.id = project_issue_messages.issue_id) AND ((pi.customer_id = (select auth.uid())) OR (pi.professional_id = (select auth.uid()))))))));

alter policy "Project participants can send issue messages" on public.project_issue_messages with check (((sender_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM project_issues pi
  WHERE ((pi.id = project_issue_messages.issue_id) AND (pi.status = ANY (ARRAY['open'::text, 'under_review'::text])) AND ((pi.customer_id = (select auth.uid())) OR (pi.professional_id = (select auth.uid()))))))));

alter policy "Users and admins can view restrictions" on public.account_restrictions using (((user_id = (select auth.uid())) OR (select public.is_korvo_admin())));

alter policy "Issue participants and admins can view evidence" on public.project_issue_evidence using (((select public.is_korvo_admin()) OR (EXISTS ( SELECT 1
   FROM project_issues pi
  WHERE ((pi.id = project_issue_evidence.issue_id) AND ((pi.customer_id = (select auth.uid())) OR (pi.professional_id = (select auth.uid()))))))));

alter policy "Users can view own blocks" on public.user_blocks using (((select auth.uid()) = blocker_id));

alter policy "Admins can view issue admin notes" on public.project_issue_admin_notes using ((select public.is_korvo_admin()));

alter policy "Admins can view case audit log" on public.case_audit_log using ((select public.is_korvo_admin()));

alter policy "Payment review participants and admins can view" on public.payment_reviews using ((((select auth.uid()) = customer_id) OR ((select auth.uid()) = professional_id) OR (select public.is_korvo_admin())));

alter policy "Reporters can view own reports" on public.trust_safety_reports using (((reporter_id = (select auth.uid())) OR (select public.is_korvo_admin())));

alter policy "Admins can view moderation events" on public.message_moderation_events using ((select public.is_korvo_admin()));

alter policy "Users and admins can view strikes" on public.account_strikes using (((user_id = (select auth.uid())) OR (select public.is_korvo_admin())));

alter policy "Admins can view trust safety audit" on public.trust_safety_audit_log using ((select public.is_korvo_admin()));


