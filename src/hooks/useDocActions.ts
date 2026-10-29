"use client";

import { useCallback } from "react";
import { attestationPdf, invoicePdf, purchaseOrderPdf, reportPdf } from "@/lib/pdf/documents";
import { docTotals } from "@/lib/calc";
import { fd, fillTemplate, gnf } from "@/lib/format";
import { saveFile, shareFile } from "@/lib/platform";
import type { Attestation, Invoice, PurchaseOrder } from "@/lib/types";
import { useAppStore, selectData } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";

/** Génération et partage des documents PDF, branchés sur l'adaptateur plateforme. */
export function useDocActions() {
  const toast = useUi((s) => s.toast);

  const run = useCallback(async (make: () => Promise<{ blob: Blob; filename: string }>, share?: string) => {
    try {
      const made = await make();
      const { blob } = made;
      const filename = made.filename.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (share !== undefined) {
        const r = await shareFile(blob, filename, share);
        if (r === "shared") toast("Document partagé.");
        else if (r === "saved") toast("PDF enregistré : joignez-le dans la conversation WhatsApp.", "info");
        return r !== "cancelled";
      }
      const ok = await saveFile(blob, filename);
      if (ok) toast(`${filename} prêt.`);
      return ok;
    } catch (e) {
      console.error(e);
      toast("Le document n'a pas pu être généré. Réessayez.", "bad");
      return false;
    }
  }, [toast]);

  const ctx = () => selectData(useAppStore.getState());

  return {
    invoice: (inv: Invoice, share = false) => {
      const d = ctx();
      const client = d.clients.find((c) => c.id === inv.clientId);
      const text = `Bonjour ${client?.contactName || client?.name || ""}, veuillez trouver ci-joint la facture ${inv.number} de ${gnf(docTotals(inv).ttc)}, payable avant le ${fd(inv.dueDate)}. Merci de votre confiance. ${d.company.name}`;
      return run(() => invoicePdf(inv, d), share ? text : undefined).then((ok) => {
        if (ok && share) useAppStore.getState().markInvoiceSent(inv.id);
        return ok;
      });
    },
    purchaseOrder: (po: PurchaseOrder, share = false) => run(() => purchaseOrderPdf(po, ctx()), share ? `Bon de commande ${po.number} — ${ctx().company.name}` : undefined),
    attestation: (at: Attestation, share = false) => run(() => attestationPdf(at, ctx()), share ? `Attestation de service ${at.number} — ${ctx().company.name}` : undefined),
    report: (year: number) => run(() => reportPdf(ctx(), year)),
    file: (blob: Blob, filename: string) => run(async () => ({ blob, filename })),
    template: fillTemplate,
  };
}
