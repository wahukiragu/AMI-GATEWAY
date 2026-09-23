import QRCode from 'qrcode';
import { LOGO_DATA_URI } from './brand-logo';
import { formatEditionDates } from './dates';
import { esc } from './summary';
import type { Edition } from './types';

const CSS = `
:root{--navy:#121642;--maroon:#600E17;--gold:#E4AD22;--sand:#F7F3EA}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:var(--navy);font-family:Poppins,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.sheet{width:210mm;min-height:297mm;margin:0 auto;padding:16mm;position:relative;overflow:hidden}
.sheet::after{content:"";position:absolute;left:0;right:0;bottom:0;height:60mm;background:linear-gradient(180deg,var(--navy),var(--maroon));z-index:0}
.content{position:relative;z-index:1}
header{display:flex;align-items:center;gap:14mm;margin-bottom:10mm}
header img{height:26mm;width:auto}
h1{font-size:13mm;line-height:1.08;margin:0 0 4mm}
.event{font-size:5.4mm;color:var(--maroon);font-weight:700;margin:0 0 12mm}
.lead{font-size:5.2mm;max-width:150mm;margin:0 0 14mm}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:8mm}
.card{border:1.2mm solid var(--navy);border-radius:6mm;padding:8mm;text-align:center}
.card h2{font-size:6mm;margin:0 0 2mm}
.card p{font-size:4mm;color:#4A5078;margin:0 0 6mm}
.card svg{width:52mm;height:52mm}
footer{position:relative;z-index:1;margin-top:16mm;color:#fff;text-align:center}
footer img{height:14mm;margin-bottom:3mm}
footer p{margin:0;font-size:4mm;opacity:.9}
@media print{.sheet{width:auto;min-height:auto}}
`;

export interface FlyerInput {
  orgName: string;
  edition: Edition | null;
  siteUrl: string;
  frameworkName: string;
  autoPrint?: boolean;
}

export async function buildFlyerHtml(input: FlyerInput): Promise<string> {
  const { edition, siteUrl } = input;
  const eventName = edition?.name ?? 'AMI Gateway';
  const dates = edition ? formatEditionDates(edition.starts_on, edition.ends_on) : '';
  const venue = edition?.venue ?? '';

  const newUrl = siteUrl;
  const returningUrl = `${siteUrl}/login?next=${encodeURIComponent('/connections/new')}`;
  const [newQr, returningQr] = await Promise.all([
    QRCode.toString(newUrl, { type: 'svg', margin: 0, color: { dark: '#121642', light: '#00000000' } }),
    QRCode.toString(returningUrl, { type: 'svg', margin: 0, color: { dark: '#121642', light: '#00000000' } }),
  ]);

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(eventName)} — AMI Gateway flyer</title><style>${CSS}</style></head>
<body><div class="sheet"><div class="content">
<header><img src="${LOGO_DATA_URI}" alt="${esc(input.orgName)}"><div>
<h1>Log your festival connections.</h1>
<p class="event">${esc(eventName)}${dates ? ` · ${esc(dates)}` : ''}${venue ? ` · ${esc(venue)}` : ''}</p>
</div></header>

<p class="lead">Scan a code below to record who you meet at the festival — and see how a conversation can turn into a booking, a sale, or a lasting partnership, through the ${esc(input.frameworkName)}.</p>

<div class="cards">
  <div class="card">
    <h2>New here?</h2>
    <p>Scan to get started and register.</p>
    ${newQr}
  </div>
  <div class="card">
    <h2>Already registered?</h2>
    <p>Scan to log a connection now.</p>
    ${returningQr}
  </div>
</div>
</div>
<footer><img src="${LOGO_DATA_URI}" alt=""><p>${esc(input.orgName)} · ${esc(siteUrl.replace(/^https?:\/\//, ''))}</p></footer>
</div>${input.autoPrint ? '<script>window.addEventListener("load",function(){window.print()})</script>' : ''}</body></html>`;
}
