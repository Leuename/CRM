"use client";

import Link from "next/link";
import { ProductForm } from "@/components/ProductForm";

export default function NewProductPage() {
  return (
    <div style={{ paddingTop: 28 }}>
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/customers/products"
          style={{
            font: "400 14px/21px var(--font-ui)",
            color: "var(--text-secondary)",
          }}
        >
          ← Back to products
        </Link>
        <h1
          style={{
            font: "700 22px/32px var(--font-ui)",
            margin: "8px 0 0",
            color: "var(--text-primary)",
          }}
        >
          Add product
        </h1>
      </div>
      <ProductForm />
    </div>
  );
}
