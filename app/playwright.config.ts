import { defineConfig, devices } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4321";
export default defineConfig({
  testDir: "../tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 2,
  reporter: [["list"], ["json", { outputFile: process.env.PW_JSON || "../reports/browser_test_report.json" }]],
  use: { baseURL: BASE, acceptDownloads: true, trace: "off", locale: "zh-CN" },
  webServer: process.env.BASE_URL ? undefined : { command: "python3 -m http.server 4321 --bind 127.0.0.1 --directory out", url: BASE, reuseExistingServer: true },
  projects: [
    { name: "desktop-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "tablet-768", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 }, hasTouch: true }, grep: /@layout/ },
    { name: "mobile-390", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } }, grep: /@layout|@mobile/ },
  ],
});
