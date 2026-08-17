import { expect, test } from "@playwright/test";

test.describe("level selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
  });

  test("shows the first level as available and later levels as locked", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Choose your maze." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Select level 1" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Level 2 locked" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Level 3 locked" })).toBeDisabled();
  });

  test("starts a selected level and exposes pause controls", async ({ page }) => {
    await page.getByRole("button", { name: "Select level 1" }).click();

    await expect(page.getByText("Get ready")).toBeVisible();
    await expect(page.getByLabel("Game information")).toBeVisible();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();

    await page.getByRole("button", { name: "Pause" }).click();
    await expect(page.getByRole("dialog", { name: "Game paused" })).toBeVisible();
    await page.getByRole("button", { name: "Resume game" }).click();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  });
});
