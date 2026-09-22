# Deploying AMI Gateway

Target: `ami.ipthamani.top` (or `.com`), as an IPWORTH product, before any
subletting arrangement with AMI directly.

## 1. Create the Supabase project

1. [supabase.com](https://supabase.com) → New project. Note the region
   (pick one close to South Africa, e.g. `eu-west` or `af-south-1` if
   offered).
2. Project settings → API: copy the **Project URL** and the **anon /
   publishable key**. Copy the **service_role key** too, but treat it like a
   password — it bypasses every permission check.
3. Open the SQL editor and run the four files in `supabase/migrations/` **in
   order**: `0001_schema.sql`, `0002_functions.sql`, `0003_rls.sql`,
   `0004_seed_framework.sql`. (Or use the Supabase CLI: `supabase link` then
   `supabase db push` — same files, same order.)
4. Authentication → Providers: confirm Email is on, with OTP/magic link
   (not password) — this is what the app uses.
5. Authentication → Email templates: the "Magic Link" template's link
   should point at `/auth/confirm` (the default Supabase template already
   does this via `{{ .ConfirmationURL }}` — no change usually needed, but
   worth checking once the site URL below is set).
6. Authentication → URL configuration: set **Site URL** to
   `https://ami.ipthamani.top` and add it (and your Vercel preview domain)
   to **Redirect URLs**.
7. Make yourself an admin so the `/admin` area is reachable:
   ```sql
   insert into public.staff (user_id, role)
   values ('<your-auth-user-uuid>', 'admin');
   ```
   Find your user's UUID under Authentication → Users, after you've signed
   in once through the app.

## 2. Push to GitHub

```bash
cd ami-gateway
git init
git add -A
git commit -m "AMI Gateway v1"
gh repo create ipworth/ami-gateway --private --source=. --push
# or: git remote add origin <your-repo-url> && git push -u origin main
```

`.gitignore` already excludes `node_modules`, `.next`, `.env*` and Supabase
local state — nothing secret should end up in the repo.

## 3. Deploy to Vercel

1. [vercel.com](https://vercel.com) → New Project → import the GitHub repo.
   Framework preset: Next.js (auto-detected).
2. Environment variables (Project Settings → Environment Variables) — set
   for Production **and** Preview:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from step 1.2 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from step 1.2 |
   | `SUPABASE_SERVICE_ROLE_KEY` | from step 1.2 — **server only**, never `NEXT_PUBLIC_` |
   | `NEXT_PUBLIC_SITE_URL` | `https://ami.ipthamani.top` |
   | `NEXT_PUBLIC_EVENT_NAME` | `AMI Festival 2026` |
   | `NEXT_PUBLIC_EVENT_VENUE` | `University of Venda` |
   | `NEXT_PUBLIC_CONTACT_EMAIL` | AMI's contact address |
   | `CRON_SECRET` | any long random string, e.g. `openssl rand -hex 32` |
   | `RESEND_API_KEY` | optional — see step 5 |
   | `EMAIL_FROM` | optional — e.g. `AMI Gateway <gateway@ipthamani.top>` |

3. Deploy. `vercel.json` already configures the daily reminder cron
   (`/api/cron/reminders` at 06:00 UTC) — Vercel picks this up automatically
   on a paid plan; on the Hobby plan, cron runs once a day at a
   Vercel-chosen time, which is fine here.

## 4. Point the domain at it

1. Vercel → Project → Settings → Domains → add `ami.ipthamani.top`.
2. At your DNS provider for `ipthamani.top`, add the CNAME (or A/ALIAS
   record) Vercel shows you for that subdomain.
3. Wait for DNS to propagate and for Vercel to issue the certificate
   (usually a few minutes).
4. Go back to Supabase → Authentication → URL configuration and confirm the
   Site URL matches exactly (including `https://`).

## 5. Turn on email (optional, recommended)

Without this, participants can still download a `.txt` summary and admins
can still print the report — but nobody gets emailed summaries or
reminders.

1. [resend.com](https://resend.com) → verify a sending domain (e.g.
   `ipthamani.top`) by adding the DNS records they give you.
2. Create an API key, set it as `RESEND_API_KEY` in Vercel.
3. Set `EMAIL_FROM` to an address on that verified domain.
4. Redeploy (env var changes need a redeploy to take effect).

## 6. Smoke test before the festival

- Sign in with a real inbox, complete the privacy notice, register.
- Log a connection with a second test account; confirm it from that
  account; check `/admin` shows it in the funnel.
- Add an unverified participant, then sign in as "them" with a matching
  email and confirm the profile auto-links.
- Download the evidence pack from `/admin/report` and open
  `manifest.json` — the SHA-256 hashes should match if you hash the other
  files yourself (`shasum -a 256 report.html`, etc.).
- If email is configured, confirm a summary email actually arrives.

## Keeping it running

- **Framework changes**: see `docs/FRAMEWORK.md` — always a new version,
  never an edit to a published one.
- **Database changes** generally: add a new numbered file under
  `supabase/migrations/`, test it locally with
  `supabase/tests/run-local.sh`, then run it against the real project (SQL
  editor or `supabase db push`).
- **CI** (`.github/workflows/ci.yml`) runs the type check, unit tests, a
  production build, and the full migration + RLS test suite against a
  throwaway Postgres, on every push and pull request.
