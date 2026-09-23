/**
 * Builds a wa.me link. Strips everything but digits, since WhatsApp's link
 * format wants digits only (no "+", spaces or dashes). Numbers entered
 * without a country code will not produce a fully correct international
 * link — the phone field hints at including one for this reason.
 */
export function waLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
