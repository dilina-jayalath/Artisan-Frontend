import { test, expect } from "../playwright-fixture";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the hero section with correct title", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Discover unique handcrafted goods");
  });

  test("should have a functional 'Browse marketplace' button", async ({ page }) => {
    const browseButton = page.getByRole("button", { name: "Browse marketplace" });
    await expect(browseButton).toBeVisible();
    await browseButton.click();
    await expect(page).toHaveURL(/\/listings/);
  });

  test("should have a functional 'Start selling' button", async ({ page }) => {
    const sellButton = page.getByRole("button", { name: "Start selling" });
    await expect(sellButton).toBeVisible();
    await sellButton.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("should display feature sections", async ({ page }) => {
    await expect(page.getByText("Handmade quality")).toBeVisible();
    await expect(page.getByText("Direct from makers")).toBeVisible();
    await expect(page.getByText("Secure checkout")).toBeVisible();
  });

  test("should display shop by category section", async ({ page }) => {
    await expect(page.getByText("Shop by category")).toBeVisible();
    const categories = ["jewelry", "textiles", "pottery", "woodwork"];
    for (const cat of categories) {
      await expect(page.locator(`a[href*="category=${cat}"]`)).toBeVisible();
    }
  });
});
