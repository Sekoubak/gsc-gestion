"use client";

import { ArrowLeft, FileCheck2, FilePlus2, MapPin, Pencil, Phone, ShoppingCart, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, Card, ConfirmButton, DemoTag, EmptyState, KV, Stat, Tabs, cx } from "@/components/ui";
import { docTotals, projectFinance } from "@/lib/calc";
import { fd, gnf, gnfShort, pct } from "@/lib/format";
import { PROJECT_STATUS } from "@/lib/labels";
import type { ProjectStatus } from "@/lib/types";
import { useLookups } from "@/hooks/useLookups";
import { useData, useAppStore } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";
import { InvoiceTable } from "../invoices/InvoiceTable";
import { POTable } from "../purchase-orders/POTable";
import { AttestationTable } from "../attestations/AttestationTable";

type Tab = "factures" | "commandes" | "attestations" | "equipe";

export function ProjectDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const data = useData();
  const upsert = useAppStore((s) => s.upsert);
  const remove = useAppStore((s) => s.remove);
  const { openSheet, toast } = useUi();
  const L = useLookups();
  const [tab, setTab] = useState<Tab>("factures");
  const p = data.projects.find((x) => x.id === id);

  const docs = useMemo(() => ({
    invoices: data.invoices.filter((i) => i.projectId === id).sort((a, b) => b.issueDate.localeCompare(a.issueDate)),
    orders: data.purchaseOrders.filter((o) => o.projectId === id).sort((a, b) => b.issueDate.localeCompare(a.issueDate)),
    attestations: data.attestations.filter((a) => a.projectId === id),
  }), [data, id]);

  if (!p) return <EmptyState title="Projet introuvable" action={<Button onClick={onBack} icon={<ArrowLeft />}>Retour aux projets</Button>}>Ce projet a été supprimé.</EmptyState>;

  const f = projectFinance(data, p);
  const client = L.client(p.clientId);
  const team = data.providers.filter((x) => p.providerIds.includes(x.id));

  return (
    <div className="fade-in">
      <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4" />Projets</button>

      <header className="mb-5 flex flex-wrap items-start gap-3">
        <div className="min-w-0">
          <div className="num flex items-center gap-2 text-[12.5px] font-semibold text-muted">{p.code}{p.demo && <DemoTag />}</div>
          <h1 className="font-display text-[1.6rem] font-bold leading-tight tracking-tight">{p.name}</h1>
          <p className="mt-0.5 text-sm text-muted">{client?.name ?? "Client supprimé"} · du {fd(p.startDate)} au {p.endDate ? fd(p.endDate) : "…"}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="pj-status">Statut du projet</label>
          <select id="pj-status" value={p.status} onChange={(e) => { upsert("projects", { ...p, status: e.target.value as ProjectStatus }); toast(`Statut : ${PROJECT_STATUS[e.target.value as ProjectStatus].label}.`); }}
            className="h-10 rounded-lg border border-line bg-surface px-3 text-sm font-semibold">
            {Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <Button icon={<Pencil />} onClick={() => openSheet({ kind: "project", id: p.id })}>Modifier</Button>
          <Button variant="primary" icon={<FilePlus2 />} onClick={() => openSheet({ kind: "invoice", projectId: p.id })}>Facturer</Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Facturé HT" value={gnfShort(f.invoicedHT)} sub={p.budget ? `${pct(f.budgetUse)} du budget (${gnfShort(p.budget)})` : "Pas de budget saisi"} />
        <Stat label="Encaissé" value={gnfShort(f.collected)} sub={f.outstanding ? `Reste ${gnfShort(f.outstanding)}` : "Rien en attente"} tone="ok" />
        <Stat label="Coûts prestataires HT" value={gnfShort(f.costHT)} sub={`Payé ${gnfShort(f.costPaid)}`} />
        <Stat label="Marge brute" value={pct(f.marginRate)} sub={gnf(f.margin)} tone={f.invoicedHT === 0 ? undefined : f.marginRate < 15 ? "bad" : "ok"} />
      </div>
      {p.budget > 0 && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-sunken" role="meter" aria-valuenow={Math.round(f.budgetUse)} aria-valuemin={0} aria-valuemax={100} aria-label="Consommation du budget">
          <div className={cx("h-full rounded-full", f.budgetUse > 100 ? "bg-bad" : "bg-accent")} style={{ width: `${Math.min(100, f.budgetUse)}%` }} />
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Tabs<Tab> value={tab} onChange={setTab} items={[
              { key: "factures", label: "Factures", count: docs.invoices.length },
              { key: "commandes", label: "Bons de commande", count: docs.orders.length },
              { key: "attestations", label: "Attestations", count: docs.attestations.length },
              { key: "equipe", label: "Équipe", count: team.length },
            ]} />
            <div className="ml-auto">
              {tab === "factures" && <Button size="sm" icon={<FilePlus2 />} onClick={() => openSheet({ kind: "invoice", projectId: p.id })}>Facture</Button>}
              {tab === "commandes" && <Button size="sm" icon={<ShoppingCart />} onClick={() => openSheet({ kind: "po", projectId: p.id })}>Bon de commande</Button>}
              {tab === "attestations" && <Button size="sm" icon={<FileCheck2 />} onClick={() => openSheet({ kind: "attestation", projectId: p.id })}>Attestation</Button>}
              {tab === "equipe" && <Button size="sm" icon={<Users />} onClick={() => openSheet({ kind: "project", id: p.id })}>Affecter</Button>}
            </div>
          </div>
          {tab === "factures" && <InvoiceTable invoices={docs.invoices} showProject={false} />}
          {tab === "commandes" && <POTable orders={docs.orders} showProject={false} />}
          {tab === "attestations" && <AttestationTable items={docs.attestations} showProject={false} />}
          {tab === "equipe" && (team.length === 0 ? <p className="rounded-card border border-dashed border-line bg-surface px-4 py-6 text-sm text-muted">Aucun prestataire affecté.</p> : (
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
              {team.map((x) => {
                const cost = docs.orders.filter((o) => o.providerId === x.id && o.status !== "annule" && o.status !== "brouillon").reduce((a, o) => a + docTotals(o).net, 0);
                return (
                  <li key={x.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openSheet({ kind: "provider", id: x.id })}>
                      <span className="block truncate text-sm font-semibold">{x.name}</span>
                      <span className="num block truncate text-[12.5px] text-muted">{x.skills.join(", ")} · TJM {gnf(x.dailyRate)} · commandé {gnf(cost)}</span>
                    </button>
                    <Button size="sm" variant="ghost" icon={<ShoppingCart />} onClick={() => openSheet({ kind: "po", projectId: p.id, providerId: x.id })}>Commander</Button>
                    <Button size="sm" variant="ghost" icon={<FileCheck2 />} onClick={() => openSheet({ kind: "attestation", projectId: p.id, providerId: x.id })}>Attestation</Button>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <Card>
            <div className="label-caps mb-2">Client</div>
            <button type="button" className="text-left font-semibold hover:text-accent" onClick={() => client && openSheet({ kind: "client", id: client.id })}>{client?.name ?? "—"}</button>
            {client?.contactName && <p className="text-sm text-muted">{client.contactName}</p>}
            {client?.phone && <p className="num mt-1 flex items-center gap-1.5 text-sm text-muted"><Phone className="size-3.5" />{client.phone}</p>}
            {p.location && <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><MapPin className="size-3.5" />{p.location}</p>}
          </Card>
          <Card>
            <div className="label-caps mb-1">Synthèse</div>
            <KV k="Statut" v={<Badge tone={PROJECT_STATUS[p.status].tone}>{PROJECT_STATUS[p.status].label}</Badge>} />
            <KV k="Budget HT" v={gnf(p.budget)} />
            <KV k="Reste à facturer" v={gnf(Math.max(0, p.budget - f.invoicedHT))} />
            <KV k="Facturé TTC" v={gnf(f.invoicedTTC)} />
          </Card>
          {p.description && <Card><div className="label-caps mb-1">Description</div><p className="text-sm text-muted">{p.description}</p></Card>}
          <ConfirmButton icon={<Trash2 />} confirmLabel="Supprimer le projet et ses documents" onConfirm={() => { remove("projects", p.id); toast("Projet supprimé avec ses documents."); onBack(); }}>Supprimer le projet</ConfirmButton>
        </aside>
      </div>
    </div>
  );
}
