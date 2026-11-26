export default function Sparkline({ series }: { series: Record<string, number> }) {
  const ys = Object.keys(series).map(Number).sort(); if (ys.length < 2) return null;
  const vs = ys.map((y) => series[String(y)]); const min = Math.min(...vs), max = Math.max(...vs); const w = 160, h = 32;
  const pts = ys.map((y, i) => `${(i / (ys.length - 1)) * w},${h - ((vs[i] - min) / (max - min || 1)) * (h - 4) - 2}`).join(" ");
  return <svg width={w} height={h} className="mt-2" aria-label={`${ys[0]}—${ys[ys.length - 1]} 趋势`} role="img"><polyline points={pts} fill="none" stroke="#1d5c8f" strokeWidth="1.5" /><text x="0" y={h} fontSize="8" fill="#5f6b77">{ys[0]}</text><text x={w - 18} y={h} fontSize="8" fill="#5f6b77">{ys[ys.length - 1]}</text></svg>;
}
