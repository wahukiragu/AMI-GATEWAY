/** CSV with a UTF-8 BOM (Excel-friendly) and protection against spreadsheet formula injection. */
export function csvCell(value: string | number | boolean | null | undefined): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(head: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const lines = [head, ...rows].map((row) => row.map(csvCell).join(','));
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}
