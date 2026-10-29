"use client";

import { Plus, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, EmptyState, PageHeader, Stat, Tabs } from "@/components/ui";
import { docTotals, isCommitted } from "@/lib/calc";
import { gnfShort } from "@/lib/format";
import type { POStatus } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";
import { POTable } from "./POTable";

export function PurchaseOrdersView() {
  const orders = useAppStore((s) => s.purchaseOrders);
  const openSheet = useUi((s) => s.openSheet);
  const [filter, setFilter] = useState<"tous" | POStatus>("tous");
  const rows = useMemo(() => orders.filter((o) => filter === "tous" || o.status === filter).sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.seq - a.seq), [orders, filter]);
  const c = (s: POStatus) => orders.filter((o) => o.status === s).length;
  const committed = orders.filter(isCommitted);
  const unpaid = committed.filter((o) => o.status !== "paye").reduce((a, o) => a + docTotals(o).ttc, 0);

  return (
    <div className="fade-in">
      <PageHeader title="Bons de commande" sub="Commandes passées aux prestataires : ce sont les sorties de chaque projet." actions={<Button variant="primary" icon={<Plus />} onClick={() => openSheet({ kind: "po" })}>Nouveau bon de commande</Button>} />
      {orders.length === 0 ? (
        <EmptyState icon={<ShoppingCart />} title="Aucun bon de commande" action={<Button variant="primary" icon={<Plus />} onClick={() => openSheet({ kind: "po" })}>Créer un bon de commande</Button>}>
          Émettez un bon de commande pour chaque prestataire mobilisé : son montant est déduit de la marge du projet.
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Stat label="Engagé (hors brouillons)" value={gnfShort(committed.reduce((a, o) => a + docTotals(o).ttc, 0))} />
            <Stat label="Reste à payer aux prestataires" value={gnfShort(unpaid)} tone="warn" sub={`${c("emis") + c("livre")} commande${c("emis") + c("livre") > 1 ? "s" : ""}`} />
            <Stat label="Livré, à régler" value={c("livre")} sub="prestations terminées non payées" />
          </div>
          <div className="mb-4">
            <Tabs value={filter} onChange={setFilter} items={[
              { key: "tous", label: "Tous", count: orders.length }, { key: "brouillon", label: "Brouillons", count: c("brouillon") },
              { key: "emis", label: "Émis", count: c("emis") }, { key: "livre", label: "Livrés", count: c("livre") }, { key: "paye", label: "Payés", count: c("paye") },
            ]} />
          </div>
          <POTable orders={rows} />
        </>
      )}
    </div>
  );
}
