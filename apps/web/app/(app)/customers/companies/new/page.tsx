"use client";

import Link from "next/link";
import { CompanyForm } from "@/components/CompanyForm";

export default function NewCompanyPage() {
  return (
    <div style={{ paddingTop: 28 }}>
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/customers/companies"
          style={{
            font: "400 14px/21px var(--font-ui)",
            color: "var(--text-secondary)",
          }}
        >
          ← Back to companies
        </Link>
        <h1
          style={{
            font: "700 22px/32px var(--font-ui)",
            margin: "8px 0 0",
            color: "var(--text-primary)",
          }}
        >
          Add company
        </h1>
      </div>
      <CompanyForm />
    </div>
  );
}
