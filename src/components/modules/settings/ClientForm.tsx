"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, ConfirmButton, Input, Sheet, Textarea } from "@/components/ui";
import type { Client } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";

type Draft = Omit<Client, "id" | "createdAt">;

export function ClientForm({ id }: { id?: string }) {
  const s = useAppStore();
  const { closeSheet, toast } = useUi();
  const existing = id ? s.clients.find((c) => c.id === id) : undefined;
  const [f, setF] = useState<Draft>(() => existing ? (({ id: _i, createdAt: _c, ...r }) => r)(existing) : { name: "", address: "", nif: "", rccm: "", contactName: "", phone: "", email: "" });
  const set = (p: Partial<Draft>) => setF((x) => ({ ...x, ...p }));
  const used = existing ? s.projects.filter((p) => p.clientId === existing.id).length : 0;

  const save = () => {
    if (!f.name.trim()) return toast("Le nom du client est obligatoire.", "bad");
    s.upsert("clients", existing ? { ...existing, ...f } : f);
    toast(existing ? "Client mis à jour." : "Client ajouté.");
    closeSheet();
  };

  return (
    <Sheet title={existing ? existing.name : "Nouveau client"} onClose={closeSheet}
      footer={<>
        <Button variant="primary" onClick={save}>Enregistrer</Button><Button variant="ghost" onClick={closeSheet}>Annuler</Button>
        <span className="ml-auto" />
        {existing && (used ? <span className="text-[12.5px] text-muted">Lié à {used} projet{used > 1 ? "s" : ""} : suppression impossible</span>
          : <ConfirmButton icon={<Trash2 />} onConfirm={() => { s.remove("clients", existing.id); closeSheet(); toast("Client supprimé."); }}>Supprimer</ConfirmButton>)}
      </>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Raison sociale" wrapClass="sm:col-span-2" value={f.name} onChange={(e) => set({ name: e.target.value })} />
        <Textarea label="Adresse" wrapClass="sm:col-span-2" className="min-h-[64px]" value={f.address} onChange={(e) => set({ address: e.target.value })} />
        <Input label="NIF" hint="Numéro d'identification fiscale" value={f.nif} onChange={(e) => set({ nif: e.target.value })} />
        <Input label="RCCM" value={f.rccm} onChange={(e) => set({ rccm: e.target.value })} />
        <Input label="Contact" placeholder="Nom de l'interlocuteur" value={f.contactName} onChange={(e) => set({ contactName: e.target.value })} />
        <Input label="Téléphone WhatsApp" inputMode="tel" placeholder="6XX XX XX XX" value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
        <Input label="E-mail" type="email" wrapClass="sm:col-span-2" value={f.email} onChange={(e) => set({ email: e.target.value })} />
      </div>
    </Sheet>
  );
}
