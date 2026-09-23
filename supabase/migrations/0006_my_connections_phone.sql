-- =====================================================================
-- my_connections(): adds other_phone to the result.
--
-- Privacy rule: a phone number is only ever returned to the participant
-- who personally typed it in (created_by = the viewer), e.g. when they
-- added someone as an unverified participant. It is never shown to an
-- independent registered participant on the other side of a connection
-- just because they're connected — that would leak contact details
-- nobody agreed to share. This lets someone message a contact they
-- themselves added, without exposing anyone else's number.
--
-- Adding a column changes the function's return type, so this needs a
-- drop + recreate rather than CREATE OR REPLACE (which only allows
-- replacing a function whose signature is unchanged).
-- =====================================================================

drop function if exists public.my_connections();

create function public.my_connections()
returns table (
  id uuid, role text, other_id uuid, other_name text, other_country text, other_status text, other_phone text,
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
         case when o.created_by = (select auth.uid()) then o.phone else null end,
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

grant execute on function public.my_connections() to authenticated;
