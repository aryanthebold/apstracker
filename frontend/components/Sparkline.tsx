'use client';

interface SparklineProps {
  data: { semester: number; sgpa: number | null }[];
  width?: number;
  height?: number;
}

export default function Sparkline({ data, width = 80, height = 30 }: SparklineProps) {
  // Filter out nulls and sort by semester
  const points = data
    .filter((d) => d.sgpa !== null && d.sgpa !== undefined)
    .sort((a, b) => a.semester - b.semester)
    .map((d) => d.sgpa as number);

  if (points.length < 2) {
    return (
      <span className="text-text-tertiary font-mono text-[10px]">—</span>
    );
  }

  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const range = maxVal - minVal || 0.1; // avoid division by zero

  // Map to SVG coordinate space
  const padding = 3;
  const svgPoints = points.map((val, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = padding + ((maxVal - val) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const trend = points[points.length - 1] - points[0];
  const color = trend > 0.05 ? '#22c55e' : trend < -0.05 ? '#ef4444' : '#6b7280';

  const tooltipText = data
    .filter((d) => d.sgpa !== null)
    .sort((a, b) => a.semester - b.semester)
    .map((d) => `Sem ${d.semester}: ${(d.sgpa as number).toFixed(2)}`)
    .join(' | ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <title>{tooltipText}</title>
      <polyline
        points={svgPoints.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      {svgPoints.length > 0 && (() => {
        const last = svgPoints[svgPoints.length - 1].split(',');
        return (
          <circle cx={last[0]} cy={last[1]} r="2" fill={color} />
        );
      })()}
    </svg>
  );
}
