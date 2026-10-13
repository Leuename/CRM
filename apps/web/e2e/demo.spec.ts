import { expect, test } from "@playwright/test";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("demo");
  await page.getByRole("button", { name: "Sign in to demo" }).click();
}

test("the single demo sign-in button fills sample credentials and opens the dashboard", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome to the Aster CRM demo." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in to demo" })).toHaveCount(1);
  await page.getByRole("button", { name: "Sign in to demo" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Casey Brooks")).toBeVisible();
});

test("login validation announces and describes field errors", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password").fill("demo");
  await page.getByRole("button", { name: "Sign in to demo" }).click();

  const email = page.getByLabel("Email");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  const hintId = await email.getAttribute("aria-describedby");
  expect(hintId).toBeTruthy();
  const hint = page.locator(`#${hintId}`);
  await expect(hint).toHaveText("Enter a valid email");
  await expect(hint).toHaveAttribute("aria-live", "polite");
  await expect(hint).toHaveAttribute("aria-atomic", "true");
});

test("administrator signs in and sees the synthetic CRM dashboard", async ({ page }) => {
  const offOriginRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (["http:", "https:"].includes(url.protocol) && url.origin !== "http://127.0.0.1:6969") {
      offOriginRequests.push(url.origin);
    }
  });
  await signIn(page, "admin@aster.example");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("note")).toContainText("Do not enter real customer data");
  await expect(page.getByText("Active opportunities", { exact: false }).first()).toBeVisible();
  expect(offOriginRequests).toEqual([]);
});

test("administrator can open every CRM list, detail, create, edit, and settings route", async ({
  page,
}) => {
  await signIn(page, "admin@aster.example");

  const routes = [
    "/dashboard",
    "/pipeline",
    "/sales/opportunities",
    "/sales/opportunities/opportunity_01",
    "/sales/opportunities/opportunity_01/edit",
    "/sales/opportunities/new",
    "/customers/individuals",
    "/customers/individuals/contact_01",
    "/customers/individuals/contact_01/edit",
    "/customers/individuals/new",
    "/customers/companies",
    "/customers/companies/company_01",
    "/customers/companies/company_01/edit",
    "/customers/companies/new",
    "/customers/products",
    "/customers/products/product_01/edit",
    "/customers/products/new",
    "/settings",
    "/settings/general",
    "/settings/activities",
    "/settings/audit",
    "/settings/pipeline",
    "/settings/pipeline/new",
    "/settings/pipeline/stage_inquiry/edit",
  ];

  for (const route of routes) {
    await page.goto(route);
    await expect(page.getByRole("main").first(), route).toBeVisible();
    await expect(page.locator("body"), route).not.toContainText("Application error");
  }

  const redirects = [
    ["/", "/dashboard"],
    ["/opportunities", "/sales/opportunities"],
    ["/contacts", "/customers/individuals"],
    ["/companies", "/customers/companies"],
    ["/products", "/customers/products"],
    ["/activities", "/settings/activities"],
    ["/audit", "/settings/audit"],
  ] as const;

  for (const [source, target] of redirects) {
    await page.goto(source);
    await expect(page).toHaveURL(new RegExp(`${target.replaceAll("/", "\\/")}$`));
  }
});

test("operations account lands in the separate front desk shell", async ({ page }) => {
  await signIn(page, "desk@aster.example");
  await expect(page).toHaveURL(/\/kiosk$/);
  await expect(page.getByRole("note")).toContainText("Do not enter real customer details");
  await expect(page.getByRole("link", { name: /New inquiry/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Find customer/ })).toBeVisible();
  await page.goto("/kiosk/customers");
  await expect(page.getByRole("note")).toContainText("Do not enter real customer details");
  await page.goto("/kiosk/inquiries");
  await expect(page.getByRole("note")).toContainText("Do not enter real customer details");
  await page.goto("/kiosk/visits");
  await expect(page.getByRole("note")).toContainText("Do not enter real customer details");
  await page.goto("/kiosk");
  await page.getByRole("link", { name: /New inquiry/ }).click();
  await expect(page.getByRole("note")).toContainText("Do not enter real customer details");
  await expect(page.getByRole("note")).toContainText("not sent or followed up");

  await page.goto("/kiosk/customers/contact_01");
  await page.getByRole("button", { name: "Edit details" }).click();
  await expect(page.getByRole("dialog", { name: "Edit customer details" })).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Edit customer details" }).getByRole("note"),
  ).toContainText("Do not enter real customer details");
});

test("kiosk customer edit dialog fits a phone viewport and saves", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "desk@aster.example");
  await page.goto("/kiosk/customers/contact_01");
  await page.getByRole("button", { name: "Edit details" }).click();

  const dialog = page.getByRole("dialog", { name: "Edit customer details" });
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  if (bounds === null) throw new Error("The customer edit dialog should be rendered");
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  const inputBounds = await dialog.locator(".k-form-grid input").evaluateAll((inputs) =>
    inputs.map((input) => {
      const rect = input.getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    }),
  );
  expect(
    inputBounds.every((input) => input.left >= bounds.x && input.right <= bounds.x + bounds.width),
  ).toBe(true);

  await dialog.getByLabel("Company").fill("Aster Demo Group");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("Aster Demo Group")).toBeVisible();
});

test("sales account can create and find a synthetic individual", async ({ page }) => {
  await signIn(page, "sales@aster.example");
  await page.goto("/customers/individuals/new");
  await page.getByLabel("First name").fill("Robin");
  await page.getByLabel("Last name").fill("Demo");
  await page.getByLabel("Email").fill("robin.demo@aster.example");
  await page.getByRole("button", { name: "Add individual" }).click();

  await expect(page).toHaveURL(/\/customers\/individuals\/contact_/);
  await expect(page.getByText("Robin Demo")).toBeVisible();
  await page.goto("/customers/individuals");
  await page.getByPlaceholder("Name, email, phone, company").fill("robin.demo");
  await expect(page.getByText("Robin Demo")).toBeVisible();
});

test("opportunity creation action stays fully visible on a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "sales@aster.example");
  await page.goto("/sales/opportunities");

  const addOpportunity = page.getByRole("button", { name: "Add opportunity" });
  const bounds = await addOpportunity.boundingBox();
  expect(bounds).not.toBeNull();
  if (bounds === null) throw new Error("Add opportunity should be rendered");
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);

  await addOpportunity.click();
  await expect(page).toHaveURL(/\/sales\/opportunities\/new$/);
  await expect(page.getByRole("heading", { name: "New opportunity" })).toBeVisible();
});

test("product pagination stays visible and labeled on a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "sales@aster.example");
  await page.goto("/customers/products");

  await expect(page.getByRole("table")).toBeVisible();
  const pager = page.locator(".crm-pagination");
  await expect(pager).toBeVisible();
  await expect(pager.getByRole("button", { name: "Page 1" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const next = pager.getByRole("button", { name: "Next page" });
  await expect(pager.getByRole("button", { name: "Previous page" })).toBeDisabled();
  await expect(next).toBeDisabled();
  const bounds = await next.boundingBox();
  expect(bounds).not.toBeNull();
  if (bounds === null) throw new Error("Next page control should be rendered");
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
});

test("pagination arrows move between pages and disable at both boundaries", async ({ page }) => {
  await signIn(page, "sales@aster.example");
  await page.goto("/customers/individuals");

  const pager = page.locator(".crm-pagination");
  const previous = pager.getByRole("button", { name: "Previous page" });
  const next = pager.getByRole("button", { name: "Next page" });

  await expect(pager.getByRole("button", { name: "Page 1" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();

  await next.click();
  await expect(pager.getByRole("button", { name: "Page 2" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(previous).toBeEnabled();
  await expect(next).toBeDisabled();

  await previous.click();
  await expect(pager.getByRole("button", { name: "Page 1" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("browser tabs keep demo changes isolated", async ({ page }) => {
  const secondTab = await page.context().newPage();
  await signIn(page, "sales@aster.example");
  await signIn(secondTab, "sales@aster.example");

  await page.goto("/customers/individuals/new");
  await page.getByLabel("First name").fill("Robin");
  await page.getByLabel("Last name").fill("Private Tab");
  await page.getByLabel("Email").fill("robin.private-tab@aster.example");
  await page.getByRole("button", { name: "Add individual" }).click();
  await expect(page.getByText("Robin Private Tab")).toBeVisible();

  await secondTab.goto("/customers/individuals");
  await secondTab.getByPlaceholder("Name, email, phone, company").fill("robin.private-tab");
  await expect(secondTab.getByText("Robin Private Tab")).toHaveCount(0);
  await secondTab.close();
});

test("company website inputs and stored links only use safe web URLs", async ({ page }) => {
  await signIn(page, "sales@aster.example");
  await page.goto("/customers/companies/new");
  await page.getByLabel("Name", { exact: true }).fill("URL Safety Demo");
  await page.getByLabel("Website").fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Add company" }).click();
  await expect(page.getByText("Enter a valid http:// or https:// web address.")).toBeVisible();
  await expect(page).toHaveURL(/\/customers\/companies\/new$/);

  await page.getByLabel("Website").fill("https://demo.example");
  await page.getByRole("button", { name: "Add company" }).click();
  await expect(page).toHaveURL(/\/customers\/companies\/company_/);
  await expect(page.getByRole("link", { name: "https://demo.example/" })).toHaveAttribute(
    "href",
    "https://demo.example/",
  );

  await page.evaluate(() => {
    const state = JSON.parse(sessionStorage.getItem("aster-crm-demo-v1") ?? "null");
    const company = state?.companies?.find(
      (row: { name: string }) => row.name === "URL Safety Demo",
    );
    if (!company) throw new Error("Demo company was not stored");
    company.website = "javascript:alert(1)";
    sessionStorage.setItem("aster-crm-demo-v1", JSON.stringify(state));
  });
  await page.reload();
  await expect(page.getByRole("button", { name: "Website" })).toBeDisabled();
  await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
});
