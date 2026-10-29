"use client";

import { ArrowRight, BellRing, FileCheck2, FilePlus2, FolderKanban, FolderPlus, HandCoins, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { useMemo } from "react";
import { Badge, Button, Card, PageHeader, SectionTitle, Stat, cx } from "@/components/ui";
import { annualReport, balance, docTotals, invoiceState, monthlySeries, projectFinance, reminderStatus } from "@/lib/calc";
import { fd, fdLong, gnf, gnfShort, pct, today } from "@/lib/format";
import { INVOICE_STATE, PROJECT_STATUS } from "@/lib/labels";
import { useData } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";
import { useLookups } from "@/hooks/useLookups";
import { RevenueChart } from "./RevenueChart";

export function DashboardView() {
  const data = useData();
  const { go, openSheet } = useUi();
  const L = useLookups();
  const year = new Date().getFullYear();
  const t = today();

  const k = useMemo(() => {
    const open = data.invoices.filter((i) => ["envoyee", "partielle", "en_retard"].includes(invoiceState(i, t)));
    const late = open.filter((i) => invoiceState(i, t) === "en_retard");
    const report = annualReport(data, year);
    const series = monthlySeries(data, year);
    const due = data.invoices.map((i) => reminderStatus(i, data.company, t)).filter((r) => r?.due);
    return {
      collected: series.inflow.reduce((a, b) => a + b, 0),
      outstanding: open.reduce((a, i) => a + balance(i), 0),
      openCount: open.length,
      late: late.reduce((a, i) => a + balance(i), 0),
      lateCount: late.length,
      active: data.projects.filter((p) => p.status === "en_cours"),
      waiting: data.projects.filter((p) => p.status === "en_attente").length,
      report,
      series,
      dueCount: due.length,
    };
  }, [data, year, t]);

  const recent = [...data.invoices].sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.createdAt - a.createdAt).slice(0, 6);
  const isEmpty = data.projects.length === 0 && data.invoices.length === 0;

  return (
    <div className="fade-in">
      <PageHeader
        title="Tableau de bord"
        sub={`${data.company.name} · ${fdLong(t)}`}
        actions={<>
          <Button icon={<FolderPlus />} onClick={() => openSheet({ kind: "project" })}>Nouveau projet</Button>
          <Button variant="primary" icon={<FilePlus2 />} onClick={() => openSheet({ kind: "invoice" })}>Nouvelle facture</Button>
        </>}
      />

      {isEmpty && (
        <Card className="mb-5 border-accent/40 bg-accent-soft/40">
          <h2 className="font-display text-lg font-bold">Bienvenue dans GSC Gestion</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
            <li>Dans <b className="text-ink">Paramètres</b>, ajoutez votre logo, votre signature et votre cachet.</li>
            <li>Enregistrez vos clients et vos prestataires.</li>
            <li>Créez un projet, puis ses factures, bons de commande et attestations.</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => go("parametres")}>Configurer l&apos;entreprise</Button>
            <Button onClick={() => openSheet({ kind: "project" })}>Créer un projet</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Wallet />} label={`Encaissé en ${year}`} value={gnfShort(k.collected)} sub={`Facturé HT : ${gnfShort(k.report.totals.invoicedHT)}`} tone="ok" />
        <Stat icon={<HandCoins />} label="À encaisser" value={gnfShort(k.outstanding)}
          sub={k.lateCount ? <span className="font-semibold text-bad">dont {gnfShort(k.late)} en retard ({k.lateCount})</span> : `${k.openCount} facture${k.openCount > 1 ? "s" : ""} en attente`} tone={k.lateCount ? "warn" : undefined} />
        <Stat icon={<FolderKanban />} label="Projets actifs" value={k.active.length} sub={`${k.waiting} en attente · ${data.projects.length} au total`} />
        <Stat icon={<TrendingUp />} label={`Marge brute ${year}`} value={pct(k.report.totals.marginRate)} sub={gnf(k.report.totals.margin)} tone={k.report.totals.marginRate < 15 ? "bad" : "accent"} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <SectionTitle title="Évolution des flux" sub={`Encaissements clients et paiements prestataires, ${year}`} />
          <RevenueChart inflow={k.series.inflow} outflow={k.series.outflow} year={year} currentMonth={new Date().getMonth()} />
        </Card>

        <div className="flex min-w-0 flex-col gap-5">
          <Card>
            <SectionTitle title="Actions rapides" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: "Facture", i: <FilePlus2 />, a: () => openSheet({ kind: "invoice" }) },
                { l: "Projet", i: <FolderPlus />, a: () => openSheet({ kind: "project" }) },
                { l: "Bon de commande", i: <ShoppingCart />, a: () => openSheet({ kind: "po" }) },
                { l: "Attestation", i: <FileCheck2 />, a: () => openSheet({ kind: "attestation" }) },
              ].map((x) => (
                <button key={x.l} type="button" onClick={x.a} className="flex min-h-[64px] flex-col items-start justify-between gap-1 rounded-lg border border-line bg-bg/60 p-3 text-left text-[13px] font-semibold transition hover:border-accent hover:text-accent [&_svg]:size-[18px] [&_svg]:text-accent">
                  {x.i}{x.l}
                </button>
              ))}
            </div>
          </Card>
          <button type="button" onClick={() => go("relances")}
            className={cx("flex items-center gap-3 rounded-card border p-4 text-left transition", k.dueCount ? "border-bad/40 bg-bad-soft hover:border-bad" : "border-line bg-surface hover:border-muted")}>
            <span className={cx("grid size-10 shrink-0 place-items-center rounded-lg [&_svg]:size-5", k.dueCount ? "bg-bad text-white" : "bg-sunken text-muted")}><BellRing /></span>
            <span className="min-w-0">
              <span className="block font-semibold">{k.dueCount ? `${k.dueCount} relance${k.dueCount > 1 ? "s" : ""} à envoyer aujourd'hui` : "Aucune relance due aujourd'hui"}</span>
              <span className="block text-[12.5px] text-muted">Calendrier : J+{data.company.reminderDays.join(", J+")} après échéance</span>
            </span>
            <ArrowRight className="ml-auto size-4 shrink-0 text-muted" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Projets en cours" action={<Button size="sm" variant="ghost" onClick={() => go("projets")}>Tous les projets <ArrowRight /></Button>} />
          {k.active.length === 0 ? <p className="text-sm text-muted">Aucun projet en cours.</p> : (
            <ul className="divide-y divide-line">
              {k.active.slice(0, 5).map((p) => {
                const f = projectFinance(data, p);
                const use = Math.min(100, f.budgetUse);
                return (
                  <li key={p.id}>
                    <button type="button" onClick={() => go("projets", p.id)} className="w-full py-3 text-left">
                      <div className="flex items-baseline gap-2">
                        <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                        <span className={cx("num text-[13px] font-bold", f.marginRate < 15 ? "text-bad" : "text-ok")}>{pct(f.marginRate)}</span>
                      </div>
                      <div className="mt-0.5 flex gap-2 text-[12.5px] text-muted"><span className="truncate">{L.clientName(p.clientId)}</span><span className="num ml-auto shrink-0">{gnfShort(f.invoicedHT)} / {gnfShort(p.budget)}</span></div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken" title={`Budget facturé : ${pct(f.budgetUse)}`}>
                        <div className="h-full rounded-full bg-accent" style={{ width: `${use}%` }} />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle title="Dernières factures" action={<Button size="sm" variant="ghost" onClick={() => go("factures")}>Toutes <ArrowRight /></Button>} />
          {recent.length === 0 ? <p className="text-sm text-muted">Aucune facture pour l&apos;instant.</p> : (
            <ul className="divide-y divide-line">
              {recent.map((i) => {
                const st = invoiceState(i, t);
                return (
                  <li key={i.id}>
                    <button type="button" onClick={() => openSheet({ kind: "invoice-view", id: i.id })} className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 py-2.5 text-left">
                      <span className="truncate font-semibold">{L.clientName(i.clientId)}</span>
                      <span className="num text-right font-semibold">{gnf(docTotals(i).ttc)}</span>
                      <span className="num truncate text-[12.5px] text-muted">{i.number} · {fd(i.issueDate)}</span>
                      <span className="justify-self-end"><Badge tone={INVOICE_STATE[st].tone}>{INVOICE_STATE[st].label}</Badge></span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {data.projects.length > 0 && (
        <p className="mt-4 text-[12.5px] text-muted">
          Statuts : {Object.entries(PROJECT_STATUS).map(([key, v]) => `${data.projects.filter((p) => p.status === key).length} ${v.label.toLowerCase()}`).join(" · ")}
        </p>
      )}
    </div>
  );
}
