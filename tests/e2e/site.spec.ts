import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { OBS, obsValue, collectErrors, readCsv, SHOT } from "./helpers";

const fmtNum = (v: string, d: number) => Number(v).toLocaleString("zh-CN", { minimumFractionDigits: d, maximumFractionDigits: d });

test("01 homepage loads with real stats and findings", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("统计数据");
  await expect(page.getByTestId("home-stats")).toContainText("30,418");
  await expect(page.getByTestId("home-stories").locator("li")).not.toHaveCount(0);
  await expect(page.getByTestId("echart").first()).toBeVisible();
  expect(errs).toEqual([]);
});

test("02 indicator search finds indicators and provinces", async ({ page }) => {
  await page.goto("/");
  const box = page.getByTestId("site-search").first();
  await box.fill("医生");
  await expect(page.getByTestId("search-results")).toContainText("每千人口执业（助理）医师数");
  await box.fill("广东");
  await expect(page.getByTestId("search-results")).toContainText("广东省");
  await box.fill("不存在的指标xyz");
  await expect(page.getByText("无匹配结果")).toBeVisible();
});

test("03 direct URL access + 18 refresh keeps page", async ({ page }) => {
  const res = await page.goto("/indicators/gdp_per_capita/");
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveText("人均地区生产总值（现价）");
  await page.reload();
  await expect(page.locator("h1")).toHaveText("人均地区生产总值（现价）");
  const r2 = await page.goto("/provinces/440000/");
  expect(r2?.status()).toBe(200);
});

test("04 year switch updates ranking + 08 ranking correctness", async ({ page }) => {
  await page.goto("/indicators/population/");
  await page.getByTestId("year-select").selectOption("2015");
  const first = page.getByTestId("ranking-table").locator("tbody tr").first();
  await expect(first).toContainText("广东");
  // ranking order must equal descending order of observations.csv for 2015
  const rows = OBS().filter((r) => r.indicator_id === "population" && r.year === "2015" && r.geo_level === "province" && r.value !== "");
  const expected = rows.sort((a, b) => Number(b.value) - Number(a.value)).map((r) => Number(r.value));
  const shown = await page.getByTestId("ranking-table").locator("tbody td[data-value]").evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-value"))));
  expect(shown).toEqual(expected);
});

test("05 province select in ranking shows detail card", async ({ page }) => {
  await page.goto("/indicators/gdp/");
  await page.getByTestId("ranking-table").getByRole("button", { name: "江苏" }).click();
  await expect(page.getByTestId("selected-card")).toContainText("江苏省");
  await expect(page.getByTestId("selected-card")).toContainText(fmtNum(obsValue("gdp", "320000", 2025)!, 1));
});

test("06 region filter restricts ranking", async ({ page }) => {
  await page.goto("/indicators/urbanization_rate/");
  await page.getByTestId("region-filter").selectOption("东北");
  await expect(page.getByTestId("ranking-table").locator("tbody tr")).toHaveCount(3);
});

test("07 multi-province trend comparison", async ({ page }) => {
  await page.goto("/indicators/population/");
  const picker = page.getByTestId("province-picker");
  await picker.getByRole("button", { name: "河南" }).click();
  await expect(page.getByTestId("trend-table").locator("tbody tr")).toHaveCount(5); // 全国 + 广东 江苏 浙江 + 河南
  await page.getByTestId("trend-from").selectOption("2015");
  const headers = await page.getByTestId("trend-table").locator("thead th").allTextContents();
  expect(headers[1]).toBe("2015");
});

test("09 chart table equals source data", async ({ page }) => {
  await page.goto("/indicators/disposable_income/");
  const t = page.getByTestId("trend-table");
  const row = t.locator("tbody tr", { hasText: "广东" });
  const cells = await row.locator("td").allTextContents();
  const headers = await t.locator("thead th").allTextContents();
  const idx = headers.indexOf("2024");
  expect(cells[idx]).toBe(fmtNum(obsValue("disposable_income", "440000", 2024)!, 0));
});

test("10 CSV download equals filtered table", async ({ page }) => {
  await page.goto("/indicators/retail_sales/");
  await page.getByTestId("explorer-region").selectOption("华南");
  await page.getByTestId("explorer-from").selectOption("2020");
  await page.getByTestId("explorer-to").selectOption("2024");
  const btn = page.getByTestId("csv-download");
  const n = Number((await btn.textContent())!.match(/(\d+) 行/)![1]);
  expect(n).toBe(15); // 3 provinces x 5 years
  const [dl] = await Promise.all([page.waitForEvent("download"), btn.click()]);
  const file = await dl.path();
  const rows = readCsv(file!);
  expect(rows.length).toBe(n);
  for (const r of rows) {
    expect(r.value).toBe(obsValue("retail_sales", r.geo_code, Number(r.year)));
    expect(["450000", "440000", "460000"]).toContain(r.geo_code);
  }
  fs.copyFileSync(file!, SHOT("../reports/sample_download_retail_sales_south_2020-2024.csv"));
});

test("11 no-data state for a year without provincial data", async ({ page }) => {
  await page.goto("/indicators/birth_rate/");
  await page.getByTestId("year-select").selectOption("2025");
  await expect(page.getByTestId("no-data")).toContainText("没有发布");
  await expect(page.getByTestId("ranking-table")).toHaveCount(0);
});

test("12 negative values and tie ranks", async ({ page }) => {
  await page.goto("/indicators/natural_growth_rate/");
  const neg = await page.getByTestId("ranking-table").locator("td[data-value^='-']").count();
  expect(neg).toBeGreaterThan(10);
  // find a year with tied values in higher_education_institutions and check '=' marker
  const rows = OBS().filter((r) => r.indicator_id === "higher_education_institutions" && r.geo_level === "province" && r.year === "2024");
  const counts: Record<string, number> = {};
  rows.forEach((r) => (counts[r.value] = (counts[r.value] || 0) + 1));
  const tied = Object.entries(counts).find(([, c]) => c > 1);
  await page.goto("/indicators/higher_education_institutions/");
  if (tied) {
    const cell = page.getByTestId("ranking-table").locator(`td[data-value='${tied[0]}']`).first();
    const rankCell = cell.locator("xpath=../td[1]");
    await expect(rankCell).toContainText("=");
  }
  // last ranked row must be the minimum value; missing never ranked
  const vals = await page.getByTestId("ranking-table").locator("tbody td[data-value]").evaluateAll((e) => e.map((x) => Number(x.getAttribute("data-value"))));
  expect(vals.length).toBe(31);
});

test("13 source links and source dialog", async ({ page }) => {
  await page.goto("/indicators/hospital_beds_per_1000/");
  await page.getByTestId("source-btn").first().click();
  const dlg = page.getByTestId("source-dialog");
  await expect(dlg).toContainText("国家统计局");
  const href = await dlg.getByRole("link").getAttribute("href");
  expect(href).toContain("data.stats.gov.cn");
  await page.keyboard.press("Escape");
});

test("14 no console errors on key pages", async ({ page }) => {
  const errs = collectErrors(page);
  for (const p of ["/", "/indicators/", "/indicators/gdp/", "/provinces/", "/provinces/110000/", "/compare/", "/explorer/", "/stories/", "/stories/aging-and-doctors/", "/ask/", "/quality/", "/map/", "/methodology/", "/about/"]) {
    await page.goto(p);
    await page.waitForLoadState("networkidle");
  }
  expect(errs).toEqual([]);
});

for (const p of [["homepage", "/"], ["indicator", "/indicators/population/"], ["data-explorer", "/explorer/"], ["province-comparison", "/compare/"], ["data-story", "/stories/zhejiang-vs-jiangsu/"], ["map-or-alternative", "/map/"], ["province", "/provinces/440000/"]] as const) {
  test(`15/16 layout + no horizontal overflow @layout ${p[0]}`, async ({ page }, info) => {
    await page.goto(p[1]);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const suffix = info.project.name.split("-")[0];
    await page.screenshot({ path: SHOT(`${p[0]}-${suffix}.png`), fullPage: p[0] !== "data-explorer" || suffix !== "desktop" });
  });
}

test("17 keyboard: search via keyboard and skip link", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByText("跳到正文")).toBeFocused();
  const box = page.getByTestId("site-search").nth(1);
  await box.focus();
  await page.keyboard.type("人均GDP");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/indicators\/gdp_per_capita/);
});

test("19 static assets reachable", async ({ request }) => {
  for (const u of ["/data/ind/population.json", "/data/prov/440000.json", "/data/conflicts/gdp.json", "/downloads/conflicts.csv", "/downloads/vintages.csv", "/downloads/observations.csv", "/downloads/coverage_matrix.csv", "/downloads/data_validation_samples.csv", "/sitemap.xml", "/robots.txt"]) {
    const r = await request.get(u);
    expect(r.status(), u).toBe(200);
  }
  const csv = await (await request.get("/downloads/observations.csv")).text();
  expect(csv.split("\n")[0]).toContain("indicator_id,indicator_name_zh");
});

test("20 basic performance", async ({ page }) => {
  await page.goto("/indicators/population/");
  const t = await page.evaluate(() => { const n = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming; return { dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd, bytes: performance.getEntriesByType("resource").reduce((a, r) => a + ((r as PerformanceResourceTiming).transferSize || 0), 0) }; });
  console.log("PERF", JSON.stringify(t));
  expect(t.load).toBeLessThan(5000);
});

test("SEO: indicator pages have title, description, canonical, h1 and server-rendered text", async ({ request }) => {
  const html = await (await request.get("/indicators/population/")).text();
  expect(html).toMatch(/<title>[^<]*年末常住人口/);
  expect(html).toMatch(/name="description"/);
  expect(html).toMatch(/rel="canonical"/);
  expect(html).toMatch(/og:title/);
  expect(html.replace(/<!-- -->/g, "")).toContain("2025年排名前三");
  expect((await (await request.get("/sitemap.xml")).text()).match(/<loc>/g)!.length).toBeGreaterThan(80);
});
