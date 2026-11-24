import type { Metadata } from "next";
import ProvinceCompare from "@/components/ProvinceCompare";
export const metadata: Metadata = { title: "省份综合比较", description: "选择2—5个省份，按共同可比年份比较人口、经济、收入、城镇化、老龄化、教育与医疗资源。", alternates: { canonical: "/compare/" } };
export default function Compare() { return <div className="wrap pt-8"><h1 className="text-2xl font-bold">省份综合比较</h1><p className="text-sm text-[var(--muted)] mt-1 mb-4">默认：广东 vs 江苏 vs 浙江。链接可分享（地址栏保存所选省份）。</p><ProvinceCompare /></div>; }
