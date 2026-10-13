"use client";

import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";

export default function NewContactPage() {
  return (
    <div style={{ paddingTop: 28 }}>
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/customers/individuals"
          style={{
            font: "400 14px/21px var(--font-ui)",
            color: "var(--text-secondary)",
          }}
        >
          ← Back to individuals
        </Link>
        <h1
          style={{
            font: "700 22px/32px var(--font-ui)",
            margin: "8px 0 0",
            color: "var(--text-primary)",
          }}
        >
          Add individual
        </h1>
      </div>
      <ContactForm />
    </div>
  );
}
