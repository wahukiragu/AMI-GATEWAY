# Running AMI Gateway across multiple editions

The registry is built to serve more than one AMI event over time — the
same tool, same framework, different venue and dates each time (e.g. this
year's AMI African Arts & Cultural Festival at University of Venda, a
future event at AMI Kabarak, and so on).

## The model

One database table, `editions`, holds every event AMI has ever run through
the Gateway. Exactly one of them is marked `is_current = true` at any
moment. Every registration, connection, and report belongs to whichever
edition was current at the time it happened.

## Setting up a new edition

Go to **Admin → Editions**. Two things you can do:

- **Queue a future edition** — fill in name, venue and dates, leave "Make
  this the current edition immediately" unticked. It's created but
  invisible to participants; the live event keeps running normally.
- **Switch over** — when the new edition actually starts, click **Make
  current** on it. From that moment, new registrations, new connections,
  the homepage, the header, the footer, the live wall, and the printable
  flyer all switch to the new event automatically. Nothing needs
  redeploying — this is a database change, not a code change.

Past editions are never deleted — their connections and reports stay
intact and remain queryable (the admin dashboard's edition selector lets
you look at any past edition's numbers specifically).

## What updates automatically when you switch editions

- Homepage hero, header badge, and footer (event name, dates, venue, "Day
  X of Y" badge)
- `/wall` — the live projector display
- `/admin/flyer` — the printable QR flyer
- New connections logged from that point on

## What does **not** change automatically

- The **framework** (Exposure → Curiosity → Consumption → Exchange →
  Integration) is shared across all editions — it's AMI's institutional
  method, not tied to one event. See `docs/FRAMEWORK.md` if a future
  edition needs a framework revision.
- Anything already logged under a past edition keeps its own dates, venue
  and framework version, exactly as it was at the time — switching the
  current edition never rewrites history.
