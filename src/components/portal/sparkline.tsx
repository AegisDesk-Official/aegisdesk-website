import React from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
  className?: string;
}

/**
 * Compact SVG sparkline for headline tiles.
 * Shows trend with an emphasized final point dot.
 */
export function Sparkline({
  data,
  width = 96,
  height = 28,
  color = "var(--glow)",
  fillOpacity = 0.12,
  className = "",
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const paddingY = 4;
  const paddingX = 4;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  const points = data.map((val, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * usableWidth;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaD = `${pathD} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sparkGrad-${color.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path d={areaD} fill={`url(#sparkGrad-${color.replace(/[^a-zA-Z0-9]/g, "")})`} />

      {/* Main Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Emphasized Last Point */}
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r={2.5}
        fill="var(--paper)"
        stroke={color}
        strokeWidth={1.5}
      />
    </svg>
  );
}

interface ControlChartProps {
  data: { label: string; value: number }[];
  height?: number;
  className?: string;
  metricLabel?: string;
  unit?: string;
}

/**
 * Control-room chart with faint hairline grid, --text-dim baseline,
 * --glow current series, and the last point emphasized.
 */
export function ControlRoomChart({
  data,
  height = 180,
  className = "",
  metricLabel = "Daily Telemetry",
  unit = "",
}: ControlChartProps) {
  if (!data || data.length === 0) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min === 0 ? 1 : max - min;
  const paddingX = 40;
  const paddingY = 24;
  const width = 600; // SVG viewBox coordinate width
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  const points = data.map((d, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * usableWidth;
    const y = height - paddingY - ((d.value - min) / range) * usableHeight;
    return { x, y, label: d.label, value: d.value };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaD = `${pathD} L ${lastPoint.x} ${height - paddingY} L ${firstPoint.x} ${height - paddingY} Z`;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-dim)] mb-2 px-1">
        <span>{metricLabel}</span>
        <span className="tabular-nums text-[var(--glow)]">
          Latest: {lastPoint.value}
          {unit}
        </span>
      </div>

      <div className="w-full overflow-hidden rounded-[8px] bg-[var(--surface)] border border-[var(--line)] p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block"
          aria-hidden="true"
        >
          {/* Faint Horizontal Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = paddingY + pct * usableHeight;
            const gridVal = Math.round(max - pct * range);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="var(--line)"
                  strokeDasharray="2 4"
                  strokeWidth={1}
                />
                <text
                  x={paddingX - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fontFamily="monospace"
                  fill="var(--text-faint)"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Area gradient */}
          <defs>
            <linearGradient id="controlChartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--glow)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--glow)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#controlChartGrad)" />

          {/* Series line */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--glow)"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={idx === points.length - 1 ? 4 : 2}
              fill={idx === points.length - 1 ? "var(--paper)" : "var(--glow)"}
              stroke="var(--canvas)"
              strokeWidth={idx === points.length - 1 ? 1.5 : 1}
            />
          ))}

          {/* Bottom X-Axis Labels */}
          {points.map((pt, idx) => {
            if (idx % 2 !== 0 && idx !== points.length - 1) return null;
            return (
              <text
                key={idx}
                x={pt.x}
                y={height - 6}
                textAnchor="middle"
                fontSize="9"
                fontFamily="monospace"
                fill="var(--text-faint)"
              >
                {pt.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default Sparkline;
