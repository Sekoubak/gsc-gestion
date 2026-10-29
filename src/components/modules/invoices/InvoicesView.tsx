"use client";

import { FilePlus2, FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, EmptyState, Input, PageHeader, Stat, Tabs } from "@/components/ui";
import { balance, docTotals, invoiceState } from "@/lib/calc";
import { gnfShort } from "@/lib/format";
import type { InvoiceState } from "@/lib/types";
import { useLookups } from "@/hooks/useLookups";
import { useAppStore } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";
import { InvoiceTable } from "./InvoiceTable";

type Filter = "toutes" | InvoiceState;

export function InvoicesView() {
  const invoices = useAppStore((s) => s.invoices);
  const openSheet = useUi((s) => s.openSheet);
  const L = useLookups();
  const [filter, setFilter] = useState<Filter>("toutes");
  const [q, setQ] = useState("");

  const withState = useMemo(() => invoices.map((i) => ({ i, st: invoiceState(i) })), [invoices]);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return withState
      .filter(({ st }) => filter === "toutes" || st === filter || (filter === "envoyee" && st === "partielle"))
      .filter(({ i }) => !t || `${i.number} ${i.subject} ${L.clientName(i.clientId)} ${L.projectName(i.projectId)}`.toLowerCase().includes(t))
      .map(({ i }) => i)
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.seq - a.seq);
  }, [withState, filter, q, L]);

  const c = (s: InvoiceState) => withState.filter((x) => x.st === s).length;
  const sum = (pred: (st: InvoiceState) => boolean, f: (i: (typeof invoices)[number]) => number) => withState.filter((x) => pred(x.st)).reduce((a, x) => a + f(x.i), 0);

  return (
    <div className="fade-in">
      <PageHeader title="Factures" sub="Toutes les factures, tous projets confondus." actions={<Button variant="primary" icon={<FilePlus2 />} onClick={() => openSheet({ kind: "invoice" })}>Nouvelle facture</Button>} />
      {invoices.length === 0 ? (
        <EmptyState icon={<FileText />} title="Aucune facture" action={<Button variant="primary" icon={<FilePlus2 />} onClick={() => openSheet({ kind: "invoice" })}>Créer une facture</Button>}>
          Chaque facture est numérotée automatiquement (FAC-année-0001) et rattachée à un projet.
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Facturé TTC (hors brouillons)" value={gnfShort(sum((st) => st !== "brouillon" && st !== "annulee", (i) => docTotals(i).ttc))} />
            <Stat label="Reste à encaisser" value={gnfShort(sum((st) => ["envoyee", "partielle", "en_retard"].includes(st), balance))} tone="warn" />
            <Stat label="En retard" value={gnfShort(sum((st) => st === "en_retard", balance))} sub={`${c("en_retard")} facture${c("en_retard") > 1 ? "s" : ""}`} tone="bad" />
            <Stat label="Brouillons" value={c("brouillon")} sub="à finaliser et envoyer" />
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Tabs<Filter> value={filter} onChange={setFilter} items={[
              { key: "toutes", label: "Toutes", count: invoices.length },
              { key: "brouillon", label: "Brouillons", count: c("brouillon") },
              { key: "envoyee", label: "En attente", count: c("envoyee") + c("partielle") },
              { key: "en_retard", label: "En retard", count: c("en_retard") },
              { key: "payee", label: "Payées", count: c("payee") },
              { key: "annulee", label: "Annulées", count: c("annulee") },
            ]} />
            <div className="relative ml-auto w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input aria-label="Rechercher une facture" placeholder="Numéro, client, objet" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <InvoiceTable invoices={rows} />
        </>
      )}
    </div>
  );
}
