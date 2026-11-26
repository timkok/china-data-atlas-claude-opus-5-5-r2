import { test, expect } from "@playwright/test";
import { obsValue, collectErrors, readCsv, SHOT } from "./helpers";

test("R21-1 indicator catalogue shows the new categories", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("/indicators/");
  for (const c of ["就业、工资与物价", "科技与数字", "社会保障与文化"]) await expect(page.getByText(c).first()).toBeVisible();
  await expect(page.getByText("每千人私人汽车拥有量").first()).toBeVisible();
  expect(errs).toEqual([]);
});

test("R21-2 growth-rate indicator shows negative values in the ranking", async ({ page }) => {
  await page.goto("/indicators/fai_growth/");
  const vals = await page.getByTestId("ranking-table").locator("td[data-value]").evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-value"))));
  expect(vals.length).toBe(31);
  expect(vals.some((v) => v < 0)).toBe(true);
  await page.screenshot({ path: SHOT("r21-fai-growth.png"), fullPage: false });
});

test("R21-3 derived indicator is labelled and documented", async ({ page }) => {
  await page.goto("/indicators/private_cars_per_1000/");
  await expect(page.locator("body")).toContainText("衍生");
  await expect(page.locator("body")).toContainText("私人汽车拥有量");
});

test("R21-4 explorer CSV for a USD trade indicator equals published data", async ({ page }) => {
  await page.goto("/explorer/?i=trade_total&g=440000,320000&from=2020&to=2024&c=line");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByTestId("x-csv").click()]);
  const rows = readCsv((await dl.path())!);
  expect(rows.length).toBe(10);
  for (const r of rows) expect(r.value).toBe(obsValue("trade_total", r.geo_code, +r.year));
});

test("R21-5 new data story renders computed facts @mobile", async ({ page }) => {
  await page.goto("/stories/wage-vs-housing-price/");
  await expect(page.locator("h1")).toContainText("平方米");
  await expect(page.locator("body")).toContainText("上海");
  await page.screenshot({ path: SHOT(`r21-story-wage-housing-${page.viewportSize()!.width}.png`), fullPage: false });
});
