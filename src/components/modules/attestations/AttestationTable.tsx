"use client";

import { Download } from "lucide-react";
import { DemoTag, IconButton } from "@/components/ui";
import { fd } from "@/lib/format";
import type { Attestation } from "@/lib/types";
import { useDocActions } from "@/hooks/useDocActions";
import { useLookups } from "@/hooks/useLookups";
import { useUi } from "@/store/useUiStore";

export function AttestationTable({ items, showProject = true }: { items: Attestation[]; showProject?: boolean }) {
  const L = useLookups();
  const openSheet = useUi((s) => s.openSheet);
  const act = useDocActions();
  if (items.length === 0) return <p className="rounded-card border border-dashed border-line bg-surface px-4 py-6 text-sm text-muted">Aucune attestation.</p>;
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
      {items.map((a) => (
        <li key={a.id} className="flex items-center gap-3 px-4 py-3">
          <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openSheet({ kind: "attestation", id: a.id })}>
            <span className="num flex items-center gap-2 text-sm font-semibold">{a.number} · {L.providerName(a.providerId)}{a.demo && <DemoTag />}</span>
            <span className="num block truncate text-[12.5px] text-muted">{showProject ? `${L.projectName(a.projectId)} · ` : ""}du {fd(a.periodStart)} au {fd(a.periodEnd)}{a.days ? ` · ${a.days} j` : ""}</span>
          </button>
          <IconButton label="Télécharger le PDF" onClick={() => act.attestation(a)}><Download /></IconButton>
        </li>
      ))}
    </ul>
  );
}
