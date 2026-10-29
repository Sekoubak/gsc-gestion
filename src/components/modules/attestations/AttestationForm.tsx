"use client";

import { Download, Send, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";
import { Button, Card, ConfirmButton, Input, Select, Sheet, Textarea } from "@/components/ui";
import { fd, fdLong, today, workingDays } from "@/lib/format";
import type { Attestation } from "@/lib/types";
import { useDocActions } from "@/hooks/useDocActions";
import { useLookups } from "@/hooks/useLookups";
import { useAppStore } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";

type Draft = Omit<Attestation, "id" | "createdAt" | "number" | "year" | "seq">;
const APPRECIATIONS = ["à notre entière satisfaction", "conformément aux termes du bon de commande", "dans les délais et selon les règles de l'art"];

export function AttestationForm({ id, projectId, providerId }: { id?: string; projectId?: string; providerId?: string }) {
  const s = useAppStore();
  const { closeSheet, openSheet, toast } = useUi();
  const L = useLookups();
  const act = useDocActions();
  const existing = id ? s.attestations.find((a) => a.id === id) : undefined;

  /** Pré-remplissage à partir du projet et des bons de commande du prestataire. */
  const autofill = (pjId: string, pvId: string): Partial<Draft> => {
    const p = L.project(pjId);
    const pos = s.purchaseOrders.filter((o) => o.projectId === pjId && o.providerId === pvId && o.status !== "annule");
    const days = pos.flatMap((o) => o.items).filter((it) => it.unit === "jour").reduce((a, it) => a + it.quantity, 0);
    const start = pos.map((o) => o.issueDate).sort()[0] ?? p?.startDate ?? today();
    const end = pos.map((o) => o.deliveryDate).filter(Boolean).sort().at(-1) ?? (p?.endDate && p.endDate < today() ? p.endDate : today());
    const subjects = [...new Set(pos.map((o) => o.subject))];
    return {
      periodStart: start, periodEnd: end,
      days: days || workingDays(start, end),
      mission: subjects.length ? `${subjects.join(" ; ")}. ${p?.description ?? ""}`.trim() : p?.description ?? "",
      location: p?.location ?? "",
    };
  };

  const [f, setF] = useState<Draft>(() => {
    if (existing) { const { id: _i, createdAt: _c, number: _n, year: _y, seq: _s, ...rest } = existing; return rest; }
    const pj = projectId ?? s.projects.find((p) => p.status === "termine")?.id ?? s.projects[0]?.id ?? "";
    const pv = providerId ?? L.project(pj)?.providerIds[0] ?? "";
    return { projectId: pj, providerId: pv, issueDate: today(), periodStart: "", periodEnd: "", days: 0, mission: "", location: "", appreciation: APPRECIATIONS[0], ...autofill(pj, pv) } as Draft;
  });
  const set = (p: Partial<Draft>) => setF((x) => ({ ...x, ...p }));
  const project = L.project(f.projectId);
  const team = project ? s.providers.filter((p) => project.providerIds.includes(p.id)) : [];

  if (s.projects.length === 0 || s.providers.length === 0) {
    return (
      <Sheet title="Attestation de service" onClose={closeSheet}>
        <Card><p className="text-sm">Une attestation concerne un prestataire mobilisé sur un projet. Enregistrez d&apos;abord un projet et son équipe.</p>
          <Button className="mt-3" variant="primary" onClick={() => openSheet({ kind: s.projects.length ? "provider" : "project" })}>{s.projects.length ? "Ajouter un prestataire" : "Créer un projet"}</Button></Card>
      </Sheet>
    );
  }

  const persist = () => {
    if (!f.providerId) { toast("Choisissez le prestataire.", "bad"); return null; }
    if (!f.mission.trim()) { toast("Décrivez la mission réalisée.", "bad"); return null; }
    if (f.periodEnd < f.periodStart) { toast("La date de fin précède la date de début.", "bad"); return null; }
    return existing ? s.upsert("attestations", { ...existing, ...f }) : s.createAttestation(f);
  };

  return (
    <Sheet wide title={existing ? `Attestation ${existing.number}` : "Générer une attestation de service"} sub="Document signé et cacheté, à remettre au prestataire." onClose={closeSheet}
      footer={<>
        <Button variant="primary" icon={<Download />} onClick={async () => { const a = persist(); if (a) { await act.attestation(a); if (!existing) openSheet({ kind: "attestation", id: a.id }); } }}>{existing ? "Enregistrer et télécharger" : "Créer et télécharger le PDF"}</Button>
        <Button icon={<Send />} onClick={() => { const a = persist(); if (a) act.attestation(a, true); }}>Envoyer</Button>
        <span className="ml-auto" />
        {existing && <ConfirmButton icon={<Trash2 />} onConfirm={() => { s.remove("attestations", existing.id); closeSheet(); toast("Attestation supprimée."); }}>Supprimer</ConfirmButton>}
      </>}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <Select label="Projet" value={f.projectId} onChange={(e) => { const pv = L.project(e.target.value)?.providerIds[0] ?? ""; set({ projectId: e.target.value, providerId: pv, ...autofill(e.target.value, pv) }); }}>
            {s.projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
          </Select>
          <Select label="Prestataire" value={f.providerId} onChange={(e) => set({ providerId: e.target.value, ...autofill(f.projectId, e.target.value) })}
            hint={team.length ? "Prestataires affectés au projet." : "Aucun prestataire affecté à ce projet : ajoutez-le dans la fiche projet."}>
            {team.length === 0 && <option value="">—</option>}
            {team.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Début de mission" type="date" value={f.periodStart} onChange={(e) => set({ periodStart: e.target.value, days: workingDays(e.target.value, f.periodEnd) })} />
            <Input label="Fin de mission" type="date" value={f.periodEnd} onChange={(e) => set({ periodEnd: e.target.value, days: workingDays(f.periodStart, e.target.value) })} />
            <Input label="Jours de prestation" inputMode="numeric" value={f.days || ""} onChange={(e) => set({ days: Number(e.target.value.replace(/\D/g, "")) || 0 })} hint="Calculé en jours ouvrés, modifiable." />
            <Input label="Date de l'attestation" type="date" value={f.issueDate} onChange={(e) => set({ issueDate: e.target.value })} />
          </div>
          <Input label="Lieu d'exécution" value={f.location} onChange={(e) => set({ location: e.target.value })} />
          <Textarea label="Description de la mission" className="min-h-[120px]" value={f.mission} onChange={(e) => set({ mission: e.target.value })} />
          <Button size="sm" variant="ghost" icon={<Wand2 />} className="-ml-2 self-start" onClick={() => set(autofill(f.projectId, f.providerId))}>Reprendre les informations du projet et des bons de commande</Button>
          <Select label="Appréciation" value={f.appreciation} onChange={(e) => set({ appreciation: e.target.value })}>
            {[...new Set([...APPRECIATIONS, f.appreciation])].map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
        </div>

        {/* Aperçu du texte */}
        <div className="rounded-card border border-line bg-surface p-5 text-[13.5px] leading-relaxed">
          <div className="label-caps text-accent">Aperçu</div>
          <h3 className="mt-1 font-display text-base font-bold">Attestation de service fait</h3>
          <p className="mt-3">Je soussigné(e), <b>{s.company.signatoryName || "[signataire]"}</b>, {(s.company.signatoryTitle || "").replace(/^Le |^La /, "").toLowerCase()} de {s.company.name}, atteste que <b>{L.provider(f.providerId)?.name ?? "[prestataire]"}</b> a réalisé, dans le cadre du projet « {project?.name} » pour {L.clientName(project?.clientId)}, la mission suivante :</p>
          <p className="mt-2 border-l-2 border-accent pl-3 italic">{f.mission || "…"}</p>
          <p className="mt-2 text-muted">Période : du {fdLong(f.periodStart)} au {fdLong(f.periodEnd)}{f.days ? ` · ${f.days} jours` : ""}{f.location ? ` · ${f.location}` : ""}</p>
          <p className="mt-2">La prestation a été exécutée {f.appreciation}.</p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-center text-[12px] text-muted">
            <div className="border-t border-line pt-2">Le prestataire</div>
            <div className="border-t border-line pt-2">{s.company.signatoryTitle}<br />{s.branding.signature && s.branding.stamp ? "signature + cachet" : <span className="text-warn">signature ou cachet manquant</span>}</div>
          </div>
          <p className="mt-3 text-right text-[12px] text-muted">Fait le {fd(f.issueDate)}</p>
        </div>
      </div>
    </Sheet>
  );
}
