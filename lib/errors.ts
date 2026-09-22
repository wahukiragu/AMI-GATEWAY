// Turns database error codes (raised by the SQL functions) into plain language.
const MESSAGES: Record<string, string> = {
  not_authenticated: 'Please sign in again.',
  consent_required: 'Please read and accept the privacy notice first.',
  registration_required: 'Please complete Stage 1 (Register) first.',
  name_required: 'Please enter a name.',
  type_required: 'Please choose what best describes you.',
  country_required: 'Please choose a country.',
  invalid_email: 'That email address does not look right.',
  cannot_connect_with_self: 'That is your own profile. Choose someone else.',
  too_many_unverified: 'You have added a lot of new people. Please ask the AMI team for help.',
  invalid_counterparty: 'Choose who you connected with.',
  invalid_stage: 'Choose the stage the connection reached.',
  invalid_event_type: 'Choose what kind of moment it was.',
  summary_required: 'Describe what happened in a few words (3 to 500 characters).',
  invalid_value: 'Enter an amount of zero or more, or leave it empty.',
  invalid_currency: 'Choose a currency.',
  payment_status_required: 'Say whether the amount was paid or only agreed.',
  too_many_sdgs: 'Choose up to six goals.',
  stage_cannot_go_back: 'A connection can stay at its stage or move forward, not back.',
  not_found: 'That record was not found, or it is not yours to change.',
  not_claimable: 'That profile cannot be claimed.',
  forbidden: 'You do not have permission to do that.',
};

export function friendlyError(err: { message?: string } | null | undefined): string {
  const msg = err?.message ?? '';
  for (const key of Object.keys(MESSAGES)) {
    if (msg.includes(key)) return MESSAGES[key];
  }
  if (msg.includes('duplicate key') || msg.includes('unique')) return 'That already exists.';
  return 'Something went wrong. Please try again.';
}

export function safeNext(next: string | null | undefined, fallback = '/connections'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback;
  return next;
}
