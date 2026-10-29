"use client";

import { Building2, Download, ImageUp, Plus, RotateCcw, Trash2, Upload, Users } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Button, Card, ConfirmButton, DemoTag, Input, PageHeader, SectionTitle, Tabs, Textarea, cx } from "@/components/ui";
import { gnf } from "@/lib/format";
import { prepareImage } from "@/lib/image";
import type { AppData, Branding, Company } from "@/lib/types";
import { useDocActions } from "@/hooks/useDocActions";
import { useAppStore, selectData } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";

type Tab = "identite" | "signatures" | "clients" | "prestataires" | "facturation" | "donnees";

export function SettingsView() {
  const [tab, setTab] = useState<Tab>("identite");
  const s = useAppStore();
  return (
    <div className="fade-in">
      <PageHeader title="Paramètres" sub="Identité de l'entreprise, signatures, registres et préférences de facturation." />
      <div className="mb-5">
        <Tabs<Tab> value={tab} onChange={setTab} items={[
          { key: "identite", label: "Identité" },
          { key: "signatures", label: "Signature et cachet" },
          { key: "clients", label: "Clients", count: s.clients.length },
          { key: "prestataires", label: "Prestataires", count: s.providers.length },
          { key: "facturation", label: "Facturation et relances" },
          { key: "donnees", label: "Données" },
        ]} />
      </div>
      {tab === "identite" && <CompanyTab />}
      {tab === "signatures" && <SignaturesTab />}
      {tab === "clients" && <ClientsTab />}
      {tab === "prestataires" && <ProvidersTab />}
      {tab === "facturation" && <BillingTab />}
      {tab === "donnees" && <DataTab />}
    </div>
  );
}

/* ---------- Brouillon local + bouton Enregistrer ---------- */
function useCompanyDraft() {
  const company = useAppStore((s) => s.company);
  const setCompany = useAppStore((s) => s.setCompany);
  const toast = useUi((s) => s.toast);
  const [d, setD] = useState<Company>(company);
  const dirty = JSON.stringify(d) !== JSON.stringify(company);
  const save = () => { setCompany(d); toast("Paramètres enregistrés."); };
  const bar = (
    <div className="sticky bottom-0 z-10 -mx-1 mt-5 flex items-center gap-3 border-t border-line bg-bg/95 px-1 py-3 backdrop-blur" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}>
      <Button variant="primary" disabled={!dirty} onClick={save}>Enregistrer</Button>
      {dirty && <Button variant="ghost" onClick={() => setD(company)}>Annuler les modifications</Button>}
      {dirty && <span className="text-[12.5px] text-warn">Modifications non enregistrées</span>}
    </div>
  );
  return { d, set: (p: Partial<Company>) => setD((x) => ({ ...x, ...p })), bar };
}

function ImageSlot({ k, label, hint, removeWhite }: { k: keyof Branding; label: string; hint: ReactNode; removeWhite: boolean }) {
  const value = useAppStore((s) => s.branding[k]);
  const setBranding = useAppStore((s) => s.setBranding);
  const toast = useUi((s) => s.toast);
  const [clear, setClear] = useState(removeWhite);
  const input = useRef<HTMLInputElement>(null);
  const onFile = async (file?: File) => {
    if (!file) return;
    try { setBranding({ [k]: await prepareImage(file, { removeWhite: clear }) }); toast(`${label} enregistré${k === "signature" ? "e" : ""}.`); }
    catch { toast("Image illisible : utilisez une photo JPG ou PNG.", "bad"); }
  };
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <div className="font-semibold">{label}</div>
      <div className="checker grid h-32 place-items-center overflow-hidden rounded-lg border border-line">
        {value ? <img src={value} alt={label} className="max-h-28 max-w-[90%] object-contain" /> : <span className="text-[12.5px] text-[#6b7480]">Aucune image</span>}
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} aria-label={`Importer ${label}`} />
      <label className="inline-flex cursor-pointer items-center gap-2 text-[13px]">
        <input type="checkbox" checked={clear} onChange={(e) => setClear(e.target.checked)} className="size-4 accent-[rgb(var(--accent))]" />
        Rendre le fond blanc transparent
      </label>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" icon={<ImageUp />} onClick={() => input.current?.click()}>{value ? "Remplacer" : "Importer"}</Button>
        {value && <Button size="sm" variant="ghost" onClick={() => setBranding({ [k]: null })}>Retirer</Button>}
      </div>
      <p className="text-[12px] text-muted">{hint}</p>
    </div>
  );
}

function CompanyTab() {
  const { d, set, bar } = useCompanyDraft();
  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card>
          <SectionTitle title="Coordonnées" sub="Elles figurent en en-tête et en pied de chaque document." />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Raison sociale" wrapClass="sm:col-span-2" value={d.name} onChange={(e) => set({ name: e.target.value })} />
            <Input label="Activité" wrapClass="sm:col-span-2" value={d.tagline} onChange={(e) => set({ tagline: e.target.value })} />
            <Input label="Adresse" value={d.address} placeholder="Quartier, commune" onChange={(e) => set({ address: e.target.value })} />
            <Input label="Ville" value={d.city} onChange={(e) => set({ city: e.target.value })} />
            <Input label="Téléphone" inputMode="tel" value={d.phone} placeholder="+224 …" onChange={(e) => set({ phone: e.target.value })} />
            <Input label="E-mail" type="email" value={d.email} onChange={(e) => set({ email: e.target.value })} />
            <Input label="RCCM" value={d.rccm} placeholder="GN.TCC.…" onChange={(e) => set({ rccm: e.target.value })} />
            <Input label="NIF" value={d.nif} onChange={(e) => set({ nif: e.target.value })} />
            <Input label="Site web" wrapClass="sm:col-span-2" value={d.website} onChange={(e) => set({ website: e.target.value })} />
          </div>
          <SectionTitle title="Coordonnées de paiement" sub="Imprimées sur les factures." />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Banque" value={d.bankName} onChange={(e) => set({ bankName: e.target.value })} />
            <Input label="N° de compte / IBAN" value={d.bankAccount} onChange={(e) => set({ bankAccount: e.target.value })} />
            <Input label="Mobile Money" wrapClass="sm:col-span-2" placeholder="Orange Money : 6XX XX XX XX" value={d.mobileMoney} onChange={(e) => set({ mobileMoney: e.target.value })} />
          </div>
        </Card>
        <ImageSlot k="logo" label="Logo" removeWhite={false} hint="PNG ou JPG. Un logo sur fond transparent rend mieux sur les documents." />
      </div>
      {bar}
    </div>
  );
}

function SignaturesTab() {
  const { d, set, bar } = useCompanyDraft();
  return (
    <div>
      <Card className="mb-5">
        <SectionTitle title="Signataire" sub="Nom et fonction imprimés sous la signature." />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Nom du signataire" value={d.signatoryName} onChange={(e) => set({ signatoryName: e.target.value })} />
          <Input label="Fonction" value={d.signatoryTitle} onChange={(e) => set({ signatoryTitle: e.target.value })} />
        </div>
      </Card>
      <div className="grid gap-5 sm:grid-cols-2">
        <ImageSlot k="signature" label="Signature" removeWhite hint="Signez à l'encre foncée sur une feuille blanche et photographiez-la à la lumière du jour, sans ombre." />
        <ImageSlot k="stamp" label="Cachet" removeWhite hint="Apposez le cachet sur une feuille blanche. Il est superposé à la signature sur les factures, bons de commande et attestations." />
      </div>
      {bar}
    </div>
  );
}

function ClientsTab() {
  const clients = useAppStore((s) => s.clients);
  const projects = useAppStore((s) => s.projects);
  const openSheet = useUi((s) => s.openSheet);
  return (
    <div>
      <SectionTitle title="Registre des clients" action={<Button variant="primary" icon={<Plus />} onClick={() => openSheet({ kind: "client" })}>Nouveau client</Button>} />
      {clients.length === 0 ? <EmptyRow icon={<Building2 />} text="Aucun client enregistré." /> : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {[...clients].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => openSheet({ kind: "client", id: c.id })} className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-4 py-3 text-left transition hover:bg-sunken/60">
                <span className="flex min-w-0 items-center gap-2"><span className="truncate font-semibold">{c.name}</span>{c.demo && <DemoTag />}</span>
                <span className="num text-right text-[12.5px] text-muted">{projects.filter((p) => p.clientId === c.id).length} projet(s)</span>
                <span className="num truncate text-[12.5px] text-muted">{[c.contactName, c.phone, c.nif && `NIF ${c.nif}`].filter(Boolean).join(" · ") || "Coordonnées à compléter"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProvidersTab() {
  const providers = useAppStore((s) => s.providers);
  const openSheet = useUi((s) => s.openSheet);
  return (
    <div>
      <SectionTitle title="Registre des prestataires" action={<Button variant="primary" icon={<Plus />} onClick={() => openSheet({ kind: "provider" })}>Nouveau prestataire</Button>} />
      {providers.length === 0 ? <EmptyRow icon={<Users />} text="Aucun prestataire enregistré." /> : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {[...providers].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => openSheet({ kind: "provider", id: p.id })} className="w-full px-4 py-3 text-left transition hover:bg-sunken/60">
                <span className="flex items-center gap-2"><span className="min-w-0 truncate font-semibold">{p.name}</span>{p.demo && <DemoTag />}<span className="num ml-auto shrink-0 text-sm font-semibold">{gnf(p.dailyRate)}<span className="font-normal text-muted"> /jour</span></span></span>
                <span className="mt-1 flex flex-wrap gap-1.5">{p.skills.map((k) => <span key={k} className="rounded-md bg-sunken px-1.5 py-0.5 text-[11.5px] text-muted">{k}</span>)}</span>
                <span className="mt-1 block truncate text-[12px] text-muted">{p.bankAccount ? `${p.bankName} · ${p.bankAccount}` : p.mobileMoney || "Informations de paiement à compléter"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BillingTab() {
  const { d, set, bar } = useCompanyDraft();
  const levels = ["Rappel courtois", "Relance ferme", "Mise en demeure"];
  return (
    <div>
      <Card className="mb-5">
        <SectionTitle title="Numérotation et conditions" sub="Numéros séquentiels par année : FAC-2026-0001, BC-2026-0001, ATT-2026-0001." />
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="Préfixe factures" value={d.invoicePrefix} onChange={(e) => set({ invoicePrefix: e.target.value.toUpperCase() })} />
          <Input label="Préfixe bons de commande" value={d.poPrefix} onChange={(e) => set({ poPrefix: e.target.value.toUpperCase() })} />
          <Input label="Préfixe attestations" value={d.attestationPrefix} onChange={(e) => set({ attestationPrefix: e.target.value.toUpperCase() })} />
          <Input label="TVA par défaut (%)" inputMode="decimal" value={d.vatRate} onChange={(e) => set({ vatRate: Number(e.target.value.replace(",", ".")) || 0 })} />
          <Input label="Délai de paiement (jours)" inputMode="numeric" value={d.paymentTermsDays} onChange={(e) => set({ paymentTermsDays: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
        </div>
        <Textarea label="Mention en pied de facture" wrapClass="mt-3" className="min-h-[60px]" value={d.invoiceFooter} onChange={(e) => set({ invoiceFooter: e.target.value })} />
      </Card>
      <Card>
        <SectionTitle title="Relances automatiques" sub="Variables : {contact}, {client}, {numero}, {montant}, {echeance}, {jours}, {entreprise}" />
        <div className="flex flex-col gap-4">
          {levels.map((l, i) => (
            <div key={l} className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
              <Input label={`${l} à J+`} inputMode="numeric" value={d.reminderDays[i]}
                onChange={(e) => { const v = [...d.reminderDays] as Company["reminderDays"]; v[i] = Number(e.target.value.replace(/\D/g, "")) || 0; set({ reminderDays: v }); }} />
              <Textarea label="Message" className="min-h-[84px]" value={d.reminderTemplates[i]}
                onChange={(e) => { const v = [...d.reminderTemplates] as Company["reminderTemplates"]; v[i] = e.target.value; set({ reminderTemplates: v }); }} />
            </div>
          ))}
        </div>
      </Card>
      {bar}
    </div>
  );
}

function DataTab() {
  const s = useAppStore();
  const { toast } = useUi();
  const act = useDocActions();
  const input = useRef<HTMLInputElement>(null);
  const demoCount = [s.clients, s.providers, s.projects, s.invoices, s.purchaseOrders, s.attestations].reduce((a, l) => a + l.filter((x) => x.demo).length, 0);

  const exportJson = () => {
    const data = selectData(useAppStore.getState());
    const blob = new Blob([JSON.stringify({ app: "gsc-gestion", version: 1, exportedAt: new Date().toISOString(), data }, null, 2)], { type: "application/json" });
    act.file(blob, `Sauvegarde GSC Gestion ${new Date().toISOString().slice(0, 10)}.json`);
  };
  const importJson = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const data: AppData = parsed.data ?? parsed;
      if (!Array.isArray(data.projects) || !Array.isArray(data.invoices)) throw new Error("format");
      s.replaceAll(data);
      toast(`Sauvegarde restaurée : ${data.projects.length} projets, ${data.invoices.length} factures.`);
    } catch { toast("Fichier non reconnu : choisissez une sauvegarde exportée depuis GSC Gestion.", "bad"); }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <SectionTitle title="Sauvegarde" sub="Exportez régulièrement vos données : le fichier contient projets, documents, registres et images." />
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={<Download />} onClick={exportJson}>Exporter une sauvegarde</Button>
          <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { importJson(e.target.files?.[0]); e.target.value = ""; }} aria-label="Restaurer une sauvegarde" />
          <Button icon={<Upload />} onClick={() => input.current?.click()}>Restaurer…</Button>
        </div>
        <p className="mt-3 text-[12.5px] text-muted">La restauration remplace toutes les données actuelles par celles du fichier.</p>
      </Card>
      <Card className={cx(demoCount > 0 && "border-warn/50")}>
        <SectionTitle title="Données d'exemple" sub={demoCount ? `${demoCount} éléments marqués « Exemple » sont présents.` : "Aucune donnée d'exemple."} />
        <div className="flex flex-wrap gap-2">
          {demoCount > 0
            ? <ConfirmButton icon={<Trash2 />} confirmLabel="Confirmer : supprimer les exemples" onConfirm={() => { s.clearDemo(); toast("Données d'exemple supprimées. Vos propres données sont conservées."); }}>Supprimer les exemples</ConfirmButton>
            : <Button icon={<RotateCcw />} onClick={() => { s.loadDemo(); toast("Données d'exemple chargées."); }}>Charger les exemples</Button>}
        </div>
      </Card>
      <Card className="lg:col-span-2">
        <SectionTitle title="Tout effacer" sub="Supprime projets, documents, clients, prestataires. Les paramètres de l'entreprise sont réinitialisés." />
        <ConfirmButton icon={<Trash2 />} confirmLabel="Confirmer l'effacement complet" onConfirm={() => { s.resetAll(); toast("Toutes les données ont été effacées."); }}>Effacer toutes les données</ConfirmButton>
      </Card>
    </div>
  );
}

function EmptyRow({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="flex items-center gap-3 rounded-card border border-dashed border-line bg-surface px-4 py-6 text-sm text-muted [&_svg]:size-5">{icon}{text}</div>;
}
