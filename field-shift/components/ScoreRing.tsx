export function scoreColor(v: number) {
  return v >= 70 ? "var(--good)" : v >= 45 ? "var(--mid)" : "var(--bad)";
}

export default function ScoreRing({ value, size = 56, stroke = 6, muted = false }: { value: number; size?: number; stroke?: number; muted?: boolean }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = muted ? "var(--ink-3)" : scoreColor(value);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ring" role="img" aria-label={`Score ${value} of 100`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset .6s ease" }}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size * 0.32} fontWeight={800} fill="var(--ink)">{value}</text>
    </svg>
  );
}
