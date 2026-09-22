import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { site } from '@/lib/config';
import { esc } from '@/lib/summary';

export const dynamic = 'force-dynamic';

/**
 * Daily job (see vercel.json). Emails each participant the private "remind me" notes that are due.
 * Vercel calls this with `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: notes, error } = await admin
    .from('connection_notes')
    .select('connection_id, participant_id, reflection, next_step, remind_on')
    .lte('remind_on', today)
    .is('reminder_sent_at', null)
    .limit(500);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!notes?.length) return NextResponse.json({ ok: true, sent: 0 });

  const byParticipant = new Map<string, typeof notes>();
  notes.forEach((n) => byParticipant.set(n.participant_id, [...(byParticipant.get(n.participant_id) ?? []), n]));

  const { data: people } = await admin.from('participants').select('id, display_name, email, consent_future_contact').in('id', Array.from(byParticipant.keys()));
  const { data: conns } = await admin.from('connections').select('id, summary, with_participant').in('id', notes.map((n) => n.connection_id));
  const otherIds = Array.from(new Set((conns ?? []).map((c) => c.with_participant).filter(Boolean))) as string[];
  const { data: others } = otherIds.length ? await admin.from('participants').select('id, display_name').in('id', otherIds) : { data: [] };
  const otherName = new Map((others ?? []).map((o) => [o.id, o.display_name]));
  const connById = new Map((conns ?? []).map((c) => [c.id, c]));

  let sent = 0;
  for (const person of people ?? []) {
    if (!person.email) continue;
    const mine = byParticipant.get(person.id) ?? [];
    const lines = mine.map((n) => {
      const c = connById.get(n.connection_id);
      const who = c?.with_participant ? otherName.get(c.with_participant) ?? 'Someone' : 'Someone';
      return { text: `${who}: ${c?.summary ?? ''}${n.next_step ? `. Your next step: ${n.next_step}` : ''}`, who, c, n };
    });
    const text = [`Hello ${person.display_name},`, '', 'A reminder about connections you asked us to remind you of:', '', ...lines.map((l) => `- ${l.text}`), '', `Update them here: ${site.siteUrl}/connections`].join('\n');
    const html = `<p>Hello ${esc(person.display_name)},</p><p>A reminder about connections you asked us to remind you of:</p><ul>${lines.map((l) => `<li>${esc(l.text)}</li>`).join('')}</ul><p><a href="${esc(site.siteUrl)}/connections">Update them in the portal</a></p>`;
    const result = await sendEmail({ to: person.email, subject: 'Your AMI Festival reminder', text, html });
    if (result.ok) {
      sent += 1;
      await admin.from('connection_notes').update({ reminder_sent_at: new Date().toISOString() }).in('connection_id', mine.map((n) => n.connection_id));
    }
  }
  return NextResponse.json({ ok: true, sent });
}
