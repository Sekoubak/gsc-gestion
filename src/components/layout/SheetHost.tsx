"use client";

import { useUi } from "@/store/useUiStore";
import { ProjectForm } from "@/components/modules/projects/ProjectForm";
import { InvoiceForm } from "@/components/modules/invoices/InvoiceForm";
import { InvoiceSheet } from "@/components/modules/invoices/InvoiceSheet";
import { PaymentForm } from "@/components/modules/invoices/PaymentForm";
import { PurchaseOrderForm } from "@/components/modules/purchase-orders/PurchaseOrderForm";
import { AttestationForm } from "@/components/modules/attestations/AttestationForm";
import { ClientForm } from "@/components/modules/settings/ClientForm";
import { ProviderForm } from "@/components/modules/settings/ProviderForm";

/** Point unique d'ouverture des panneaux latéraux (formulaires et fiches). */
export function SheetHost() {
  const sheet = useUi((s) => s.sheet);
  if (!sheet) return null;
  const k = JSON.stringify(sheet);
  switch (sheet.kind) {
    case "project": return <ProjectForm key={k} id={sheet.id} />;
    case "invoice": return <InvoiceForm key={k} id={sheet.id} projectId={sheet.projectId} />;
    case "invoice-view": return <InvoiceSheet key={k} id={sheet.id} />;
    case "payment": return <PaymentForm key={k} invoiceId={sheet.invoiceId} />;
    case "po": return <PurchaseOrderForm key={k} id={sheet.id} projectId={sheet.projectId} providerId={sheet.providerId} />;
    case "attestation": return <AttestationForm key={k} id={sheet.id} projectId={sheet.projectId} providerId={sheet.providerId} />;
    case "client": return <ClientForm key={k} id={sheet.id} />;
    case "provider": return <ProviderForm key={k} id={sheet.id} />;
  }
}
