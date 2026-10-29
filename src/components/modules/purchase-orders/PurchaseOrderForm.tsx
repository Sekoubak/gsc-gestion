"use client";

import { Download, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, ConfirmButton, Input, Select, Sheet, Textarea } from "@/components/ui";
import { ItemsEditor, newLine } from "@/components/documents/ItemsEditor";
import { today } from "@/lib/format";
import { PO_STATUS } from "@/lib/labels";
import type { POStatus, PurchaseOrder } from "@/lib/types";
import { useDocActions } from "@/hooks/useDocActions";
import { useLookups } from "@/hooks/useLookups";
import { useAppStore } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";

type Draft = Omit<PurchaseOrder, "id" | "createdAt" | "number" | "year" | "seq">;

export function PurchaseOrderForm({ id, projectId, providerId }: { id?: string; projectId?: string; providerId?: string }) {
  const s = useAppStore();
  const { closeSheet, openSheet, toast } = useUi();
  const L = useLookups();
  const act = useDocActions();
  const existing = id ? s.purchaseOrders.find((p) => p.id === id) : undefined;
  const pj = projectId ?? s.projects.find((p) => p.status === "en_cours")?.id ?? s.projects[0]?.id ?? "";
  const pv = providerId ?? L.project(pj)?.providerIds[0] ?? s.providers[0]?.id ?? "";

  const [f, setF] = useState<Draft>(() => existing
    ? (({ id: _i, createdAt: _c, number: _n, year: _y, seq: _s, ...rest }) => rest)(existing)
    : { projectId: pj, providerId: pv, issueDate: today(), deliveryDate: "", subject: "", items: [newLine({ unitPrice: s.providers.find((x) => x.id === pv)?.dailyRate ?? 0 })], vatEnabled: false, vatRate: s.company.vatRate, notes: "", status: "brouillon", paidDate: "" });
  const set = (p: Partial<Draft>) => setF((x) => ({ ...x, ...p }));
  const project = L.project(f.projectId);
  const provider = L.provider(f.providerId);
  const projectProviders = project ? s.providers.filter((p) => project.providerIds.includes(p.id)) : [];
  const otherProviders = s.providers.filter((p) => !projectProviders.includes(p));

  if (s.projects.length === 0 || s.providers.length === 0) {
    return (
      <Sheet title="Nouveau bon de commande" onClose={closeSheet}>
        <Card><p className="text-sm">Un bon de commande relie un projet à un prestataire. Il faut au moins un projet et un prestataire enregistrés.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {s.projects.length === 0 && <Button variant="primary" onClick={() => openSheet({ kind: "project" })}>Créer un projet</Button>}
            {s.providers.length === 0 && <Button variant="primary" onClick={() => openSheet({ kind: "provider" })}>Ajouter un prestataire</Button>}
          </div></Card>
      </Sheet>
    );
  }

  const persist = (): PurchaseOrder | null => {
    const items = f.items.filter((x) => x.description.trim() || x.unitPrice);
    if (!f.projectId || !f.providerId) { toast("Choisissez le projet et le prestataire.", "bad"); return null; }
    if (!items.length) { toast("Ajoutez au moins une ligne.", "bad"); return null; }
    if (!f.subject.trim()) { toast("Indiquez l'objet de la commande.", "bad"); return null; }
    const body = { ...f, items, paidDate: f.status === "paye" ? f.paidDate || today() : "" };
    if (existing) return s.upsert("purchaseOrders", { ...existing, ...body });
    return s.createPurchaseOrder(body);
  };

  const save = () => {
    const po = persist();
    if (!po) return;
    toast(existing ? `Bon de commande ${po.number} mis à jour.` : `Bon de commande ${po.number} créé.`);
    closeSheet();
  };

  return (
    <Sheet wide title={existing ? `Bon de commande ${existing.number}` : "Nouveau bon de commande"} sub={existing ? <Badge tone={PO_STATUS[existing.status].tone}>{PO_STATUS[existing.status].label}</Badge> : "Commande passée à un prestataire : elle alimente les coûts et la marge du projet."} onClose={closeSheet}
      footer={<>
        <Button variant="primary" onClick={save}>{existing ? "Enregistrer" : "Créer le bon de commande"}</Button>
        <Button icon={<Download />} onClick={() => { const po = persist(); if (po) act.purchaseOrder(po); }}>PDF</Button>
        <Button icon={<Send />} onClick={() => { const po = persist(); if (po) act.purchaseOrder(po, true); }}>Envoyer</Button>
        <span className="ml-auto" />
        {existing && <ConfirmButton icon={<Trash2 />} onConfirm={() => { s.remove("purchaseOrders", existing.id); closeSheet(); toast("Bon de commande supprimé."); }}>Supprimer</ConfirmButton>}
      </>}>
      <div className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Projet" value={f.projectId} onChange={(e) => { const p = L.project(e.target.value); set({ projectId: e.target.value, providerId: p?.providerIds[0] ?? f.providerId }); }}>
            {s.projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
          </Select>
          <Select label="Prestataire" value={f.providerId} onChange={(e) => set({ providerId: e.target.value })} hint={provider ? `TJM de référence : ${provider.dailyRate.toLocaleString("fr-FR").replace(/\u202F/g, " ")} GNF` : undefined}>
            {projectProviders.length > 0 && <optgroup label="Équipe du projet">{projectProviders.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>}
            <optgroup label={projectProviders.length ? "Autres prestataires" : "Prestataires"}>{otherProviders.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>
          </Select>
          <Input label="Objet" wrapClass="sm:col-span-2" placeholder="Ex. Agents de sécurité — T4 2026" value={f.subject} onChange={(e) => set({ subject: e.target.value })} />
          <Input label="Date d'émission" type="date" value={f.issueDate} onChange={(e) => set({ issueDate: e.target.value })} />
          <Input label="Date de livraison / fin" type="date" value={f.deliveryDate} onChange={(e) => set({ deliveryDate: e.target.value })} />
          <Select label="Statut" value={f.status} onChange={(e) => set({ status: e.target.value as POStatus, paidDate: e.target.value === "paye" ? f.paidDate || today() : "" })}>
            {Object.entries(PO_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
          {f.status === "paye" && <Input label="Date de paiement" type="date" value={f.paidDate} onChange={(e) => set({ paidDate: e.target.value })} hint="Compte comme sortie de trésorerie dans le bilan." />}
        </div>
        <div>
          <h3 className="mb-2 font-display font-bold">Prestations commandées</h3>
          <ItemsEditor items={f.items} onItems={(items) => set({ items })} vatEnabled={f.vatEnabled} vatRate={f.vatRate} onVat={(vatEnabled, vatRate) => set({ vatEnabled, vatRate })}
            suggestions={provider ? [{ label: `Jours de ${provider.name.replace(/ \(exemple\)$/, "")} au TJM`, line: { description: `${provider.skills[0] ?? "Prestation"} — ${provider.name.replace(/ \(exemple\)$/, "")}`, unit: "jour", quantity: 1, unitPrice: provider.dailyRate } }] : undefined} />
        </div>
        <Textarea label="Notes" placeholder="Conditions particulières, lieu, horaires…" value={f.notes} onChange={(e) => set({ notes: e.target.value })} />
      </div>
    </Sheet>
  );
}
