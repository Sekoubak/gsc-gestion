"use client";

import { BarChart3, BellRing, FileCheck2, FileText, FolderKanban, LayoutDashboard, Search, Settings, ShoppingCart, X } from "lucide-react";
import { useMemo } from "react";
import { cx } from "@/components/ui";
import { invoiceState, reminderStatus } from "@/lib/calc";
import type { ModuleKey } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";

export const NAV: { key: ModuleKey; label: string; icon: typeof LayoutDashboard; group: string }[] = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, group: "Pilotage" },
  { key: "projets", label: "Projets", icon: FolderKanban, group: "Pilotage" },
  { key: "factures", label: "Factures", icon: FileText, group: "Documents" },
  { key: "commandes", label: "Bons de commande", icon: ShoppingCart, group: "Documents" },
  { key: "attestations", label: "Attestations", icon: FileCheck2, group: "Documents" },
  { key: "relances", label: "Relances", icon: BellRing, group: "Suivi" },
  { key: "bilan", label: "Bilan & rapports", icon: BarChart3, group: "Suivi" },
  { key: "parametres", label: "Paramètres", icon: Settings, group: "Configuration" },
];

export function Sidebar() {
  const { module, go, navOpen, setNav, setPalette } = useUi();
  const company = useAppStore((s) => s.company);
  const logo = useAppStore((s) => s.branding.logo);
  const invoices = useAppStore((s) => s.invoices);

  const badges = useMemo(() => {
    const due = invoices.filter((i) => reminderStatus(i, company)?.due).length;
    const late = invoices.filter((i) => invoiceState(i) === "en_retard").length;
    return { relances: due, factures: late } as Partial<Record<ModuleKey, number>>;
  }, [invoices, company]);

  const groups = [...new Set(NAV.map((n) => n.group))];

  return (
    <>
      {navOpen && <button type="button" aria-label="Fermer le menu" className="fade-in fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setNav(false)} />}
      <aside
        className={cx(
          "sidebar fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col transition-transform lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)", paddingLeft: "env(safe-area-inset-left, 0px)" }}
        aria-label="Navigation principale"
      >
        <div className="flex items-center gap-3 px-5 pb-4 pt-5">
          {logo ? (
            <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-white p-1"><img src={logo} alt="" className="max-h-full max-w-full object-contain" /></span>
          ) : (
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#D9A54A] font-display text-sm font-bold text-[#10241f]">GSC</span>
          )}
          <div className="min-w-0">
            <div className="font-display text-[15px] font-bold leading-tight text-white">GSC Gestion</div>
            <div className="truncate text-[12px] opacity-70">{company.name}</div>
          </div>
          <button type="button" aria-label="Fermer le menu" className="ml-auto grid size-8 place-items-center rounded-md opacity-80 hover:bg-white/10 lg:hidden" onClick={() => setNav(false)}><X className="size-4" /></button>
        </div>

        <button type="button" onClick={() => setPalette(true)} className="mx-4 mb-3 flex h-9 items-center gap-2 rounded-lg bg-white/[0.07] px-3 text-[13px] opacity-90 transition hover:bg-white/[0.12]">
          <Search className="size-4" /> Rechercher…
          <kbd className="ml-auto rounded border border-white/20 px-1.5 text-[10.5px] font-semibold opacity-80">Ctrl K</kbd>
        </button>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {groups.map((g) => (
            <div key={g} className="mt-3">
              <div className="px-2 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] opacity-50">{g}</div>
              {NAV.filter((n) => n.group === g).map(({ key, label, icon: Icon }) => {
                const active = module === key;
                const count = badges[key];
                return (
                  <button
                    key={key}
                    type="button"
                    aria-current={active ? "page" : undefined}
                    onClick={() => go(key)}
                    className={cx(
                      "group relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition",
                      active ? "bg-white/[0.12] font-semibold text-white" : "opacity-80 hover:bg-white/[0.06] hover:opacity-100",
                    )}
                  >
                    {active && <span className="absolute left-0 top-2 h-6 w-[3px] rounded-r bg-[#D9A54A]" aria-hidden />}
                    <Icon className="size-[18px]" />
                    {label}
                    {!!count && <span className="num ml-auto rounded-full bg-[#F2776B] px-1.5 text-[11px] font-bold text-[#2b0d0a]">{count}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-3 text-[11.5px] opacity-60">Montants en francs guinéens (GNF)</div>
      </aside>
    </>
  );
}
