"use client";

import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { Button, Input, MoneyInput, Select, Sheet, Textarea, cx } from "@/components/ui";
import { nextProjectCode } from "@/lib/calc";
import { gnf, today } from "@/lib/format";
import { PROJECT_STATUS } from "@/lib/labels";
import type { Project, ProjectStatus } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";

type Draft = Omit<Project, "id" | "createdAt">;

export function ProjectForm({ id }: { id?: string }) {
  const s = useAppStore();
  const { closeSheet, openSheet, toast, go } = useUi();
  const existing = id ? s.projects.find((p) => p.id === id) : undefined;
  const [f, setF] = useState<Draft>(() => existing
    ? (({ id: _i, createdAt: _c, ...rest }) => rest)(existing)
    : { code: nextProjectCode(s.projects, today()), name: "", clientId: s.clients[0]?.id ?? "", providerIds: [], status: "en_cours", startDate: today(), endDate: "", budget: 0, location: "", description: "" });
  const set = (p: Partial<Draft>) => setF((x) => ({ ...x, ...p }));
  const toggle = (pid: string) => set({ providerIds: f.providerIds.includes(pid) ? f.providerIds.filter((x) => x !== pid) : [...f.providerIds, pid] });

  const save = () => {
    if (!f.name.trim()) return toast("Donnez un nom au projet.", "bad");
    if (!f.clientId) return toast("Choisissez le client du projet.", "bad");
    const p = s.upsert("projects", existing ? { ...existing, ...f } : f);
    toast(existing ? "Projet mis à jour." : `Projet ${p.code} créé.`);
    closeSheet();
    go("projets", p.id);
  };

  return (
    <Sheet title={existing ? "Modifier le projet" : "Nouveau projet"} onClose={closeSheet}
      footer={<><Button variant="primary" onClick={save}>{existing ? "Enregistrer" : "Créer le projet"}</Button><Button variant="ghost" onClick={closeSheet}>Annuler</Button></>}>
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
          <Input label="Code" value={f.code} onChange={(e) => set({ code: e.target.value })} />
          <Input label="Nom du projet" placeholder="Ex. Gardiennage site de Kamsar" value={f.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
        {s.clients.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line p-3 text-sm">
            Aucun client enregistré. <button type="button" className="font-semibold text-accent underline" onClick={() => openSheet({ kind: "client" })}>Ajouter un client</button>, puis revenez créer le projet.
          </div>
        ) : (
          <Select label="Client" value={f.clientId} onChange={(e) => set({ clientId: e.target.value })}>
            {s.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <Select label="Statut" value={f.status} onChange={(e) => set({ status: e.target.value as ProjectStatus })}>
            {Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
          <Input label="Début" type="date" value={f.startDate} onChange={(e) => set({ startDate: e.target.value })} />
          <Input label="Fin prévue" type="date" value={f.endDate} onChange={(e) => set({ endDate: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <MoneyInput label="Budget vendu (HT)" value={f.budget} onChange={(budget) => set({ budget })} hint="Sert à suivre la consommation du budget." />
          <Input label="Lieu d'exécution" value={f.location} onChange={(e) => set({ location: e.target.value })} />
        </div>
        <Textarea label="Description" placeholder="Périmètre, effectifs, livrables…" value={f.description} onChange={(e) => set({ description: e.target.value })} />

        <div>
          <div className="mb-1.5 flex items-center">
            <span className="text-[12.5px] font-semibold text-muted">Prestataires affectés ({f.providerIds.length})</span>
            <Button size="sm" variant="ghost" className="ml-auto" icon={<Plus />} onClick={() => openSheet({ kind: "provider" })}>Nouveau</Button>
          </div>
          {s.providers.length === 0 ? <p className="text-sm text-muted">Aucun prestataire enregistré.</p> : (
            <div className="grid gap-2 sm:grid-cols-2">
              {s.providers.map((p) => {
                const on = f.providerIds.includes(p.id);
                return (
                  <button key={p.id} type="button" aria-pressed={on} onClick={() => toggle(p.id)}
                    className={cx("flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition", on ? "border-accent bg-accent-soft/60" : "border-line bg-surface hover:border-muted")}>
                    <span className={cx("mt-0.5 grid size-5 shrink-0 place-items-center rounded border", on ? "border-accent bg-accent text-accent-ink" : "border-line")}>{on && <Check className="size-3.5" />}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{p.name}</span>
                      <span className="num block truncate text-[12px] text-muted">{p.skills.slice(0, 2).join(", ")} · {gnf(p.dailyRate)}/j</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
