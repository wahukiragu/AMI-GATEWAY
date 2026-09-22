# The Culture-Trade Gateway Framework: how it's stored and versioned

This is AMI's own framework for describing how a festival moment turns into
trade: **Exposure → Curiosity → Consumption → Exchange → Integration**. It is
the intellectual asset the whole registry is built around, so it's stored as
*data* in the database, not hard-coded in the app.

## Where it lives

- `framework_versions` — one row per version (name, version string, status,
  rights holder, licence notice, publish date).
- `framework_stages` — the five stage definitions for a version: name, short
  label, meaning, a worked example, guidance on what counts as evidence, and
  the list of event types a participant can pick for that stage.
- Every `connections` row stores the `framework_version_id` it was logged
  under.

Seeded in `supabase/migrations/0004_seed_framework.sql` as **version 0.1**,
marked `status = 'published'`, with a draft rights/licence notice for AMI and
IPWORTH to formalise.

## The one rule: never edit a published version

Once a version's status is `published`, don't change its rows. If the
framework needs to change — a renamed stage, a reworded event type, a sixth
stage, anything — do this instead:

1. Add a new migration file, e.g. `0005_framework_v0_2.sql`.
2. Insert a **new row** into `framework_versions` (new `id`, `version =
   '0.2'`, `status = 'published'`).
3. Insert the **full set** of stage rows for that new version — even the
   ones that didn't change.
4. Optionally set the old version's `status` to `'retired'` (it stays
   readable; connections logged under it keep working).

Why this matters: `create_connection()` always uses
`current_framework_version_id()`, which returns the most recently published
version. So the moment you publish v0.2, new connections use it — but every
connection already logged keeps the version it was created under. That
means:

- A report for a past edition is reproducible: re-running it later gives the
  same funnel, the same stage names, the same event types.
- You can compare v0.1-based and v0.2-based results honestly, because you
  know exactly which definitions each side used.
- Nobody's already-logged "Exchange" silently becomes something else because
  someone renamed a stage in place.

## Rights and licensing

`rights_holder` and `licence_notice` on `framework_versions` are there so the
framework's authorship is recorded alongside the data it produces. The
seeded text is explicitly marked draft — AMI and IPWORTH should agree final
wording in writing and update it via a new version row (or, before the
first real event, it's reasonable to fix the v0.1 row directly since nothing
will have been logged against it yet).

## Where it's shown

- `/admin/framework` — read-only view of the current published version:
  rights holder, licence notice, and all five stage definitions.
- The homepage and the Stage 2 "log a connection" form pull `meaning`,
  `example`, and `evidence_guidance` live from the database (via
  `lib/framework-data.ts`), so editing the seed data is enough to change the
  explanatory copy everywhere — no app code changes needed for wording
  fixes within a version that hasn't published yet.

## Fallback copy

`lib/framework.ts` has `DEFAULT_STAGES` / `DEFAULT_SDGS` — a frozen copy of
v0.1, used only if the database is unreachable (for example, before Supabase
is connected, or during an outage). It is not a second source of truth; the
database always wins when it's available. Don't add new stages there without
also adding them to a real migration.
