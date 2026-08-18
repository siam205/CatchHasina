import { expect, test } from "@playwright/test";

test.describe("level selection", () => {
  test("shows the Catch Hasina authentication copy", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Catch Hasina" })).toBeVisible();
    await expect(page.getByText("Can You Catch Her?")).toBeVisible();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page.getByRole("button", { name: "Play as guest" }).click();
  });

  test("shows the first level as available and later levels as locked", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Pick your route." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Select level 1" })).toBeEnabled();
    await expect(page.getByRole("button", { name: /Level 2, .+, locked/ })).toBeDisabled();
    await expect(page.getByRole("button", { name: /Level 3, .+, locked/ })).toBeDisabled();
  });

  test("names every authored route and offers all ten", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Pick your route." })).toBeVisible();
    await expect(page.getByText("Open Yard")).toBeVisible();
    await expect(page.getByText("The Gauntlet")).toBeVisible();
    await expect(page.getByRole("button", { name: /^(Select level|Level) \d+, / })).toHaveCount(10);
  });

  test("tells guests their progress is browser-only", async ({ page }) => {
    await expect(page.getByText("Guest progress lives in this browser only")).toBeVisible();
  });

  test("starts a selected level and exposes pause controls", async ({ page }) => {
    await page.getByRole("button", { name: "Select level 1" }).click();

    await expect(page.getByText("Get ready")).toBeVisible();
    await expect(page.getByLabel("Game information")).toBeVisible();
    await expect(page.getByLabel("Zoomed-out maze mini map")).toBeVisible();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();

    await page.getByRole("button", { name: "Pause" }).click();
    await expect(page.getByRole("dialog", { name: "Game paused" })).toBeVisible();
    await page.getByRole("button", { name: "Resume game" }).click();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  });
});
