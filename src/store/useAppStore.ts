"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { EMPTY_DATA, DEFAULT_COMPANY } from "@/data/defaults";
import { buildSeed } from "@/data/seed";
import { nextNumber } from "@/lib/calc";
import { today, uid } from "@/lib/format";
import { AUTOLOAD_DEMO, storage } from "@/lib/platform";
import type {
  AppData, Attestation, Branding, Client, Company, Invoice, Payment, Project, Provider, PurchaseOrder, Reminder,
} from "@/lib/types";

type Collection = "clients" | "providers" | "projects" | "invoices" | "purchaseOrders" | "attestations";
type ItemOf<C extends Collection> = AppData[C][number];
type Draft<T> = Omit<T, "id" | "createdAt"> & { id?: string };

interface Actions {
  hydrated: boolean;
  setCompany: (patch: Partial<Company>) => void;
  setBranding: (patch: Partial<Branding>) => void;

  upsert: <C extends Collection>(c: C, item: Draft<ItemOf<C>>) => ItemOf<C>;
  remove: (c: Collection, id: string) => void;

  createInvoice: (draft: Omit<Invoice, "id" | "createdAt" | "number" | "year" | "seq" | "payments" | "reminders" | "sentAt" | "status">) => Invoice;
  createPurchaseOrder: (draft: Omit<PurchaseOrder, "id" | "createdAt" | "number" | "year" | "seq">) => PurchaseOrder;
  createAttestation: (draft: Omit<Attestation, "id" | "createdAt" | "number" | "year" | "seq">) => Attestation;
  duplicateInvoice: (id: string) => Invoice | null;
  markInvoiceSent: (id: string) => void;
  addPayment: (invoiceId: string, p: Omit<Payment, "id">) => void;
  removePayment: (invoiceId: string, paymentId: string) => void;
  logReminder: (invoiceId: string, r: Omit<Reminder, "id">) => void;

  loadDemo: () => void;
  clearDemo: () => void;
  replaceAll: (data: AppData) => void;
  resetAll: () => void;
}

export type AppState = AppData & Actions;

const COLLECTIONS: Collection[] = ["clients", "providers", "projects", "invoices", "purchaseOrders", "attestations"];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...EMPTY_DATA,
      hydrated: false,

      setCompany: (patch) => set((s) => ({ company: { ...s.company, ...patch } })),
      setBranding: (patch) => set((s) => ({ branding: { ...s.branding, ...patch } })),

      upsert: (c, item) => {
        const list = get()[c] as ItemOf<typeof c>[];
        const existing = item.id ? list.find((x) => x.id === item.id) : undefined;
        const saved = (existing
          ? { ...existing, ...item }
          : { ...item, id: item.id ?? uid(), createdAt: Date.now() }) as ItemOf<typeof c>;
        set({ [c]: existing ? list.map((x) => (x.id === saved.id ? saved : x)) : [...list, saved] } as Partial<AppState>);
        return saved;
      },

      remove: (c, id) => {
        const s = get();
        const patch: Partial<AppData> = { [c]: (s[c] as { id: string }[]).filter((x) => x.id !== id) };
        // Suppression en cascade des documents d'un projet supprimé.
        if (c === "projects") {
          patch.invoices = s.invoices.filter((i) => i.projectId !== id);
          patch.purchaseOrders = s.purchaseOrders.filter((p) => p.projectId !== id);
          patch.attestations = s.attestations.filter((a) => a.projectId !== id);
        }
        if (c === "providers") patch.projects = s.projects.map((p) => ({ ...p, providerIds: p.providerIds.filter((x) => x !== id) }));
        set(patch);
      },

      createInvoice: (draft) => {
        const s = get();
        const n = nextNumber(s.invoices, s.company.invoicePrefix, draft.issueDate);
        const inv: Invoice = { ...draft, ...n, id: uid(), createdAt: Date.now(), status: "brouillon", sentAt: null, payments: [], reminders: [] };
        set({ invoices: [...s.invoices, inv] });
        return inv;
      },
      createPurchaseOrder: (draft) => {
        const s = get();
        const po: PurchaseOrder = { ...draft, ...nextNumber(s.purchaseOrders, s.company.poPrefix, draft.issueDate), id: uid(), createdAt: Date.now() };
        set({ purchaseOrders: [...s.purchaseOrders, po] });
        return po;
      },
      createAttestation: (draft) => {
        const s = get();
        const at: Attestation = { ...draft, ...nextNumber(s.attestations, s.company.attestationPrefix, draft.issueDate), id: uid(), createdAt: Date.now() };
        set({ attestations: [...s.attestations, at] });
        return at;
      },
      duplicateInvoice: (id) => {
        const src = get().invoices.find((i) => i.id === id);
        if (!src) return null;
        const d = today();
        const due = new Date(`${d}T12:00:00`);
        due.setDate(due.getDate() + get().company.paymentTermsDays);
        return get().createInvoice({
          projectId: src.projectId, clientId: src.clientId, issueDate: d, dueDate: due.toISOString().slice(0, 10),
          subject: src.subject, clientPoRef: src.clientPoRef, items: src.items.map((x) => ({ ...x, id: uid() })),
          vatEnabled: src.vatEnabled, vatRate: src.vatRate, discount: src.discount, notes: src.notes,
        });
      },
      markInvoiceSent: (id) =>
        set((s) => ({ invoices: s.invoices.map((i) => (i.id === id && i.status === "brouillon" ? { ...i, status: "envoyee", sentAt: Date.now() } : i)) })),
      addPayment: (invoiceId, p) =>
        set((s) => ({ invoices: s.invoices.map((i) => (i.id === invoiceId ? { ...i, status: i.status === "brouillon" ? "envoyee" : i.status, payments: [...i.payments, { ...p, id: uid() }] } : i)) })),
      removePayment: (invoiceId, paymentId) =>
        set((s) => ({ invoices: s.invoices.map((i) => (i.id === invoiceId ? { ...i, payments: i.payments.filter((p) => p.id !== paymentId) } : i)) })),
      logReminder: (invoiceId, r) =>
        set((s) => ({ invoices: s.invoices.map((i) => (i.id === invoiceId ? { ...i, reminders: [...i.reminders, { ...r, id: uid() }] } : i)) })),

      loadDemo: () => {
        const seed = buildSeed();
        set((s) => {
          const patch: Partial<AppData> = {};
          for (const c of COLLECTIONS) {
            const mine = (s[c] as { demo?: boolean }[]).filter((x) => !x.demo);
            (patch as Record<string, unknown>)[c] = [...mine, ...seed[c]];
          }
          return patch;
        });
      },
      clearDemo: () =>
        set((s) => {
          const patch: Partial<AppData> = {};
          for (const c of COLLECTIONS) (patch as Record<string, unknown>)[c] = (s[c] as { demo?: boolean }[]).filter((x) => !x.demo);
          return patch;
        }),
      replaceAll: (data) => set({ ...EMPTY_DATA, ...data, company: { ...DEFAULT_COMPANY, ...data.company } }),
      resetAll: () => set({ ...EMPTY_DATA }),
    }),
    {
      name: "gsc-gestion",
      version: 1,
      storage,
      partialize: (s) => {
        const { company, branding, clients, providers, projects, invoices, purchaseOrders, attestations } = s;
        return { company, branding, clients, providers, projects, invoices, purchaseOrders, attestations };
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppData>;
        return { ...current, ...p, company: { ...DEFAULT_COMPANY, ...(p.company ?? {}) }, branding: { ...EMPTY_DATA.branding, ...(p.branding ?? {}) } };
      },
      onRehydrateStorage: () => (state, error) => {
        const firstRun = !error && state && state.clients.length === 0 && state.projects.length === 0 && state.invoices.length === 0;
        // Le store n'est pas encore assigné pendant une hydratation synchrone : on diffère.
        queueMicrotask(() => {
          if (firstRun && AUTOLOAD_DEMO) {
            let seen = false;
            try { seen = localStorage.getItem("gsc-demo-seen") === "1"; localStorage.setItem("gsc-demo-seen", "1"); } catch { /* ignore */ }
            if (!seen) useAppStore.getState().loadDemo();
          }
          useAppStore.setState({ hydrated: true });
        });
      },
    },
  ),
);

/** Sélecteur pratique pour les composants qui ont besoin de tout le jeu de données. */
export const selectData = (s: AppState): AppData => ({
  company: s.company, branding: s.branding, clients: s.clients, providers: s.providers,
  projects: s.projects, invoices: s.invoices, purchaseOrders: s.purchaseOrders, attestations: s.attestations,
});

export const useData = () => useAppStore(useShallow(selectData));
