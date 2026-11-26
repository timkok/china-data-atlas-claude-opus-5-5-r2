import type { Metadata, Viewport } from "next";
import "./globals.css";
import Search from "@/components/Search";
import { SITE, SITE_URL } from "@/lib/data";

export const metadata: Metadata = {
  metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
  title: { default: "China Data Atlas | 中国数据地图 — 可追溯、可核验的中国省级统计数据", template: "%s | 中国数据地图 China Data Atlas" },
  description: "把国家统计局的分省统计数据变成可查询、可比较、可引用、可下载的数据产品：人口、经济、教育、医疗12项核心指标，31个省级行政区，2000—2025年。每个数字都可追溯到官方表格。",
  openGraph: { type: "website", siteName: "China Data Atlas | 中国数据地图", locale: "zh_CN" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-2 focus:bg-white">跳到正文</a>
        <header className="border-b border-[var(--line)] bg-white/95 backdrop-blur sticky top-0 z-30">
          <div className="wrap flex items-center gap-4 h-14">
            <a href="/" className="font-bold whitespace-nowrap" aria-label="中国数据地图 首页">中国数据地图 <span className="hidden sm:inline text-xs font-normal text-[var(--muted)]">China Data Atlas</span></a>
            <nav aria-label="主导航" className="hidden md:flex gap-4 text-sm">
              <a href="/indicators/">指标</a><a href="/provinces/">省份</a><a href="/compare/">比较</a><a href="/explorer/">数据浏览器</a><a href="/stories/">数据故事</a><a href="/ask/">查询</a><a href="/quality/">数据质量</a><a href="/methodology/">方法</a>
            </nav>
            <div className="ml-auto w-44 sm:w-64"><Search compact /></div>
          </div>
          <nav aria-label="移动端导航" className="md:hidden wrap flex gap-2 text-sm pb-1 overflow-x-auto [&>a]:px-2 [&>a]:py-2">
            <a href="/indicators/">指标</a><a href="/provinces/">省份</a><a href="/compare/">比较</a><a href="/explorer/">浏览器</a><a href="/stories/">故事</a><a href="/ask/">查询</a><a href="/quality/">质量</a>
          </nav>
        </header>
        <main id="main" className="flex-1">{children}</main>
        <footer className="border-t border-[var(--line)] mt-16 py-8 text-xs text-[var(--muted)] bg-white">
          <div className="wrap grid gap-2 md:grid-cols-2">
            <div>
              <p className="font-semibold text-[var(--ink)]">China Data Atlas | 中国数据地图</p>
              <p>数据来源：国家统计局“国家数据”数据库；独立核验：《中国统计年鉴2025》、2025年统计公报、第七次人口普查公报、省统计公报。Round 2：已审计并融合 8 个 Round 1 数据集。数据获取日期 {SITE.generated_at.slice(0, 10)}，方法版本 {SITE.methodology_version}。</p>
              <p>本站为独立的非官方研究项目，与国家统计局无隶属关系。统计覆盖范围为中国大陆31个省级行政区，未包括香港、澳门特别行政区和台湾省的数据；这是统计覆盖范围的说明，不涉及任何地理归属判断。</p>
            </div>
            <div className="md:text-right">
              <p><a className="underline" href="/methodology/">方法与引用</a> · <a className="underline" href="/downloads/observations.csv">完整数据 CSV</a> · <a className="underline" href="/about/">数据使用说明</a></p>
              <p>无广告、无第三方追踪。</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
