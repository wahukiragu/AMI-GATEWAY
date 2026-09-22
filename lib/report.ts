import { LOGO_DATA_URI } from './brand-logo';
import { typeLabel, VERIFICATION_LABEL } from './framework';
import { formatMoney, verificationOf, type Metrics } from './metrics';
import { esc } from './summary';
import type { AdminConnection, Edition, FrameworkStage, FrameworkVersion, Participant, Sdg } from './types';

const CSS = `
:root{--navy:#121642;--maroon:#600E17;--gold:#E4AD22;--sand:#F7F3EA;--muted:#4A5078}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:var(--navy);font-family:Poppins,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.6}
main{max-width:860px;margin:0 auto;padding:32px 24px 64px}
header.top{display:flex;align-items:center;gap:20px;border-bottom:3px solid var(--gold);padding-bottom:18px;margin-bottom:28px}
header.top img{height:88px;width:auto}
h1{font-size:2rem;line-height:1.15;margin:0}
h2{font-size:1.3rem;margin:36px 0 8px;color:var(--navy)}
p{margin:0 0 12px;max-width:70ch}
.muted{color:var(--muted);font-size:.9rem}
.lead{font-size:1.1rem}
table{width:100%;border-collapse:collapse;font-size:.92rem;margin:8px 0 16px}
th{text-align:left;border-bottom:2px solid var(--navy);padding:6px 10px 6px 0;font-weight:600}
td{border-bottom:1px solid #dde;padding:8px 10px 8px 0;vertical-align:top}
.bar{height:14px;background:var(--sand);border-radius:7px;overflow:hidden;min-width:120px}
.bar i{display:block;height:100%;background:var(--navy);border-radius:7px}
.bar.gold i{background:var(--gold)}
.note{background:var(--sand);border-radius:10px;padding:12px 16px;font-size:.9rem}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin:16px 0}
.kpi{border:1px solid #dde;border-radius:12px;padding:12px 14px}
.kpi b{display:block;font-size:1.7rem;line-height:1.1}
.kpi span{font-size:.85rem;color:var(--muted)}
footer{margin-top:40px;border-top:1px solid #dde;padding-top:14px;font-size:.82rem;color:var(--muted)}
@media print{main{padding:0}h2{break-after:avoid}table,.kpis{break-inside:avoid}}
`;

export interface ReportInput {
  orgName: string;
  edition: Edition | null;
  version: FrameworkVersion | null;
  stages: FrameworkStage[];
  sdgs: Sdg[];
  metrics: Metrics;
  connections: AdminConnection[];
  /** Participants who agreed to be named in reports. */
  named: Participant[];
  generatedAt: Date;
  autoPrint?: boolean;
}

const n = (x: number) => x.toLocaleString('en-US');

export function buildReportHtml(input: ReportInput): string {
  const { metrics: m, stages, sdgs, edition, version } = input;
  const editionName = edition?.name ?? 'Festival edition';
  const date = input.generatedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const top = Math.max(1, m.funnel[0]?.connections ?? 1);
  const solid = m.connections.verification.confirmed_by_other + m.connections.verification.ami_verified;
  const solidPct = m.connections.total ? Math.round((solid / m.connections.total) * 100) : 0;

  const funnelRows = m.funnel
    .map((f) => {
      const st = stages.find((s) => s.stage_no === f.stage_no);
      return `<tr>
        <td><strong>${esc(st?.name ?? `Stage ${f.stage_no}`)}</strong><br><span class="muted">${esc(st?.short_label ?? '')}</span></td>
        <td>${n(f.connections)}</td>
        <td>${n(f.participants)}</td>
        <td>${f.conversion === null ? '' : `${f.conversion}%`}</td>
        <td><div class="bar"><i style="width:${Math.round((f.connections / top) * 100)}%"></i></div></td>
      </tr>`;
    })
    .join('');

  const corridorRows = m.corridors
    .slice(0, 10)
    .map(
      (c) =>
        `<tr><td>${esc(c.from)} to ${esc(c.to)}</td><td>${n(c.count)}</td><td>${esc(stages.find((s) => s.stage_no === c.topStage)?.name ?? '')}</td></tr>`,
    )
    .join('');

  const sdgKeys = Object.keys(m.sdg)
    .map(Number)
    .sort((a, b) => (m.sdg[b] ?? 0) - (m.sdg[a] ?? 0) || a - b);
  const sdgTop = Math.max(1, ...sdgKeys.map((k) => m.sdg[k]));
  const sdgRows = sdgKeys
    .map((k) => {
      const goal = sdgs.find((s) => s.no === k);
      return `<tr><td>SDG ${k}: ${esc(goal?.name ?? '')}</td><td>${n(m.sdg[k])}</td><td><div class="bar gold"><i style="width:${Math.round((m.sdg[k] / sdgTop) * 100)}%"></i></div></td></tr>`;
    })
    .join('');

  const typeRows = Object.entries(m.participants.byType)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `<tr><td>${esc(k === 'not_stated' ? 'Not stated' : typeLabel(k))}</td><td>${n(v)}</td></tr>`)
    .join('');

  // Anonymised examples: structured fields only, never names or free text.
  const examples = [...input.connections]
    .filter((c) => c.stage_no >= 3)
    .sort((a, b) => b.stage_no - a.stage_no || (b.value_amount ?? 0) - (a.value_amount ?? 0))
    .slice(0, 8)
    .map((c) => {
      const stage = stages.find((s) => s.stage_no === c.stage_no)?.name ?? '';
      const a = `${typeLabel(c.logger?.participant_type)}${c.logger?.country ? ` (${c.logger.country})` : ''}`;
      const b = `${typeLabel(c.other?.participant_type)}${c.other?.country ? ` (${c.other.country})` : ''}`;
      const value =
        c.value_amount !== null && c.value_currency
          ? `, ${c.value_currency} ${n(Number(c.value_amount))} ${c.payment_status === 'paid' ? 'paid' : 'agreed'}`
          : '';
      return `<li>${esc(a)} with ${esc(b)}: ${esc(c.event_type)} (${esc(stage)}${esc(value)}). ${esc(VERIFICATION_LABEL[verificationOf(c)])}.</li>`;
    })
    .join('');

  const namedList = input.named.length
    ? `<ul>${input.named
        .map((p) => `<li>${esc(p.display_name)}${p.country ? `, ${esc(p.country)}` : ''}${p.participant_type ? ` (${esc(typeLabel(p.participant_type))})` : ''}</li>`)
        .join('')}</ul>`
    : '<p class="muted">No participants have agreed to be named yet.</p>';

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(editionName)} Gateway Report</title><style>${CSS}</style></head>
<body><main>
<header class="top"><img src="${LOGO_DATA_URI}" alt="${esc(input.orgName)}"><div>
<h1>Festival Gateway Report</h1>
<p class="muted" style="margin:6px 0 0">${esc(editionName)}${edition?.venue ? `, ${esc(edition.venue)}` : ''}<br>Generated ${esc(date)}</p></div></header>

<p class="lead">${n(m.participants.registered)} participants from ${n(m.participants.countries.length)} ${m.participants.countries.length === 1 ? 'country' : 'countries'} registered and logged ${n(m.connections.total)} connections. ${n(m.connections.crossBorder)} of them crossed a border, and ${n(m.connections.exchangeOrBeyond)} reached the Exchange stage or beyond, where a booking, order or agreement was made.</p>

<div class="kpis">
<div class="kpi"><b>${n(m.participants.registered)}</b><span>registered participants</span></div>
<div class="kpi"><b>${n(m.connections.total)}</b><span>connections logged</span></div>
<div class="kpi"><b>${n(m.connections.crossBorder)}</b><span>cross-border connections</span></div>
<div class="kpi"><b>${solidPct}%</b><span>confirmed or verified</span></div>
</div>

<h2>The gateway funnel</h2>
<p>The ${esc(version?.name ?? 'Culture-Trade Gateway Framework')} measures how far a connection travels from first exposure to ongoing partnership. Each row counts connections that reached that stage or beyond.</p>
<table><thead><tr><th>Stage</th><th>Connections</th><th>Participants</th><th>Share of previous stage</th><th></th></tr></thead><tbody>${funnelRows}</tbody></table>

<h2>Economic activity reported</h2>
<table><tbody>
<tr><td>Connections that involved money</td><td>${n(m.value.withValue)}</td></tr>
<tr><td>Paid</td><td>${esc(formatMoney(m.value.paid))}</td></tr>
<tr><td>Agreed, not yet paid</td><td>${esc(formatMoney(m.value.agreed))}</td></tr>
<tr><td>Confirmed by the other party or verified by AMI</td><td>${esc(formatMoney(m.value.verified))}</td></tr>
</tbody></table>
<p class="note">Amounts are reported by participants in the currency they used and are not converted. They are not audited. The confirmed line counts only entries the other party or AMI has confirmed.</p>

<h2>Cross-border corridors</h2>
${corridorRows ? `<table><thead><tr><th>Corridor</th><th>Connections</th><th>Furthest stage</th></tr></thead><tbody>${corridorRows}</tbody></table>` : '<p class="muted">No cross-border connections logged yet.</p>'}

<h2>Contribution to the Sustainable Development Goals</h2>
<p>Participants tagged each connection with the goals it contributes to. The mapping is indicative and self-reported.</p>
${sdgRows ? `<table><thead><tr><th>Goal</th><th>Connections</th><th></th></tr></thead><tbody>${sdgRows}</tbody></table>` : '<p class="muted">No goals tagged yet.</p>'}

<h2>Strength of the evidence</h2>
<table><tbody>
<tr><td>${esc(VERIFICATION_LABEL.ami_verified)}</td><td>${n(m.connections.verification.ami_verified)}</td></tr>
<tr><td>${esc(VERIFICATION_LABEL.confirmed_by_other)}</td><td>${n(m.connections.verification.confirmed_by_other)}</td></tr>
<tr><td>${esc(VERIFICATION_LABEL.self_reported)}</td><td>${n(m.connections.verification.self_reported)}</td></tr>
</tbody></table>
${m.connections.byAck.disputed ? `<p class="muted">${n(m.connections.byAck.disputed)} connections were questioned by the other party and are counted as self-reported.</p>` : ''}

<h2>Who took part</h2>
<table><thead><tr><th>Type</th><th>Participants</th></tr></thead><tbody>${typeRows}</tbody></table>
<p class="muted">Countries: ${esc(m.participants.countries.join(', ') || 'none yet')}.</p>

${examples ? `<h2>Selected connections</h2><p class="muted">Anonymised: no names or free text are included.</p><ul>${examples}</ul>` : ''}

<h2>Participants who agreed to be named</h2>
${namedList}

<h2>Method and limits</h2>
<ul>
<li>Participants registered after accepting a privacy notice and log connections themselves. Entries are self-reported unless marked as confirmed by the other party or verified by AMI.</li>
<li>Later stages often happen after the festival, so participants are asked to update their connections. Counts can rise after this report is generated.</li>
<li>Amounts are not audited or converted. Goals are tagged by participants and are indicative.</li>
<li>Participant names and free-text descriptions are not published in this report.</li>
</ul>

<footer>
<strong>${esc(version?.name ?? 'Culture-Trade Gateway Framework')}${version ? `, version ${esc(version.version)}` : ''}.</strong>
${version?.rights_holder ? ` Rights holder: ${esc(version.rights_holder)}.` : ''}
${version?.licence_notice ? ` ${esc(version.licence_notice)}` : ''}
<br>Data captured with AMI Gateway. Generated ${esc(input.generatedAt.toISOString())}.
</footer>
</main>${input.autoPrint ? '<script>window.addEventListener("load",function(){window.print()})</script>' : ''}</body></html>`;
}
