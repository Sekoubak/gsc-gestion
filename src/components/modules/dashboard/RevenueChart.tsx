"use client";

import { useState } from "react";
import { cx } from "@/components/ui";
import { useElementWidth } from "@/hooks/useElementWidth";
import { MONTHS_SHORT, gnf, gnfShort } from "@/lib/format";

function niceTicks(max: number, count = 4) {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

/** Barre arrondie en haut (4px), posée sur la ligne de base. */
function barPath(x: number, y: number, w: number, h: number) {
  if (h <= 0) return "";
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export function RevenueChart({ inflow, outflow, year, currentMonth }: { inflow: number[]; outflow: number[]; year: number; currentMonth: number | null }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);

  const H = 250, M = { t: 12, r: 8, b: 26, l: 46 };
  const pw = width - M.l - M.r, ph = H - M.t - M.b;
  const ticks = niceTicks(Math.max(...inflow, ...outflow, 1));
  const top = ticks.at(-1)!;
  const y = (v: number) => M.t + ph - (v / top) * ph;
  const gw = pw / 12;
  const bw = Math.max(3, Math.min(16, (gw - 8) / 2));
  const narrow = width < 520;

  const totalIn = inflow.reduce((a, b) => a + b, 0);
  const totalOut = outflow.reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
        <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-sm bg-chart-in" />Encaissements <b className="num">{gnfShort(totalIn)}</b></span>
        <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-sm bg-chart-out" />Paiements prestataires <b className="num">{gnfShort(totalOut)}</b></span>
        <button type="button" onClick={() => setTable((v) => !v)} className="ml-auto text-[12.5px] font-semibold text-accent hover:underline">{table ? "Voir le graphique" : "Voir le tableau"}</button>
      </div>

      {table ? (
        <div className="overflow-x-auto">
          <table className="num w-full min-w-[420px] text-sm">
            <thead><tr className="text-left text-[12px] text-muted"><th className="py-1.5 font-semibold">Mois {year}</th><th className="py-1.5 text-right font-semibold">Encaissements</th><th className="py-1.5 text-right font-semibold">Paiements prestataires</th><th className="py-1.5 text-right font-semibold">Solde</th></tr></thead>
            <tbody>{MONTHS_SHORT.map((m, i) => (
              <tr key={m} className="border-t border-line"><td className="py-1.5">{m}</td><td className="py-1.5 text-right">{gnf(inflow[i])}</td><td className="py-1.5 text-right">{gnf(outflow[i])}</td><td className={cx("py-1.5 text-right font-semibold", inflow[i] - outflow[i] < 0 && "text-bad")}>{gnf(inflow[i] - outflow[i])}</td></tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <div ref={ref} className="relative" onMouseLeave={() => setHover(null)}>
          <svg width={width} height={H} role="img" aria-label={`Encaissements et paiements prestataires par mois en ${year}`} className="block overflow-visible">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={M.l} x2={width - M.r} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={t === 0 ? 1 : 0.75} strokeDasharray={t === 0 ? undefined : "2 4"} />
                <text x={M.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="num fill-muted text-[11px]">{gnfShort(t)}</text>
              </g>
            ))}
            {MONTHS_SHORT.map((m, i) => {
              const x0 = M.l + i * gw;
              const cx0 = x0 + gw / 2;
              const future = currentMonth !== null && i > currentMonth;
              return (
                <g key={m} opacity={hover !== null && hover !== i ? 0.45 : future ? 0.5 : 1}>
                  {hover === i && <rect x={x0 + 1} y={M.t} width={gw - 2} height={ph} rx={6} className="fill-sunken" />}
                  <path d={barPath(cx0 - bw - 1, y(inflow[i]), bw, y(0) - y(inflow[i]))} className="fill-chart-in" />
                  <path d={barPath(cx0 + 1, y(outflow[i]), bw, y(0) - y(outflow[i]))} className="fill-chart-out" />
                  {(!narrow || i % 2 === 0) && (
                    <text x={cx0} y={H - 8} textAnchor="middle" className={cx("text-[11px]", i === currentMonth ? "fill-ink font-bold" : "fill-muted")}>{m.replace(".", "")}</text>
                  )}
                  <rect x={x0} y={M.t} width={gw} height={ph + M.b} fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />
                </g>
              );
            })}
          </svg>
          {hover !== null && (
            <div
              className="pointer-events-none absolute top-1 z-10 min-w-[190px] rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] shadow-pop"
              style={{ left: Math.min(Math.max(M.l + hover * gw + gw / 2 - 95, 0), width - 200) }}
            >
              <div className="mb-1 font-bold capitalize">{MONTHS_SHORT[hover]} {year}</div>
              <div className="flex items-center gap-2"><span className="size-2 rounded-sm bg-chart-in" />Encaissé<span className="num ml-auto pl-3 font-semibold">{gnf(inflow[hover])}</span></div>
              <div className="flex items-center gap-2"><span className="size-2 rounded-sm bg-chart-out" />Payé<span className="num ml-auto pl-3 font-semibold">{gnf(outflow[hover])}</span></div>
              <div className="mt-1 flex border-t border-line pt-1 text-muted">Solde<span className={cx("num ml-auto font-semibold", inflow[hover] - outflow[hover] < 0 ? "text-bad" : "text-ink")}>{gnf(inflow[hover] - outflow[hover])}</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
