"use client";
import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart, LineChart, ScatterChart, BoxplotChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, DataZoomComponent, TitleComponent, GraphicComponent } from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import type { EChartsCoreOption } from "echarts/core";

echarts.use([BarChart, LineChart, ScatterChart, BoxplotChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, DataZoomComponent, TitleComponent, GraphicComponent, SVGRenderer]);

function download(href: string, name: string) {
  const a = document.createElement("a"); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove();
}

export default function EChart({ option, height = 360, label, onClickName, exportName, caption }: { option: EChartsCoreOption | object; height?: number; label: string; onClickName?: (name: string) => void; exportName?: string; caption?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    chart.current = echarts.init(ref.current, undefined, { renderer: "svg" });
    const ro = new ResizeObserver(() => chart.current?.resize());
    ro.observe(ref.current);
    return () => { ro.disconnect(); chart.current?.dispose(); };
  }, []);
  useEffect(() => {
    chart.current?.setOption(option as EChartsCoreOption, true);
    chart.current?.off("click");
    if (onClickName) chart.current?.on("click", (p: { name?: string }) => { if (p.name) onClickName(p.name); });
  }, [option, onClickName]);
  const svg = () => {
    const url = chart.current?.getDataURL({ type: "svg" });
    if (url) download(url, `${exportName || "chart"}.svg`);
  };
  const png = () => {
    const url = chart.current?.getDataURL({ type: "svg" });
    if (!url || !ref.current) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); const s = 2;
      c.width = ref.current!.clientWidth * s; c.height = ref.current!.clientHeight * s + (caption ? 40 : 0);
      const ctx = c.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, ref.current!.clientHeight * s);
      if (caption) { ctx.fillStyle = "#5f6b77"; ctx.font = `${11 * s}px sans-serif`; ctx.fillText(caption, 8 * s, c.height - 14 * s); }
      download(c.toDataURL("image/png"), `${exportName || "chart"}.png`);
    };
    img.src = url;
  };
  return (
    <figure className="m-0">
      <div ref={ref} role="img" aria-label={label} style={{ width: "100%", height }} data-testid="echart" />
      {exportName && (
        <div className="flex gap-2 justify-end text-xs mt-1" aria-label="导出图表">
          <button className="underline" onClick={png} data-testid="export-png">PNG</button>
          <button className="underline" onClick={svg} data-testid="export-svg">SVG</button>
        </div>
      )}
      {caption && <figcaption className="text-[11px] text-[var(--muted)]">{caption}</figcaption>}
    </figure>
  );
}
