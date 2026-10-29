"use client";

import { FileDown, FileSpreadsheet } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Card, PageHeader, SectionTitle, Stat, Tabs, cx } from "@/components/ui";
import { annualReport, cashFlows, monthlySeries, yearsWithActivity } from "@/lib/calc";
import { toCsv } from "@/lib/csv";
import { fd, gnf, gnfShort, pct } from "@/lib/format";
import { useDocActions } from "@/hooks/useDocActions";
import { useLookups } from "@/hooks/useLookups";
import { useData } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";
import { RevenueChart } from "../dashboard/RevenueChart";

type View = "projets" | "journal";

export function ReportsView() {
  const data = useData();
  const go = useUi((s) => s.go);
  const L = useLookups();
  const act = useDocActions();
  const years = useMemo(() => yearsWithActivity(data), [data]);
  const [year, setYear] = useState(years[0] ?? new Date().getFullYear());
  const [view, setView] = useState<View>("projets");

  const r = useMemo(() => annualReport(data, year), [data, year]);
  const series = useMemo(() => monthlySeries(data, year), [data, year]);
  const flows = useMemo(() => cashFlows(data).filter((f) => f.date.startsWith(String(year))), [data, year]);
  const maxAbs = Math.max(1, ...r.rows.map((x) => Math.abs(x.margin)));
  const now = new Date();

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      [`Bilan ${year} — ${data.company.name}`], [],
      ["Code", "Projet", "Client", "Facturé HT", "Encaissé", "Coûts prestataires HT", "Payé prestataires", "Marge brute", "Marge %"],
      ...r.rows.map((x) => [x.project.code, x.project.name, x.clientName, x.invoicedHT, x.collected, x.costHT, x.paidOut, x.margin, x.marginRate.toFixed(1).replace(".", ",")]),
      ["", "TOTAL", "", r.totals.invoicedHT, r.totals.collected, r.totals.costHT, r.totals.paidOut, r.totals.margin, r.totals.marginRate.toFixed(1).replace(".", ",")],
      [], ["Journal des flux"], ["Date", "Type", "Libellé", "Projet", "Entrée", "Sortie"],
      ...flows.map((f) => [fd(f.date), f.kind === "entree" ? "Entrée" : "Sortie", f.label, L.projectName(f.projectId), f.kind === "entree" ? f.amount : "", f.kind === "sortie" ? f.amount : ""]),
    ];
    act.file(toCsv(rows), `Bilan ${year} - ${data.company.name}.csv`);
  };

  return (
    <div className="fade-in">
      <PageHeader title="Bilan & rapports" sub="Entrées (factures encaissées), sorties (prestataires payés) et marge par projet."
        actions={<>
          <label className="sr-only" htmlFor="rp-year">Année</label>
          <select id="rp-year" value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-10 rounded-lg border border-line bg-surface px-3 text-sm font-semibold">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button icon={<FileSpreadsheet />} onClick={exportCsv}>Excel (CSV)</Button>
          <Button variant="primary" icon={<FileDown />} onClick={() => act.report(year)}>Rapport PDF</Button>
        </>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Entrées (encaissé)" value={gnfShort(r.totals.collected)} sub={`Facturé HT ${gnfShort(r.totals.invoicedHT)}`} tone="ok" />
        <Stat label="Sorties (prestataires)" value={gnfShort(r.totals.paidOut)} sub={`Engagé HT ${gnfShort(r.totals.costHT)}`} />
        <Stat label="Trésorerie nette" value={gnfShort(r.totals.net)} tone={r.totals.net < 0 ? "bad" : "accent"} sub="entrées − sorties" />
        <Stat label="Marge brute globale" value={pct(r.totals.marginRate)} sub={gnf(r.totals.margin)} tone={r.totals.marginRate < 15 ? "bad" : "ok"} />
      </div>

      <Card className="mt-5">
        <SectionTitle title={`Flux mensuels ${year}`} />
        <RevenueChart inflow={series.inflow} outflow={series.outflow} year={year} currentMonth={year === now.getFullYear() ? now.getMonth() : null} />
      </Card>

      <div className="mb-3 mt-6"><Tabs<View> value={view} onChange={setView} items={[{ key: "projets", label: "Marge par projet", count: r.rows.length }, { key: "journal", label: "Journal des flux", count: flows.length }]} /></div>

      {view === "projets" ? (
        r.rows.length === 0 ? <p className="rounded-card border border-dashed border-line bg-surface px-4 py-6 text-sm text-muted">Aucune activité facturée ou commandée en {year}.</p> : (
          <div className="overflow-x-auto rounded-card border border-line bg-surface">
            <table className="num w-full min-w-[760px] text-sm">
              <thead>
                <tr className="bg-sunken/70 text-left text-[12px] text-muted">
                  <th className="px-4 py-2.5 font-semibold">Projet</th><th className="px-3 py-2.5 text-right font-semibold">Facturé HT</th><th className="px-3 py-2.5 text-right font-semibold">Encaissé</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Coûts HT</th><th className="px-3 py-2.5 text-right font-semibold">Marge</th><th className="w-[180px] px-4 py-2.5 font-semibold">Taux de marge</th>
                </tr>
              </thead>
              <tbody>
                {r.rows.map((x) => (
                  <tr key={x.project.id} className="border-t border-line">
                    <td className="max-w-[280px] px-4 py-2.5"><button type="button" className="block max-w-full truncate text-left font-semibold hover:text-accent" onClick={() => go("projets", x.project.id)}>{x.project.name}</button><span className="block truncate text-[12px] text-muted">{x.project.code} · {x.clientName}</span></td>
                    <td className="px-3 py-2.5 text-right">{gnf(x.invoicedHT)}</td>
                    <td className="px-3 py-2.5 text-right">{gnf(x.collected)}</td>
                    <td className="px-3 py-2.5 text-right">{gnf(x.costHT)}</td>
                    <td className={cx("px-3 py-2.5 text-right font-semibold", x.margin < 0 && "text-bad")}>{gnf(x.margin)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-sunken"><div className={cx("h-full rounded-full", x.marginRate < 15 ? "bg-bad" : "bg-accent")} style={{ width: `${Math.max(2, (Math.abs(x.margin) / maxAbs) * 100)}%` }} /></div>
                        <span className={cx("w-14 text-right text-[12.5px] font-bold", x.marginRate < 15 ? "text-bad" : "text-ok")}>{x.invoicedHT ? pct(x.marginRate) : "—"}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-ink bg-sunken/40 font-bold">
                  <td className="px-4 py-2.5">Total {year}</td><td className="px-3 py-2.5 text-right">{gnf(r.totals.invoicedHT)}</td><td className="px-3 py-2.5 text-right">{gnf(r.totals.collected)}</td>
                  <td className="px-3 py-2.5 text-right">{gnf(r.totals.costHT)}</td><td className="px-3 py-2.5 text-right">{gnf(r.totals.margin)}</td><td className="px-4 py-2.5 text-right">{pct(r.totals.marginRate)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      ) : (
        flows.length === 0 ? <p className="rounded-card border border-dashed border-line bg-surface px-4 py-6 text-sm text-muted">Aucun flux en {year}.</p> : (
          <div className="overflow-x-auto rounded-card border border-line bg-surface">
            <table className="num w-full min-w-[620px] text-sm">
              <thead><tr className="bg-sunken/70 text-left text-[12px] text-muted"><th className="px-4 py-2.5 font-semibold">Date</th><th className="px-3 py-2.5 font-semibold">Libellé</th><th className="px-3 py-2.5 text-right font-semibold">Entrée</th><th className="px-4 py-2.5 text-right font-semibold">Sortie</th></tr></thead>
              <tbody>{[...flows].reverse().map((f, i) => (
                <tr key={`${f.ref}-${i}`} className="border-t border-line">
                  <td className="px-4 py-2">{fd(f.date)}</td>
                  <td className="max-w-[360px] px-3 py-2"><span className="block truncate">{f.label}</span><span className="block truncate text-[12px] text-muted">{L.projectName(f.projectId)}</span></td>
                  <td className="px-3 py-2 text-right font-semibold text-ok">{f.kind === "entree" ? gnf(f.amount) : ""}</td>
                  <td className="px-4 py-2 text-right font-semibold">{f.kind === "sortie" ? gnf(f.amount) : ""}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )
      )}
      <p className="mt-3 text-[12.5px] text-muted">Marge brute = facturé HT − coûts prestataires engagés HT (bons de commande émis, livrés ou payés). Trésorerie nette = encaissements − paiements prestataires sur l&apos;année.</p>
    </div>
  );
}
