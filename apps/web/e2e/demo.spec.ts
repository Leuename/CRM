import { expect, test } from "@playwright/test";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("demo");
  await page.getByRole("button", { name: "Sign in to demo" }).click();
  await page.getByRole("button", { name: "Continue to demo" }).click();
}

test("demo sign-in shows a data warning before opening the dashboard", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome to the Aster CRM demo." })).toBeVisible();
  await expect(page.getByRole("note")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sign in to demo" })).toHaveCount(1);
  await page.getByRole("button", { name: "Sign in to demo" }).click();
  const warning = page.getByRole("alertdialog", { name: "Demo data warning" });
  await expect(warning).toBeVisible();
  await expect(warning).toContainText(
    "Do not enter real customer, employee, personal, or confidential data",
  );
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("button", { name: "Continue to demo" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Casey Brooks")).toBeVisible();
});

test("the demo warning must be continued before opening the dashboard", async ({ page }) => {
  let releaseDashboard!: () => void;
  let dashboardRequested = false;
  const dashboardHeld = new Promise<void>((resolve) => (releaseDashboard = resolve));
  await page.route(
    (url) => url.pathname === "/dashboard",
    async (route) => {
      dashboardRequested = true;
      await dashboardHeld;
      await route.continue();
    },
  );
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in to demo" }).click();
  await expect(page.getByLabel("Email")).toHaveValue("sales@aster.example");
  await expect(page.getByLabel("Password")).toHaveValue("demo");
  await expect(page.getByRole("alertdialog", { name: "Demo data warning" })).toBeVisible();
  expect(dashboardRequested).toBe(false);
  await page.getByRole("button", { name: "Continue to demo" }).click();
  await expect.poll(() => dashboardRequested).toBe(true);
  releaseDashboard();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Casey Brooks")).toBeVisible();
});

test("opening a kiosk service description with Enter does not select that service", async ({
  page,
}) => {
  await signIn(page, "desk@aster.example");
  await page.goto("/kiosk/new-inquiry");
  await page.getByRole("textbox", { name: /Mobile number/ }).fill("9990000000");
  await page.getByRole("button", { name: "Continue" }).click();

  const card = page.locator(".k-variant").filter({ hasText: "Strategy Sprint" }).first();
  const view = card.locator(".k-variant-toggle");
  const choice = card.locator(".k-variant-choice");
  await expect(view).toHaveAccessibleName("View Strategy Sprint");
  await expect(choice).toHaveAttribute("aria-pressed", "false");
  await view.focus();
  await page.keyboard.press("Enter");

  await expect(view).toHaveAccessibleName("Hide Strategy Sprint");
  await expect(view).toHaveAttribute("aria-expanded", "true");
  await expect(choice).toHaveAttribute("aria-pressed", "false");
  await expect(view).toHaveAttribute("aria-controls", /k-variant-panel-/);
});

test("login brand panel keeps its copy readable at tablet width", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/login");

  const panel = page.getByRole("complementary", { name: "Aster Advisory" });
  await expect(panel).toBeVisible();
  const panelBounds = await panel.boundingBox();
  expect(panelBounds).not.toBeNull();
  if (panelBounds === null) throw new Error("The brand panel should be rendered");
  expect(panelBounds.width).toBeGreaterThanOrEqual(320);

  const tagline = panel.getByText(
    "One clear view of every customer, conversation, and opportunity.",
  );
  const taglineHeight = await tagline.evaluate((element) => element.getBoundingClientRect().height);
  expect(taglineHeight).toBeLessThanOrEqual(92);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(panel).toBeHidden();
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

test("administrator signs in and sees the synthetic CRM dashboard", async ({ page, baseURL }) => {
  if (!baseURL) throw new Error("Playwright baseURL must be configured for origin checks");
  const appOrigin = new URL(baseURL).origin;
  const offOriginRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (["http:", "https:"].includes(url.protocol) && url.origin !== appOrigin) {
      offOriginRequests.push(url.origin);
    }
  });
  await signIn(page, "admin@aster.example");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("note")).toContainText(
    "Do not enter real customer, employee, personal, or confidential data",
  );
  await expect(page.getByRole("note")).toContainText("not sent to a CRM service");
  await expect(page.getByText("Active opportunities", { exact: false }).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Consultation: 6 inquiries, 21% of inquiries" }),
  ).toBeVisible();
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

  await page.goto("/customers/individuals/contact_01");
  await expect(page.getByRole("heading", { name: "Amara Bennett", level: 2 })).toBeVisible();

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
  await expect(page.getByRole("note")).toContainText(
    "Do not enter real customer, employee, personal, or confidential data",
  );
  await expect(page.getByRole("link", { name: /New inquiry/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Find customer/ })).toBeVisible();
  await page.goto("/kiosk/customers");
  await expect(page.getByRole("note")).toContainText(
    "Do not enter real customer, employee, personal, or confidential data",
  );
  await page.goto("/kiosk/inquiries");
  await expect(page.getByRole("note")).toContainText(
    "Do not enter real customer, employee, personal, or confidential data",
  );
  await page.goto("/kiosk/visits");
  await expect(page.getByRole("note")).toContainText(
    "Do not enter real customer, employee, personal, or confidential data",
  );
  await page.goto("/kiosk");
  await page.getByRole("link", { name: /New inquiry/ }).click();
  await expect(page.getByRole("note")).toContainText(
    "Do not enter real customer, employee, personal, or confidential data",
  );
  await expect(page.getByRole("note")).toContainText("not sent to a CRM service or followed up");

  await page.goto("/kiosk/customers/contact_01");
  await page.getByRole("button", { name: "Edit details" }).click();
  await expect(page.getByRole("dialog", { name: "Edit customer details" })).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Edit customer details" }).getByRole("note"),
  ).toContainText("Do not enter real customer, employee, personal, or confidential data");
});

test("kiosk routes provide a skip link, main landmark, and one page heading", async ({ page }) => {
  await signIn(page, "desk@aster.example");

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toHaveAttribute("href", "#kiosk-main");
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();

  for (const route of [
    "/kiosk",
    "/kiosk/customers",
    "/kiosk/customers/contact_01",
    "/kiosk/inquiries",
    "/kiosk/visits",
    "/kiosk/new-inquiry",
  ]) {
    await page.goto(route);
    await expect(page.getByRole("main"), route).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 }), route).toHaveCount(1);
  }
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

test("sales account can create, reload, and find an editable demo individual", async ({ page }) => {
  await signIn(page, "sales@aster.example");
  await page.goto("/customers/individuals/new");
  await page.getByLabel("First name").fill("Robin");
  await page.getByLabel("Last name").fill("Demo");
  await page.getByLabel("Email").fill("robin.demo@aster.example");
  await page.getByRole("button", { name: "Add individual" }).click();

  await expect(page).toHaveURL(/\/customers\/individuals\/contact_/);
  await expect(page.getByRole("heading", { name: "Robin Demo" })).toBeVisible();
  await expect(page.getByText("robin.demo@aster.example").first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Robin Demo" })).toBeVisible();
  await page.goto("/customers/individuals");
  await page.getByPlaceholder("Name, email, phone, company").fill("robin.demo@aster.example");
  await expect(page.getByRole("row").filter({ hasText: "robin.demo@aster.example" })).toContainText(
    "Robin Demo",
  );
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
  await expect(page.getByRole("heading", { name: "Robin Private Tab" })).toBeVisible();

  await secondTab.goto("/customers/individuals");
  await secondTab
    .getByPlaceholder("Name, email, phone, company")
    .fill("robin.private-tab@aster.example");
  await expect(
    secondTab.getByRole("row").filter({ hasText: "robin.private-tab@aster.example" }),
  ).toHaveCount(0);
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
    const state = JSON.parse(sessionStorage.getItem("aster-crm-demo-v2") ?? "null");
    const company = state?.companies?.find(
      (row: { name: string; website: string | null }) =>
        row.name === "URL Safety Demo" && row.website === "https://demo.example/",
    );
    if (!company) throw new Error("Demo company was not stored");
    company.website = "javascript:alert(1)";
    sessionStorage.setItem("aster-crm-demo-v2", JSON.stringify(state));
  });
  await page.reload();
  await expect(page.getByRole("button", { name: "Website" })).toBeDisabled();
  await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
});
