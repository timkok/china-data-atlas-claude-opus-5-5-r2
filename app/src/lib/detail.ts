// Server/build-time only: per-indicator detail kept out of the client bundle (see export_site_data_r2.py).
import detail from "@/data/site-detail.json";
import { getIndicator, type IndicatorDetail, type IndicatorFull } from "./data";

const D = detail as unknown as Record<string, IndicatorDetail>;
export const getDetail = (id: string): IndicatorDetail => D[id];
export function getIndicatorFull(id: string): IndicatorFull | undefined {
  const i = getIndicator(id);
  return i && D[id] ? { ...i, ...D[id] } : undefined;
}
