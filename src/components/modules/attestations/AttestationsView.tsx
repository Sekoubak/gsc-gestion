"use client";

import { FileCheck2, Plus } from "lucide-react";
import { Button, EmptyState, PageHeader } from "@/components/ui";
import { useAppStore } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";
import { AttestationTable } from "./AttestationTable";

export function AttestationsView() {
  const items = useAppStore((s) => s.attestations);
  const openSheet = useUi((s) => s.openSheet);
  const sorted = [...items].sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.seq - a.seq);
  return (
    <div className="fade-in">
      <PageHeader title="Attestations de service" sub="Générées à partir du projet, du prestataire et de ses bons de commande, avec signature et cachet."
        actions={<Button variant="primary" icon={<Plus />} onClick={() => openSheet({ kind: "attestation" })}>Générer une attestation</Button>} />
      {items.length === 0 ? (
        <EmptyState icon={<FileCheck2 />} title="Aucune attestation" action={<Button variant="primary" icon={<Plus />} onClick={() => openSheet({ kind: "attestation" })}>Générer la première</Button>}>
          Choisissez un projet et un prestataire : la période, le nombre de jours et la mission sont repris automatiquement.
        </EmptyState>
      ) : <AttestationTable items={sorted} />}
    </div>
  );
}
