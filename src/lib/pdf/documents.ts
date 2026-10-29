import type { CellHookData } from "jspdf-autotable";
import { annualReport, balance, docTotals, paidAmount } from "@/lib/calc";
import { fd, fdLong, gnf, MONTHS_SHORT, pct } from "@/lib/format";
import type { AppData, Attestation, Invoice, PurchaseOrder } from "@/lib/types";
import { C, PAGE, amountWords, clean, ensureSpace, fileName, footer, header, itemsTable, newDoc, partyBlocks, paymentInfo, sideNotes, signatureBlock, totalsBlock } from "./common";

type Ctx = Pick<AppData, "company" | "branding" | "clients" | "providers" | "projects">;

/* ---------------- Facture ---------------- */
export async function invoicePdf(inv: Invoice, ctx: Ctx) {
  const { doc, autoTable } = await newDoc();
  const { company, branding } = ctx;
  const client = ctx.clients.find((c) => c.id === inv.clientId);
  const project = ctx.projects.find((p) => p.id === inv.projectId);
  const t = docTotals(inv);
  const paid = paidAmount(inv);

  let y = await header(doc, company, branding, "FACTURE", [`N° ${inv.number}`, `Date : ${fd(inv.issueDate)}`, `Échéance : ${fd(inv.dueDate)}`]);
  y = partyBlocks(doc, y,
    { label: "Facturé à", name: client?.name ?? "Client", lines: [client?.address ?? "", client?.contactName ? `À l'attention de ${client.contactName}` : "", client?.phone ? `Tél. ${client.phone}` : "", client?.email ?? "", client?.nif ? `NIF : ${client.nif}` : "", client?.rccm ? `RCCM : ${client.rccm}` : ""] },
    { label: "Objet", lines: [inv.subject, project ? `Projet : ${project.name} (${project.code})` : "", inv.clientPoRef ? `Votre bon de commande : ${inv.clientPoRef}` : ""] });
  y = itemsTable(doc, autoTable, y, inv.items);
  y = totalsBlock(doc, y, t, { enabled: inv.vatEnabled, rate: inv.vatRate });
  if (paid > 0) {
    doc.setFont("helvetica", "normal").setFontSize(8.8).setTextColor(...C.muted);
    doc.text(clean(`Déjà réglé : ${gnf(paid)}  ·  Reste dû : ${gnf(balance(inv))}`), PAGE.W - PAGE.M, y - 6, { align: "right" });
    y += 2;
  }
  y = amountWords(doc, y, t.ttc, "Arrêtée la présente facture à la somme de");

  const sigW = 70, leftW = PAGE.W - 2 * PAGE.M - sigW - 8;
  y = ensureSpace(doc, y, 58);
  const leftEnd = sideNotes(doc, y, [["Modalités de paiement", paymentInfo(company)], ["Conditions", `Paiement à ${company.paymentTermsDays} jours, au plus tard le ${fd(inv.dueDate)}.`], ["Notes", inv.notes]], leftW);
  const sigEnd = await signatureBlock(doc, PAGE.W - PAGE.M - sigW / 2, y, company, branding);
  void Math.max(leftEnd, sigEnd);
  footer(doc, company, company.invoiceFooter);
  return { blob: doc.output("blob"), filename: fileName(inv.number, client?.name ?? "") };
}

/* ---------------- Bon de commande ---------------- */
export async function purchaseOrderPdf(po: PurchaseOrder, ctx: Ctx) {
  const { doc, autoTable } = await newDoc();
  const { company, branding } = ctx;
  const prov = ctx.providers.find((p) => p.id === po.providerId);
  const project = ctx.projects.find((p) => p.id === po.projectId);
  const t = docTotals(po);
  let y = await header(doc, company, branding, "BON DE COMMANDE", [`N° ${po.number}`, `Date : ${fd(po.issueDate)}`, po.deliveryDate ? `Livraison : ${fd(po.deliveryDate)}` : ""].filter(Boolean));
  y = partyBlocks(doc, y,
    { label: "Prestataire", name: prov?.name ?? "Prestataire", lines: [prov?.phone ? `Tél. ${prov.phone}` : "", prov?.email ?? "", prov?.nif ? `NIF : ${prov.nif}` : "", prov?.bankAccount ? `${prov.bankName} · ${prov.bankAccount}` : prov?.mobileMoney ? `Mobile Money : ${prov.mobileMoney}` : ""] },
    { label: "Objet", lines: [po.subject, project ? `Projet : ${project.name} (${project.code})` : "", project?.location ? `Lieu d'exécution : ${project.location}` : ""] });
  y = itemsTable(doc, autoTable, y, po.items);
  y = totalsBlock(doc, y, t, { enabled: po.vatEnabled, rate: po.vatRate }, po.vatEnabled ? "TOTAL TTC" : "MONTANT DE LA COMMANDE");
  y = amountWords(doc, y, t.ttc, "Arrêté le présent bon de commande à la somme de");
  y = ensureSpace(doc, y, 62);
  const colW = (PAGE.W - 2 * PAGE.M) / 2;
  sideNotes(doc, y, [["Conditions", "Le prestataire s'engage à exécuter la commande conformément à la description ci-dessus. Le règlement intervient sur présentation de sa facture et de l'attestation de service fait."], ["Notes", po.notes]], colW - 8);
  await signatureBlock(doc, PAGE.W - PAGE.M - 35, y, company, branding, `Pour ${company.name}`);
  footer(doc, company);
  return { blob: doc.output("blob"), filename: fileName(po.number, prov?.name ?? "") };
}

/* ---------------- Attestation de service ---------------- */
export async function attestationPdf(at: Attestation, ctx: Ctx) {
  const { doc } = await newDoc();
  const { company, branding } = ctx;
  const prov = ctx.providers.find((p) => p.id === at.providerId);
  const project = ctx.projects.find((p) => p.id === at.projectId);
  const client = ctx.clients.find((c) => c.id === project?.clientId);
  const { W, M } = PAGE;
  let y = await header(doc, company, branding, "ATTESTATION DE SERVICE FAIT", [`N° ${at.number}`, `Date : ${fd(at.issueDate)}`]);
  y += 4;
  const body = [
    `Je soussigné(e), ${company.signatoryName || "[nom du signataire]"}, ${(company.signatoryTitle || "représentant légal").replace(/^Le |^La /, "")} de ${company.name}${company.rccm ? ` (RCCM ${company.rccm})` : ""}, atteste que :`,
  ];
  doc.setFont("helvetica", "normal").setFontSize(10.5).setTextColor(...C.ink);
  for (const p of body) { const l = doc.splitTextToSize(clean(p), W - 2 * M); doc.text(l, M, y); y += l.length * 5.4 + 4; }

  // Encadré du prestataire
  doc.setFillColor(...C.soft).roundedRect(M, y, W - 2 * M, 18, 2, 2, "F");
  doc.setFont("helvetica", "bold").setFontSize(12).text(clean(prov?.name ?? "Prestataire"), M + 5, y + 7.5);
  doc.setFont("helvetica", "normal").setFontSize(8.8).setTextColor(...C.muted);
  doc.text(clean([prov?.kind === "societe" ? "Société" : "Prestataire individuel", prov?.nif && `NIF ${prov.nif}`, prov?.phone && `Tél. ${prov.phone}`, prov?.skills.length ? prov.skills.join(", ") : ""].filter(Boolean).join("  ·  ")), M + 5, y + 13.5);
  y += 26;

  doc.setFontSize(10.5).setTextColor(...C.ink);
  const intro = doc.splitTextToSize(clean(`a réalisé pour le compte de ${company.name}${client ? `, au profit de notre client ${client.name}` : ""}, dans le cadre du projet « ${project?.name ?? ""} »${project?.code ? ` (${project.code})` : ""}, la mission suivante :`), W - 2 * M);
  doc.text(intro, M, y); y += intro.length * 5.4 + 3;

  const mission = doc.splitTextToSize(clean(at.mission), W - 2 * M - 8);
  doc.setDrawColor(...C.accent).setLineWidth(0.8).line(M + 1, y - 1, M + 1, y + 4 + (mission.length - 1) * 5.4);
  doc.setFont("helvetica", "italic").text(mission, M + 6, y + 3);
  y += mission.length * 5.4 + 8;

  const facts: [string, string][] = [
    ["Période", `du ${fdLong(at.periodStart)} au ${fdLong(at.periodEnd)}`],
    ["Durée", at.days ? `${at.days} jour${at.days > 1 ? "s" : ""} de prestation` : ""],
    ["Lieu", at.location],
  ];
  doc.setFontSize(10);
  for (const [k, v] of facts) {
    if (!v) continue;
    doc.setFont("helvetica", "bold").setTextColor(...C.muted).text(clean(`${k} :`), M, y);
    doc.setFont("helvetica", "normal").setTextColor(...C.ink).text(clean(v), M + 24, y);
    y += 6;
  }
  y += 3;
  doc.setFontSize(10.5);
  const close = doc.splitTextToSize(clean(`La prestation a été exécutée ${at.appreciation || "conformément aux termes convenus"}. En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.`), W - 2 * M);
  doc.text(close, M, y); y += close.length * 5.4 + 8;
  doc.text(clean(`Fait à ${(company.city || "Conakry").split(",")[0]}, le ${fdLong(at.issueDate)}`), W - M, y, { align: "right" });
  y += 10;
  y = ensureSpace(doc, y, 60);
  // Deux signatures : prestataire (manuscrite) et entreprise (signature + cachet)
  const lx = M + 35;
  doc.setFont("helvetica", "bold").setFontSize(8.8).setTextColor(...C.ink).text("Le prestataire", lx, y + 3, { align: "center" });
  doc.setFont("helvetica", "normal").setFontSize(7.8).setTextColor(...C.muted).text("Lu et approuvé", lx, y + 8, { align: "center" });
  doc.setDrawColor(...C.line).setLineWidth(0.3).line(lx - 28, y + 40, lx + 28, y + 40);
  doc.setFont("helvetica", "bold").setFontSize(9.2).setTextColor(...C.ink).text(clean(prov?.name ?? ""), lx, y + 45, { align: "center" });
  await signatureBlock(doc, W - M - 35, y, company, branding);
  footer(doc, company);
  return { blob: doc.output("blob"), filename: fileName(at.number, prov?.name ?? "") };
}

/* ---------------- Bilan annuel ---------------- */
export async function reportPdf(data: AppData, year: number) {
  const { doc, autoTable } = await newDoc();
  const { company, branding } = data;
  const r = annualReport(data, year);
  const { W, M } = PAGE;
  const n = (v: number) => gnf(v).replace(" GNF", "");
  let y = await header(doc, company, branding, `BILAN ${year}`, [`Édité le ${fd(new Date().toISOString().slice(0, 10))}`, "Montants en GNF"]);

  const kpis: [string, string][] = [
    ["Facturé HT", gnf(r.totals.invoicedHT)],
    ["Encaissé (entrées)", gnf(r.totals.collected)],
    ["Payé aux prestataires (sorties)", gnf(r.totals.paidOut)],
    ["Trésorerie nette", gnf(r.totals.net)],
    ["Coûts engagés HT", gnf(r.totals.costHT)],
    ["Marge brute", `${gnf(r.totals.margin)} (${pct(r.totals.marginRate)})`],
  ];
  const bw = (W - 2 * M - 8) / 3;
  kpis.forEach(([k, v], i) => {
    const x = M + (i % 3) * (bw + 4), yy = y + Math.floor(i / 3) * 18;
    doc.setFillColor(...C.soft).roundedRect(x, yy, bw, 15, 1.5, 1.5, "F");
    doc.setFont("helvetica", "normal").setFontSize(7.4).setTextColor(...C.muted).text(clean(k), x + 3, yy + 5);
    doc.setFont("helvetica", "bold").setFontSize(9.6).setTextColor(...C.ink).text(clean(v), x + 3, yy + 11);
  });
  y += 42;

  doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor(...C.accent).text("Marge par projet", M, y);
  autoTable(doc, {
    startY: y + 3, margin: { left: M, right: M, bottom: 24 }, theme: "plain",
    head: [["Projet", "Facturé HT", "Encaissé", "Coûts HT", "Marge", "%"]],
    body: [
      ...r.rows.map((x) => [clean(`${x.project.code} ${x.project.name}\n${x.clientName}`), n(x.invoicedHT), n(x.collected), n(x.costHT), n(x.margin), pct(x.marginRate)]),
      ["TOTAL", n(r.totals.invoicedHT), n(r.totals.collected), n(r.totals.costHT), n(r.totals.margin), pct(r.totals.marginRate)],
    ],
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2, textColor: C.ink, lineColor: [222, 228, 233], lineWidth: { bottom: 0.2 } },
    headStyles: { fillColor: C.accent, textColor: 255, fontStyle: "bold", halign: "right" },
    columnStyles: { 1: { halign: "right", cellWidth: 26 }, 2: { halign: "right", cellWidth: 26 }, 3: { halign: "right", cellWidth: 26 }, 4: { halign: "right", cellWidth: 26 }, 5: { halign: "right", cellWidth: 15 } },
    didParseCell: (d: CellHookData) => { if (d.section === "head" && d.column.index === 0) d.cell.styles.halign = "left"; if (d.section === "body" && d.row.index === r.rows.length) { d.cell.styles.fontStyle = "bold"; d.cell.styles.fillColor = [236, 244, 241]; } },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  const { inflow, outflow } = (await import("@/lib/calc")).monthlySeries(data, year);
  y = ensureSpace(doc, y, 90);
  doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor(...C.accent).text("Entrées et sorties mensuelles", M, y);
  autoTable(doc, {
    startY: y + 3, margin: { left: M, right: M, bottom: 24 }, theme: "plain",
    head: [["Mois", "Entrées (encaissements)", "Sorties (prestataires)", "Solde"]],
    body: MONTHS_SHORT.map((m, i) => [m, gnf(inflow[i]), gnf(outflow[i]), gnf(inflow[i] - outflow[i])]),
    styles: { font: "helvetica", fontSize: 8, cellPadding: 1.8, textColor: C.ink, lineColor: [222, 228, 233], lineWidth: { bottom: 0.2 } },
    headStyles: { fillColor: C.accent, textColor: 255, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
  });
  footer(doc, company, "Marge brute = facturé HT - coûts prestataires engagés HT. Trésorerie nette = encaissements - paiements prestataires. Montants en GNF.");
  return { blob: doc.output("blob"), filename: fileName(`Bilan ${year}`, company.name) };
}
