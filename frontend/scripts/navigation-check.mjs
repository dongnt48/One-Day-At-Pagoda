import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage({ ignoreHTTPSErrors: true });
  await page.goto(process.env.BASE_URL || "https://localhost:18447");
  await page.getByRole("button", { name: "Vào chùa", exact: true }).click();
  await page.getByLabel("Tên của bạn").fill("Khách Quay Lại");
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  let routed;
  const started = new Promise((resolve) => (routed = resolve));
  await page.route("**/matchmake/joinOrCreate/**", async (route) => {
    routed();
    await gate;
    await route.continue();
  });
  await page.getByRole("button", { name: "Bắt đầu", exact: true }).click();
  await started;
  await page.getByRole("button", { name: "Trở lại", exact: true }).click();
  release();
  await page.waitForTimeout(2500);
  await expect(
    page.getByRole("button", { name: "Vào chùa", exact: true }),
  ).toBeVisible();
  console.log("Pending join is cancelled when navigating home.");
} finally {
  await browser.close();
}
