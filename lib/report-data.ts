import { loadAdminData } from './admin-data';
import { getFramework } from './framework-data';
import { computeMetrics } from './metrics';
import { site } from './config';
import type { ReportInput } from './report';

/** Loads everything the report and the evidence pack need, as the signed-in staff member. */
export async function loadReportInput(editionId?: string, autoPrint = false): Promise<ReportInput & { participantsAll: number }> {
  const [{ edition, participants, connections }, framework] = await Promise.all([loadAdminData(editionId), getFramework()]);
  return {
    orgName: site.org,
    edition,
    version: framework.version,
    stages: framework.stages,
    sdgs: framework.sdgs,
    metrics: computeMetrics(participants, connections),
    connections,
    named: participants.filter((p) => p.status === 'registered' && p.consent_public_name),
    generatedAt: new Date(),
    autoPrint,
    participantsAll: participants.length,
  };
}
