import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Abc123()");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 20_000 });
}

test("login page shows the demo hint", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText(/student@example.com/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Learn from the page/i })).toBeVisible();
});

test("unauthenticated dashboard redirects to login", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
});

test("student opens a cited chapter iframe", async ({ page }) => {
  await login(page, "student@example.com");
  await expect(page.getByRole("heading", { name: /Your Subjects/i })).toBeVisible();
  await page.getByRole("link", { name: /Mathematics/i }).first().click();
  await expect(page.getByRole("heading", { name: /Mathematics/i })).toBeVisible();
  await page.getByRole("link", { name: /Fractions/i }).click();
  const frame = page.locator("iframe");
  await expect(frame).toBeVisible();
  await expect(frame).toHaveAttribute("sandbox", /allow-scripts/);
  await expect(frame).not.toHaveAttribute("sandbox", /allow-same-origin/);
});

test("owner workspace shows attendance and jobs", async ({ page }) => {
  await login(page, "owner@example.com");
  await expect(page.getByRole("heading", { name: /School workspace/i })).toBeVisible();
  await page.getByRole("tab", { name: "Attendance" }).click();
  await expect(page.getByText(/Today/i)).toBeVisible();
  await expect(page.getByText("student@example.com").first()).toBeVisible();
  await page.getByRole("button", { name: "present" }).first().click();
  await expect(page.getByText(/Attendance records/i)).toBeVisible();
  await page.getByRole("tab", { name: "Jobs" }).click();
  await expect(page.getByText(/Slidegen jobs/i)).toBeVisible();
});

test("owner sees student performance records", async ({ page }) => {
  await login(page, "owner@example.com");
  await page.getByRole("tab", { name: "Performance" }).click();
  await expect(page.getByText(/Student performance/i)).toBeVisible();
  await expect(page.getByText("student@example.com").first()).toBeVisible();
  await expect(page.getByText(/Mathematics/i).first()).toBeVisible();
  await expect(page.getByText(/Quiz/i).first()).toBeVisible();
});
