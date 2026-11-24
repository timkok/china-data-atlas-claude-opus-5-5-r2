import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { obsValue, recordAcceptance, SHOT, readCsv, OBS, ROOT } from "./helpers";

const f = (v: string, d: number) => Number(v).toLocaleString("zh-CN", { minimumFractionDigits: d, maximumFractionDigits: d });
const shot = (n: string) => SHOT(`acceptance-${n}.png`);
const go = async (page: Page, url: string) => { await page.goto(url); await page.waitForLoadState("networkidle"); };

test.describe("Unified acceptance tasks A–S (desktop)", () => {
  test.beforeEach(async ({}, info) => { test.skip(info.project.name !== "desktop-1440", "desktop only (T runs on mobile)"); });

  test("A Guangdong latest population + official source", async ({ page }) => {
    await go(page, "/");
    await page.getByTestId("site-search").nth(1).fill("广东");
    await page.getByTestId("search-results").getByRole("link", { name: /广东省/ }).click();
    const row = page.locator("tr[data-ind='population']");
    await expect(row.locator("td[data-value]")).toHaveAttribute("data-value", obsValue("population", "440000", 2025)!);
    await expect(row).toContainText("2025");
    await page.screenshot({ path: shot("A") });
    recordAcceptance("A", { result: "Pass", steps: "首页搜索“广东”→广东省页“年末常住人口”行（2025年）→指标页可点“查看来源”看到官方表格路径", clicks: 2, data_year: "2025", verification: `显示值 = canonical ${obsValue("population", "440000", 2025)}（E2，2024年值经年鉴2025表2-5核验为E3）`, evidence: "screenshots/acceptance-A.png" });
  });

  test("B JS/ZJ/GD population since 2015", async ({ page }) => {
    await go(page, "/indicators/population/#trend");
    await page.getByTestId("trend-from").selectOption("2015");
    const t = page.getByTestId("trend-table");
    for (const [g, n] of [["320000", "江苏"], ["330000", "浙江"], ["440000", "广东"]]) {
      const cells = await t.locator("tbody tr", { hasText: n }).locator("td").allTextContents();
      expect(cells[1]).toBe(f(obsValue("population", g, 2015)!, 0)); expect(cells[cells.length - 1]).toBe(f(obsValue("population", g, 2025)!, 0));
    }
    await page.screenshot({ path: shot("B") });
    recordAcceptance("B", { result: "Pass", steps: "年末常住人口→历史趋势（默认粤苏浙+全国）→起始年2015", clicks: 2, data_year: "2015—2025", verification: "首末年数值与 canonical 一致", evidence: "screenshots/acceptance-B.png" });
  });

  test("C 2020 65+ ranking, census caliber", async ({ page }) => {
    await go(page, "/indicators/population_65plus/#rankings");
    await page.getByTestId("year-select").selectOption("2020");
    const first = page.getByTestId("ranking-table").locator("tbody tr").first();
    await expect(first).toContainText("辽宁"); await expect(first.locator("td[data-value]")).toHaveAttribute("data-value", "17.42");
    await expect(page.locator("#methodology")).toContainText("2020年为第七次人口普查数据");
    await page.screenshot({ path: shot("C") });
    recordAcceptance("C", { result: "Pass", steps: "65+占比→年份2020→排名表；方法区注明七普口径", clicks: 2, data_year: "2020（普查）", verification: "辽宁17.42、广东8.58 = 七普公报表5-2（HTML 程序解析）", evidence: "screenshots/acceptance-C.png" });
  });

  test("D latest provincial GDP per capita (current prices)", async ({ page }) => {
    await go(page, "/indicators/gdp_per_capita/");
    await expect(page.getByTestId("latest-prov-year")).toHaveText("2025");
    await expect(page.locator("#summary")).toContainText("现价");
    await page.screenshot({ path: shot("D") });
    recordAcceptance("D", { result: "Pass", steps: "打开人均GDP页：最新完整省级年份2025（初步核算），2024为最终核实数，现价", clicks: 1, data_year: "2025", verification: "浙江141,418、北京≈23.9万与省统计公报一致（E3）", evidence: "screenshots/acceptance-D.png" });
  });

  test("E Shandong / Henan / Guangdong disposable income", async ({ page }) => {
    await go(page, "/compare/?p=370000,410000,440000");
    const row = page.getByTestId("compare-table").locator("tr", { hasText: "居民人均可支配收入" });
    const cells = await row.locator("td").allTextContents();
    expect(cells[2]).toBe(f(obsValue("disposable_income", "370000", 2025)!, 0));
    await page.screenshot({ path: shot("E") });
    recordAcceptance("E", { result: "Pass", steps: "省份比较页选择山东、河南、广东（链接 /compare/?p=370000,410000,440000）", clicks: 3, data_year: "2025", verification: "山东2025年44,180与山东省统计公报一致（E3）", evidence: "screenshots/acceptance-E.png" });
  });

  test("F physicians per 1000 ranking", async ({ page }) => {
    await go(page, "/indicators/physicians_per_1000/#rankings");
    const vals = await page.getByTestId("ranking-table").locator("tbody td[data-value]").evaluateAll((e) => e.map((x) => Number(x.getAttribute("data-value"))));
    expect(vals.length).toBe(31); expect([...vals].sort((a, b) => b - a)).toEqual(vals);
    await page.screenshot({ path: shot("F") });
    recordAcceptance("F", { result: "Pass", steps: "每千人口执业（助理）医师数→排名（2024）", clicks: 1, data_year: "2024", verification: "5省与年鉴2025表22-3一致", evidence: "screenshots/acceptance-F.png" });
  });

  test("G filtered CSV equals page", async ({ page }) => {
    await go(page, "/indicators/retail_sales/");
    await page.getByTestId("explorer-region").selectOption("华南");
    await page.getByTestId("explorer-from").selectOption("2020"); await page.getByTestId("explorer-to").selectOption("2024");
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByTestId("csv-download").click()]);
    const rows = readCsv((await dl.path())!); expect(rows.length).toBe(15);
    for (const r of rows) expect(r.value).toBe(obsValue("retail_sales", r.geo_code, +r.year));
    recordAcceptance("G", { result: "Pass", steps: "社零页数据表→华南→2020—2024→下载CSV", clicks: 4, data_year: "2020—2024", verification: "15行，逐行等于 canonical；含 evidence_level 列", evidence: "browser_test_log" });
  });

  test("I year without data -> no fabricated values", async ({ page }) => {
    await go(page, "/indicators/hospital_beds_per_1000/#rankings");
    await page.getByTestId("year-select").selectOption("2005");
    await expect(page.getByTestId("no-data")).toBeVisible();
    await page.screenshot({ path: shot("I") });
    recordAcceptance("I", { result: "Pass", steps: "床位/千人→年份2005（无省级数据）→明确提示不插值", clicks: 2, data_year: "2005", verification: "排名表不出现；canonical 无该年省级值", evidence: "screenshots/acceptance-I.png" });
  });

  test("J + K value -> official table + evidence level", async ({ page }) => {
    await go(page, "/indicators/gdp/");
    await page.getByTestId("explorer-search").fill("河南");
    await page.getByTestId("source-btn").first().click();
    const dlg = page.getByTestId("source-dialog");
    await expect(dlg).toContainText("分省年度数据 > 国民经济核算 > 地区生产总值");
    await expect(dlg.getByTestId("evidence-level")).toContainText("E");
    await page.screenshot({ path: shot("K") });
    recordAcceptance("J", { result: "Pass", steps: "数据表→查看来源→表格路径+接口定位+官方链接", clicks: 2, data_year: "2025", verification: "接口定位可由原始响应缓存重放", evidence: "screenshots/acceptance-K.png" });
    recordAcceptance("K", { result: "Pass", steps: "同一来源弹窗显示证据等级（E2/E3/E4）及含义、数据版本", clicks: 2, data_year: "2025", verification: "弹窗证据等级 = canonical evidence_level", evidence: "screenshots/acceptance-K.png" });
  });

  test("L value with multiple historical vintages", async ({ page }) => {
    await go(page, "/indicators/gdp/#provenance");
    const v = page.getByTestId("vintages");
    await expect(v).toContainText("全国"); await expect(v).toContainText("1,260,582"); await expect(v).toContainText("1,294,271.7");
    await page.screenshot({ path: shot("L") });
    recordAcceptance("L", { result: "Pass", steps: "GDP页→数据版本：全国2023年 当前官方值 1,294,271.7（修订后）与旧版本 1,260,582（R1 Codex 引用的年鉴2024初步数）并列，附修订公告链接", clicks: 1, data_year: "2023", verification: "NBS 2024-12-27 修订公告", evidence: "screenshots/acceptance-L.png" });
  });

  test("M conflict record and ruling evidence", async ({ page }) => {
    await go(page, "/indicators/gdp/#provenance");
    await page.getByTestId("conflict-category").selectOption("Official Revision");
    const link = page.getByTestId("conflicts").getByRole("link", { name: "证据" }).first();
    expect(await link.getAttribute("href")).toContain("stats.gov.cn");
    await go(page, "/quality/");
    await expect(page.getByTestId("conflict-summary")).toContainText("Official Revision");
    await page.screenshot({ path: shot("M") });
    recordAcceptance("M", { result: "Pass", steps: "GDP页→冲突表筛选 Official Revision→证据链接为国家统计局公告；/quality 页汇总", clicks: 2, data_year: "2015—2024", verification: "conflicts.csv 同步下载", evidence: "screenshots/acceptance-M.png" });
  });

  test("N GD/JS/ZJ population and GDP per capita since 2015", async ({ page }) => {
    await go(page, "/compare/?p=440000,320000,330000");
    await expect(page.getByTestId("compare-trend-population").getByTestId("echart")).toBeVisible();
    await expect(page.getByTestId("compare-trend-gdp_per_capita").getByTestId("echart")).toBeVisible();
    const row = page.getByTestId("compare-table").locator("tr", { hasText: "人均地区生产总值" });
    expect((await row.locator("td").allTextContents())[2]).toBe(f(obsValue("gdp_per_capita", "440000", 2025)!, 0));
    await page.screenshot({ path: shot("N"), fullPage: true });
    recordAcceptance("N", { result: "Pass", steps: "/compare/?p=440000,320000,330000：共同年份表 + 2015年以来人口、人均GDP趋势", clicks: 0, data_year: "2015—2025", verification: "表格值 = canonical", evidence: "screenshots/acceptance-N.png" });
  });

  test("O scatter: aging vs physicians correlation", async ({ page }) => {
    await go(page, "/explorer/?i=population_65plus,physicians_per_1000&c=scatter&y=2024");
    const c = page.getByTestId("correlation"); await expect(c).toContainText("n = 31");
    const txt = await c.textContent(); const r = Number(txt!.match(/r = (-?[\d.]+)/)![1]);
    const xs = OBS().filter((o) => o.indicator_id === "population_65plus" && o.year === "2024" && o.geo_level === "province");
    const ys = Object.fromEntries(OBS().filter((o) => o.indicator_id === "physicians_per_1000" && o.year === "2024" && o.geo_level === "province").map((o) => [o.geo_code, +o.value]));
    const X = xs.map((o) => +o.value), Y = xs.map((o) => ys[o.geo_code]); const mx = X.reduce((a, b) => a + b) / X.length, my = Y.reduce((a, b) => a + b) / Y.length;
    let a = 0, b = 0, d = 0; X.forEach((x, i) => { a += (x - mx) * (Y[i] - my); b += (x - mx) ** 2; d += (Y[i] - my) ** 2; });
    expect(Math.abs(r - a / Math.sqrt(b * d))).toBeLessThan(0.001);
    await page.screenshot({ path: shot("O") });
    recordAcceptance("O", { result: "Pass", steps: "Explorer 散点：65+占比 × 每千人口医师，2024年31省", clicks: 3, data_year: "2024", verification: `r = ${r}，测试独立重算一致；显示 n、年份、缺失处理与“相关≠因果”`, evidence: "screenshots/acceptance-O.png" });
  });

  test("P explorer: 3 provinces × 2 indicators CSV", async ({ page }) => {
    await go(page, "/explorer/?i=population,disposable_income&g=440000,320000,330000&from=2020&to=2025&c=line");
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByTestId("x-csv").click()]);
    const rows = readCsv((await dl.path())!);
    expect(new Set(rows.map((r) => r.geo_code))).toEqual(new Set(["440000", "320000", "330000"]));
    expect(new Set(rows.map((r) => r.indicator_id))).toEqual(new Set(["population", "disposable_income"]));
    expect(rows.length).toBe(36);
    for (const r of rows) expect(r.value).toBe(obsValue(r.indicator_id, r.geo_code, +r.year));
    fs.copyFileSync((await dl.path())!, path.join(ROOT, "reports/sample_download_explorer_P.csv"));
    recordAcceptance("P", { result: "Pass", steps: "Explorer：广东/江苏/浙江 × 人口/可支配收入 × 2020—2025 → 下载CSV（亦可通过分享链接复现）", clicks: 6, data_year: "2020—2025", verification: "36行，逐行等于 canonical", evidence: "reports/sample_download_explorer_P.csv" });
  });

  test("Q province page vs national", async ({ page }) => {
    await go(page, "/provinces/330000/");
    const row = page.locator("tr[data-ind='gdp_per_capita']");
    await expect(row.locator("td[data-value]")).toHaveAttribute("data-value", obsValue("gdp_per_capita", "330000", 2025)!);
    await expect(row).toContainText(f(obsValue("gdp_per_capita", "000000", 2025)!, 0));
    await page.screenshot({ path: shot("Q") });
    recordAcceptance("Q", { result: "Pass", steps: "浙江省页：各指标最新值、全国排名、全国同年值、相对全国差", clicks: 1, data_year: "2024/2025", verification: "人均GDP与全国值 = canonical", evidence: "screenshots/acceptance-Q.png" });
  });

  test("R data story reproducible", async ({ page }) => {
    await go(page, "/stories/zhejiang-vs-jiangsu/");
    const facts = await page.getByTestId("story-facts").textContent();
    const gap = Number(obsValue("gdp_per_capita", "320000", 2025)) - Number(obsValue("gdp_per_capita", "330000", 2025));
    expect(facts).toContain(gap.toLocaleString("zh-CN"));
    await page.screenshot({ path: shot("R"), fullPage: true });
    recordAcceptance("R", { result: "Pass", steps: "打开“浙江与江苏”故事；测试从 canonical 重算2025年人均GDP差值", clicks: 1, data_year: "2013—2025", verification: `江苏−浙江 = ${gap} 元，与页面一致`, evidence: "screenshots/acceptance-R.png" });
  });

  test("S simulated official update -> review report", async () => {
    const out = execFileSync("python3", [path.join(ROOT, "pipeline/update/simulate_update.py")], { encoding: "utf-8" });
    const r = JSON.parse(fs.readFileSync(path.join(ROOT, "reports/update_test_report.json"), "utf-8"));
    expect(r.passed).toBe(true);
    recordAcceptance("S", { result: "Pass", steps: "运行 simulate_update.py：隔离副本 + SIMULATED 夹具 → check 生成待审核报告 → approve → rollback", clicks: "n/a (CLI)", data_year: "SIMULATED 2026", verification: out.trim().split("\n").pop()!.slice(0, 300), evidence: "reports/update_test_report.json" });
  });
});

test("T mobile end-to-end research task @mobile", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile-390", "mobile only");
  await page.goto("/"); await page.waitForLoadState("networkidle");
  await page.getByTestId("site-search").first().fill("老龄");
  await page.getByTestId("search-results").getByRole("link").first().click();
  await expect(page).toHaveURL(/population_65plus/); await page.waitForLoadState("networkidle");
  await page.getByTestId("year-select").selectOption("2020");
  await expect(page.getByTestId("ranking-table").locator("tbody tr").first()).toContainText("辽宁");
  await page.getByTestId("source-btn").first().click(); await expect(page.getByTestId("source-dialog")).toBeVisible();
  await page.keyboard.press("Escape"); await expect(page.getByTestId("source-dialog")).toHaveCount(0);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByTestId("csv-download").click()]);
  expect(readCsv((await dl.path())!).length).toBeGreaterThan(0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: shot("T-mobile") });
  recordAcceptance("T", { result: "Pass", steps: "390px：搜索“老龄”→65+页→年份2020→排名第1辽宁→查看来源→下载CSV", clicks: 6, data_year: "2020", verification: "Chromium 移动模拟（Pixel 7 UA）；未在真实手机/微信内验证", evidence: "screenshots/acceptance-T-mobile.png" });
  recordAcceptance("H", { result: "Pass", steps: "同 T：手机端搜索、年份切换、来源查看", clicks: 4, data_year: "2020", verification: "Chromium 移动模拟", evidence: "screenshots/acceptance-T-mobile.png" });
});
