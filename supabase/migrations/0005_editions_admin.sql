-- =====================================================================
-- Editions admin: lets an admin queue future editions (e.g. a future
-- AMI event at a different venue) and switch which one is "current"
-- without touching the database by hand.
-- =====================================================================

create or replace function public.create_edition(
  p_name text, p_venue text, p_starts date, p_ends date, p_make_current boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_year smallint;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'name_required' using errcode = 'P0001'; end if;
  if p_starts is null then raise exception 'start_date_required' using errcode = 'P0001'; end if;
  if p_ends is not null and p_ends < p_starts then raise exception 'end_before_start' using errcode = 'P0001'; end if;

  v_year := extract(year from p_starts);
  insert into public.editions (name, year, venue, starts_on, ends_on)
  values (btrim(p_name), v_year, nullif(btrim(coalesce(p_venue, '')), ''), p_starts, p_ends)
  returning id into v_id;

  if p_make_current then
    update public.editions set is_current = false where is_current and id <> v_id;
    update public.editions set is_current = true where id = v_id;
  end if;

  perform public.write_audit('edition_created', 'edition', v_id::text,
    jsonb_build_object('name', p_name, 'made_current', p_make_current));
  return v_id;
end $$;

create or replace function public.set_current_edition(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if not exists (select 1 from public.editions where id = p_id) then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  update public.editions set is_current = false where is_current and id <> p_id;
  update public.editions set is_current = true where id = p_id;
  perform public.write_audit('edition_set_current', 'edition', p_id::text, '{}'::jsonb);
end $$;

grant execute on function
  public.create_edition(text, text, date, date, boolean),
  public.set_current_edition(uuid)
to authenticated;
