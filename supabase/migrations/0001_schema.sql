-- =====================================================================
-- AMI Gateway: core schema
-- Culture-Trade Gateway Framework registry (participants, connections,
-- framework versions, editions) with claims, notes, staff and audit.
--
-- Design rules
--  1. Clients never write tables directly. All writes go through the
--     security-definer functions in 0002_functions.sql, which set
--     ownership, status and verification server-side.
--  2. Row level security is enabled on every table (0003_rls.sql).
--  3. The framework itself is data (versioned), not code.
-- =====================================================================

create extension if not exists pg_trgm with schema extensions;

-- ---------- enums ----------
create type public.participant_status as enum ('unverified', 'account', 'registered');
create type public.ack_status         as enum ('pending', 'confirmed', 'disputed');
create type public.payment_status     as enum ('none', 'agreed', 'paid');
create type public.claim_status       as enum ('pending', 'approved', 'rejected');
create type public.staff_role         as enum ('admin', 'viewer');

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- framework (versioned, institutional asset) ----------
create table public.framework_versions (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  version        text not null,
  status         text not null check (status in ('draft', 'published', 'retired')),
  rights_holder  text,
  licence_notice text,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  unique (name, version)
);

create table public.framework_stages (
  framework_version_id uuid not null references public.framework_versions (id) on delete cascade,
  stage_no             smallint not null check (stage_no between 1 and 5),
  name                 text not null,
  short_label          text not null,
  meaning              text not null,
  example              text not null,
  evidence_guidance    text not null,
  event_types          text[] not null check (cardinality(event_types) > 0),
  primary key (framework_version_id, stage_no)
);

create table public.sdg_goals (
  no       smallint primary key check (no between 1 and 17),
  name     text not null,
  featured boolean not null default false
);

-- ---------- editions (one per festival year) ----------
create table public.editions (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  year       smallint not null,
  venue      text,
  starts_on  date,
  ends_on    date,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index editions_one_current on public.editions (is_current) where is_current;

-- ---------- participants ----------
-- A participant is a person or group. Unverified participants have no
-- auth user: they were added by someone else and can be claimed later.
create table public.participants (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid unique references auth.users (id) on delete set null,
  status                 public.participant_status not null default 'unverified',
  display_name           text not null check (char_length(display_name) between 1 and 120),
  organisation           text check (char_length(organisation) <= 120),
  participant_type       text check (participant_type in (
                           'performer_or_group', 'instrument_or_craft_maker', 'garment_or_textile_maker',
                           'scholar_or_student', 'trader_or_enterprise',
                           'traditional_leader_or_custodian', 'content_creator_or_podcaster', 'other')),
  country                text check (char_length(country) <= 60),
  offering               text check (char_length(offering) <= 300),
  wants                  text[] not null default '{}' check (cardinality(wants) <= 10),
  email                  text check (char_length(email) <= 254),
  email_norm             text generated always as (lower(btrim(email))) stored,
  phone                  text check (char_length(phone) <= 40),
  phone_norm             text generated always as (nullif(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), '')) stored,
  created_by             uuid references auth.users (id) on delete set null,
  consent_version        text,
  consent_at             timestamptz,
  consent_public_name    boolean not null default false,
  consent_future_contact boolean not null default false,
  adult_confirmed        boolean not null default false,
  registered_at          timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create unique index participants_email_norm_key on public.participants (email_norm) where email_norm is not null;
create index participants_phone_norm_idx on public.participants (phone_norm) where phone_norm is not null;
create index participants_status_idx on public.participants (status);
create index participants_country_idx on public.participants (country);
create index participants_name_trgm_idx on public.participants using gin (lower(display_name) extensions.gin_trgm_ops);
create trigger participants_updated_at before update on public.participants
  for each row execute function public.set_updated_at();

-- ---------- connections ----------
create table public.connections (
  id                   uuid primary key default gen_random_uuid(),
  edition_id           uuid not null references public.editions (id),
  framework_version_id uuid not null references public.framework_versions (id),
  logged_by            uuid not null references public.participants (id) on delete cascade,
  with_participant     uuid references public.participants (id) on delete set null,
  stage_no             smallint not null check (stage_no between 1 and 5),
  event_type           text not null check (char_length(event_type) <= 80),
  summary              text not null check (char_length(summary) between 3 and 500),
  value_amount         numeric(14, 2) check (value_amount is null or value_amount >= 0),
  value_currency       text check (value_currency ~ '^[A-Z]{3}$'),
  payment_status       public.payment_status not null default 'none',
  sdg_goals            smallint[] not null default '{}' check (cardinality(sdg_goals) <= 6),
  ack_status           public.ack_status not null default 'pending',
  ack_note             text check (char_length(ack_note) <= 500),
  acknowledged_at      timestamptz,
  ami_verified_at      timestamptz,
  ami_verified_by      uuid references auth.users (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check (with_participant is null or with_participant <> logged_by),
  check ((value_amount is null) = (value_currency is null)),
  check ((payment_status = 'none') = (value_amount is null))
);
create index connections_logged_by_idx on public.connections (logged_by);
create index connections_with_idx on public.connections (with_participant);
create index connections_edition_idx on public.connections (edition_id);
create index connections_stage_idx on public.connections (stage_no);
create trigger connections_updated_at before update on public.connections
  for each row execute function public.set_updated_at();

-- Append-only history of every change to a connection.
create table public.connection_updates (
  id             uuid primary key default gen_random_uuid(),
  connection_id  uuid not null references public.connections (id) on delete cascade,
  stage_no       smallint not null check (stage_no between 1 and 5),
  note           text check (char_length(note) <= 500),
  value_amount   numeric(14, 2),
  value_currency text,
  payment_status public.payment_status not null default 'none',
  created_by     uuid references public.participants (id) on delete set null,
  created_at     timestamptz not null default now()
);
create index connection_updates_conn_idx on public.connection_updates (connection_id, created_at);

-- Private notes: visible only to the participant who wrote them.
create table public.connection_notes (
  connection_id    uuid primary key references public.connections (id) on delete cascade,
  participant_id   uuid not null references public.participants (id) on delete cascade,
  reflection       text check (char_length(reflection) <= 1000),
  next_step        text check (char_length(next_step) <= 300),
  remind_on        date,
  reminder_sent_at timestamptz,
  updated_at       timestamptz not null default now()
);
create index connection_notes_remind_idx on public.connection_notes (remind_on)
  where remind_on is not null and reminder_sent_at is null;
create trigger connection_notes_updated_at before update on public.connection_notes
  for each row execute function public.set_updated_at();

-- ---------- claims (unverified profile -> real participant) ----------
create table public.claim_requests (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid references public.participants (id) on delete set null,
  target_name    text not null,
  target_country text,
  requested_by   uuid not null references auth.users (id) on delete cascade,
  status         public.claim_status not null default 'pending',
  decided_by     uuid references auth.users (id) on delete set null,
  decided_at     timestamptz,
  note           text check (char_length(note) <= 500),
  created_at     timestamptz not null default now()
);
create unique index claim_requests_once on public.claim_requests (participant_id, requested_by)
  where participant_id is not null;

-- ---------- staff and audit ----------
create table public.staff (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       public.staff_role not null default 'viewer',
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id        bigint generated always as identity primary key,
  at        timestamptz not null default now(),
  actor     uuid,
  action    text not null,
  entity    text,
  entity_id text,
  detail    jsonb not null default '{}'::jsonb
);
create index audit_log_at_idx on public.audit_log (at desc);
