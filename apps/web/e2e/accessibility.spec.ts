import { expect, test } from "@playwright/test";

test("back-office routes provide a keyboard skip link to main content", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in to demo" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toHaveAttribute("href", "#app-main");
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();

  for (const route of [
    "/dashboard",
    "/sales/opportunities",
    "/customers/individuals",
    "/customers/individuals/contact_01",
  ]) {
    await page.goto(route);
    await expect(page.getByRole("main"), route).toBeVisible();
    await expect(page.getByRole("link", { name: "Skip to main content" }), route).toHaveAttribute(
      "href",
      "#app-main",
    );
  }

  await page.goto("/dashboard");
  const revenue = page.getByRole("region", { name: "Won revenue by month" });
  await expect(revenue.locator('[aria-hidden="true"] svg.chart-wave')).toHaveCount(1);
  await expect(revenue.locator(".dash-wave-months").getByText(/\$/).first()).toBeVisible();
});

test("kiosk visit calendar tabs support keyboard navigation and label the panel", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("desk@aster.example");
  await page.getByLabel("Password").fill("demo");
  await page.getByRole("button", { name: "Sign in to demo" }).click();
  await expect(page).toHaveURL(/\/kiosk$/);
  await page.goto("/kiosk/visits");

  const tablist = page.getByRole("tablist", { name: "Calendar view" });
  const day = tablist.getByRole("tab", { name: "Day" });
  const week = tablist.getByRole("tab", { name: "Week" });
  const month = tablist.getByRole("tab", { name: "Month" });
  const panel = page.getByRole("tabpanel");
  const panelId = await panel.getAttribute("id");
  const dayId = await day.getAttribute("id");
  const weekId = await week.getAttribute("id");

  await expect(day).toHaveAttribute("aria-controls", panelId!);
  expect(dayId).not.toBeNull();
  expect(weekId).not.toBeNull();
  await expect(day).toHaveAttribute("aria-selected", "true");
  await expect(day).toHaveAttribute("tabindex", "0");
  await expect(week).toHaveAttribute("tabindex", "-1");
  await expect(month).toHaveAttribute("tabindex", "-1");
  await expect(panel).toHaveAttribute("aria-labelledby", dayId as string);

  await day.focus();
  await page.keyboard.press("ArrowRight");
  await expect(week).toBeFocused();
  await expect(week).toHaveAttribute("aria-selected", "true");
  await expect(panel).toHaveAttribute("aria-labelledby", weekId as string);

  await page.keyboard.press("End");
  await expect(month).toBeFocused();
  await expect(month).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("Home");
  await expect(day).toBeFocused();
  await expect(day).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("ArrowLeft");
  await expect(month).toBeFocused();
  await expect(month).toHaveAttribute("aria-selected", "true");
});

test("new-inquiry transitions announce the step and move focus into its choices", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("desk@aster.example");
  await page.getByLabel("Password").fill("demo");
  await page.getByRole("button", { name: "Sign in to demo" }).click();
  await expect(page).toHaveURL(/\/kiosk$/);
  await page.goto("/kiosk/new-inquiry");

  await page.getByRole("textbox", { name: /Mobile number/ }).fill("9990000000");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.locator(".k-subtitle")).toHaveText("Step 2 of 4");
  await expect(page.locator(".k-subtitle")).toHaveAttribute("aria-live", "polite");
  await expect(
    page.getByRole("heading", { name: "Step 2 of 4. Choose what they need." }),
  ).toBeAttached();
  await expect(page.locator("[data-kiosk-screen-focus]").first()).toBeFocused();
});

test("CRM detail tabs expose selection, panel relationships, and arrow-key navigation", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in to demo" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/sales/opportunities/new");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1, name: "Opportunities" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "New opportunity" })).toBeVisible();

  await page.goto("/sales/opportunities/opportunity_01");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1, name: "Opportunities" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();

  const tablist = page.getByRole("tablist", { name: "Opportunity sections" });
  const overview = tablist.getByRole("tab", { name: "Overview" });
  const products = tablist.getByRole("tab", { name: "Products" });
  const history = tablist.getByRole("tab", { name: "History" });
  const panel = page.getByRole("tabpanel");
  const panelId = await panel.getAttribute("id");
  const overviewId = await overview.getAttribute("id");
  const productsId = await products.getAttribute("id");
  const historyId = await history.getAttribute("id");
  expect(overviewId).not.toBeNull();
  expect(productsId).not.toBeNull();
  expect(historyId).not.toBeNull();

  await expect(overview).toHaveAttribute("aria-selected", "true");
  await expect(overview).toHaveAttribute("tabindex", "0");
  await expect(products).toHaveAttribute("tabindex", "-1");
  await expect(overview).toHaveAttribute("aria-controls", panelId!);
  await expect(panel).toHaveAttribute("aria-labelledby", overviewId!);

  await overview.focus();
  await page.keyboard.press("ArrowRight");
  await expect(products).toBeFocused();
  await expect(products).toHaveAttribute("aria-selected", "true");
  await expect(panel).toHaveAttribute("aria-labelledby", productsId!);

  await page.keyboard.press("ArrowRight");
  await expect(history).toBeFocused();
  await expect(history).toHaveAttribute("aria-selected", "true");
  await expect(panel).toHaveAttribute("aria-labelledby", historyId!);
});

test("archive and restore buttons identify the row they act on", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in to demo" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/customers/individuals");
  await expect(page.getByRole("button", { name: /^Archive contact / }).first()).toBeVisible();

  await page.goto("/sales/opportunities");
  await expect(page.getByRole("button", { name: /^Archive opportunity / }).first()).toBeVisible();
});
