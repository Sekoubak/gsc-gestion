import type { ISODate } from "./types";

/** Groupe les milliers avec une espace : 1 250 000 */
export const grp = (n: number) =>
  Math.round(Number(n) || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export const gnf = (n: number) => `${grp(n)} GNF`;

/** Format compact pour les KPI et axes : 12,4 M · 850 k */
export function gnfShort(n: number) {
  const a = Math.abs(n);
  if (a >= 1e9) return `${(n / 1e9).toFixed(1).replace(".", ",")} Md`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(a >= 1e8 ? 0 : 1).replace(".", ",")} M`;
  if (a >= 1e3) return `${Math.round(n / 1e3)} k`;
  return String(Math.round(n));
}

export const pct = (n: number) => `${(Number.isFinite(n) ? n : 0).toFixed(1).replace(".", ",")} %`;

export function today(): ISODate {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function addDays(date: ISODate, n: number): ISODate {
  const x = new Date(`${date}T12:00:00`);
  x.setDate(x.getDate() + Number(n || 0));
  return x.toISOString().slice(0, 10);
}

export function daysBetween(a: ISODate, b: ISODate) {
  return Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000);
}

/** Jours ouvrés (lundi–vendredi) entre deux dates incluses. */
export function workingDays(a: ISODate, b: ISODate) {
  if (!a || !b || b < a) return 0;
  let n = 0;
  const d = new Date(`${a}T12:00:00`);
  const end = new Date(`${b}T12:00:00`);
  while (d <= end) {
    const w = d.getDay();
    if (w !== 0 && w !== 6) n++;
    d.setDate(d.getDate() + 1);
  }
  return n;
}

export const fd = (d?: string) => (d ? d.split("-").reverse().join("/") : "—");

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
export const MONTHS_SHORT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
export function fdLong(d?: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  return `${day === 1 ? "1er" : day} ${MONTHS[m - 1]} ${y}`;
}

export const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
  ).replace(/-/g, "").slice(0, 20);

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- Montant en toutes lettres (français, règles de 1990 non appliquées) ---------- */
const U = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const T = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];
function lt100(n: number): string {
  if (n < 20) return U[n];
  const t = Math.floor(n / 10), u = n % 10;
  if (t === 7 || t === 9) return T[t] + (t === 7 && u === 1 ? " et " : "-") + U[10 + u];
  if (u === 0) return t === 8 ? "quatre-vingts" : T[t];
  if (u === 1 && t !== 8) return `${T[t]} et un`;
  return `${T[t]}-${U[u]}`;
}
function lt1000(n: number): string {
  const c = Math.floor(n / 100), r = n % 100;
  let s = "";
  if (c > 0) { s = c === 1 ? "cent" : `${U[c]} cent`; if (r === 0 && c > 1) s += "s"; }
  if (r > 0) s += (s ? " " : "") + lt100(r);
  return s;
}
export function amountInWords(value: number): string {
  const n = Math.round(Math.abs(Number(value) || 0));
  if (n === 0) return "zéro";
  const b = Math.floor(n / 1e9), m = Math.floor((n % 1e9) / 1e6), k = Math.floor((n % 1e6) / 1e3), r = n % 1e3;
  const parts: string[] = [];
  if (b) parts.push(`${lt1000(b)} milliard${b > 1 ? "s" : ""}`);
  if (m) parts.push(`${lt1000(m)} million${m > 1 ? "s" : ""}`);
  if (k) parts.push(k === 1 ? "mille" : `${lt1000(k).replace(/(vingt|cent)s$/, "$1")} mille`);
  if (r) parts.push(lt1000(r));
  return parts.join(" ");
}

/** Numéro WhatsApp international à partir d'un numéro guinéen saisi librement. */
export function waNumber(phone: string) {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 9) d = `224${d}`;
  return d;
}
export const waLink = (phone: string, text: string) => `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`;

export function fillTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}
