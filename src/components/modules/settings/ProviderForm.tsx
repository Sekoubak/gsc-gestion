"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, ConfirmButton, Input, MoneyInput, Select, Sheet } from "@/components/ui";
import type { Provider } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";

type Draft = Omit<Provider, "id" | "createdAt">;

export function ProviderForm({ id }: { id?: string }) {
  const s = useAppStore();
  const { closeSheet, toast } = useUi();
  const existing = id ? s.providers.find((p) => p.id === id) : undefined;
  const [f, setF] = useState<Draft>(() => existing ? (({ id: _i, createdAt: _c, ...r }) => r)(existing) : { name: "", kind: "individuel", skills: [], dailyRate: 0, phone: "", email: "", nif: "", bankName: "", bankAccount: "", mobileMoney: "" });
  const [skills, setSkills] = useState(f.skills.join(", "));
  const set = (p: Partial<Draft>) => setF((x) => ({ ...x, ...p }));
  const used = existing ? s.purchaseOrders.filter((o) => o.providerId === existing.id).length + s.attestations.filter((a) => a.providerId === existing.id).length : 0;

  const save = () => {
    if (!f.name.trim()) return toast("Le nom du prestataire est obligatoire.", "bad");
    const body = { ...f, skills: skills.split(",").map((x) => x.trim()).filter(Boolean) };
    s.upsert("providers", existing ? { ...existing, ...body } : body);
    toast(existing ? "Prestataire mis à jour." : "Prestataire ajouté.");
    closeSheet();
  };

  return (
    <Sheet title={existing ? existing.name : "Nouveau prestataire"} onClose={closeSheet}
      footer={<>
        <Button variant="primary" onClick={save}>Enregistrer</Button><Button variant="ghost" onClick={closeSheet}>Annuler</Button>
        <span className="ml-auto" />
        {existing && (used ? <span className="text-[12.5px] text-muted">Lié à {used} document{used > 1 ? "s" : ""} : suppression impossible</span>
          : <ConfirmButton icon={<Trash2 />} onConfirm={() => { s.remove("providers", existing.id); closeSheet(); toast("Prestataire supprimé."); }}>Supprimer</ConfirmButton>)}
      </>}>
      <div className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Nom ou raison sociale" wrapClass="sm:col-span-2" value={f.name} onChange={(e) => set({ name: e.target.value })} />
          <Select label="Type" value={f.kind} onChange={(e) => set({ kind: e.target.value as Provider["kind"] })}>
            <option value="individuel">Prestataire individuel</option><option value="societe">Société</option>
          </Select>
          <MoneyInput label="Tarif journalier (TJM)" value={f.dailyRate} onChange={(dailyRate) => set({ dailyRate })} hint="Proposé automatiquement sur les bons de commande." />
          <Input label="Compétences" wrapClass="sm:col-span-2" placeholder="Séparées par des virgules : Réseaux, Fibre optique" value={skills} onChange={(e) => setSkills(e.target.value)} />
          <Input label="Téléphone" inputMode="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
          <Input label="E-mail" type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} />
          <Input label="NIF" value={f.nif} onChange={(e) => set({ nif: e.target.value })} />
        </div>
        <div>
          <h3 className="mb-2 font-display font-bold">Informations de paiement</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Banque" value={f.bankName} onChange={(e) => set({ bankName: e.target.value })} />
            <Input label="N° de compte / IBAN" value={f.bankAccount} onChange={(e) => set({ bankAccount: e.target.value })} />
            <Input label="Mobile Money" wrapClass="sm:col-span-2" placeholder="Numéro Orange Money ou MTN MoMo" value={f.mobileMoney} onChange={(e) => set({ mobileMoney: e.target.value })} />
          </div>
        </div>
      </div>
    </Sheet>
  );
}
