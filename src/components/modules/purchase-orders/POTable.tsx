"use client";

import { Badge, DemoTag } from "@/components/ui";
import { docTotals } from "@/lib/calc";
import { fd, gnf } from "@/lib/format";
import { PO_STATUS } from "@/lib/labels";
import type { PurchaseOrder } from "@/lib/types";
import { useLookups } from "@/hooks/useLookups";
import { useUi } from "@/store/useUiStore";

export function POTable({ orders, showProject = true }: { orders: PurchaseOrder[]; showProject?: boolean }) {
  const L = useLookups();
  const openSheet = useUi((s) => s.openSheet);
  if (orders.length === 0) return <p className="rounded-card border border-dashed border-line bg-surface px-4 py-6 text-sm text-muted">Aucun bon de commande.</p>;
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="hidden grid-cols-[minmax(120px,auto)_minmax(0,1.6fr)_96px_130px_100px] gap-4 border-b border-line bg-sunken/60 px-4 py-2.5 text-[12px] font-semibold text-muted md:grid">
        <span>Numéro</span><span>Prestataire · {showProject ? "projet" : "objet"}</span><span>Émis</span><span className="text-right">Montant</span><span className="text-right">Statut</span>
      </div>
      {orders.map((p) => (
        <button key={p.id} type="button" onClick={() => openSheet({ kind: "po", id: p.id })}
          className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 border-b border-line px-4 py-3 text-left transition last:border-0 hover:bg-sunken/60 md:grid-cols-[minmax(120px,auto)_minmax(0,1.6fr)_96px_130px_100px]">
          <span className="num flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold">{p.number}</span>
          <span className="num text-right text-sm font-semibold md:hidden">{gnf(docTotals(p).ttc)}</span>
          <span className="min-w-0">
            <span className="flex items-center gap-2 text-sm font-medium"><span className="truncate">{L.providerName(p.providerId)}</span>{showProject && p.demo && <DemoTag />}</span>
            <span className="block truncate text-[12.5px] text-muted">{showProject ? L.projectName(p.projectId) : p.subject}</span>
          </span>
          <span className="justify-self-end md:hidden"><Badge tone={PO_STATUS[p.status].tone}>{PO_STATUS[p.status].label}</Badge></span>
          <span className="num hidden text-sm text-muted md:block">{fd(p.issueDate)}</span>
          <span className="num hidden text-right text-sm font-semibold md:block">{gnf(docTotals(p).ttc)}</span>
          <span className="hidden justify-self-end md:block"><Badge tone={PO_STATUS[p.status].tone}>{PO_STATUS[p.status].label}</Badge></span>
        </button>
      ))}
    </div>
  );
}
