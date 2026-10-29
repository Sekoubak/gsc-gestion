import { daysBetween, today } from "./format";
import type { AppData, Company, Invoice, InvoiceState, LineItem, Project, PurchaseOrder } from "./types";

/* ---------------- Totaux de document ---------------- */
export interface Totals { ht: number; discount: number; net: number; vat: number; ttc: number }

export function lineTotal(it: Pick<LineItem, "quantity" | "unitPrice">) {
  return (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
}

export function docTotals(doc: { items: LineItem[]; vatEnabled: boolean; vatRate: number; discount?: number }): Totals {
  const ht = Math.round(doc.items.reduce((a, it) => a + lineTotal(it), 0));
  const discount = Math.round(Math.min(Math.max(Number(doc.discount) || 0, 0), ht));
  const net = ht - discount;
  const vat = doc.vatEnabled ? Math.round((net * (Number(doc.vatRate) || 0)) / 100) : 0;
  return { ht, discount, net, vat, ttc: net + vat };
}

/* ---------------- Factures ---------------- */
export const paidAmount = (inv: Invoice) => inv.payments.reduce((a, p) => a + (Number(p.amount) || 0), 0);
export const balance = (inv: Invoice) => Math.max(0, docTotals(inv).ttc - paidAmount(inv));

export function invoiceState(inv: Invoice, ref = today()): InvoiceState {
  if (inv.status === "annulee") return "annulee";
  if (inv.status === "brouillon") return "brouillon";
  const ttc = docTotals(inv).ttc;
  const paid = paidAmount(inv);
  if (ttc > 0 && paid >= ttc) return "payee";
  if (inv.dueDate && inv.dueDate < ref) return "en_retard";
  if (paid > 0) return "partielle";
  return "envoyee";
}

/** Date du dernier encaissement qui solde la facture. */
export function paidDate(inv: Invoice) {
  return inv.payments.map((p) => p.date).sort().at(-1) ?? "";
}

export const isBillable = (inv: Invoice) => inv.status !== "brouillon" && inv.status !== "annulee";
export const isCommitted = (po: PurchaseOrder) => po.status !== "brouillon" && po.status !== "annule";

/* ---------------- Relances ---------------- */
export interface ReminderDue {
  invoice: Invoice;
  daysLate: number;
  nextLevel: 1 | 2 | 3 | null;
  due: boolean; // une relance est attendue aujourd'hui
  lastDate: string | null;
}

export function reminderStatus(inv: Invoice, company: Company, ref = today()): ReminderDue | null {
  const state = invoiceState(inv, ref);
  if (state !== "en_retard") return null;
  const daysLate = daysBetween(inv.dueDate, ref);
  const done = inv.reminders.length;
  const nextLevel = done >= 3 ? null : ((done + 1) as 1 | 2 | 3);
  const threshold = nextLevel ? company.reminderDays[nextLevel - 1] : Infinity;
  const lastDate = inv.reminders.map((r) => r.date).sort().at(-1) ?? null;
  // Pas deux relances le même jour, et on attend le seuil du niveau suivant.
  const due = nextLevel !== null && daysLate >= threshold && lastDate !== ref;
  return { invoice: inv, daysLate, nextLevel, due, lastDate };
}

/* ---------------- Projets ---------------- */
export interface ProjectFinance {
  invoicedHT: number; // factures émises (hors brouillons/annulées), HT net de remise
  invoicedTTC: number;
  collected: number; // encaissements TTC
  outstanding: number; // reste à encaisser TTC
  costHT: number; // bons de commande engagés, HT
  costPaid: number; // bons de commande payés, TTC
  margin: number; // invoicedHT - costHT
  marginRate: number; // en %
  budgetUse: number; // invoicedHT / budget en %
}

export function projectFinance(data: Pick<AppData, "invoices" | "purchaseOrders">, project: Project): ProjectFinance {
  const invs = data.invoices.filter((i) => i.projectId === project.id && isBillable(i));
  const pos = data.purchaseOrders.filter((p) => p.projectId === project.id && isCommitted(p));
  const invoicedHT = invs.reduce((a, i) => a + docTotals(i).net, 0);
  const invoicedTTC = invs.reduce((a, i) => a + docTotals(i).ttc, 0);
  const collected = invs.reduce((a, i) => a + paidAmount(i), 0);
  const costHT = pos.reduce((a, p) => a + docTotals(p).net, 0);
  const costPaid = pos.filter((p) => p.status === "paye").reduce((a, p) => a + docTotals(p).ttc, 0);
  const margin = invoicedHT - costHT;
  return {
    invoicedHT,
    invoicedTTC,
    collected,
    outstanding: Math.max(0, invoicedTTC - collected),
    costHT,
    costPaid,
    margin,
    marginRate: invoicedHT > 0 ? (margin / invoicedHT) * 100 : 0,
    budgetUse: project.budget > 0 ? (invoicedHT / project.budget) * 100 : 0,
  };
}

/* ---------------- Flux de trésorerie ---------------- */
export interface CashEntry { date: string; amount: number; kind: "entree" | "sortie"; label: string; projectId: string; ref: string }

export function cashFlows(data: AppData): CashEntry[] {
  const out: CashEntry[] = [];
  for (const inv of data.invoices) {
    if (inv.status === "annulee") continue;
    const client = data.clients.find((c) => c.id === inv.clientId);
    for (const p of inv.payments)
      out.push({ date: p.date, amount: Number(p.amount) || 0, kind: "entree", label: `Encaissement ${inv.number} — ${client?.name ?? "Client"}`, projectId: inv.projectId, ref: inv.number });
  }
  for (const po of data.purchaseOrders) {
    if (po.status !== "paye" || !po.paidDate) continue;
    const prov = data.providers.find((p) => p.id === po.providerId);
    out.push({ date: po.paidDate, amount: docTotals(po).ttc, kind: "sortie", label: `Paiement ${po.number} — ${prov?.name ?? "Prestataire"}`, projectId: po.projectId, ref: po.number });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function monthlySeries(data: AppData, year: number) {
  const inflow = Array(12).fill(0) as number[];
  const outflow = Array(12).fill(0) as number[];
  for (const f of cashFlows(data)) {
    if (!f.date.startsWith(String(year))) continue;
    const m = Number(f.date.slice(5, 7)) - 1;
    (f.kind === "entree" ? inflow : outflow)[m] += f.amount;
  }
  return { inflow, outflow };
}

/* ---------------- Bilan annuel ---------------- */
export interface ProjectYearRow { project: Project; clientName: string; invoicedHT: number; collected: number; costHT: number; paidOut: number; margin: number; marginRate: number }

export function annualReport(data: AppData, year: number) {
  const y = String(year);
  const rows: ProjectYearRow[] = data.projects.map((project) => {
    const invs = data.invoices.filter((i) => i.projectId === project.id && isBillable(i) && i.issueDate.startsWith(y));
    const pos = data.purchaseOrders.filter((p) => p.projectId === project.id && isCommitted(p) && p.issueDate.startsWith(y));
    const invoicedHT = invs.reduce((a, i) => a + docTotals(i).net, 0);
    const costHT = pos.reduce((a, p) => a + docTotals(p).net, 0);
    const collected = data.invoices
      .filter((i) => i.projectId === project.id && i.status !== "annulee")
      .flatMap((i) => i.payments)
      .filter((p) => p.date.startsWith(y))
      .reduce((a, p) => a + p.amount, 0);
    const paidOut = data.purchaseOrders
      .filter((p) => p.projectId === project.id && p.status === "paye" && p.paidDate.startsWith(y))
      .reduce((a, p) => a + docTotals(p).ttc, 0);
    const margin = invoicedHT - costHT;
    return {
      project,
      clientName: data.clients.find((c) => c.id === project.clientId)?.name ?? "—",
      invoicedHT, collected, costHT, paidOut, margin,
      marginRate: invoicedHT > 0 ? (margin / invoicedHT) * 100 : 0,
    };
  }).filter((r) => r.invoicedHT || r.collected || r.costHT || r.paidOut);

  const sum = (k: keyof Omit<ProjectYearRow, "project" | "clientName" | "marginRate">) => rows.reduce((a, r) => a + r[k], 0);
  const totals = { invoicedHT: sum("invoicedHT"), collected: sum("collected"), costHT: sum("costHT"), paidOut: sum("paidOut"), margin: sum("margin") };
  return { rows, totals: { ...totals, marginRate: totals.invoicedHT > 0 ? (totals.margin / totals.invoicedHT) * 100 : 0, net: totals.collected - totals.paidOut } };
}

export function yearsWithActivity(data: AppData) {
  const ys = new Set<number>([new Date().getFullYear()]);
  data.invoices.forEach((i) => ys.add(Number(i.issueDate.slice(0, 4))));
  data.purchaseOrders.forEach((p) => ys.add(Number(p.issueDate.slice(0, 4))));
  return [...ys].filter(Boolean).sort((a, b) => b - a);
}

/* ---------------- Numérotation séquentielle annuelle ---------------- */
export function nextNumber(existing: { year: number; seq: number }[], prefix: string, date: string) {
  const year = Number(date.slice(0, 4)) || new Date().getFullYear();
  const seq = existing.filter((d) => d.year === year).reduce((m, d) => Math.max(m, d.seq), 0) + 1;
  return { year, seq, number: `${(prefix || "DOC").trim()}-${year}-${String(seq).padStart(4, "0")}` };
}

export function nextProjectCode(projects: Project[], date: string) {
  const year = date.slice(0, 4);
  const n = projects.filter((p) => p.code.includes(`-${year}-`)).length + 1;
  return `PRJ-${year}-${String(n).padStart(3, "0")}`;
}
