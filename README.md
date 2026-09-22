# AMI Gateway

A registry that records the connections made at the AMI Festival and turns
them into evidence: who came, what happened, and whether a conversation
became a sale, a booking, or an ongoing partnership.

Built for the **African Musicology Institute** around AMI's own
**Culture-Trade Gateway Framework** — a five-stage model (Exposure →
Curiosity → Consumption → Exchange → Integration) for how a cultural moment
grows into trade. Operated as an IPWORTH product ahead of a direct handover
to AMI.

## What it does

- **Stage 1 — Register.** A participant signs in with a passwordless email
  code and registers once: who they are, what they bring, what they're
  hoping for.
- **Stage 2 — Log a connection.** Any time a participant meets someone
  worth following up, they log it: who, what stage it reached, what kind of
  moment it was, and — only if relevant — an amount of money and which
  Sustainable Development Goals it contributes to. The other person is
  asked to confirm it.
- **Private notes.** A participant's own reflections and reminders on a
  connection are visible only to them — not to the other party, not to
  staff.
- **Unverified participants.** Someone who hasn't registered yet can still
  be logged as the other side of a connection. If they later register with
  a matching email, their profile links automatically; otherwise they can
  ask AMI to link a look-alike profile to their account (a "claim"), which
  an admin approves.
- **Admin dashboard.** Funnel, cross-border corridors, evidence strength
  (self-reported / confirmed / AMI-verified), SDG tallies, and internal
  CSV exports with full participant data.
- **Festival Gateway Report + evidence pack.** A funder-facing report built
  live from the data — anonymised, with names only for participants who
  opted in — plus a downloadable `.zip` with the report, an anonymised CSV,
  computed metrics, the framework description, and a manifest of SHA-256
  fingerprints for reproducibility.
- **Right to erasure.** A participant can view, export, or fully delete
  their data from `/account` at any time.

## How it's built

- **Next.js 15 / React 19 / TypeScript**, deployed on Vercel.
- **Supabase** (Postgres + Auth). All writes go through `SECURITY DEFINER`
  SQL functions — the client never inserts or updates a table directly.
  Row level security is enabled on every table; a viewer only ever sees
  their own data or, for staff, everything except other people's private
  notes.
- The framework itself is **data, not code** — versioned in the database so
  reports stay reproducible even as the framework evolves. See
  [`docs/FRAMEWORK.md`](docs/FRAMEWORK.md).
- Brand colours and the logo mark come from AMI's own logo
  (`public/brand/ami-logo.png`).

## Getting started locally

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project's keys
npm run dev
```

Without Supabase configured, the marketing pages still render; anything
behind sign-in redirects to `/login` once the environment is set up.

### Database

```bash
# apply migrations + run the RLS test suite against a throwaway local Postgres
export PGURL=postgresql://postgres:postgres@localhost:5432
bash supabase/tests/run-local.sh
```

Or apply `supabase/migrations/*.sql`, in order, to a real Supabase project's
SQL editor.

### Tests

```bash
npx tsc --noEmit     # type check
npx vitest run        # unit tests (lib/metrics.ts)
npm run build          # production build
```

## Deploying

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full Supabase →
GitHub → Vercel → custom domain walkthrough for `ami.ipthamani.top`.

## Project layout

```
supabase/migrations/   Database schema, functions, RLS policies, seed data
supabase/tests/         Local test harness + the RLS/ownership test suite
lib/                     Shared logic: auth guards, metrics, report/CSV builders
components/              Shared UI (brand components, forms, cards)
app/                     Next.js App Router pages and Server Actions
docs/                    Framework governance and deployment guide
```
