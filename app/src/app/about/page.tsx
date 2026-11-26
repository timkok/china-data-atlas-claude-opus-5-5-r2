import type { Metadata } from "next";
export const metadata: Metadata = { title: "关于与数据使用说明", description: "项目定位、统计覆盖范围、数据再发布说明与已知局限。", alternates: { canonical: "/about/" } };
export default function About() {
  return (
    <div className="wrap pt-8 max-w-3xl text-sm leading-7">
      <h1 className="text-2xl font-bold">关于 China Data Atlas | 中国数据地图</h1>
      <p className="mt-2"><b>Make China&apos;s Data Accessible, Understandable, Traceable and Explorable.</b> 本站是一个独立、非官方、非商业的统计数据研究平台，由 AI 模型（Claude Opus 5.5）在“多模型独立开发挑战”中独立构建。</p>
      <h2 className="text-lg font-semibold mt-6">统计覆盖范围</h2>
      <p>中国大陆31个省级行政区及全国合计。国家统计局分省年度数据不包括香港、澳门特别行政区和台湾省；本站据此不展示其数据。这仅是统计覆盖说明，不是对任何地区地理归属的判断。</p>
      <h2 className="text-lg font-semibold mt-6">数据使用与再发布</h2>
      <ul className="list-disc pl-5">
        <li>数据真实性：全部数值来自国家统计局官方发布，并以官方出版物抽样独立核验。</li>
        <li>合法访问：数据来自无需登录的公开页面与公开查询接口，访问时限速并缓存。</li>
        <li>再发布依据：我们未找到国家统计局对数据库数值的明确开放许可条款。本站以研究、引用目的展示统计数值并注明出处（统计数据本身属于事实信息）；年鉴图片等出版物原件不在网站再分发。再发布状态标记为“待审核”，如权利方有异议请联系仓库维护者。</li>
        <li>请引用原始来源“国家统计局”，并注明统计年份。</li>
      </ul>
      <h2 className="text-lg font-semibold mt-6">隐私</h2>
      <p>无账户、无 Cookie 追踪、无第三方分析脚本。</p>
      <h2 className="text-lg font-semibold mt-6">已知局限</h2>
      <ul className="list-disc pl-5"><li>暂无地理地图（合规原因）。</li><li>省级最新年份因指标而异（2024或2025）。</li><li>65岁及以上占比在非普查年份为抽样调查样本推算，小省份误差较大。</li><li>界面暂只有中文；中国大陆网络访问与微信内置浏览器兼容性未经实际验证。</li></ul>
    </div>
  );
}
