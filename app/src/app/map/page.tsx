import type { Metadata } from "next";
import MatrixMap from "@/components/MatrixMap";
export const metadata: Metadata = { title: "地图合规研究与地区矩阵", description: "交互式省级专题地图的合规条件研究，以及当前采用的非地理地区矩阵。", alternates: { canonical: "/map/" } };
export default function MapPage() {
  return (<div className="wrap pt-8 max-w-5xl">
    <h1 className="text-2xl font-bold">地图：合规研究与地区矩阵</h1>
    <p className="text-sm mt-2">本平台<b>尚未实现地理地图</b>。经研究（见 research/MAP_COMPLIANCE_RESEARCH.md），公开发布带行政边界的中国专题地图需使用经审核的标准地图或取得审图号；对标准地图着色、编辑后公开使用需送审。天地图服务需申请开发者密钥（需账号授权），且本次执行环境无法访问天地图与标准地图服务站点，无法核实条款原文。因此继续采用下面的<b>非地理地区矩阵</b>，并提供可替换的地图组件接口（<code>components/mapAdapter.ts</code>），在满足条件后接入。</p>
    <ul className="text-sm list-disc pl-5 mt-2"><li>支持：专题着色（分位数7级）、年份切换、悬停、点击联动、图例、缺失值斜纹标识、移动端点按。</li><li>不表示任何地理边界；香港、澳门、台湾不在国家统计局分省数据库统计范围内（统计覆盖说明，非地理归属判断）。</li></ul>
    <div className="mt-6"><MatrixMap /></div>
  </div>);
}
