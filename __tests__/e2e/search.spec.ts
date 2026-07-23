import { test, expect } from "@playwright/test";

test.describe("Search E2E", () => {
  test("user can search for programs", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder(/Search programs/i);
    await searchInput.fill("computer science");
    await searchInput.press("Enter");

    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByText(/results for/i)).toBeVisible();
  });

  test("search shows suggestions", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder(/Search programs/i);
    await searchInput.fill("nurs");

    await expect(page.getByText(/nursing/i)).toBeVisible({ timeout: 5000 });
  });

  test("partner portal requires login", async ({ page }) => {
    await page.goto("/partner/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
