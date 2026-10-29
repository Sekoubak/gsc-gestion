"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button, IconButton, KV, MoneyInput, Toggle, cx } from "@/components/ui";
import { docTotals, lineTotal } from "@/lib/calc";
import { amountInWords, cap, gnf, uid } from "@/lib/format";
import { UNITS } from "@/lib/labels";
import type { LineItem } from "@/lib/types";

const ctl = "h-10 w-full min-w-0 rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/25";

export const newLine = (p: Partial<LineItem> = {}): LineItem => ({ id: uid(), description: "", quantity: 1, unit: "jour", unitPrice: 0, ...p });

/** Éditeur de lignes + TVA + remise + totaux, partagé par factures et bons de commande. */
export function ItemsEditor({
  items, onItems, vatEnabled, vatRate, onVat, discount, onDiscount, suggestions,
}: {
  items: LineItem[];
  onItems: (v: LineItem[]) => void;
  vatEnabled: boolean;
  vatRate: number;
  onVat: (enabled: boolean, rate: number) => void;
  discount?: number;
  onDiscount?: (n: number) => void;
  suggestions?: { label: string; line: Partial<LineItem> }[];
}) {
  const t = docTotals({ items, vatEnabled, vatRate, discount });
  const patch = (i: number, p: Partial<LineItem>) => onItems(items.map((x, j) => (j === i ? { ...x, ...p } : x)));

  return (
    <div className="flex flex-col gap-3">
      {items.map((it, i) => (
        <div key={it.id} className="rounded-lg border border-line bg-surface p-3">
          <div className="flex gap-2">
            <input aria-label={`Désignation ligne ${i + 1}`} className={ctl} placeholder="Désignation de la prestation" value={it.description} onChange={(e) => patch(i, { description: e.target.value })} />
            <IconButton label="Retirer la ligne" className="shrink-0 hover:!text-bad" onClick={() => onItems(items.length > 1 ? items.filter((_, j) => j !== i) : [newLine()])}><Trash2 /></IconButton>
          </div>
          <div className="mt-2 grid grid-cols-[72px_minmax(0,1fr)] gap-2 sm:grid-cols-[80px_120px_minmax(0,1fr)]">
            <input aria-label="Quantité" inputMode="decimal" className={cx(ctl, "num text-right")} value={it.quantity || ""} placeholder="Qté"
              onChange={(e) => patch(i, { quantity: Number(e.target.value.replace(",", ".").replace(/[^\d.]/g, "")) || 0 })} />
            <select aria-label="Unité" className={ctl} value={it.unit} onChange={(e) => patch(i, { unit: e.target.value })}>
              {[...new Set([...UNITS, it.unit])].map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <div className="col-span-2 sm:col-span-1"><MoneyInput value={it.unitPrice} onChange={(n) => patch(i, { unitPrice: n })} placeholder="Prix unitaire HT" /></div>
          </div>
          <div className="num mt-1.5 text-right text-[12.5px] text-muted">{gnf(lineTotal(it))}</div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" icon={<Plus />} onClick={() => onItems([...items, newLine()])}>Ajouter une ligne</Button>
        {suggestions?.map((s) => (
          <Button key={s.label} size="sm" variant="ghost" icon={<Plus />} onClick={() => onItems([...items.filter((x) => x.description || x.unitPrice), newLine(s.line)])}>{s.label}</Button>
        ))}
      </div>

      <div className="mt-1 grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Toggle label="Appliquer la TVA" checked={vatEnabled} onChange={(v) => onVat(v, vatRate)} />
            {vatEnabled && (
              <span className="inline-flex items-center gap-1.5 text-sm">
                <input aria-label="Taux de TVA" inputMode="decimal" className={cx(ctl, "num w-16 text-right")} value={vatRate} onChange={(e) => onVat(true, Number(e.target.value.replace(",", ".")) || 0)} /> %
              </span>
            )}
          </div>
          {onDiscount && <MoneyInput label="Remise (HT)" value={discount ?? 0} onChange={onDiscount} />}
        </div>
        <div className="rounded-lg bg-sunken/70 px-4 py-2">
          <KV k="Total HT" v={gnf(t.ht)} />
          {!!t.discount && <><KV k="Remise" v={`− ${gnf(t.discount)}`} /><KV k="Net HT" v={gnf(t.net)} /></>}
          {vatEnabled && <KV k={`TVA ${vatRate} %`} v={gnf(t.vat)} />}
          <div className="mt-1 flex justify-between border-t-2 border-ink pt-2 font-bold"><span>{vatEnabled ? "Total TTC" : "Net à payer"}</span><span className="num">{gnf(t.ttc)}</span></div>
          <p className="mt-1 pb-1 text-[12px] italic text-muted">{cap(amountInWords(t.ttc))} francs guinéens</p>
        </div>
      </div>
    </div>
  );
}
