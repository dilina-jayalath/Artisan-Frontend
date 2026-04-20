import { test, expect } from "../playwright-fixture";

test.describe("Authentication", () => {
  test("should navigate to login page and display correct elements", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
    await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Enter your password/i)).toBeVisible();
    await expect(page.locator("form").getByRole("button", { name: /Sign in/i })).toBeVisible();
  });

  test("should navigate to register page from login", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /Sign up/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByText(/Create an account/i)).toBeVisible();
  });

  test("should have required attributes on login fields", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.getByPlaceholder(/you@example.com/i);
    const passwordInput = page.getByPlaceholder(/Enter your password/i);
    
    await expect(emailInput).toHaveAttribute("required", "");
    await expect(passwordInput).toHaveAttribute("required", "");
  });
});
