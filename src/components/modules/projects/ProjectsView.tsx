"use client";

import { FolderKanban, FolderPlus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, DemoTag, EmptyState, Input, PageHeader, Tabs, cx } from "@/components/ui";
import { projectFinance } from "@/lib/calc";
import { fd, gnfShort, pct } from "@/lib/format";
import { PROJECT_STATUS } from "@/lib/labels";
import type { ProjectStatus } from "@/lib/types";
import { useLookups } from "@/hooks/useLookups";
import { useData } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";

type Filter = "tous" | ProjectStatus;

export function ProjectsView() {
  const data = useData();
  const { go, openSheet } = useUi();
  const L = useLookups();
  const [filter, setFilter] = useState<Filter>("tous");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data.projects
      .filter((p) => filter === "tous" || p.status === filter)
      .filter((p) => !t || `${p.name} ${p.code} ${L.clientName(p.clientId)}`.toLowerCase().includes(t))
      .sort((a, b) => (a.status === b.status ? b.startDate.localeCompare(a.startDate) : ["en_cours", "en_attente", "termine"].indexOf(a.status) - ["en_cours", "en_attente", "termine"].indexOf(b.status)))
      .map((p) => ({ p, f: projectFinance(data, p) }));
  }, [data, filter, q, L]);

  const count = (s: ProjectStatus) => data.projects.filter((p) => p.status === s).length;

  return (
    <div className="fade-in">
      <PageHeader title="Projets" sub="Chaque projet relie un client, ses prestataires et tous ses documents." actions={<Button variant="primary" icon={<FolderPlus />} onClick={() => openSheet({ kind: "project" })}>Nouveau projet</Button>} />

      {data.projects.length === 0 ? (
        <EmptyState icon={<FolderKanban />} title="Aucun projet" action={<Button variant="primary" icon={<FolderPlus />} onClick={() => openSheet({ kind: "project" })}>Créer le premier projet</Button>}>
          Un projet regroupe le client, les prestataires mobilisés, les factures, les bons de commande et les attestations de service.
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Tabs<Filter> value={filter} onChange={setFilter} items={[
              { key: "tous", label: "Tous", count: data.projects.length },
              { key: "en_cours", label: "En cours", count: count("en_cours") },
              { key: "en_attente", label: "En attente", count: count("en_attente") },
              { key: "termine", label: "Terminés", count: count("termine") },
            ]} />
            <div className="relative ml-auto w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input aria-label="Rechercher un projet" placeholder="Rechercher" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>

          <div className="overflow-hidden rounded-card border border-line bg-surface">
            <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_110px_120px_120px_90px] gap-4 border-b border-line bg-sunken/60 px-4 py-2.5 text-[12px] font-semibold text-muted md:grid">
              <span>Projet</span><span>Client</span><span>Statut</span><span className="text-right">Budget HT</span><span className="text-right">Facturé HT</span><span className="text-right">Marge</span>
            </div>
            {rows.length === 0 && <p className="px-4 py-6 text-sm text-muted">Aucun projet ne correspond.</p>}
            {rows.map(({ p, f }) => (
              <button key={p.id} type="button" onClick={() => go("projets", p.id)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-line px-4 py-3 text-left transition last:border-0 hover:bg-sunken/60 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_110px_120px_120px_90px]">
                <span className="min-w-0">
                  <span className="flex items-center gap-2"><span className="truncate font-semibold">{p.name}</span>{p.demo && <DemoTag />}</span>
                  <span className="num flex items-center gap-2 text-[12.5px] text-muted">{p.code} · {fd(p.startDate)}<span className="inline-flex items-center gap-1"><Users className="size-3.5" />{p.providerIds.length}</span></span>
                </span>
                <span className="justify-self-end md:hidden"><Badge tone={PROJECT_STATUS[p.status].tone}>{PROJECT_STATUS[p.status].label}</Badge></span>
                <span className="truncate text-sm text-muted md:text-ink">{L.clientName(p.clientId)}</span>
                <span className="num text-right text-sm font-semibold md:hidden">{gnfShort(f.invoicedHT)} · <span className={f.marginRate < 15 ? "text-bad" : "text-ok"}>{pct(f.marginRate)}</span></span>
                <span className="hidden md:block"><Badge tone={PROJECT_STATUS[p.status].tone}>{PROJECT_STATUS[p.status].label}</Badge></span>
                <span className="num hidden text-right text-sm md:block">{gnfShort(p.budget)}</span>
                <span className="num hidden text-right text-sm font-semibold md:block">{gnfShort(f.invoicedHT)}</span>
                <span className={cx("num hidden text-right text-sm font-bold md:block", f.invoicedHT === 0 ? "text-muted" : f.marginRate < 15 ? "text-bad" : "text-ok")}>{f.invoicedHT ? pct(f.marginRate) : "—"}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-muted">Marge = facturé HT − bons de commande engagés HT. En rouge sous 15 %.</p>
        </>
      )}
    </div>
  );
}
