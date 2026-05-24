import type { TopicMasteryDto } from '../api/profile';

export default function ScoreTrendChart({ masteries }: { masteries: TopicMasteryDto[] }) {
  if (masteries.length === 0) return null;

  const data = masteries.map(m => ({ label: m.topic, score: m.score }));
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW),
    y: padding.top + chartH - (d.score / 100) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line
            x1={padding.left}
            y1={padding.top + chartH - (v / 100) * chartH}
            x2={width - padding.right}
            y2={padding.top + chartH - (v / 100) * chartH}
            stroke="var(--color-border)"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
          <text x={padding.left - 8} y={padding.top + chartH - (v / 100) * chartH + 4} textAnchor="end" fontSize="10" fill="var(--color-text-muted)">
            {v}
          </text>
        </g>
      ))}
      <path d={areaPath} fill="url(#scoreGradient)" />
      <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="var(--color-primary)" stroke="white" strokeWidth="2" />
          <text x={p.x} y={height - 10} textAnchor="middle" fontSize="10" fill="var(--color-text-muted)">
            {p.label.length > 6 ? p.label.slice(0, 6) + '…' : p.label}
          </text>
          <title>{`${p.label}: ${p.score.toFixed(1)}`}</title>
        </g>
      ))}
    </svg>
  );
}