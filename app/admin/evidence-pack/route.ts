import { createHash } from 'node:crypto';
import { strToU8, zipSync } from 'fflate';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStaffRole } from '@/lib/auth';
import { toCsv } from '@/lib/csv';
import { typeLabel, VERIFICATION_LABEL } from '@/lib/framework';
import { verificationOf } from '@/lib/metrics';
import { buildReportHtml } from '@/lib/report';
import { loadReportInput } from '@/lib/report-data';

const sha256 = (data: Uint8Array) => createHash('sha256').update(data).digest('hex');

/**
 * Evidence pack for funders and partners: anonymised, fingerprinted, reproducible.
 * Contains no names, contact details or free text.
 */
export async function GET(request: Request) {
  if (!(await getStaffRole())) return new NextResponse('Not found', { status: 404 });
  const editionId = new URL(request.url).searchParams.get('edition') ?? undefined;
  const input = await loadReportInput(editionId);
  const { metrics: m, connections, stages, version, edition } = input;
  const stamp = input.generatedAt.toISOString();

  const connectionsCsv = toCsv(
    ['Ref', 'Edition', 'Stage', 'Stage name', 'Event type', 'Logged by (type)', 'Logged by (country)', 'Other party (type)', 'Other party (country)', 'Value', 'Currency', 'Payment', 'Goals', 'Evidence level', 'Logged on', 'Framework version'],
    connections.map((c, i) => [
      `C${String(i + 1).padStart(4, '0')}`,
      edition?.name ?? '',
      c.stage_no,
      stages.find((s) => s.stage_no === c.stage_no)?.name ?? '',
      c.event_type,
      typeLabel(c.logger?.participant_type),
      c.logger?.country,
      typeLabel(c.other?.participant_type),
      c.other?.country,
      c.value_amount,
      c.value_currency,
      c.payment_status,
      c.sdg_goals.join('; '),
      VERIFICATION_LABEL[verificationOf(c)],
      c.created_at.slice(0, 10),
      version?.version ?? '',
    ]),
  );

  const frameworkMd = [
    `# ${version?.name ?? 'Culture-Trade Gateway Framework'}${version ? `, version ${version.version}` : ''}`,
    '',
    version?.rights_holder ? `Rights holder: ${version.rights_holder}` : '',
    version?.licence_notice ? `Licence notice: ${version.licence_notice}` : '',
    '',
    ...stages.flatMap((s) => [
      `## Stage ${s.stage_no}: ${s.name} (${s.short_label})`,
      s.meaning,
      `Example: ${s.example}`,
      `Evidence: ${s.evidence_guidance}`,
      `Event types: ${s.event_types.join('; ')}`,
      '',
    ]),
  ].join('\n');

  const readme = [
    `AMI Gateway evidence pack`,
    `Edition: ${edition?.name ?? 'n/a'}`,
    `Generated: ${stamp}`,
    '',
    'Files',
    '  report.html                   Festival Gateway Report (open in a browser, print to PDF)',
    '  connections-anonymised.csv    One row per connection. No names, contacts or free text.',
    '  metrics.json                  The computed measures behind the report',
    '  framework.md                  The framework version used',
    '  manifest.json                 SHA-256 fingerprint of each file',
    '',
    'Notes',
    '  Entries are self-reported unless the evidence level says confirmed by the other party or verified by AMI.',
    '  Amounts are as entered by participants, are not converted between currencies and are not audited.',
    '  Add consent forms, media and audience feedback from the festival archive before sharing.',
    '',
  ].join('\n');

  const files: Record<string, Uint8Array> = {
    'report.html': strToU8(buildReportHtml(input)),
    'connections-anonymised.csv': strToU8(connectionsCsv),
    'metrics.json': strToU8(JSON.stringify(m, null, 2)),
    'framework.md': strToU8(frameworkMd),
    'README.txt': strToU8(readme),
  };
  const manifest = {
    generated_at: stamp,
    edition: edition?.name ?? null,
    framework: version ? `${version.name} v${version.version}` : null,
    counts: { registered_participants: m.participants.registered, connections: m.connections.total },
    files: Object.fromEntries(Object.entries(files).map(([name, data]) => [name, { sha256: sha256(data), bytes: data.length }])),
  };
  files['manifest.json'] = strToU8(JSON.stringify(manifest, null, 2));

  const supabase = await createClient();
  await supabase.rpc('staff_log_export', { p_kind: 'evidence_pack' });

  const zip = zipSync(files, { level: 6 });
  const slug = (edition?.name ?? 'ami').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return new NextResponse(Buffer.from(zip), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${slug}-evidence-pack-${stamp.slice(0, 10)}.zip"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
