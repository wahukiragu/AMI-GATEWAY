import { NextResponse } from 'next/server';
import { getStaffRole } from '@/lib/auth';
import { loadAdminData } from '@/lib/admin-data';
import { getFramework } from '@/lib/framework-data';
import { computeMetrics } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

// Polled by the /wall display. Staff-gated (viewer role is enough) since it
// exposes aggregate participant/connection counts, even though no names.
export async function GET() {
  const role = await getStaffRole();
  if (!role) return new NextResponse('Not found', { status: 404 });

  const [{ edition, participants, connections }, framework] = await Promise.all([loadAdminData(), getFramework()]);
  const metrics = computeMetrics(participants, connections);

  return NextResponse.json({
    edition: edition
      ? { name: edition.name, venue: edition.venue, starts_on: edition.starts_on, ends_on: edition.ends_on }
      : null,
    stages: framework.stages.map((s) => ({ stage_no: s.stage_no, name: s.name, short_label: s.short_label })),
    metrics,
    generatedAt: new Date().toISOString(),
  });
}
