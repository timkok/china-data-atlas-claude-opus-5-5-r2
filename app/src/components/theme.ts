// One accent hue (ink blue) + a sequential ramp for magnitude. National series uses dark ink.
export const INK = "#1f2933";
export const ACCENT = "#1d5c8f";
export const MUTED = "#8a94a0";
export const GRID = "#e6e8eb";
export const SERIES = ["#1d5c8f", "#c2410c", "#15803d", "#7c3aed", "#b45309", "#0f766e", "#be185d", "#4d7c0f"];
export const SEQ = ["#e8f0f7", "#c6d9ea", "#9cbfdc", "#6ea2cb", "#336f9c", "#1d5c8f", "#123f66"];
export const axisCommon = {
  axisLine: { lineStyle: { color: GRID } }, axisTick: { show: false },
  axisLabel: { color: "#56606b", fontSize: 11 }, splitLine: { lineStyle: { color: GRID } },
};
export function seqColor(v: number, min: number, max: number) {
  if (max === min) return SEQ[3];
  const t = (v - min) / (max - min);
  return SEQ[Math.min(SEQ.length - 1, Math.floor(t * SEQ.length))];
}
