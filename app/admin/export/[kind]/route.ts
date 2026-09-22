import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStaffRole } from '@/lib/auth';
import { loadAdminData } from '@/lib/admin-data';
import { toCsv } from '@/lib/csv';
import { verificationOf } from '@/lib/metrics';
import { VERIFICATION_LABEL, typeLabel } from '@/lib/framework';

// INTERNAL exports. These contain personal data (names, contacts, free text). Not for funders.
export async function GET(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const role = await getStaffRole();
  if (!role) return new NextResponse('Not found', { status: 404 });
  if (kind !== 'participants' && kind !== 'connections') return new NextResponse('Not found', { status: 404 });

  const editionId = new URL(request.url).searchParams.get('edition') ?? undefined;
  const { participants, connections } = await loadAdminData(editionId);
  const supabase = await createClient();
  await supabase.rpc('staff_log_export', { p_kind: `internal_${kind}` });

  const csv =
    kind === 'participants'
      ? toCsv(
          ['Name', 'Organisation', 'Status', 'Type', 'Country', 'Offering', 'Hoping for', 'Email', 'Phone', 'Consent: named in reports', 'Consent: future contact', 'Consent version', 'Registered at'],
          participants.map((p) => [p.display_name, p.organisation, p.status, typeLabel(p.participant_type), p.country, p.offering, (p.wants ?? []).join('; '), p.email, p.phone, p.consent_public_name ? 'yes' : 'no', p.consent_future_contact ? 'yes' : 'no', p.consent_version, p.registered_at]),
        )
      : toCsv(
          ['Logged by', 'Logger country', 'With', 'Other country', 'Other status', 'Stage', 'Event type', 'What happened', 'Value', 'Currency', 'Payment', 'Goals', 'Evidence', 'Created', 'Updated'],
          connections.map((c) => [c.logger?.display_name, c.logger?.country, c.other?.display_name ?? 'Removed participant', c.other?.country, c.other?.status, c.stage_no, c.event_type, c.summary, c.value_amount, c.value_currency, c.payment_status, c.sdg_goals.join('; '), VERIFICATION_LABEL[verificationOf(c)], c.created_at, c.updated_at]),
        );

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ami-internal-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
