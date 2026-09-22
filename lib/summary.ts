import type { MyConnection } from './types';

export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

const STAGE_NAMES = ['Exposure', 'Curiosity', 'Consumption', 'Exchange', 'Integration'];

function money(c: MyConnection): string {
  if (c.value_amount === null || !c.value_currency) return '';
  const status = c.payment_status === 'paid' ? 'paid' : 'agreed, not yet paid';
  return `${c.value_currency} ${Number(c.value_amount).toLocaleString('en-US', { maximumFractionDigits: 2 })} (${status})`;
}

function ackLine(c: MyConnection): string {
  if (c.role === 'counterparty') return c.ack_status === 'pending' ? 'Waiting for you to confirm' : `You marked this as ${c.ack_status}`;
  if (c.ack_status === 'confirmed') return `Confirmed by ${c.other_name}`;
  if (c.ack_status === 'disputed') return `${c.other_name} said it is not quite right${c.ack_note ? `: ${c.ack_note}` : ''}`;
  return `Waiting for ${c.other_name} to confirm`;
}

/** A private summary of one participant's connections: for their own notes and reminders. */
export function buildSummary(name: string, rows: MyConnection[], portalUrl: string) {
  const mine = rows.filter((r) => r.role === 'logger');
  const waiting = rows.filter((r) => r.role === 'counterparty' && r.ack_status === 'pending');
  const subject = 'Your AMI Festival connections';

  const textParts: string[] = [
    `Hello ${name},`,
    '',
    'Here are the connections you logged at the AMI Festival, for your own notes.',
    'Open the portal any time to update a connection as it moves forward:',
    portalUrl,
    '',
  ];
  const htmlParts: string[] = [
    `<p>Hello ${esc(name)},</p>`,
    `<p>Here are the connections you logged at the AMI Festival, for your own notes. <a href="${esc(portalUrl)}">Open the portal</a> to update a connection as it moves forward.</p>`,
  ];

  if (waiting.length) {
    textParts.push(`Waiting for you to confirm (${waiting.length}):`);
    htmlParts.push(`<h3>Waiting for you to confirm (${waiting.length})</h3><ul>`);
    waiting.forEach((c) => {
      textParts.push(`- ${c.other_name}: ${c.summary}`);
      htmlParts.push(`<li><strong>${esc(c.other_name)}</strong>: ${esc(c.summary)}</li>`);
    });
    htmlParts.push('</ul>');
    textParts.push('');
  }

  textParts.push(`Your connections (${mine.length}):`, '');
  htmlParts.push(`<h3>Your connections (${mine.length})</h3>`);
  mine.forEach((c) => {
    const stage = STAGE_NAMES[c.stage_no - 1] ?? `Stage ${c.stage_no}`;
    const lines = [
      `${c.other_name}${c.other_country ? ` (${c.other_country})` : ''}`,
      `Stage: ${stage}. ${c.event_type}`,
      c.summary,
      money(c) ? `Value: ${money(c)}` : '',
      ackLine(c),
      c.next_step ? `Next step: ${c.next_step}${c.remind_on ? ` (by ${c.remind_on})` : ''}` : '',
      c.reflection ? `Your note: ${c.reflection}` : '',
    ].filter(Boolean);
    textParts.push(...lines.map((l, i) => (i === 0 ? l : `  ${l}`)), '');
    htmlParts.push(
      `<div style="margin:0 0 14px"><strong>${esc(lines[0])}</strong><br>${lines.slice(1).map(esc).join('<br>')}</div>`,
    );
  });
  if (!mine.length) {
    textParts.push('You have not logged any connections yet.');
    htmlParts.push('<p>You have not logged any connections yet.</p>');
  }
  textParts.push('', 'This summary is private to you. Your notes are never shown to the other person.');
  htmlParts.push('<p style="color:#4A5078;font-size:13px">This summary is private to you. Your notes are never shown to the other person.</p>');

  return { subject, text: textParts.join('\n'), html: htmlParts.join('\n') };
}
