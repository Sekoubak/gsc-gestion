"use client";

import { Building2, FileCheck2, FilePlus2, FileText, FolderKanban, FolderPlus, Search, ShoppingCart, UserPlus, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cx } from "@/components/ui";
import { docTotals } from "@/lib/calc";
import { gnf } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";
import { NAV } from "./Sidebar";

interface Cmd { id: string; label: string; hint?: string; icon: ReactNode; group: string; run: () => void }

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Palette de commandes (Ctrl/Cmd + K) : recherche globale et actions rapides. */
export function CommandPalette() {
  const { paletteOpen, setPalette, go, openSheet } = useUi();
  const s = useAppStore();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { if (paletteOpen) { setQ(""); setSel(0); setTimeout(() => input.current?.focus(), 10); } }, [paletteOpen]);

  const cmds = useMemo<Cmd[]>(() => {
    const list: Cmd[] = [
      { id: "a-inv", group: "Actions", label: "Nouvelle facture", icon: <FilePlus2 />, run: () => openSheet({ kind: "invoice" }) },
      { id: "a-prj", group: "Actions", label: "Nouveau projet", icon: <FolderPlus />, run: () => openSheet({ kind: "project" }) },
      { id: "a-po", group: "Actions", label: "Nouveau bon de commande", icon: <ShoppingCart />, run: () => openSheet({ kind: "po" }) },
      { id: "a-att", group: "Actions", label: "Générer une attestation", icon: <FileCheck2 />, run: () => openSheet({ kind: "attestation" }) },
      { id: "a-cli", group: "Actions", label: "Nouveau client", icon: <UserPlus />, run: () => openSheet({ kind: "client" }) },
      { id: "a-pro", group: "Actions", label: "Nouveau prestataire", icon: <UserPlus />, run: () => openSheet({ kind: "provider" }) },
      ...NAV.map((n) => ({ id: `n-${n.key}`, group: "Aller à", label: n.label, icon: <n.icon />, run: () => go(n.key) })),
      ...s.projects.map((p) => ({ id: `p-${p.id}`, group: "Projets", label: p.name, hint: p.code, icon: <FolderKanban />, run: () => go("projets", p.id) })),
      ...s.invoices.map((i) => ({ id: `i-${i.id}`, group: "Factures", label: `${i.number} · ${i.subject}`, hint: gnf(docTotals(i).ttc), icon: <FileText />, run: () => openSheet({ kind: "invoice-view", id: i.id }) })),
      ...s.purchaseOrders.map((p) => ({ id: `o-${p.id}`, group: "Bons de commande", label: `${p.number} · ${p.subject}`, icon: <ShoppingCart />, run: () => openSheet({ kind: "po", id: p.id }) })),
      ...s.clients.map((c) => ({ id: `c-${c.id}`, group: "Clients", label: c.name, hint: c.contactName, icon: <Building2 />, run: () => openSheet({ kind: "client", id: c.id }) })),
      ...s.providers.map((p) => ({ id: `r-${p.id}`, group: "Prestataires", label: p.name, hint: p.skills.join(", "), icon: <Users />, run: () => openSheet({ kind: "provider", id: p.id }) })),
    ];
    return list;
  }, [s.projects, s.invoices, s.purchaseOrders, s.clients, s.providers, go, openSheet]);

  const results = useMemo(() => {
    const t = norm(q.trim());
    if (!t) return cmds.filter((c) => c.group === "Actions" || c.group === "Aller à");
    return cmds.filter((c) => norm(`${c.label} ${c.hint ?? ""}`).includes(t)).slice(0, 40);
  }, [q, cmds]);

  if (!paletteOpen) return null;

  const run = (c?: Cmd) => { if (!c) return; setPalette(false); c.run(); };
  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Recherche et actions">
      <button type="button" aria-label="Fermer" className="fade-in absolute inset-0 bg-black/45" onClick={() => setPalette(false)} />
      <div className="fade-in relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-5 text-muted" />
          <input
            ref={input}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0); }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setPalette(false);
              if (e.key === "ArrowDown") { e.preventDefault(); setSel((v) => Math.min(v + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setSel((v) => Math.max(v - 1, 0)); }
              if (e.key === "Enter") { e.preventDefault(); run(results[sel]); }
            }}
            placeholder="Rechercher un projet, une facture, un client… ou une action"
            className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
            aria-label="Rechercher"
          />
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {results.length === 0 && <p className="px-3 py-6 text-sm text-muted">Aucun résultat pour « {q} ».</p>}
          {results.map((c, i) => {
            const header = c.group !== lastGroup ? (lastGroup = c.group) : null;
            return (
              <div key={c.id}>
                {header && <div className="px-3 pb-1 pt-2.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted">{header}</div>}
                <button
                  type="button"
                  onMouseEnter={() => setSel(i)}
                  onClick={() => run(c)}
                  className={cx("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm [&_svg]:size-4 [&_svg]:shrink-0", i === sel ? "bg-accent-soft text-accent" : "text-ink")}
                >
                  {c.icon}
                  <span className="min-w-0 flex-1 truncate font-medium">{c.label}</span>
                  {c.hint && <span className="num max-w-[40%] truncate text-xs text-muted">{c.hint}</span>}
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 border-t border-line px-4 py-2 text-[11.5px] text-muted"><span>↑↓ naviguer</span><span>Entrée ouvrir</span><span>Échap fermer</span></div>
      </div>
    </div>
  );
}
