/* Lightweight chart components — no external deps, pure SVG/CSS */

export function BarChart({ data, color = 'primary', height = 160 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bar-chart" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="bar-chart__bar-wrap">
          <div
            className={`bar-chart__bar ${color === 'accent' ? 'bar-chart__bar--accent' : ''}`}
            style={{ height: `${(d.value / max) * 100}%` }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="bar-chart__label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ data, size = 140, thickness = 24 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut-chart">
      <svg className="donut-chart__svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-neutral-100)"
          strokeWidth={thickness}
        />
        {data.map((d, i) => {
          const len = (d.value / total) * circumference;
          const seg = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${circumference - len}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: 'stroke-dasharray var(--transition-slow)' }}
            />
          );
          offset += len;
          return seg;
        })}
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--color-text)"
          fontSize="20"
          fontWeight="700"
          fontFamily="var(--font-display)"
        >
          {total}
        </text>
        <text
          x="50%"
          y="62%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--color-text-tertiary)"
          fontSize="10"
          fontWeight="500"
        >
          Total
        </text>
      </svg>
      <div className="donut-chart__legend">
        {data.map((d, i) => (
          <div key={i} className="donut-chart__legend-item">
            <span className="donut-chart__legend-dot" style={{ background: d.color }} />
            <span>{d.label}</span>
            <span className="donut-chart__legend-value">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="hbar-chart">
      {data.map((d, i) => (
        <div key={i} className="hbar-chart__item">
          <span className="hbar-chart__label">{d.label}</span>
          <div className="hbar-chart__track">
            <div
              className="hbar-chart__fill"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color }}
            />
          </div>
          <span className="hbar-chart__value">{d.value}</span>
        </div>
      ))}
    </div>
  );
}
