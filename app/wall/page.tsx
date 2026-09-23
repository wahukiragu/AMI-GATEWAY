import type { Metadata } from 'next';
import { WallDisplay } from './WallDisplay';
import { requireStaff } from '@/lib/auth';
import { loadAdminData } from '@/lib/admin-data';
import { getFramework } from '@/lib/framework-data';
import { computeMetrics } from '@/lib/metrics';

export const metadata: Metadata = { title: 'Live wall' };

// A fullscreen, auto-refreshing display for projecting at the venue.
// Works for any edition — it always shows whichever one is marked current.
export default async function WallPage() {
  await requireStaff();
  const [{ edition, participants, connections }, framework] = await Promise.all([loadAdminData(), getFramework()]);
  const metrics = computeMetrics(participants, connections);

  const initial = {
    edition: edition
      ? { name: edition.name, venue: edition.venue, starts_on: edition.starts_on, ends_on: edition.ends_on }
      : null,
    stages: framework.stages.map((s) => ({ stage_no: s.stage_no, name: s.name, short_label: s.short_label })),
    metrics,
    generatedAt: new Date().toISOString(),
  };

  return <WallDisplay initial={initial} />;
}
