/**
 * Decorative row of rounded vertical bars, echoing the AMI logo. Purely visual.
 */
export function BarsStrip({ className = '' }: { className?: string }) {
  const colours = ['#121642', '#600E17', '#E4AD22'];
  const count = 46;
  const step = 22;
  const height = 170;
  const bars = Array.from({ length: count }, (_, i) => {
    const h = 34 + 118 * Math.abs(Math.sin(i * 0.52 + 0.4)) * (0.55 + 0.45 * Math.cos(i * 0.17));
    const hollow = i % 7 === 3;
    const x = i * step + 5;
    const y = height - h;
    return hollow ? (
      <rect key={i} x={x + 1} y={y + 1} width={12} height={h - 2} rx={6} fill="none" stroke="#E4AD22" strokeWidth={2.5} />
    ) : (
      <rect key={i} x={x} y={y} width={14} height={h} rx={7} fill={colours[i % 3]} />
    );
  });
  return (
    <svg
      viewBox={`0 0 ${count * step} ${height}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {bars}
    </svg>
  );
}
