// Central place for names and versions shown in the product.
export const site = {
  name: 'AMI Gateway',
  org: 'African Musicology Institute',
  short: 'AMI',
  event: process.env.NEXT_PUBLIC_EVENT_NAME ?? 'AMI Festival 2026',
  venue: process.env.NEXT_PUBLIC_EVENT_VENUE ?? 'University of Venda',
  frameworkName: 'Culture-Trade Gateway Framework',
  // Bump when the privacy notice or consent wording changes. Everyone is asked to consent again.
  privacyVersion: '0.1-draft',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
};
