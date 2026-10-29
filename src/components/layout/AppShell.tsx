"use client";

import { Menu, Plus, Search } from "lucide-react";
import { useCallback, useEffect } from "react";
import { Button, IconButton, cx } from "@/components/ui";
import { useHotkey } from "@/hooks/useHotkey";
import { useAppStore } from "@/store/useAppStore";
import { readHash, useUi } from "@/store/useUiStore";
import { CommandPalette } from "./CommandPalette";
import { NAV, Sidebar } from "./Sidebar";
import { SheetHost } from "./SheetHost";
import { Toaster } from "./Toaster";
import { DashboardView } from "@/components/modules/dashboard/DashboardView";
import { ProjectsView } from "@/components/modules/projects/ProjectsView";
import { ProjectDetail } from "@/components/modules/projects/ProjectDetail";
import { InvoicesView } from "@/components/modules/invoices/InvoicesView";
import { PurchaseOrdersView } from "@/components/modules/purchase-orders/PurchaseOrdersView";
import { AttestationsView } from "@/components/modules/attestations/AttestationsView";
import { RemindersView } from "@/components/modules/reminders/RemindersView";
import { ReportsView } from "@/components/modules/reports/ReportsView";
import { SettingsView } from "@/components/modules/settings/SettingsView";

export default function AppShell() {
  const hydrated = useAppStore((s) => s.hydrated);
  const { module, projectId, go, setNav, setPalette, openSheet, toast } = useUi();

  // Navigation par ancre : #projets, #projets-<id>… (retour arrière et liens partageables)
  useEffect(() => {
    const sync = () => { const h = readHash(); useUi.setState({ module: h.module, projectId: h.projectId }); };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    const onErr = (e: Event) => {
      const d = (e as CustomEvent).detail as string;
      const msg: Record<string, string> = {
        quota: "Stockage plein : exportez une sauvegarde puis supprimez d'anciens documents.",
        nodb: "Vos données ne peuvent pas être enregistrées ici. Ouvrez l'application connecté à votre compte.",
        nodownload: "Le téléchargement de fichiers n'est pas disponible dans cette vue.",
        busy: "Une fenêtre d'enregistrement est déjà ouverte.",
      };
      toast(msg[d] ?? "Enregistrement interrompu : réessayez dans un instant.", "bad");
    };
    window.addEventListener("gsc:storage-error", onErr);
    return () => window.removeEventListener("gsc:storage-error", onErr);
  }, [toast]);

  const openPalette = useCallback(() => setPalette(true), [setPalette]);
  useHotkey("k", openPalette);

  const current = NAV.find((n) => n.key === module);

  return (
    <div className="min-h-dvh">
      <Sidebar />
      <div className="lg:pl-[260px]">
        {/* Barre supérieure mobile */}
        <div className="sticky z-20 border-b border-line bg-surface/95 backdrop-blur lg:hidden" style={{ top: "env(safe-area-inset-top, 0px)" }}>
          <div className="gutter flex h-14 items-center gap-2">
            <IconButton label="Ouvrir le menu" className="-ml-2" onClick={() => setNav(true)}><Menu /></IconButton>
            <span className="truncate font-display text-[15px] font-bold">{current?.label}</span>
            <IconButton label="Rechercher" className="ml-auto" onClick={openPalette}><Search /></IconButton>
            <Button variant="primary" size="sm" icon={<Plus />} onClick={() => openSheet({ kind: "invoice" })}>Facture</Button>
          </div>
        </div>

        <main className={cx("gutter mx-auto max-w-[1200px] pb-24 pt-5 lg:pt-8")}>
          {!hydrated ? (
            <div className="grid gap-3" aria-busy="true" aria-label="Chargement">
              <div className="h-9 w-56 animate-pulse rounded-lg bg-sunken" />
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-card bg-sunken" />)}</div>
              <div className="h-72 animate-pulse rounded-card bg-sunken" />
            </div>
          ) : module === "projets" && projectId ? (
            <ProjectDetail id={projectId} onBack={() => go("projets")} />
          ) : module === "projets" ? <ProjectsView />
            : module === "factures" ? <InvoicesView />
            : module === "commandes" ? <PurchaseOrdersView />
            : module === "attestations" ? <AttestationsView />
            : module === "relances" ? <RemindersView />
            : module === "bilan" ? <ReportsView />
            : module === "parametres" ? <SettingsView />
            : <DashboardView />}
        </main>
      </div>
      {hydrated && <SheetHost />}
      {hydrated && <CommandPalette />}
      <Toaster />
    </div>
  );
}
