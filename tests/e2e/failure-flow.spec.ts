import { expect, test } from "@playwright/test";

test("holding into a wall eventually ends the run", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Play as guest" }).click();
  await page.getByRole("button", { name: "Select level 1" }).click();
  await expect(page.getByText("Get ready")).toBeVisible();

  await page.waitForTimeout(3500);
  await page.keyboard.down("ArrowUp");
  await expect(page.getByText("Vehicle damaged")).toBeVisible({ timeout: 10000 });
  await page.keyboard.up("ArrowUp");

  await expect(page.getByRole("button", { name: "Retry level" })).toBeVisible();
});
