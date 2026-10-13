"use client";

import { type Product } from "@/lib/api";
import { formatMoney } from "@/lib/opportunities";
import { Button, Input } from "@/lib/ds";
import { Select } from "@/components/Select";
import { LineField, Section } from "./ui";
import {
  displaySubtotalIncVat,
  errorBanner,
  grandEstimate,
  inputWide,
  type LineRow,
} from "./shared";

export function SectionProductLine({
  lines,
  products,
  currency,
  updateLine,
  changeProduct,
  addLine,
  removeLine,
  lineError,
  sellingPrice,
  setSellingPrice,
  dealDiscountOn,
  setDealDiscountOn,
  discountPercent,
  setDiscountPercent,
  dealVatExempt,
  setDealVatExempt,
  fieldErrors,
}: {
  lines: LineRow[];
  products: Product[] | null;
  currency: string;
  updateLine: (key: string, patch: Partial<LineRow>) => void;
  changeProduct: (key: string, productId: string) => void;
  addLine: () => void;
  removeLine: (key: string) => void;
  lineError: string | null;
  sellingPrice: string;
  setSellingPrice: (v: string) => void;
  dealDiscountOn: boolean;
  setDealDiscountOn: (v: boolean) => void;
  discountPercent: string;
  setDiscountPercent: (v: string) => void;
  dealVatExempt: boolean;
  setDealVatExempt: (v: boolean) => void;
  fieldErrors: Record<string, string>;
}) {
  const hasLines = lines.length > 0;

  return (
    <Section
      index={3}
      title="Product line"
      subtitle="Add products or services included in this opportunity."
      action={
        <Button type="button" variant="outline" icon="las la-plus" onClick={addLine}>
          Add line
        </Button>
      }
    >
      {lineError && (
        <div role="alert" style={errorBanner}>
          {lineError}
        </div>
      )}

      {!hasLines ? (
        <>
          <p className="opp-form-empty">
            No product lines yet. Add one to itemise this deal, or enter a single deal value below.
          </p>

          <div className="opp-form-grid-2">
            <Input
              label="Deal value"
              aria-label="Deal value"
              inputMode="decimal"
              placeholder="0.00"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              state={fieldErrors.selling_price_ex_vat ? "error" : "default"}
              hint={fieldErrors.selling_price_ex_vat}
              style={inputWide}
            />
            <div style={{ paddingTop: 10 }}>
              <label className="opp-check">
                <input
                  type="checkbox"
                  checked={dealDiscountOn}
                  onChange={(e) => {
                    setDealDiscountOn(e.target.checked);
                    if (!e.target.checked) setDiscountPercent("");
                  }}
                />
                <span>Apply a discount</span>
              </label>
              {dealDiscountOn && (
                <Input
                  label="Discount (%)"
                  aria-label="Discount percent"
                  inputMode="decimal"
                  placeholder="0"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  state={fieldErrors.discount_percent ? "error" : "default"}
                  hint={fieldErrors.discount_percent}
                  style={inputWide}
                />
              )}
              <label className="opp-check" style={{ marginTop: 10 }}>
                <input
                  type="checkbox"
                  checked={dealVatExempt}
                  onChange={(e) => setDealVatExempt(e.target.checked)}
                />
                <span>VAT exempt</span>
              </label>
              <div className="opp-form-note" style={{ marginTop: 2 }}>
                {dealVatExempt ? "No VAT on this deal." : "VAT 12% applies."}
              </div>
            </div>
          </div>
        </>
      ) : (
        // visual reference: a table of lines — a header row, then per
        // line the priced row, its service schedule, and a quieter VAT/notes row.
        // Each line stays one bordered group so a five-line deal never leaves a
        // date row orphaned from the price it belongs to.
        <div className="opp-line-table">
          <div className="opp-line-head-row" aria-hidden="true">
            <span>Product</span>
            <span>Qty</span>
            <span>Unit price</span>
            <span>Discount</span>
            <span>Subtotal</span>
            <span />
          </div>
          {lines.map((l, i) => {
            // DISPLAY-ONLY — see displaySubtotalIncVat(): never submitted.
            const sub = displaySubtotalIncVat(l);
            return (
              <div className="opp-line-card" key={l.key}>
                <div className="opp-line-cells">
                  <Select
                    label="Product"
                    value={l.product_id}
                    onChange={(v) => changeProduct(l.key, v)}
                    disabled={products === null}
                  >
                    <option value="">{products === null ? "Loading…" : "Select product"}</option>
                    {(products ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                  <LineField label="Quantity">
                    <input
                      aria-label="Quantity"
                      inputMode="decimal"
                      value={l.quantity}
                      onChange={(e) => updateLine(l.key, { quantity: e.target.value })}
                      className="crm-field-box crm-field-box--sm"
                    />
                  </LineField>
                  <LineField label="Unit price">
                    <input
                      aria-label="Unit price"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={l.unit_price}
                      onChange={(e) => updateLine(l.key, { unit_price: e.target.value })}
                      className="crm-field-box crm-field-box--sm"
                    />
                  </LineField>
                  <div className="opp-line-discount">
                    {/* Named by the header row on a wide screen, by this label
                        once the header row is gone (≤900px). */}
                    <span className="opp-line-cell-label">Discount</span>
                    <label className="opp-check">
                      <input
                        type="checkbox"
                        aria-label={`Apply a discount to line ${i + 1}`}
                        checked={l.discount_on}
                        onChange={(e) =>
                          updateLine(l.key, {
                            discount_on: e.target.checked,
                            // Clearing on untick keeps a hidden percentage from
                            // riding along into the payload.
                            ...(e.target.checked ? {} : { discount_percent: "" }),
                          })
                        }
                      />
                      <span>Yes</span>
                    </label>
                    {/* Always present, disabled until "Yes" — visual reference
                        shows the empty % box beside an unticked checkbox, and a field
                        that appears out of nowhere shifts the row under the cursor. */}
                    <input
                      aria-label={`Discount percent for line ${i + 1}`}
                      inputMode="decimal"
                      placeholder="%"
                      disabled={!l.discount_on}
                      value={l.discount_percent}
                      onChange={(e) => updateLine(l.key, { discount_percent: e.target.value })}
                      className="crm-field-box crm-field-box--sm opp-line-discount-pct"
                    />
                  </div>
                  {/* DISPLAY ONLY — see displaySubtotalIncVat(). The server
                      computes the stored total and is the authority. */}
                  <div className="opp-line-subtotal">
                    <span className="opp-line-cell-label">Subtotal</span>
                    <span className="opp-line-subtotal-value">
                      {formatMoney(sub === null ? null : sub.toFixed(2), currency)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="opp-line-remove"
                    aria-label={`Remove line ${i + 1}`}
                    onClick={() => removeLine(l.key)}
                  >
                    <i className="las la-trash-alt" aria-hidden="true" />
                  </button>
                </div>

                {/* The service window: when this line is scheduled. */}
                <div className="opp-line-service-period">
                  <LineField label="Start date">
                    <input
                      type="date"
                      value={l.start_date}
                      onChange={(e) => updateLine(l.key, { start_date: e.target.value })}
                      className="crm-field-box crm-field-box--sm"
                      style={{ width: 150 }}
                    />
                  </LineField>
                  <LineField label="Start time">
                    <input
                      type="time"
                      value={l.start_time}
                      onChange={(e) => updateLine(l.key, { start_time: e.target.value })}
                      className="crm-field-box crm-field-box--sm"
                      style={{ width: 110 }}
                    />
                  </LineField>
                  <LineField label="End date">
                    <input
                      type="date"
                      value={l.end_date}
                      onChange={(e) => updateLine(l.key, { end_date: e.target.value })}
                      className="crm-field-box crm-field-box--sm"
                      style={{ width: 150 }}
                    />
                  </LineField>
                  <LineField label="End time">
                    <input
                      type="time"
                      value={l.end_time}
                      onChange={(e) => updateLine(l.key, { end_time: e.target.value })}
                      className="crm-field-box crm-field-box--sm"
                      style={{ width: 110 }}
                    />
                  </LineField>
                  <LineField label="Preferred schedule">
                    <input
                      placeholder="e.g. weekday mornings"
                      value={l.preferred_schedule}
                      onChange={(e) => updateLine(l.key, { preferred_schedule: e.target.value })}
                      className="crm-field-box crm-field-box--sm"
                      style={{ minWidth: 200 }}
                    />
                  </LineField>
                </div>

                {/* The exception and the free text: kept off the priced row (the
                    mock omits both) but never dropped — VAT applies unless the
                    line says otherwise, and that switch has to be reachable. */}
                <div className="opp-line-extra">
                  <label className="opp-check">
                    <input
                      type="checkbox"
                      aria-label={`VAT exempt line ${i + 1}`}
                      checked={l.vat_exempt}
                      onChange={(e) => updateLine(l.key, { vat_exempt: e.target.checked })}
                    />
                    {/* The RATE, not an amount — what the owner asked to see. */}
                    <span>VAT exempt</span>
                  </label>
                  <span className="opp-line-vat-note">{l.vat_exempt ? "Exempt" : "VAT 12%"}</span>
                  <LineField label="Line notes">
                    <input
                      placeholder="optional"
                      value={l.notes}
                      onChange={(e) => updateLine(l.key, { notes: e.target.value })}
                      className="crm-field-box crm-field-box--sm"
                    />
                  </LineField>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DISPLAY-ONLY grand estimate. The real total is server-computed and
          shown on the detail page after saving. */}
      {lines.some((l) => l.unit_price.trim() !== "") && (
        <div className="opp-form-estimate">
          Estimated total incl. VAT (not saved; the server computes the authoritative total):{" "}
          <b style={{ color: "var(--text-primary)" }}>
            {currency} {grandEstimate(lines).toFixed(2)}
          </b>
        </div>
      )}
    </Section>
  );
}
