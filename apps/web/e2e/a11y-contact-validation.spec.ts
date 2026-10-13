import { expect, test } from "@playwright/test";

test("invalid opportunity contact is focused and described", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in to demo" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/sales/opportunities/new");
  const contact = page.getByRole("combobox", { name: "Contact" });
  await expect(contact).toBeEnabled();

  await page.getByRole("button", { name: "Create opportunity" }).focus();
  await page.keyboard.press("Enter");

  await expect(contact).toBeFocused();
  await expect(contact).toHaveAttribute("aria-invalid", "true");
  await expect(contact).toHaveAccessibleDescription("Select a contact, or create a new one.");

  const errorId = await contact.getAttribute("aria-describedby");
  expect(errorId).toBeTruthy();
  await expect(page.locator(`#${errorId}`)).toHaveText("Select a contact, or create a new one.");
});

test("opportunity product line fields follow keyboard order and select", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in to demo" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/sales/opportunities/new");
  const addLine = page.getByRole("button", { name: "Add line" });
  await addLine.focus();
  await page.keyboard.press("Enter");

  const product = page.getByRole("combobox", { name: "Product" });
  await expect(product).toBeVisible();
  await expect(product).toBeEnabled();
  await page.keyboard.press("Tab");
  await expect(product).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(product).not.toHaveValue("");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: "Quantity" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: "Unit price" })).toBeFocused();
});
