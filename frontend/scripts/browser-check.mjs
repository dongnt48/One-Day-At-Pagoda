import { chromium, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
mkdirSync("test-results", { recursive: true });
const browser = await chromium.launch({
  headless: true,
  channel: "chromium",
  args: [
    ...(process.env.SOFTWARE_GL === "1" ? ["--use-angle=swiftshader"] : []),
    "--enable-webgl",
    "--enable-unsafe-swiftshader",
  ],
});
const errors = [];
const watchdog = setTimeout(() => { console.error("Browser smoke exceeded 180 seconds"); browser.close().finally(() => process.exit(1)); }, 180000);
try {
const context = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.stack || e.message));
context.on("response", (response) => {
  if (/\/(models|textures)\//.test(response.url()) && !response.ok()) {
    errors.push(`Asset ${response.status()}: ${response.url()}`);
  }
});
const base = process.env.BASE_URL || "http://localhost:5173";
await page.goto(base);
await page.getByRole("button", { name: "Vào chùa", exact: true }).waitFor();
await page.waitForTimeout(2200);
await page.screenshot({ path: "test-results/home.png" });
await page.getByRole("button", { name: "Vào chùa", exact: true }).click();
await page.getByLabel("Tên của bạn").fill("Khách Thử");
await page.screenshot({ path: "test-results/entry.png" });
await page.getByRole("button", { name: "Bắt đầu", exact: true }).click();
await page
  .getByRole("navigation", { name: "Tương tác" })
  .waitFor({ timeout: 15000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: "test-results/game.png" });
await page.getByRole("button", { name: /Quỳ xuống/ }).click();
await page.getByRole("button", { name: /Đứng lên/ }).waitFor();
await page.waitForTimeout(500);
await page.screenshot({ path: "test-results/sitting.png" });
await page.getByRole("button", { name: /Đứng lên/ }).click();
await page.getByRole("button", { name: /Quỳ xuống/ }).waitFor();
await page.getByLabel("Tin nhắn", { exact: true }).fill("Chào buổi sáng");
await page.getByRole("button", { name: "Gửi tin nhắn", exact: true }).click();
await page.getByRole("log").getByText("Chào buổi sáng").waitFor();
const secondContext = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  ignoreHTTPSErrors: true,
});
const second = await secondContext.newPage();
second.on("pageerror", (e) => errors.push(e.stack || e.message));
await second.goto(base);
await second.getByRole("button", { name: "Vào chùa", exact: true }).click();
await second.getByLabel("Tên của bạn").fill("Bạn Hiền");
await second.getByRole("button", { name: "Nữ", exact: true }).click();
await second.getByRole("button", { name: "Bắt đầu", exact: true }).click();
await second.getByRole("navigation", { name: "Tương tác" }).waitFor();
// A developer may be playing in this same local room during the smoke test.
await expect.poll(async () => {
  const badge = await page.locator(".room-badge").innerText();
  return Number(badge.match(/(\d+)\/\d+/)?.[1] || 0);
}).toBeGreaterThanOrEqual(2);
await second
  .getByLabel("Tin nhắn", { exact: true })
  .fill("Chào bạn từ trình duyệt khác");
await second.getByRole("button", { name: "Gửi tin nhắn", exact: true }).click();
await page.getByRole("log").getByText("Chào bạn từ trình duyệt khác").waitFor();
await page.getByRole("button", { name: "Bạn bè", exact: true }).click();
await page
  .getByRole("button", { name: "Kết bạn với Bạn Hiền", exact: true })
  .click();
await page.getByRole("button", { name: "Đóng", exact: true }).click();
await second.getByRole("button", { name: /^Bạn bè/ }).click();
await second
  .getByRole("button", { name: "Chấp nhận", exact: true })
  .waitFor({ timeout: 10000 });
await second.getByRole("button", { name: "Chấp nhận", exact: true }).click();
await second.getByRole("button", { name: "Đóng", exact: true }).click();
await page.getByRole("button", { name: "Bạn bè", exact: true }).click();
await page
  .getByRole("dialog")
  .getByRole("button", { name: /^Bạn bè/ })
  .click();
await expect(
  page
    .getByRole("dialog")
    .locator(".person-row")
    .filter({ hasText: "Bạn Hiền" }),
).toContainText("Tham gia cùng", { timeout: 10000 });
await page.getByRole("button", { name: "Đóng", exact: true }).click();
await second.getByRole("button", { name: "Cài đặt", exact: true }).click();
await second.getByRole("button", { name: "Rời chùa", exact: true }).click();
await secondContext.close();
await page.keyboard.press("Tab");
await page.getByRole("dialog").waitFor();
await page.screenshot({ path: "test-results/social.png" });
await page.getByRole("button", { name: "Đóng", exact: true }).click();
await page.getByRole("button", { name: "Cài đặt", exact: true }).click();
await page.getByRole("button", { name: "Rời chùa", exact: true }).click();
await page.getByRole("button", { name: "Vào chùa", exact: true }).waitFor();
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "test-results/mobile.png" });
// A delayed join must not bring the player back after they chose to go home.
let releaseJoin;
const joinGate = new Promise((resolve) => {
  releaseJoin = resolve;
});
await page.route("**/matchmake/joinOrCreate/**", async (route) => {
  await joinGate;
  await route.continue();
});
await page.getByRole("button", { name: "Vào chùa", exact: true }).click();
await page.getByRole("button", { name: "Bắt đầu", exact: true }).click();
await page.getByRole("button", { name: "Trở lại", exact: true }).click();
releaseJoin();
await page.waitForTimeout(2000);
await expect(
  page.getByRole("button", { name: "Vào chùa", exact: true }),
).toBeVisible();
await page.unroute("**/matchmake/joinOrCreate/**");
if (process.env.TEST_RESTART === "1") {
  const before = await page.evaluate(async () =>
    (await (await fetch("/api/social")).json()).friends.map((f) => f.id),
  );
  execFileSync("docker", ["compose", "restart", "backend"], {
    cwd: "..",
    stdio: "pipe",
  });
  await expect
    .poll(
      async () =>
        page.evaluate(async () => {
          try {
            return (await fetch("/api/health")).status;
          } catch {
            return 0;
          }
        }),
      { timeout: 20000 },
    )
    .toBe(200);
  const after = await page.evaluate(async () =>
    (await (await fetch("/api/social")).json()).friends.map((f) => f.id),
  );
  expect(after).toEqual(before);
  expect(after.length).toBeGreaterThan(0);
  console.log("SQLite friendship and guest cookie survive a backend restart.");
}
if (errors.length) throw Error(errors.join("\n"));
console.log(
  "Browser smoke passed: two independent guests, realtime presence/chat, friendship, 3D gameplay, leave, mobile.",
);
} finally { clearTimeout(watchdog); await browser.close(); }
