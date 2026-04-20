import { test, expect } from "../playwright-fixture";

test.describe("Listings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/listings");
  });

  test("should display all listings heading by default", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("All listings");
  });

  test("should have functional search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search...");
    await searchInput.fill("Ring");
    await searchInput.press("Enter");
    await expect(page).toHaveURL(/q=Ring/);
    await expect(page.locator("h1")).toContainText('Results for "Ring"');
  });

  test("should filter by category", async ({ page }) => {
    const categoryButton = page.getByRole("button", { name: "Jewelry" });
    await categoryButton.click();
    await expect(page).toHaveURL(/category=jewelry/);
    await expect(page.locator("h1")).toContainText("jewelry");
  });

  test("should display category buttons", async ({ page }) => {
    const categories = ["All", "Jewelry", "Textiles", "Pottery", "Woodwork"];
    for (const cat of categories) {
      await expect(page.getByRole("button", { name: cat })).toBeVisible();
    }
  });
});
