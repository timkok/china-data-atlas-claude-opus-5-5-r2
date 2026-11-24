// Replaceable geographic-view interface. The site only ships the non-geographic MatrixAdapter.
// A geographic adapter (e.g. Tianditu WMTS base map + officially reviewed boundary data) may be plugged in ONLY after
// the conditions in research/MAP_COMPLIANCE_RESEARCH.md are met (licence key, 审图号 / review, mainland hosting rules).
export type MapDatum = { geo: string; value: number | null; label: string };
export type MapOptions = { year: number; unit: string; colorFor: (v: number | null) => string; onSelect?: (geo: string) => void };
export interface ProvinceMapAdapter {
  id: string;
  isGeographic: boolean;
  licenceConfirmed: boolean;
  reviewNumber: string | null; // 审图号 — must be displayed if geographic
}
export const MATRIX_ADAPTER: ProvinceMapAdapter = { id: "region-matrix", isGeographic: false, licenceConfirmed: true, reviewNumber: null };
// Intentionally disabled placeholder: do not enable without the documented approvals.
export const TIANDITU_ADAPTER_DISABLED: ProvinceMapAdapter = { id: "tianditu-wmts", isGeographic: true, licenceConfirmed: false, reviewNumber: null };
export const ACTIVE_ADAPTER = MATRIX_ADAPTER;
