import type { Edition } from '@/lib/types';

/** GET form: changes the ?edition= query parameter without any client JavaScript. */
export function EditionSelect({ editions, current }: { editions: Edition[]; current: string | undefined }) {
  if (editions.length < 2) return null;
  return (
    <form method="get" className="flex items-end gap-2">
      <div>
        <label htmlFor="edition" className="label">Edition</label>
        <select id="edition" name="edition" defaultValue={current} className="input py-2">
          {editions.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>
      <button className="btn btn-ghost btn-sm" type="submit">Show</button>
    </form>
  );
}
