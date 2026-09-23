/** "23 September 2026", or a sensible range like "23–24 September 2026". */
export function formatEditionDates(startsOn: string | null, endsOn: string | null): string {
  if (!startsOn) return '';
  const start = new Date(`${startsOn}T00:00:00`);
  const startFull = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  if (!endsOn || endsOn === startsOn) return startFull;

  const end = new Date(`${endsOn}T00:00:00`);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const sameYear = start.getFullYear() === end.getFullYear();
  const endFull = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  if (sameMonth) return `${start.getDate()}–${endFull}`;
  if (sameYear) return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} – ${endFull}`;
  return `${startFull} – ${endFull}`;
}

export interface EditionStatus {
  phase: 'before' | 'live' | 'after' | 'unknown';
  label: string;
}

/** "Day 1 of 2", "Starts in 3 days", "This edition has ended", etc. */
export function editionStatus(startsOn: string | null, endsOn: string | null, now: Date = new Date()): EditionStatus {
  if (!startsOn) return { phase: 'unknown', label: '' };
  const today = now.toISOString().slice(0, 10);
  const end = endsOn ?? startsOn;
  const dayMs = 86_400_000;

  if (today < startsOn) {
    const days = Math.ceil((Date.parse(startsOn) - Date.parse(today)) / dayMs);
    return { phase: 'before', label: days === 1 ? 'Starts tomorrow' : `Starts in ${days} days` };
  }
  if (today > end) {
    return { phase: 'after', label: 'This edition has ended' };
  }
  const totalDays = Math.round((Date.parse(end) - Date.parse(startsOn)) / dayMs) + 1;
  const dayNum = Math.round((Date.parse(today) - Date.parse(startsOn)) / dayMs) + 1;
  return { phase: 'live', label: totalDays > 1 ? `Day ${dayNum} of ${totalDays}` : 'Today' };
}
