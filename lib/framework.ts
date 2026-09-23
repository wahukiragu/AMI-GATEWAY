import type { FrameworkStage, Sdg } from './types';

export const PARTICIPANT_TYPES: { value: string; label: string }[] = [
  { value: 'performer_or_group', label: 'Performer or cultural group' },
  { value: 'instrument_or_craft_maker', label: 'Instrument or craft maker' },
  { value: 'garment_or_textile_maker', label: 'Garment or textile maker' },
  { value: 'scholar_or_student', label: 'Scholar or student' },
  { value: 'trader_or_enterprise', label: 'Trader or enterprise' },
  { value: 'traditional_leader_or_custodian', label: 'Traditional leader or custodian' },
  { value: 'content_creator_or_podcaster', label: 'Content creator or podcaster' },
  { value: 'other', label: 'Other' },
];

export function typeLabel(value: string | null | undefined): string {
  return PARTICIPANT_TYPES.find((t) => t.value === value)?.label ?? 'Not stated';
}

export const COUNTRIES = [
  'South Africa', 'Zimbabwe', 'Botswana', 'Namibia', 'Mozambique', 'Zambia', 'Malawi', 'Eswatini', 'Lesotho',
  'Nigeria', 'Ghana', 'Kenya', 'Tanzania', 'Uganda', 'Ethiopia', 'Rwanda', 'Cameroon', 'Senegal', 'Other',
];

export const WANTS = ['Paid performances', 'Trade and sales', 'Collaboration', 'Research', 'Training'];

export const CURRENCIES = ['ZAR', 'KES', 'USD', 'NGN', 'BWP', 'GHS', 'TZS', 'UGX', 'EUR', 'GBP'];

export const PAYMENT_OPTIONS = [
  { value: 'paid', label: 'Paid' },
  { value: 'agreed', label: 'Agreed, not yet paid' },
];

export const VERIFICATION_LABEL: Record<string, string> = {
  self_reported: 'Self-reported',
  confirmed_by_other: 'Confirmed by the other party',
  ami_verified: 'Verified by AMI',
};

/**
 * Fallback copy of framework v0.1 used only if the database is unreachable
 * (for example before Supabase is connected). The database is the source of truth.
 */
export const DEFAULT_STAGES: FrameworkStage[] = [
  {
    stage_no: 1, name: 'Exposure', short_label: 'Showcased or seen',
    meaning: "People encounter each other's heritage: music, dress, instruments, ideas.",
    example: 'A group performs, or a visitor watches a workshop.',
    evidence_guidance: 'Programme, stream link or stall record.',
    event_types: ['Registered at the festival', 'Performed at the festival', 'Exhibited or sold at a stall', 'Presented a paper', 'Featured on live stream or podcast', 'Other'],
  },
  {
    stage_no: 2, name: 'Curiosity', short_label: 'Asked for more',
    meaning: 'Someone wants to know more or stay in touch.',
    example: 'A visitor asks how to book a group or where to buy a garment.',
    evidence_guidance: 'Message, email or a logged conversation.',
    event_types: ['Enquiry received', 'Asked for contact', 'Invited to a follow-up meeting', 'Requested a sample or demo', 'Other'],
  },
  {
     {
    stage_no: 3, name: 'Consumption', short_label: 'Value changed hands',
    meaning: 'Someone gives something in return for what they discovered — money, a trade, or a swap of goods and skills.',
    example: 'A guest buys a drum, trades a craft item for a ticket, or barters a skill for a workshop place.',
    evidence_guidance: 'Receipt, payment record, or a description of what was exchanged.',
    event_types: ['Purchase', 'Ticket or entry paid', 'Trade or barter exchange', 'Download or stream paid', 'Workshop fee paid', 'Other'],
  },
  {
    stage_no: 4, name: 'Exchange', short_label: 'Booked or contracted',
    meaning: 'A booking, commission or order that involves an agreement.',
    example: 'A venue books a choir, or a shop places a supply order.',
    evidence_guidance: 'Contract, invoice or written confirmation.',
    event_types: ['Paid booking', 'Commission', 'Supply order', 'Contract signed', 'Other'],
  },
  {
    stage_no: 5, name: 'Integration', short_label: 'Partnership or repeat trade',
    meaning: 'The relationship becomes ongoing: repeat trade, joint work, formal links across borders.',
    example: 'Repeat orders, a joint production, or an MoU.',
    evidence_guidance: 'Signed agreement or a record of repeat trade.',
    event_types: ['Repeat order', 'Joint production', 'MoU or partnership', 'Import or export link', 'Other'],
  },
];

export const DEFAULT_SDGS: Sdg[] = [
  { no: 4, name: 'Quality education', featured: true },
  { no: 5, name: 'Gender equality', featured: true },
  { no: 8, name: 'Decent work and economic growth', featured: true },
  { no: 9, name: 'Industry, innovation and infrastructure', featured: true },
  { no: 10, name: 'Reduced inequalities', featured: true },
  { no: 11, name: 'Sustainable cities and communities', featured: true },
  { no: 17, name: 'Partnerships for the goals', featured: true },
];
