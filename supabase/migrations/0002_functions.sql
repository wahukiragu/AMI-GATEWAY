-- =====================================================================
-- AMI Gateway: functions
-- Every function is SECURITY DEFINER with an empty search_path, so all
-- objects are schema-qualified. Ownership, status and verification are
-- set here, never accepted from the client.
-- =====================================================================

-- ---------- identity helpers (used by RLS policies) ----------
create or replace function public.current_participant_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.participants where user_id = (select auth.uid()) limit 1
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff where user_id = (select auth.uid()))
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff where user_id = (select auth.uid()) and role = 'admin')
$$;

-- ---------- internal helpers (not callable by clients) ----------
create or replace function public.current_framework_version_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.framework_versions
  where status = 'published'
  order by published_at desc nulls last, created_at desc
  limit 1
$$;

create or replace function public.current_edition_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.editions where is_current limit 1
$$;

create or replace function public.write_audit(p_action text, p_entity text, p_entity_id text, p_detail jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values ((select auth.uid()), p_action, p_entity, p_entity_id, coalesce(p_detail, '{}'::jsonb))
$$;

-- Validates an optional sale/payment value. Returns nulls and 'none' when no value.
create or replace function public.normalise_value(p_value numeric, p_currency text, p_payment text)
returns table (amount numeric, currency text, pay public.payment_status)
language plpgsql immutable set search_path = '' as $$
begin
  if p_value is null then
    return query select null::numeric, null::text, 'none'::public.payment_status;
    return;
  end if;
  if p_value < 0 or p_value > 1000000000 then
    raise exception 'invalid_value' using errcode = 'P0001';
  end if;
  if p_currency is null or upper(btrim(p_currency)) not in ('ZAR','KES','USD','NGN','BWP','GHS','TZS','UGX','EUR','GBP') then
    raise exception 'invalid_currency' using errcode = 'P0001';
  end if;
  if p_payment is null or p_payment not in ('agreed', 'paid') then
    raise exception 'payment_status_required' using errcode = 'P0001';
  end if;
  return query select round(p_value, 2), upper(btrim(p_currency)), p_payment::public.payment_status;
end $$;

create or replace function public.clean_sdgs(p_sdgs int[])
returns smallint[] language plpgsql immutable set search_path = '' as $$
declare v smallint[];
begin
  select coalesce(array_agg(distinct x::smallint order by x::smallint), '{}')
    into v from unnest(coalesce(p_sdgs, '{}')) as x where x between 1 and 17;
  if cardinality(v) > 6 then
    raise exception 'too_many_sdgs' using errcode = 'P0001';
  end if;
  return v;
end $$;

-- Merges an unverified profile into a real participant. Internal.
create or replace function public.merge_participants(p_target uuid, p_source uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_target = p_source then return; end if;
  -- a connection between the two would become a self-connection
  delete from public.connections where logged_by = p_target and with_participant = p_source;
  delete from public.connections where logged_by = p_source and with_participant = p_target;
  update public.connections set with_participant = p_target where with_participant = p_source;
  update public.connections set logged_by = p_target where logged_by = p_source;
  update public.participants t
     set organisation     = coalesce(t.organisation, s.organisation),
         participant_type = coalesce(t.participant_type, s.participant_type),
         country          = coalesce(t.country, s.country),
         offering         = coalesce(t.offering, s.offering)
    from public.participants s
   where t.id = p_target and s.id = p_source;
  delete from public.participants where id = p_source;
end $$;

-- ---------- Stage 0: consent gate ----------
create or replace function public.record_consent(
  p_version text, p_agreed boolean, p_adult boolean,
  p_public_name boolean default false, p_future_contact boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := (select auth.uid());
  v_email text;
  v_pid   uuid;
  v_claim uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not coalesce(p_agreed, false) or not coalesce(p_adult, false) then
    raise exception 'consent_required' using errcode = 'P0001';
  end if;
  if coalesce(btrim(p_version), '') = '' then
    raise exception 'consent_version_required' using errcode = 'P0001';
  end if;

  select lower(btrim(email)) into v_email from auth.users where id = v_uid;
  select id into v_pid from public.participants where user_id = v_uid;

  if v_pid is null then
    -- Auto-link an unverified profile that carries this VERIFIED email address.
    select id into v_claim from public.participants
     where user_id is null and v_email is not null and email_norm = v_email limit 1;
    if v_claim is not null then
      update public.participants
         set user_id = v_uid, status = 'account',
             consent_version = p_version, consent_at = now(), adult_confirmed = true,
             consent_public_name = coalesce(p_public_name, false),
             consent_future_contact = coalesce(p_future_contact, false)
       where id = v_claim returning id into v_pid;
      perform public.write_audit('profile_auto_claimed', 'participant', v_pid::text, '{}'::jsonb);
    else
      insert into public.participants
        (user_id, status, display_name, email, created_by, consent_version, consent_at, adult_confirmed,
         consent_public_name, consent_future_contact)
      values
        (v_uid, 'account', coalesce(nullif(split_part(coalesce(v_email, ''), '@', 1), ''), 'Participant'),
         v_email, v_uid, p_version, now(), true,
         coalesce(p_public_name, false), coalesce(p_future_contact, false))
      returning id into v_pid;
    end if;
  else
    update public.participants
       set consent_version = p_version, consent_at = now(), adult_confirmed = true,
           consent_public_name = coalesce(p_public_name, false),
           consent_future_contact = coalesce(p_future_contact, false)
     where id = v_pid;
  end if;

  perform public.write_audit('consent_recorded', 'participant', v_pid::text,
    jsonb_build_object('version', p_version, 'public_name', coalesce(p_public_name, false),
                       'future_contact', coalesce(p_future_contact, false)));
  return v_pid;
end $$;

create or replace function public.update_consents(p_public_name boolean, p_future_contact boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_pid uuid := public.current_participant_id();
begin
  if v_pid is null then raise exception 'consent_required' using errcode = 'P0001'; end if;
  update public.participants
     set consent_public_name = coalesce(p_public_name, false),
         consent_future_contact = coalesce(p_future_contact, false)
   where id = v_pid;
  perform public.write_audit('consents_changed', 'participant', v_pid::text,
    jsonb_build_object('public_name', coalesce(p_public_name, false), 'future_contact', coalesce(p_future_contact, false)));
end $$;

-- ---------- Stage 1: register ----------
create or replace function public.register_participant(
  p_name text, p_org text, p_type text, p_country text, p_offering text, p_wants text[], p_phone text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_pid uuid := public.current_participant_id();
begin
  if (select auth.uid()) is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if v_pid is null then raise exception 'consent_required' using errcode = 'P0001'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'name_required' using errcode = 'P0001'; end if;
  if coalesce(btrim(p_type), '') = '' then raise exception 'type_required' using errcode = 'P0001'; end if;
  if coalesce(btrim(p_country), '') = '' then raise exception 'country_required' using errcode = 'P0001'; end if;

  update public.participants
     set display_name = btrim(p_name),
         organisation = nullif(btrim(coalesce(p_org, '')), ''),
         participant_type = p_type,
         country = btrim(p_country),
         offering = nullif(btrim(coalesce(p_offering, '')), ''),
         wants = coalesce(p_wants, '{}'),
         phone = nullif(btrim(coalesce(p_phone, '')), ''),
         status = 'registered',
         registered_at = coalesce(registered_at, now())
   where id = v_pid;
  return v_pid;
end $$;

-- ---------- directory search (registered people + profiles I added) ----------
create or replace function public.search_participants(p_query text)
returns table (id uuid, display_name text, organisation text, participant_type text, country text, status text)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_me uuid := public.current_participant_id();
  v_q  text := btrim(coalesce(p_query, ''));
  v_pat text;
begin
  if v_me is null then return; end if;
  if not exists (select 1 from public.participants x where x.id = v_me and x.status = 'registered') then return; end if;
  v_pat := '%' || replace(replace(replace(v_q, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  return query
    select p.id, p.display_name, p.organisation, p.participant_type, p.country, p.status::text
      from public.participants p
     where p.id <> v_me
       and (p.status = 'registered' or (p.status = 'unverified' and p.created_by = (select auth.uid())))
       and (v_q = '' or p.display_name ilike v_pat or coalesce(p.organisation, '') ilike v_pat)
     order by (p.status = 'registered') desc, p.display_name
     limit 8;
end $$;

-- ---------- Stage 2: people who have not registered yet ----------
create or replace function public.add_unverified_participant(
  p_name text, p_country text, p_offering text, p_email text, p_phone text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me    uuid := public.current_participant_id();
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_phone text := nullif(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), '');
  v_id    uuid;
  v_name  text;
  v_status public.participant_status;
  v_count int;
begin
  if v_me is null or not exists (select 1 from public.participants x where x.id = v_me and x.status = 'registered') then
    raise exception 'registration_required' using errcode = 'P0001';
  end if;
  if coalesce(btrim(p_name), '') = '' or char_length(btrim(p_name)) > 120 then
    raise exception 'name_required' using errcode = 'P0001';
  end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = 'P0001';
  end if;

  if v_email is not null then
    select id, display_name, status into v_id, v_name, v_status from public.participants where email_norm = v_email;
  end if;
  if v_id is null and v_phone is not null and char_length(v_phone) >= 7 then
    select id, display_name, status into v_id, v_name, v_status from public.participants where phone_norm = v_phone limit 1;
  end if;
  if v_id is not null then
    if v_id = v_me then raise exception 'cannot_connect_with_self' using errcode = 'P0001'; end if;
    return jsonb_build_object('id', v_id, 'existing', true,
      'name', case when v_status = 'registered' then v_name else null end);
  end if;

  select count(*) into v_count from public.participants
   where created_by = (select auth.uid()) and status = 'unverified';
  if v_count >= 200 then raise exception 'too_many_unverified' using errcode = 'P0001'; end if;

  insert into public.participants (status, display_name, country, offering, email, phone, created_by)
  values ('unverified', btrim(p_name), nullif(btrim(coalesce(p_country, '')), ''),
          nullif(btrim(coalesce(p_offering, '')), ''), v_email, nullif(btrim(coalesce(p_phone, '')), ''),
          (select auth.uid()))
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'existing', false, 'name', null);
end $$;

-- ---------- Stage 2: log a connection ----------
create or replace function public.create_connection(
  p_with uuid, p_stage int, p_event_type text, p_summary text,
  p_value numeric default null, p_currency text default null, p_payment text default null,
  p_sdgs int[] default '{}', p_reflection text default null, p_next_step text default null,
  p_remind_on date default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_me  uuid := public.current_participant_id();
  v_fw  uuid := public.current_framework_version_id();
  v_ed  uuid := public.current_edition_id();
  v_id  uuid;
  v_amt numeric; v_cur text; v_pay public.payment_status;
  v_sdgs smallint[];
begin
  if v_me is null or not exists (select 1 from public.participants x where x.id = v_me and x.status = 'registered') then
    raise exception 'registration_required' using errcode = 'P0001';
  end if;
  if v_fw is null or v_ed is null then raise exception 'framework_not_configured' using errcode = 'P0001'; end if;
  if p_with is null or p_with = v_me or not exists (select 1 from public.participants x where x.id = p_with) then
    raise exception 'invalid_counterparty' using errcode = 'P0001';
  end if;
  if p_stage is null or p_stage not between 1 and 5 then raise exception 'invalid_stage' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.framework_stages s
                  where s.framework_version_id = v_fw and s.stage_no = p_stage and p_event_type = any (s.event_types)) then
    raise exception 'invalid_event_type' using errcode = 'P0001';
  end if;
  if char_length(btrim(coalesce(p_summary, ''))) not between 3 and 500 then
    raise exception 'summary_required' using errcode = 'P0001';
  end if;

  select n.amount, n.currency, n.pay into v_amt, v_cur, v_pay from public.normalise_value(p_value, p_currency, p_payment) n;
  v_sdgs := public.clean_sdgs(p_sdgs);

  insert into public.connections
    (edition_id, framework_version_id, logged_by, with_participant, stage_no, event_type, summary,
     value_amount, value_currency, payment_status, sdg_goals)
  values
    (v_ed, v_fw, v_me, p_with, p_stage, p_event_type, btrim(p_summary), v_amt, v_cur, v_pay, v_sdgs)
  returning id into v_id;

  insert into public.connection_updates (connection_id, stage_no, note, value_amount, value_currency, payment_status, created_by)
  values (v_id, p_stage, 'Logged', v_amt, v_cur, v_pay, v_me);

  if nullif(btrim(coalesce(p_reflection, '')), '') is not null
     or nullif(btrim(coalesce(p_next_step, '')), '') is not null or p_remind_on is not null then
    insert into public.connection_notes (connection_id, participant_id, reflection, next_step, remind_on)
    values (v_id, v_me, nullif(btrim(coalesce(p_reflection, '')), ''), nullif(btrim(coalesce(p_next_step, '')), ''), p_remind_on);
  end if;
  return v_id;
end $$;

-- ---------- Update a connection as it moves along the gateway ----------
create or replace function public.update_connection(
  p_id uuid, p_stage int, p_event_type text, p_note text,
  p_value numeric, p_currency text, p_payment text,
  p_reflection text, p_next_step text, p_remind_on date)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := public.current_participant_id();
  c public.connections%rowtype;
  v_amt numeric; v_cur text; v_pay public.payment_status;
  v_changed boolean;
begin
  select * into c from public.connections where id = p_id and logged_by = v_me for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if p_stage is null or p_stage not between 1 and 5 then raise exception 'invalid_stage' using errcode = 'P0001'; end if;
  if p_stage < c.stage_no then raise exception 'stage_cannot_go_back' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.framework_stages s
                  where s.framework_version_id = c.framework_version_id and s.stage_no = p_stage
                    and p_event_type = any (s.event_types)) then
    raise exception 'invalid_event_type' using errcode = 'P0001';
  end if;

  select n.amount, n.currency, n.pay into v_amt, v_cur, v_pay from public.normalise_value(p_value, p_currency, p_payment) n;

  v_changed := p_stage <> c.stage_no
            or p_event_type <> c.event_type
            or v_amt is distinct from c.value_amount
            or v_cur is distinct from c.value_currency
            or v_pay <> c.payment_status;

  update public.connections
     set stage_no = p_stage, event_type = p_event_type,
         value_amount = v_amt, value_currency = v_cur, payment_status = v_pay,
         ack_status      = case when v_changed then 'pending' else ack_status end,
         ack_note        = case when v_changed then null else ack_note end,
         acknowledged_at = case when v_changed then null else acknowledged_at end,
         ami_verified_at = case when v_changed then null else ami_verified_at end,
         ami_verified_by = case when v_changed then null else ami_verified_by end
   where id = p_id;

  insert into public.connection_updates (connection_id, stage_no, note, value_amount, value_currency, payment_status, created_by)
  values (p_id, p_stage, coalesce(nullif(btrim(coalesce(p_note, '')), ''), 'Updated'), v_amt, v_cur, v_pay, v_me);

  insert into public.connection_notes (connection_id, participant_id, reflection, next_step, remind_on)
  values (p_id, v_me, nullif(btrim(coalesce(p_reflection, '')), ''), nullif(btrim(coalesce(p_next_step, '')), ''), p_remind_on)
  on conflict (connection_id) do update
     set reflection = excluded.reflection,
         next_step = excluded.next_step,
         remind_on = excluded.remind_on,
         reminder_sent_at = case when public.connection_notes.remind_on is distinct from excluded.remind_on
                                 then null else public.connection_notes.reminder_sent_at end;
end $$;

-- ---------- The other party confirms or questions a connection ----------
create or replace function public.acknowledge_connection(p_id uuid, p_decision text, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_me uuid := public.current_participant_id();
begin
  if v_me is null then raise exception 'consent_required' using errcode = 'P0001'; end if;
  if p_decision not in ('confirmed', 'disputed') then raise exception 'invalid_decision' using errcode = 'P0001'; end if;
  update public.connections
     set ack_status = p_decision::public.ack_status,
         ack_note = nullif(btrim(coalesce(p_note, '')), ''),
         acknowledged_at = now()
   where id = p_id and with_participant = v_me;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  perform public.write_audit('connection_acknowledged', 'connection', p_id::text, jsonb_build_object('decision', p_decision));
end $$;

-- ---------- My connections, with the other party's name (RLS hides other profiles) ----------
create or replace function public.my_connections()
returns table (
  id uuid, role text, other_id uuid, other_name text, other_country text, other_status text,
  stage_no smallint, event_type text, summary text,
  value_amount numeric, value_currency text, payment_status text, sdg_goals smallint[],
  ack_status text, ack_note text, verification text, edition_name text,
  created_at timestamptz, updated_at timestamptz,
  reflection text, next_step text, remind_on date)
language sql stable security definer set search_path = '' as $$
  with me as (select public.current_participant_id() as pid)
  select c.id,
         case when c.logged_by = me.pid then 'logger' else 'counterparty' end,
         o.id,
         coalesce(o.display_name, 'Removed participant'),
         o.country,
         o.status::text,
         c.stage_no, c.event_type, c.summary,
         c.value_amount, c.value_currency, c.payment_status::text, c.sdg_goals,
         c.ack_status::text, c.ack_note,
         case when c.ami_verified_at is not null then 'ami_verified'
              when c.ack_status = 'confirmed' then 'confirmed_by_other'
              else 'self_reported' end,
         e.name, c.created_at, c.updated_at,
         n.reflection, n.next_step, n.remind_on
    from me
    join public.connections c on (c.logged_by = me.pid or c.with_participant = me.pid)
    left join public.participants o on o.id = case when c.logged_by = me.pid then c.with_participant else c.logged_by end
    left join public.editions e on e.id = c.edition_id
    left join public.connection_notes n on n.connection_id = c.id and n.participant_id = me.pid
   order by c.updated_at desc
$$;

-- ---------- Claims: "is this profile you?" ----------
create or replace function public.suggest_claims()
returns table (participant_id uuid, display_name text, country text, pending_connections int, reason text)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_me  public.participants%rowtype;
begin
  select * into v_me from public.participants where user_id = v_uid;
  if not found then return; end if;
  return query
    select p.id, p.display_name, p.country,
           (select count(*)::int from public.connections c where c.with_participant = p.id),
           case when v_me.phone_norm is not null and p.phone_norm = v_me.phone_norm then 'phone' else 'name' end
      from public.participants p
     where p.user_id is null and p.status = 'unverified'
       and p.created_by is distinct from v_uid
       and (extensions.similarity(lower(p.display_name), lower(v_me.display_name)) >= 0.5
            or (v_me.phone_norm is not null and p.phone_norm = v_me.phone_norm))
       and not exists (select 1 from public.claim_requests r where r.participant_id = p.id and r.requested_by = v_uid)
     order by 4 desc
     limit 5;
end $$;

create or replace function public.request_claim(p_participant uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_id  uuid;
  v_name text; v_country text;
begin
  if not exists (select 1 from public.participants where user_id = v_uid) then
    raise exception 'consent_required' using errcode = 'P0001';
  end if;
  select s.display_name, s.country into v_name, v_country
    from public.suggest_claims() s where s.participant_id = p_participant;
  if v_name is null then raise exception 'not_claimable' using errcode = 'P0001'; end if;
  insert into public.claim_requests (participant_id, target_name, target_country, requested_by)
  values (p_participant, v_name, v_country, v_uid) returning id into v_id;
  perform public.write_audit('claim_requested', 'claim_request', v_id::text, '{}'::jsonb);
  return v_id;
end $$;

create or replace function public.decide_claim(p_request uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  r public.claim_requests%rowtype;
  v_target uuid;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into r from public.claim_requests where id = p_request and status = 'pending' for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;

  if p_approve and r.participant_id is not null then
    select id into v_target from public.participants where user_id = r.requested_by;
    if v_target is null then raise exception 'requester_has_no_profile' using errcode = 'P0001'; end if;
    -- reject competing claims first: the merge below deletes the source profile
    update public.claim_requests
       set status = 'rejected', decided_by = (select auth.uid()), decided_at = now(),
           note = 'Profile was linked to another participant'
     where participant_id = r.participant_id and status = 'pending' and id <> r.id;
    perform public.merge_participants(v_target, r.participant_id);
    update public.claim_requests
       set status = 'approved', decided_by = (select auth.uid()), decided_at = now(),
           note = nullif(btrim(coalesce(p_note, '')), '')
     where id = r.id;
  else
    update public.claim_requests
       set status = 'rejected', decided_by = (select auth.uid()), decided_at = now(),
           note = nullif(btrim(coalesce(p_note, '')), '')
     where id = r.id;
  end if;
  perform public.write_audit('claim_decided', 'claim_request', p_request::text, jsonb_build_object('approved', p_approve));
end $$;

-- ---------- AMI verification (admin only) ----------
create or replace function public.admin_verify_connection(p_id uuid, p_verify boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.connections
     set ami_verified_at = case when p_verify then now() else null end,
         ami_verified_by = case when p_verify then (select auth.uid()) else null end
   where id = p_id;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  perform public.write_audit('connection_verified', 'connection', p_id::text, jsonb_build_object('verified', p_verify));
end $$;

-- ---------- Delete my data ----------
create or replace function public.delete_my_data()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_pid uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select id into v_pid from public.participants where user_id = v_uid;
  if v_pid is not null then
    -- cascades to connections I logged and my private notes; connections others logged
    -- about me keep their record but lose the link to me
    delete from public.participants where id = v_pid;
  end if;
  -- profiles I created for other people, if nobody else has connected with them
  delete from public.participants p
   where p.created_by = v_uid and p.status = 'unverified'
     and not exists (select 1 from public.connections c where c.with_participant = p.id);
  delete from public.claim_requests where requested_by = v_uid;
  perform public.write_audit('account_data_deleted', 'user', v_uid::text, '{}'::jsonb);
end $$;

-- ---------- Audit trail for data exports (staff only) ----------
create or replace function public.staff_log_export(p_kind text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  perform public.write_audit('export', 'export', coalesce(nullif(btrim(p_kind), ''), 'unknown'), '{}'::jsonb);
end $$;
