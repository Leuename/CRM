"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listContacts,
  listLeadSources,
  listPipelineStages,
  listProducts,
  listSalesRepresentatives,
  type Contact,
  type LeadSource,
  type OpportunityDetail,
  type PipelineStage,
  type Product,
  type SalesRepresentative,
} from "@/lib/api";

export function usePickers(
  initial: OpportunityDetail | undefined,

  setContactId: (id: string) => void,
) {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [salesReps, setSalesReps] = useState<SalesRepresentative[] | null>(null);
  const [leadSources, setLeadSources] = useState<LeadSource[] | null>(null);
  const [stages, setStages] = useState<PipelineStage[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    // needs. Swap for a debounced typeahead if a picker outgrows one page.
    listContacts({ limit: 100, offset: 0 }, controller.signal)
      .then((page) => {
        setContacts(page.items);

        // ?contact=<id>. Adopted only if that id is one the picker actually
        // offers — an unknown, mismatched or archived contact (the list is
        // non-archived only) then degrades to the normal empty picker instead
        // of showing a selection the dropdown cannot represent.

        // an effect, so no Suspense boundary and no re-render on every change.
        const preset = new URLSearchParams(window.location.search).get("contact");
        if (preset && page.items.some((c) => c.id === preset)) setContactId(preset);
      })
      .catch(() => setContacts([]));
    // active only — a retired representative must not be offered on a new deal.
    // The one already on THIS deal is re-added by repOptions below so an edit
    // never silently drops them.
    listSalesRepresentatives(true, controller.signal)
      .then(setSalesReps)
      .catch(() => setSalesReps([]));
    listLeadSources(controller.signal)
      .then((rows) => rows.filter((s) => s.active))
      .then(setLeadSources)
      .catch(() => setLeadSources([]));
    listPipelineStages(controller.signal)
      .then(setStages)
      .catch(() => setStages([]));

    // single fetch drops the 101st+ product from the dropdown). Fine for hundreds
    // of products; revisit with server-side search if the catalogue ever gets huge.
    (async () => {
      const all: Product[] = [];
      const limit = 100;
      for (let offset = 0; ; offset += limit) {
        const page = await listProducts({ limit, offset, active: true }, controller.signal);
        all.push(...page.items);
        if (all.length >= page.total || page.items.length < limit) break;
      }
      setProducts(all);
    })().catch(() => setProducts([]));
    return () => controller.abort();
  }, [setContactId]);

  // The picker offers ACTIVE representatives, plus whoever is already on this
  // deal even if they have since been retired. Without that second part, opening
  // an older deal would show an empty box and saving would silently strip the
  // attribution — deactivating someone must not rewrite the deals they closed.
  const repOptions = useMemo(() => {
    const rows = salesReps ?? [];
    const current = initial?.sales_representative_id;
    if (!current || rows.some((r) => r.id === current)) return rows;
    return [
      ...rows,
      {
        id: current,
        name: initial?.sales_representative_name ?? "(inactive)",
        active: false,
        sort_order: 0,
      },
    ];
  }, [salesReps, initial?.sales_representative_id, initial?.sales_representative_name]);

  return { contacts, products, salesReps, leadSources, stages, repOptions };
}
