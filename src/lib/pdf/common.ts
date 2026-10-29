/**
 * Socle commun des PDF (jsPDF) : en-tête avec logo, pied de page légal,
 * bloc signature + cachet, tableau de lignes et totaux.
 * jsPDF est chargé à la demande pour ne pas alourdir le premier affichage.
 */
import type { jsPDF as JsPDF } from "jspdf";
import { amountInWords, cap, fd, gnf, grp } from "@/lib/format";
import type { Totals } from "@/lib/calc";
import type { Branding, Company, LineItem } from "@/lib/types";

export type RGB = [number, number, number];
export const C = {
  accent: [15, 92, 77] as RGB,
  ink: [22, 32, 46] as RGB,
  muted: [96, 106, 120] as RGB,
  soft: [236, 244, 241] as RGB,
  line: [220, 226, 232] as RGB,
  gold: [176, 125, 31] as RGB,
};
export const PAGE = { W: 210, H: 297, M: 16 };

/** Les polices standard de jsPDF ne couvrent que le Latin-1 : on remplace les signes typographiques. */
export const clean = (s: unknown) =>
  String(s ?? "")
    .replace(/[\u202F\u00A0]/g, " ")
    .replace(/[\u2019\u2018]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u0153/g, "oe").replace(/\u0152/g, "OE");

export async function newDoc() {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  return { doc, autoTable };
}

interface ImgInfo { w: number; h: number }
export async function imageSize(dataUrl: string): Promise<ImgInfo> {
  return new Promise((res) => {
    const im = new Image();
    im.onload = () => res({ w: im.naturalWidth || 1, h: im.naturalHeight || 1 });
    im.onerror = () => res({ w: 1, h: 1 });
    im.src = dataUrl;
  });
}
const fit = (im: ImgInfo, bw: number, bh: number) => { const s = Math.min(bw / im.w, bh / im.h); return [im.w * s, im.h * s] as const; };

/** En-tête : logo + identité à gauche, titre et références à droite. Renvoie le y suivant. */
export async function header(doc: JsPDF, company: Company, branding: Branding, title: string, refs: string[]) {
  const { W, M } = PAGE;
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, W, 4.5, "F");
  const y = 16;
  let x = M;
  let bottom = y;
  if (branding.logo) {
    const [lw, lh] = fit(await imageSize(branding.logo), 30, 22);
    doc.addImage(branding.logo, "PNG", M, y - 5, lw, lh);
    x = M + lw + 5;
    bottom = y - 5 + lh;
  }
  const maxW = 108 - (x - M);
  doc.setTextColor(...C.ink).setFont("helvetica", "bold").setFontSize(13.5);
  const name = doc.splitTextToSize(clean(company.name), maxW);
  doc.text(name, x, y);
  let ly = y + name.length * 5.4;
  doc.setFont("helvetica", "normal").setFontSize(8.4).setTextColor(...C.muted);
  for (const l of [company.tagline, [company.address, company.city].filter(Boolean).join(", "), [company.phone && `Tél. ${company.phone}`, company.email].filter(Boolean).join("  ·  ")]) {
    if (!l) continue;
    const ls = doc.splitTextToSize(clean(l), maxW);
    doc.text(ls, x, ly);
    ly += ls.length * 3.9;
  }
  bottom = Math.max(bottom, ly);

  doc.setTextColor(...C.accent).setFont("helvetica", "bold").setFontSize(title.length > 18 ? 14 : 20);
  const tl = doc.splitTextToSize(clean(title), 80);
  doc.text(tl, W - M, y + 2, { align: "right" });
  let ry = y + 2 + tl.length * 6.5;
  doc.setFontSize(9).setTextColor(...C.ink);
  refs.forEach((r, i) => {
    doc.setFont("helvetica", i === 0 ? "bold" : "normal").setTextColor(...(i === 0 ? C.ink : C.muted));
    doc.text(clean(r), W - M, ry, { align: "right" });
    ry += 4.4;
  });
  bottom = Math.max(bottom, ry);
  const sep = bottom + 4;
  doc.setDrawColor(...C.line).setLineWidth(0.3).line(M, sep, W - M, sep);
  return sep + 7;
}

/** Bloc encadré « Facturé à / Prestataire » + bloc libre à droite. */
export function partyBlocks(doc: JsPDF, y: number, left: { label: string; name: string; lines: string[] }, right?: { label: string; lines: string[] }) {
  const { W, M } = PAGE;
  const colW = (W - 2 * M - 8) / 2;
  doc.setFontSize(10.5).setFont("helvetica", "bold");
  const nm = doc.splitTextToSize(clean(left.name), colW - 8);
  doc.setFontSize(8.4).setFont("helvetica", "normal");
  const ll = left.lines.filter(Boolean).flatMap((l) => doc.splitTextToSize(clean(l), colW - 8));
  const h = 10 + nm.length * 4.8 + ll.length * 3.9 + 3;
  doc.setFillColor(...C.soft).roundedRect(M, y, colW, h, 2, 2, "F");
  doc.setFont("helvetica", "bold").setFontSize(7.2).setTextColor(...C.accent).text(clean(left.label.toUpperCase()), M + 4, y + 6);
  doc.setFontSize(10.5).setTextColor(...C.ink).text(nm, M + 4, y + 11.2);
  doc.setFont("helvetica", "normal").setFontSize(8.4).setTextColor(...C.muted).text(ll, M + 4, y + 11.2 + nm.length * 4.8);
  let rh = 0;
  if (right) {
    const rx = M + colW + 8;
    doc.setFont("helvetica", "bold").setFontSize(7.2).setTextColor(...C.accent).text(clean(right.label.toUpperCase()), rx, y + 6);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...C.ink);
    let ry = y + 11.2;
    for (const l of right.lines.filter(Boolean)) {
      const ls = doc.splitTextToSize(clean(l), colW - 2);
      doc.text(ls, rx, ry);
      ry += ls.length * 4.3;
    }
    rh = ry - y;
  }
  return y + Math.max(h, rh) + 7;
}

export function itemsTable(doc: JsPDF, autoTable: (d: JsPDF, o: object) => void, y: number, items: LineItem[]) {
  const { M } = PAGE;
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, bottom: 24 },
    theme: "plain",
    head: [["Désignation", "Qté", "Unité", "P.U. HT (GNF)", "Montant HT (GNF)"]],
    body: items.map((it) => [clean(it.description), clean(String(it.quantity)), clean(it.unit), grp(it.unitPrice), grp((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))]),
    styles: { font: "helvetica", fontSize: 8.8, cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 }, textColor: C.ink, lineColor: [222, 228, 233], lineWidth: { bottom: 0.2 } },
    headStyles: { fillColor: C.accent, textColor: 255, fontStyle: "bold", fontSize: 8.2, lineWidth: 0 },
    alternateRowStyles: { fillColor: [247, 250, 249] },
    columnStyles: { 1: { halign: "right", cellWidth: 14 }, 2: { cellWidth: 18 }, 3: { halign: "right", cellWidth: 32 }, 4: { halign: "right", cellWidth: 34 } },
    didParseCell: (d: { section: string; column: { index: number }; cell: { styles: { halign: string } } }) => { if (d.section === "head" && (d.column.index === 1 || d.column.index >= 3)) d.cell.styles.halign = "right"; },
  });
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
}

export function ensureSpace(doc: JsPDF, y: number, h: number) {
  if (y + h > PAGE.H - 26) { doc.addPage(); return 20; }
  return y;
}

export function totalsBlock(doc: JsPDF, y: number, t: Totals, vat: { enabled: boolean; rate: number }, finalLabel?: string) {
  const { W, M } = PAGE;
  const rows: [string, string][] = [["Total HT", gnf(t.ht)]];
  if (t.discount) rows.push(["Remise", `- ${gnf(t.discount)}`], ["Net HT", gnf(t.net)]);
  if (vat.enabled) rows.push([`TVA ${vat.rate} %`, gnf(t.vat)]);
  y = ensureSpace(doc, y, rows.length * 6 + 16);
  const tx = W - M - 84;
  doc.setFontSize(9.2);
  for (const [l, v] of rows) {
    doc.setFont("helvetica", "normal").setTextColor(...C.muted).text(clean(l), tx + 3, y + 4);
    doc.setTextColor(...C.ink).text(clean(v), W - M - 3, y + 4, { align: "right" });
    y += 6;
  }
  doc.setFillColor(...C.accent).rect(tx, y + 1, 84, 10, "F");
  doc.setFont("helvetica", "bold").setTextColor(255, 255, 255).setFontSize(10.2);
  doc.text(clean(finalLabel ?? (vat.enabled ? "TOTAL TTC" : "NET À PAYER")), tx + 3, y + 7.5);
  doc.text(clean(gnf(t.ttc)), W - M - 3, y + 7.5, { align: "right" });
  return y + 18;
}

export function amountWords(doc: JsPDF, y: number, amount: number, lead: string) {
  const { W, M } = PAGE;
  doc.setFont("helvetica", "italic").setFontSize(8.8).setTextColor(...C.ink);
  const wl = doc.splitTextToSize(clean(`${lead} ${cap(amountInWords(amount))} francs guinéens (${gnf(amount)}).`), W - 2 * M);
  y = ensureSpace(doc, y, wl.length * 4.4 + 4);
  doc.text(wl, M, y);
  return y + wl.length * 4.4 + 6;
}

/** Colonne de texte à gauche (modalités, notes) — renvoie le y atteint. */
export function sideNotes(doc: JsPDF, y: number, blocks: [string, string][], width: number) {
  const { M } = PAGE;
  let by = y;
  for (const [t, body] of blocks) {
    if (!body) continue;
    const l = doc.splitTextToSize(clean(body), width);
    doc.setFont("helvetica", "bold").setFontSize(7.2).setTextColor(...C.accent).text(clean(t.toUpperCase()), M, by + 3);
    doc.setFont("helvetica", "normal").setFontSize(8.4).setTextColor(...C.muted).text(l, M, by + 7.4);
    by += 7 + l.length * 3.9 + 3;
  }
  return by;
}

/** Signature et cachet de l'entreprise, centrés sur cx. */
export async function signatureBlock(doc: JsPDF, cx: number, y: number, company: Company, branding: Branding, caption?: string) {
  doc.setFont("helvetica", "bold").setFontSize(8.8).setTextColor(...C.ink);
  doc.text(clean(caption ?? company.signatoryTitle ?? ""), cx, y + 3, { align: "center" });
  const iy = y + 6;
  if (branding.stamp) {
    const [sw, sh] = fit(await imageSize(branding.stamp), 36, 36);
    doc.addImage(branding.stamp, "PNG", cx - sw / 2 - 9, iy + (36 - sh) / 2, sw, sh);
  }
  if (branding.signature) {
    const [gw, gh] = fit(await imageSize(branding.signature), 44, 22);
    doc.addImage(branding.signature, "PNG", cx - gw / 2 + 8, iy + 8, gw, gh);
  }
  if (company.signatoryName) doc.setFont("helvetica", "bold").setFontSize(9.2).text(clean(company.signatoryName), cx, iy + 43, { align: "center" });
  return iy + 48;
}

export function footer(doc: JsPDF, company: Company, extra?: string) {
  const { W, H, M } = PAGE;
  const n = doc.getNumberOfPages();
  const legal = [company.name, company.rccm && `RCCM ${company.rccm}`, company.nif && `NIF ${company.nif}`, [company.address, company.city].filter(Boolean).join(", "), company.phone].filter(Boolean).join("  ·  ");
  for (let p = 1; p <= n; p++) {
    doc.setPage(p);
    doc.setDrawColor(...C.line).setLineWidth(0.3).line(M, H - 17, W - M, H - 17);
    doc.setFont("helvetica", "normal").setFontSize(7.2).setTextColor(...C.muted);
    const fl = doc.splitTextToSize(clean(legal), W - 2 * M - 22);
    doc.text(fl, M, H - 12.5);
    if (extra) doc.text(doc.splitTextToSize(clean(extra), W - 2 * M - 22), M, H - 12.5 + fl.length * 3.3);
    doc.text(`Page ${p}/${n}`, W - M, H - 12.5, { align: "right" });
  }
}

export const paymentInfo = (c: Company) =>
  [c.bankName && `Banque : ${c.bankName}`, c.bankAccount && `Compte : ${c.bankAccount}`, c.mobileMoney && `Mobile Money : ${c.mobileMoney}`].filter(Boolean).join("\n");

export const dateLine = (label: string, d: string) => `${label} : ${fd(d)}`;

/** Nom de fichier sans accents ni caractères interdits : sûr sous Windows, Android et dans WhatsApp. */
export const fileName = (...parts: string[]) =>
  `${clean(parts.filter(Boolean).join(" - "))
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/:*?"<>|]+/g, "-").slice(0, 120)}.pdf`;
