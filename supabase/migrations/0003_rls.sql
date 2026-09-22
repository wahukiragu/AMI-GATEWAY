-- =====================================================================
-- AMI Gateway: row level security and grants
--
-- Principle: signed-in users can READ only what belongs to them (or, for
-- staff, everything except private notes). Nobody can write a table
-- directly; writes happen through the SECURITY DEFINER functions.
-- =====================================================================

alter table public.framework_versions enable row level security;
alter table public.framework_stages   enable row level security;
alter table public.sdg_goals          enable row level security;
alter table public.editions           enable row level security;
alter table public.participants       enable row level security;
alter table public.connections        enable row level security;
alter table public.connection_updates enable row level security;
alter table public.connection_notes   enable row level security;
alter table public.claim_requests     enable row level security;
alter table public.staff              enable row level security;
alter table public.audit_log          enable row level security;

-- Public reference data (the framework is meant to be readable)
create policy framework_versions_read on public.framework_versions for select to anon, authenticated using (status <> 'draft');
create policy framework_stages_read   on public.framework_stages   for select to anon, authenticated
  using (exists (select 1 from public.framework_versions v where v.id = framework_version_id and v.status <> 'draft'));
create policy sdg_goals_read          on public.sdg_goals          for select to anon, authenticated using (true);
create policy editions_read           on public.editions           for select to anon, authenticated using (true);

-- Participants: my own row, or any row for staff. Other people's names come
-- only through search_participants() / my_connections().
create policy participants_read on public.participants for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));

-- Connections: ones I logged, ones logged with me, or all for staff.
create policy connections_read on public.connections for select to authenticated
  using (
    logged_by = (select public.current_participant_id())
    or with_participant = (select public.current_participant_id())
    or (select public.is_staff())
  );

create policy connection_updates_read on public.connection_updates for select to authenticated
  using (exists (select 1 from public.connections c where c.id = connection_id));

-- Private notes: only the author. Staff cannot read them.
create policy connection_notes_read on public.connection_notes for select to authenticated
  using (participant_id = (select public.current_participant_id()));

create policy claim_requests_read on public.claim_requests for select to authenticated
  using (requested_by = (select auth.uid()) or (select public.is_staff()));

create policy staff_read_self on public.staff for select to authenticated
  using (user_id = (select auth.uid()));

create policy audit_log_admin_read on public.audit_log for select to authenticated
  using ((select public.is_admin()));

-- ---------- grants ----------
revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;

grant select on public.framework_versions, public.framework_stages, public.sdg_goals, public.editions
  to anon, authenticated;
grant select on public.participants, public.connections, public.connection_updates,
  public.connection_notes, public.claim_requests, public.staff, public.audit_log
  to authenticated;

-- Functions: nothing is callable by default; grant only the public API.
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.current_participant_id(),
  public.is_staff(),
  public.is_admin(),
  public.record_consent(text, boolean, boolean, boolean, boolean),
  public.update_consents(boolean, boolean),
  public.register_participant(text, text, text, text, text, text[], text),
  public.search_participants(text),
  public.add_unverified_participant(text, text, text, text, text),
  public.create_connection(uuid, int, text, text, numeric, text, text, int[], text, text, date),
  public.update_connection(uuid, int, text, text, numeric, text, text, text, text, date),
  public.acknowledge_connection(uuid, text, text),
  public.my_connections(),
  public.suggest_claims(),
  public.request_claim(uuid),
  public.decide_claim(uuid, boolean, text),
  public.admin_verify_connection(uuid, boolean),
  public.staff_log_export(text),
  public.delete_my_data()
to authenticated;
