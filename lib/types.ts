export type ParticipantStatus = 'unverified' | 'account' | 'registered';
export type AckStatus = 'pending' | 'confirmed' | 'disputed';
export type PaymentStatus = 'none' | 'agreed' | 'paid';
export type Verification = 'self_reported' | 'confirmed_by_other' | 'ami_verified';

export interface Participant {
  id: string;
  user_id: string | null;
  status: ParticipantStatus;
  display_name: string;
  organisation: string | null;
  participant_type: string | null;
  country: string | null;
  offering: string | null;
  wants: string[];
  email: string | null;
  phone: string | null;
  consent_version: string | null;
  consent_at: string | null;
  consent_public_name: boolean;
  consent_future_contact: boolean;
  registered_at: string | null;
  created_at: string;
}

export interface FrameworkStage {
  stage_no: number;
  name: string;
  short_label: string;
  meaning: string;
  example: string;
  evidence_guidance: string;
  event_types: string[];
}

export interface FrameworkVersion {
  id: string;
  name: string;
  version: string;
  status: string;
  rights_holder: string | null;
  licence_notice: string | null;
  published_at: string | null;
}

export interface Sdg {
  no: number;
  name: string;
  featured: boolean;
}

export interface Edition {
  id: string;
  name: string;
  year: number;
  venue: string | null;
  starts_on: string | null;
  ends_on: string | null;
  is_current: boolean;
}

/** Row returned by the my_connections() database function. */
export interface MyConnection {
  id: string;
  role: 'logger' | 'counterparty';
  other_id: string | null;
  other_name: string;
  other_country: string | null;
  other_status: string | null;
  /** Only populated when the viewer is the one who originally supplied this number. */
  other_phone: string | null;
  stage_no: number;
  event_type: string;
  summary: string;
  value_amount: number | null;
  value_currency: string | null;
  payment_status: PaymentStatus;
  sdg_goals: number[];
  ack_status: AckStatus;
  ack_note: string | null;
  verification: Verification;
  edition_name: string | null;
  created_at: string;
  updated_at: string;
  reflection: string | null;
  next_step: string | null;
  remind_on: string | null;
}

export interface ConnectionUpdate {
  id: string;
  connection_id: string;
  stage_no: number;
  note: string | null;
  value_amount: number | null;
  value_currency: string | null;
  payment_status: PaymentStatus;
  created_at: string;
}

/** Connection row as staff see it (joined with both participants). */
export interface AdminConnection {
  id: string;
  edition_id: string;
  logged_by: string;
  with_participant: string | null;
  stage_no: number;
  event_type: string;
  summary: string;
  value_amount: number | null;
  value_currency: string | null;
  payment_status: PaymentStatus;
  sdg_goals: number[];
  ack_status: AckStatus;
  ami_verified_at: string | null;
  created_at: string;
  updated_at: string;
  logger: { display_name: string; country: string | null; participant_type: string | null } | null;
  other: { display_name: string; country: string | null; participant_type: string | null; status: string } | null;
}
