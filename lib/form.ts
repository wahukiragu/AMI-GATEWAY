export type ActionResult = { error?: string } | void;

export const str = (fd: FormData, key: string): string => String(fd.get(key) ?? '').trim();

export const opt = (fd: FormData, key: string): string | null => {
  const v = str(fd, key);
  return v === '' ? null : v;
};

/** null when empty, NaN when not a number. */
export const num = (fd: FormData, key: string): number | null => {
  const v = str(fd, key);
  if (v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

export const checked = (fd: FormData, key: string): boolean => fd.get(key) === 'on';
