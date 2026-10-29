"use client";

import { Badge, DemoTag, cx } from "@/components/ui";
import { balance, docTotals, invoiceState } from "@/lib/calc";
import { fd, gnf } from "@/lib/format";
import { INVOICE_STATE } from "@/lib/labels";
import type { Invoice } from "@/lib/types";
import { useLookups } from "@/hooks/useLookups";
import { useUi } from "@/store/useUiStore";

/** Liste des factures, utilisée dans le module Factures et dans la fiche projet. */
export function InvoiceTable({ invoices, showProject = true }: { invoices: Invoice[]; showProject?: boolean }) {
  const L = useLookups();
  const openSheet = useUi((s) => s.openSheet);
  if (invoices.length === 0) return <p className="rounded-card border border-dashed border-line bg-surface px-4 py-6 text-sm text-muted">Aucune facture.</p>;
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="hidden grid-cols-[minmax(124px,auto)_minmax(0,1fr)_96px_136px_112px] gap-4 border-b border-line bg-sunken/60 px-4 py-2.5 text-[12px] font-semibold text-muted md:grid">
        <span>Numéro</span><span>{showProject ? "Client · projet" : "Objet"}</span><span>Échéance</span><span className="text-right">Total TTC</span><span className="text-right">Statut</span>
      </div>
      {invoices.map((i) => {
        const st = invoiceState(i);
        const rest = balance(i);
        return (
          <button key={i.id} type="button" onClick={() => openSheet({ kind: "invoice-view", id: i.id })}
            className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 border-b border-line px-4 py-3 text-left transition last:border-0 hover:bg-sunken/60 md:grid-cols-[minmax(124px,auto)_minmax(0,1fr)_96px_136px_112px]">
            <span className="num flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold">{i.number}</span>
            <span className="num text-right text-sm font-semibold md:hidden">{gnf(docTotals(i).ttc)}</span>
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-sm font-medium"><span className="truncate">{showProject ? L.clientName(i.clientId) : i.subject}</span>{showProject && i.demo && <DemoTag />}</span>
              <span className="num block truncate text-[12.5px] text-muted">Émise le {fd(i.issueDate)} · {showProject ? L.projectName(i.projectId) : i.clientPoRef ? `BC ${i.clientPoRef}` : `${i.items.length} ligne${i.items.length > 1 ? "s" : ""}`}</span>
            </span>
            <span className="justify-self-end md:hidden"><Badge tone={INVOICE_STATE[st].tone}>{INVOICE_STATE[st].label}</Badge></span>
            <span className={cx("num hidden text-sm md:block", st === "en_retard" ? "font-semibold text-bad" : "text-muted")}>{fd(i.dueDate)}</span>
            <span className="num hidden text-right md:block">
              <span className="block text-sm font-semibold">{gnf(docTotals(i).ttc)}</span>
              {rest > 0 && rest < docTotals(i).ttc && <span className="block text-[12px] text-muted">reste {gnf(rest)}</span>}
            </span>
            <span className="hidden justify-self-end md:block"><Badge tone={INVOICE_STATE[st].tone}>{INVOICE_STATE[st].label}</Badge></span>
          </button>
        );
      })}
    </div>
  );
}
