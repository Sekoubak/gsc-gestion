"use client";

import { create } from "zustand";
import type { ModuleKey } from "@/lib/types";

export type Sheet =
  | { kind: "project"; id?: string }
  | { kind: "invoice"; id?: string; projectId?: string }
  | { kind: "invoice-view"; id: string }
  | { kind: "payment"; invoiceId: string }
  | { kind: "po"; id?: string; projectId?: string; providerId?: string }
  | { kind: "attestation"; id?: string; projectId?: string; providerId?: string }
  | { kind: "client"; id?: string }
  | { kind: "provider"; id?: string };

export interface Toast { id: number; text: string; tone: "ok" | "bad" | "info" }

interface UiState {
  module: ModuleKey;
  projectId: string | null; // vue détaillée d'un projet
  sheet: Sheet | null;
  paletteOpen: boolean;
  navOpen: boolean; // tiroir mobile
  toasts: Toast[];
  go: (m: ModuleKey, projectId?: string | null) => void;
  openSheet: (s: Sheet) => void;
  closeSheet: () => void;
  setPalette: (v: boolean) => void;
  setNav: (v: boolean) => void;
  toast: (text: string, tone?: Toast["tone"]) => void;
  dismiss: (id: number) => void;
}

let tid = 0;
export const MODULES: ModuleKey[] = ["dashboard", "projets", "factures", "commandes", "attestations", "relances", "bilan", "parametres"];

export const useUi = create<UiState>()((set, get) => ({
  module: "dashboard",
  projectId: null,
  sheet: null,
  paletteOpen: false,
  navOpen: false,
  toasts: [],
  go: (module, projectId = null) => {
    set({ module, projectId, navOpen: false, paletteOpen: false });
    try {
      const h = projectId ? `${module}-${projectId}` : module;
      if (location.hash.slice(1) !== h) history.replaceState(null, "", `#${h}`);
    } catch { /* ignore */ }
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  },
  openSheet: (sheet) => set({ sheet, paletteOpen: false }),
  closeSheet: () => set({ sheet: null }),
  setPalette: (paletteOpen) => set({ paletteOpen }),
  setNav: (navOpen) => set({ navOpen }),
  toast: (text, tone = "ok") => {
    const id = ++tid;
    set({ toasts: [...get().toasts.slice(-2), { id, text, tone }] });
    setTimeout(() => get().dismiss(id), 4200);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Lit le module depuis l'ancre (#projets, #projets-<id>) au chargement. */
export function readHash(): { module: ModuleKey; projectId: string | null } {
  try {
    const h = location.hash.slice(1);
    const [m, ...rest] = h.split("-");
    if (MODULES.includes(m as ModuleKey)) return { module: m as ModuleKey, projectId: rest.join("-") || null };
  } catch { /* ignore */ }
  return { module: "dashboard", projectId: null };
}
