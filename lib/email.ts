import 'server-only';

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Sends email through Resend (https://resend.com). If RESEND_API_KEY / EMAIL_FROM are not set,
 * returns { ok: false, error: 'not_configured' } and the app falls back to downloads.
 */
export async function sendEmail(mail: OutgoingEmail): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return { ok: false, error: 'not_configured' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html }),
    });
    if (!res.ok) return { ok: false, error: `provider_${res.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: 'network' };
  }
}
