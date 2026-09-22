/** Five small bars showing how far a connection has travelled (1 to 5). */
export function StageBars({ stage, label }: { stage: number; label?: string }) {
  return (
    <span className="inline-flex items-end gap-1" role="img" aria-label={label ?? `Stage ${stage} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`inline-block w-2 rounded-full ${n <= stage ? 'bg-gold' : 'bg-navy/15'}`}
          style={{ height: 8 + n * 4 }}
        />
      ))}
    </span>
  );
}
