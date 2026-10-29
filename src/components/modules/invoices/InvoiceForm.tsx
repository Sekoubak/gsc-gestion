"use client";

import { useState } from "react";
import { Button, Card, Input, Select, Sheet, Textarea } from "@/components/ui";
import { ItemsEditor, newLine } from "@/components/documents/ItemsEditor";
import { addDays, today } from "@/lib/format";
import type { Invoice } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";
import { useLookups } from "@/hooks/useLookups";

export function InvoiceForm({ id, projectId }: { id?: string; projectId?: string }) {
  const s = useAppStore();
  const { closeSheet, openSheet, toast } = useUi();
  const L = useLookups();
  const existing = id ? s.invoices.find((i) => i.id === id) : undefined;
  const firstProject = projectId ?? s.projects.find((p) => p.status === "en_cours")?.id ?? s.projects[0]?.id ?? "";
  const d0 = today();

  const [f, setF] = useState<Omit<Invoice, "id" | "createdAt" | "number" | "year" | "seq" | "payments" | "reminders" | "sentAt" | "status">>(() =>
    existing
      ? { projectId: existing.projectId, clientId: existing.clientId, issueDate: existing.issueDate, dueDate: existing.dueDate, subject: existing.subject, clientPoRef: existing.clientPoRef, items: existing.items, vatEnabled: existing.vatEnabled, vatRate: existing.vatRate, discount: existing.discount, notes: existing.notes, demo: existing.demo }
      : { projectId: firstProject, clientId: L.project(firstProject)?.clientId ?? "", issueDate: d0, dueDate: addDays(d0, s.company.paymentTermsDays), subject: "", clientPoRef: "", items: [newLine()], vatEnabled: true, vatRate: s.company.vatRate, discount: 0, notes: "" },
  );
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  const project = L.project(f.projectId);

  if (s.projects.length === 0) {
    return (
      <Sheet title="Nouvelle facture" onClose={closeSheet}>
        <Card><p className="text-sm">Une facture est toujours rattachée à un projet. Créez d&apos;abord le projet et son client.</p>
          <Button className="mt-3" variant="primary" onClick={() => openSheet({ kind: "project" })}>Créer un projet</Button></Card>
      </Sheet>
    );
  }

  const save = () => {
    const items = f.items.filter((x) => x.description.trim() || x.unitPrice);
    if (!f.projectId) return toast("Choisissez le projet facturé.", "bad");
    if (!items.length) return toast("Ajoutez au moins une ligne de prestation.", "bad");
    if (!f.subject.trim()) return toast("Indiquez l'objet de la facture.", "bad");
    const body = { ...f, items, clientId: project?.clientId ?? f.clientId };
    if (existing) {
      s.upsert("invoices", { ...existing, ...body });
      toast(`Facture ${existing.number} mise à jour.`);
      openSheet({ kind: "invoice-view", id: existing.id });
    } else {
      const inv = s.createInvoice(body);
      toast(`Facture ${inv.number} créée en brouillon.`);
      openSheet({ kind: "invoice-view", id: inv.id });
    }
  };

  return (
    <Sheet wide title={existing ? `Modifier ${existing.number}` : "Nouvelle facture"} sub={existing ? "Le numéro reste inchangé." : "Le numéro est attribué à l'enregistrement, dans l'ordre chronologique."} onClose={closeSheet}
      footer={<><Button variant="primary" onClick={save}>{existing ? "Enregistrer" : "Créer la facture"}</Button><Button variant="ghost" onClick={closeSheet}>Annuler</Button></>}>
      <div className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Projet" value={f.projectId} onChange={(e) => { const p = L.project(e.target.value); set({ projectId: e.target.value, clientId: p?.clientId ?? "" }); }}>
            {s.projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
          </Select>
          <Input label="Client facturé" value={project ? L.clientName(project.clientId) : ""} readOnly className="bg-sunken" hint="Repris du projet." />
          <Input label="Objet" wrapClass="sm:col-span-2" placeholder="Ex. Mise à disposition de personnel — octobre 2026" value={f.subject} onChange={(e) => set({ subject: e.target.value })} />
          <Input label="Date d'émission" type="date" value={f.issueDate} onChange={(e) => set({ issueDate: e.target.value, dueDate: existing ? f.dueDate : addDays(e.target.value, s.company.paymentTermsDays) })} />
          <Input label="Échéance" type="date" value={f.dueDate} onChange={(e) => set({ dueDate: e.target.value })} hint={`Délai par défaut : ${s.company.paymentTermsDays} jours`} />
          <Input label="Référence du bon de commande client" wrapClass="sm:col-span-2" placeholder="Facultatif" value={f.clientPoRef} onChange={(e) => set({ clientPoRef: e.target.value })} />
        </div>
        <div>
          <h3 className="mb-2 font-display font-bold">Prestations</h3>
          <ItemsEditor items={f.items} onItems={(items) => set({ items })} vatEnabled={f.vatEnabled} vatRate={f.vatRate} onVat={(vatEnabled, vatRate) => set({ vatEnabled, vatRate })} discount={f.discount} onDiscount={(discount) => set({ discount })} />
        </div>
        <Textarea label="Notes sur la facture" placeholder="Période couverte, conditions particulières…" value={f.notes} onChange={(e) => set({ notes: e.target.value })} />
      </div>
    </Sheet>
  );
}
