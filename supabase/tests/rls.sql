-- =====================================================================
-- Database tests: ownership, RLS, privacy of notes, claims, admin rules.
-- Run with supabase/tests/run-local.sh (plain Postgres) after the migrations.
-- =====================================================================
\set ON_ERROR_STOP 1
\set a   '''aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'''
\set b   '''bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'''
\set c   '''cccccccc-cccc-4ccc-8ccc-cccccccccccc'''
\set d   '''dddddddd-dddd-4ddd-8ddd-dddddddddddd'''
\set adm '''eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'''
\set vw  '''ffffffff-ffff-4fff-8fff-ffffffffffff'''

\o /dev/null
reset role;
insert into auth.users (id, email) values
  (:a, 'alice@example.org'), (:b, 'bongani@example.org'), (:c, 'carol@example.org'),
  (:d, 'dan@example.org'), (:adm, 'admin@example.org'), (:vw, 'viewer@example.org');
insert into public.staff (user_id, role) values (:adm, 'admin'), (:vw, 'viewer');

-- ---------- anonymous access ----------
select tests.anon();
select tests.expect_error('select 1 from public.participants limit 1', 'permission denied');
select tests.expect_error('select 1 from public.connections limit 1', 'permission denied');
select tests.expect_error($q$select public.create_connection(null, 1, 'x', 'y')$q$, 'permission denied');
do $$ begin
  assert (select count(*) from public.framework_stages) = 5, 'anon can read published framework stages';
  assert (select count(*) from public.sdg_goals) = 17, 'anon can read SDG list';
end $$;

-- ---------- consent gate ----------
reset role; select tests.login(:b);
select tests.expect_error($q$select public.register_participant('B','','other','Kenya','',array[]::text[],'')$q$, 'consent_required');
select tests.expect_error($q$select public.record_consent('0.1', false, true)$q$, 'consent_required');
select tests.expect_error($q$select public.record_consent('0.1', true, false)$q$, 'consent_required');

-- ---------- direct writes are denied ----------
select tests.expect_error($q$insert into public.connections (edition_id, framework_version_id, logged_by, stage_no, event_type, summary) select (select id from public.editions limit 1), (select id from public.framework_versions limit 1), gen_random_uuid(), 1, 'x', 'xxx'$q$, 'permission denied');
select tests.expect_error($q$update public.participants set status = 'registered'$q$, 'permission denied');
select tests.expect_error($q$insert into public.staff (user_id, role) values (auth.uid(), 'admin')$q$, 'permission denied');
select tests.expect_error($q$select public.write_audit('x', 'y', 'z')$q$, 'permission denied');
select tests.expect_error($q$select public.merge_participants(gen_random_uuid(), gen_random_uuid())$q$, 'permission denied');

-- ---------- A and B register ----------
reset role; select tests.login(:a);
select public.record_consent('0.1', true, true, true, false);
select public.register_participant('Alice Dube', 'Dube Trio', 'performer_or_group', 'South Africa', 'Marimba music', array['Paid performances'], '+27 82 000 1111');

reset role; select tests.login(:b);
select public.record_consent('0.1', true, true, false, false);
select public.register_participant('Bongani Traders', null, 'trader_or_enterprise', 'Botswana', 'Fruit and craft supply', array['Trade and sales'], null);

-- ---------- A logs connections ----------
reset role; select tests.login(:a);
-- an unverified person with an email
do $$
declare v_carol uuid; v_c1 uuid; r jsonb; r1 jsonb;
begin
  r1 := public.add_unverified_participant('Carol Ndlovu', 'Zimbabwe', 'Textiles', 'Carol@Example.org', null);
  assert not (r1 ->> 'existing')::boolean, 'first add creates a profile';
  -- adding the same email again returns the same profile and does not duplicate
  r := public.add_unverified_participant('Carol N', 'Zimbabwe', null, ' carol@example.org ', null);
  assert (r ->> 'existing')::boolean, 'duplicate email dedupes to existing profile';
  assert (r ->> 'id') = (r1 ->> 'id'), 'same profile returned';
  v_carol := (r ->> 'id')::uuid;

  -- self connection is refused
  perform tests.expect_error(format('select public.create_connection(%L, 2, %L, %L)', public.current_participant_id(), 'Enquiry received', 'me'), 'invalid_counterparty');
  -- invalid inputs
  perform tests.expect_error(format('select public.create_connection(%L, 9, %L, %L)', v_carol, 'Enquiry received', 'valid summary'), 'invalid_stage');
  perform tests.expect_error(format('select public.create_connection(%L, 2, %L, %L)', v_carol, 'Paid booking', 'valid summary'), 'invalid_event_type');
  perform tests.expect_error(format('select public.create_connection(%L, 2, %L, %L, -5, %L, %L)', v_carol, 'Enquiry received', 'valid summary', 'ZAR', 'paid'), 'invalid_value');
  perform tests.expect_error(format('select public.create_connection(%L, 2, %L, %L, 100, %L, null)', v_carol, 'Enquiry received', 'valid summary', 'ZAR'), 'payment_status_required');
  perform tests.expect_error(format('select public.create_connection(%L, 2, %L, %L, 100, %L, %L)', v_carol, 'Enquiry received', 'valid summary', 'XYZ', 'paid'), 'invalid_currency');
  perform tests.expect_error(format('select public.create_connection(%L, 2, %L, %L, null, null, null, array[1,2,3,4,5,6,7])', v_carol, 'Enquiry received', 'valid summary'), 'too_many_sdgs');

  -- Carol has not registered: connection is stored against the unverified profile
  v_c1 := public.create_connection(v_carol, 2, 'Enquiry received', 'Asked about ordering ceremonial cloth', null, null, null,
                                   array[8], 'Private reflection: promising lead', 'Send price list', current_date + 7);
  assert v_c1 is not null;
end $$;

do $$
declare v_bong uuid; v_c2 uuid; rec record;
begin
  select id into v_bong from public.search_participants('Bongani') limit 1;
  assert v_bong is not null, 'A can find registered participant B in the directory';
  v_c2 := public.create_connection(v_bong, 4, 'Paid booking', 'Booked for a heritage evening', 18000, 'zar', 'paid', array[8,17,8], null, null, null);
  select * into rec from public.my_connections() where id = v_c2;
  assert rec.sdg_goals = array[8,17]::smallint[], 'SDGs are de-duplicated and sorted';
  assert rec.value_currency = 'ZAR', 'currency normalised';
  assert rec.verification = 'self_reported', 'starts self-reported';
  assert rec.ack_status = 'pending', 'starts pending';
  assert (select count(*) from public.my_connections()) = 2, 'A sees two connections';
  assert (select reflection from public.my_connections() where other_name = 'Carol Ndlovu') like 'Private%', 'A sees own private note';
end $$;

-- ---------- B sees only what involves B ----------
reset role; select tests.login(:b);
do $$
declare rec record;
begin
  assert (select count(*) from public.participants) = 1, 'B can read only own participant row';
  assert (select count(*) from public.connections) = 1, 'B can read only the connection with B';
  assert (select count(*) from public.connection_notes) = 0, 'B cannot read anyone elses private notes';
  select * into rec from public.my_connections();
  assert rec.role = 'counterparty', 'B is the counterparty';
  assert rec.other_name = 'Alice Dube', 'B sees who logged it';
  assert rec.reflection is null, 'B does not see logger notes';
  assert (select count(*) from public.connection_updates) = 1, 'history is visible for B''s connection only';
  assert (select count(*) from public.audit_log) = 0, 'B cannot read audit log';

  -- B acknowledges
  perform public.acknowledge_connection(rec.id, 'confirmed', null);
  assert (select ack_status from public.my_connections()) = 'confirmed';
  -- B may not change the connection
  perform tests.expect_error(format('select public.update_connection(%L, 4, %L, null, null, null, null, null, null, null)', rec.id, 'Paid booking'), 'not_found');
end $$;

-- ---------- A: verification state, confirm, update resets ----------
reset role; select tests.login(:a);
do $$
declare v_id uuid;
begin
  select id into v_id from public.my_connections() where other_name = 'Bongani Traders';
  assert (select verification from public.my_connections() where id = v_id) = 'confirmed_by_other', 'confirmed by other party';
  -- cannot acknowledge a connection you logged
  perform tests.expect_error(format('select public.acknowledge_connection(%L, %L)', v_id, 'confirmed'), 'not_found');
  perform tests.expect_error(format('select public.update_connection(%L, 3, %L, null, null, null, null, null, null, null)', v_id, 'Purchase'), 'stage_cannot_go_back');
  -- moving to a later stage resets confirmation
  perform public.update_connection(v_id, 5, 'Repeat order', 'Repeat order agreed', 45000, 'ZAR', 'agreed', 'Notes', 'Draft contract', current_date + 30);
  assert (select ack_status from public.my_connections() where id = v_id) = 'pending', 'update resets acknowledgement';
  assert (select count(*) from public.connection_updates where connection_id = v_id) = 2, 'history has two rows';
  assert (select stage_no from public.my_connections() where id = v_id) = 5;
end $$;

-- ---------- Carol signs up: auto-link by verified email ----------
reset role; select tests.login(:c);
select public.record_consent('0.1', true, true, false, true);
do $$
declare rec record;
begin
  assert (select count(*) from public.participants) = 1, 'Carol sees only her own profile';
  assert (select status from public.participants) = 'account', 'signed up but not registered yet';
  assert (select display_name from public.participants) = 'Carol Ndlovu', 'kept the name Alice typed';
  select * into rec from public.my_connections();
  assert rec.role = 'counterparty' and rec.ack_status = 'pending', 'Carol sees a pending connection waiting for her';
  assert rec.reflection is null, 'Carol does not see Alice''s private note';
  assert (select count(*) from public.search_participants('')) = 0, 'unregistered accounts cannot search';
  perform tests.expect_error(format('select public.create_connection(%L, 2, %L, %L)', gen_random_uuid(), 'Enquiry received', 'summary'), 'registration_required');
  perform public.acknowledge_connection(rec.id, 'disputed', 'The price was different');
  assert (select ack_status from public.my_connections()) = 'disputed';
end $$;
select public.register_participant('Carol Ndlovu', 'Ndlovu Textiles', 'garment_or_textile_maker', 'Zimbabwe', 'Cloth', array['Trade and sales'], null);

reset role; select tests.login(:a);
do $$ begin
  assert (select ack_note from public.my_connections() where other_name = 'Carol Ndlovu') = 'The price was different', 'logger sees why it was disputed';
end $$;

-- ---------- Name-based claim needs admin approval ----------
select public.add_unverified_participant('Dan Moyo', 'Kenya', null, null, null);
do $$
declare v_dan uuid;
begin
  select id into v_dan from public.search_participants('Dan') limit 1;
  assert v_dan is not null, 'A sees the profile A created';
  perform public.create_connection(v_dan, 2, 'Asked for contact', 'Wanted my contact details', null, null, null, array[]::int[], null, null, null);
  perform tests.expect_error(format('select public.request_claim(%L)', v_dan), 'not_claimable');
end $$;

reset role; select tests.login(:d);
select public.record_consent('0.1', true, true, false, false);
select public.register_participant('Dan Moyo', null, 'performer_or_group', 'Kenya', null, array[]::text[], null);
do $$
declare v_dan uuid; v_req uuid;
begin
  assert (select count(*) from public.my_connections()) = 0, 'Dan sees nothing before the claim is approved';
  select participant_id into v_dan from public.suggest_claims();
  assert v_dan is not null, 'Dan is offered the matching profile';
  assert (select pending_connections from public.suggest_claims()) = 1;
  v_req := public.request_claim(v_dan);
  assert (select count(*) from public.suggest_claims()) = 0, 'requested profile is no longer suggested';
  assert (select count(*) from public.my_connections()) = 0, 'still nothing until an admin approves';
  perform tests.expect_error(format('select public.decide_claim(%L, true)', v_req), 'forbidden');
end $$;

reset role; select tests.login(:vw);
do $$ begin
  assert (select count(*) from public.claim_requests) = 1, 'viewer can read claims';
  perform tests.expect_error(format('select public.decide_claim(%L, true)', (select id from public.claim_requests limit 1)), 'forbidden');
end $$;

reset role; select tests.login(:adm);
do $$
declare v_req uuid;
begin
  select id into v_req from public.claim_requests where status = 'pending';
  perform public.decide_claim(v_req, true, 'Confirmed by phone');
  assert (select status from public.claim_requests where id = v_req) = 'approved';
  assert (select count(*) from public.participants where display_name = 'Dan Moyo') = 1, 'profile merged, no duplicate';
end $$;

reset role; select tests.login(:d);
do $$ begin
  assert (select count(*) from public.my_connections()) = 1, 'Dan now sees the connection waiting for him';
  assert (select role from public.my_connections()) = 'counterparty';
end $$;

-- ---------- staff rules ----------
reset role; select tests.login(:adm);
do $$
declare v_id uuid;
begin
  assert (select count(*) from public.participants) = 4, 'admin can read all participants';
  assert (select count(*) from public.connections) = 3, 'admin can read all connections';
  assert (select count(*) from public.connection_notes) = 0, 'admin cannot read private notes';
  assert (select count(*) from public.audit_log) > 0, 'admin can read audit log';
  select id into v_id from public.connections where stage_no = 5 limit 1;
  perform public.admin_verify_connection(v_id, true);
  assert (select ami_verified_at from public.connections where id = v_id) is not null, 'admin verified';
end $$;

reset role; select tests.login(:vw);
do $$ begin
  assert (select count(*) from public.connections) = 3, 'viewer can read all connections';
  assert (select count(*) from public.audit_log) = 0, 'viewer cannot read audit log';
  perform tests.expect_error(format('select public.admin_verify_connection(%L, true)', (select id from public.connections limit 1)), 'forbidden');
end $$;

reset role; select tests.login(:b);
do $$ begin
  perform tests.expect_error(format('select public.admin_verify_connection(%L, true)', gen_random_uuid()), 'forbidden');
end $$;

-- A changing a verified connection clears the AMI verification
reset role; select tests.login(:a);
do $$
declare v_id uuid;
begin
  select id into v_id from public.my_connections() where stage_no = 5;
  perform public.update_connection(v_id, 5, 'Repeat order', 'Changed price', 46000, 'ZAR', 'agreed', null, null, null);
  assert (select verification from public.my_connections() where id = v_id) = 'self_reported', 'edit clears AMI verification and confirmation';
end $$;

-- ---------- deleting my data ----------
select public.add_unverified_participant('Zed Orphan', 'Kenya', null, null, null);
reset role; select tests.login(:c);
select public.delete_my_data();
reset role; select tests.login(:a);
do $$ begin
  assert (select other_name from public.my_connections() where other_id is null limit 1) = 'Removed participant', 'connection survives with a removed participant';
end $$;
select public.delete_my_data();
reset role;
do $$ begin
  assert (select count(*) from public.participants where display_name = 'Zed Orphan') = 0, 'orphan unverified profiles are removed';
  assert (select count(*) from public.connections where logged_by not in (select id from public.participants)) = 0;
  assert (select count(*) from public.audit_log where action = 'account_data_deleted') = 2, 'deletions are audited';
end $$;

do $$ begin
  assert (select count(*) from public.participants where email_norm = 'carol@example.org') = 0, 'carol profile removed with her data';
end $$;
\o
\echo 'rls.sql: all assertions passed'
