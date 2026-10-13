"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ProductForm } from "@/components/ProductForm";
import { useProduct } from "@/components/useProduct";
import { Button, EmptyState } from "@/lib/ds";
import { DetailSkeleton } from "@/components/Skeleton";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { state, reload } = useProduct(id);

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
          Edit product
        </h1>
      </div>

      {state.status === "loading" ? (
        <DetailSkeleton label="Loading product" />
      ) : state.status === "notfound" ? (
        <EmptyState
          icon="las la-box"
          title="Product not found"
          body="This product may have been removed."
          action={
            <Link href="/customers/products">
              <Button>Back to products</Button>
            </Link>
          }
        />
      ) : state.status === "error" ? (
        <EmptyState
          icon="las la-exclamation-circle"
          title="Product could not be loaded"
          body={`${state.message}. Check that the API is running, then try again.`}
          action={<Button onClick={reload}>Try again</Button>}
        />
      ) : (
        <ProductForm initial={state.product} />
      )}
    </div>
  );
}
