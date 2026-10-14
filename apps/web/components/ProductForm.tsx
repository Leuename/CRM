"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, createProduct, updateProduct, type Product, type ProductInput } from "@/lib/api";
import { Button, Card, Input, Switch } from "@/lib/ds";

// New catalogue rows use the demo's USD currency.

// MONEY RULE: default_price is a string end-to-end. This regex is a display-side
// format guard only (non-negative, up to 2 decimals) — never Number()/parseFloat,
// never arithmetic. The server re-validates the decimal and is the authority.
const PRICE_RE = /^\d+(\.\d{1,2})?$/;

export function ProductForm({ initial }: { initial?: Product }) {
  const router = useRouter();
  const isEdit = initial !== undefined;

  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  // Kept as the raw string the user typed — no numeric coercion.
  const [defaultPrice, setDefaultPrice] = useState(initial?.default_price ?? "");
  const [active, setActive] = useState(initial?.active ?? true);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required.";
    const priceStr = defaultPrice.trim();
    if (priceStr && !PRICE_RE.test(priceStr)) {
      errs.default_price = "Enter a non-negative amount, up to 2 decimals (e.g. 1500.00).";
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setFormError(null);
      return;
    }

    const payload: ProductInput = {
      name: name.trim(),
      category: category.trim() || null,
      description: description.trim() || null,
      default_price: priceStr || null, // string or null — never a number
      // No currency: the demo service defaults new catalogue rows to USD.
      active,
    };

    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    try {
      const saved = isEdit
        ? await updateProduct(initial.id, payload)
        : await createProduct(payload);
      router.push("/customers/products");
      void saved;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 422) {
          setFieldErrors(err.fields ?? {});
          setFormError(err.fields ? null : err.message);
        } else if (err.status === 403) {
          setFormError(
            "You are not permitted to configure products. Ask an administrator to make this change.",
          );
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError(err instanceof Error ? err.message : "Unknown error");
      }
      setSubmitting(false);
    }
  }

  const inputWide = { width: "100%" } as const;

  return (
    // Full width, matching the opportunity form's fix: .opp-form-grid-2
    // already caps each field at 260–420px and flex-wraps, so the reclaimed
    // width goes into more fields per row, not stretched inputs.
    <Card style={{ width: "100%" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {formError && (
          <div
            role="alert"
            style={{
              marginBottom: 20,
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: "rgba(196,86,78,0.10)",
              color: "var(--secondary-red)",
              font: "400 14px/21px var(--font-ui)",
            }}
          >
            {formError}
          </div>
        )}

        <div className="opp-form-grid-2">
          <Input
            label="Name"
            aria-label="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            state={fieldErrors.name ? "error" : "default"}
            hint={fieldErrors.name}
            style={inputWide}
          />
          <Input
            label="Category"
            aria-label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            state={fieldErrors.category ? "error" : "default"}
            hint={fieldErrors.category}
            style={inputWide}
          />
          <Input
            label="Default price"
            aria-label="Default price"
            inputMode="decimal"
            placeholder="0.00"
            value={defaultPrice}
            onChange={(e) => setDefaultPrice(e.target.value)}
            state={fieldErrors.default_price ? "error" : "default"}
            hint={fieldErrors.default_price}
            style={inputWide}
          />
        </div>

        {/* Description — DS gap: no Textarea. Capped for a readable measure,
            same as the opportunity form's notes field. */}
        <div style={{ marginTop: 28, maxWidth: 760 }}>
          <label style={{ display: "block" }}>
            <span className="crm-field-label">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="crm-field-box"
            />
          </label>
          {fieldErrors.description && (
            <div
              style={{
                marginTop: 6,
                font: "400 12px/18px var(--font-ui)",
                color: "var(--secondary-red)",
              }}
            >
              {fieldErrors.description}
            </div>
          )}
        </div>

        <div style={{ marginTop: 28 }}>
          <Switch
            label="Active"
            checked={active}
            state={fieldErrors.active ? "error" : "default"}
            onChange={(e) => setActive(e.target.checked)}
          />
          <div
            style={{
              marginTop: 6,
              font: "400 12px/18px var(--font-ui)",
              color: "var(--text-secondary)",
            }}
          >
            Inactive products are hidden from the active filter and future opportunity pickers, but
            their history is kept.
          </div>
        </div>

        <div style={{ display: "flex", gap: 9, marginTop: 28 }}>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Add product"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => router.push("/customers/products")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
