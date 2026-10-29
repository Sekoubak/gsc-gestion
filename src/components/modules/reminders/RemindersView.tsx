"use client";

import { BellRing, CalendarClock, Check, Copy, Download, MessageCircle, Phone } from "lucide-react";
import { useMemo } from "react";
import { Badge, Button, Card, EmptyState, PageHeader, SectionTitle, Stat, cx } from "@/components/ui";
import { balance, invoiceState, reminderStatus, type ReminderDue } from "@/lib/calc";
import { addDays, daysBetween, fd, fillTemplate, gnf, gnfShort, today, waNumber } from "@/lib/format";
import { REMINDER_LEVELS } from "@/lib/labels";
import type { Invoice } from "@/lib/types";
import { useDocActions } from "@/hooks/useDocActions";
import { useLookups } from "@/hooks/useLookups";
import { useAppStore } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";

/**
 * Relances automatiques : le calendrier (J+3, J+15, J+30 par défaut) calcule
 * chaque jour quelles factures doivent être relancées et à quel niveau.
 * Le message est prêt ; l'envoi reste un geste volontaire (un tap).
 */
export function RemindersView() {
  const s = useAppStore();
  const { openSheet, toast, go } = useUi();
  const L = useLookups();
  const act = useDocActions();
  const t = today();

  const { due, waiting, upcoming, totalLate } = useMemo(() => {
    const all = s.invoices.map((i) => reminderStatus(i, s.company, t)).filter(Boolean) as ReminderDue[];
    const soon = s.invoices.filter((i) => ["envoyee", "partielle"].includes(invoiceState(i, t)) && i.dueDate >= t && i.dueDate <= addDays(t, 7));
    return {
      due: all.filter((r) => r.due).sort((a, b) => b.daysLate - a.daysLate),
      waiting: all.filter((r) => !r.due).sort((a, b) => b.daysLate - a.daysLate),
      upcoming: soon.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
      totalLate: all.reduce((a, r) => a + balance(r.invoice), 0),
    };
  }, [s.invoices, s.company, t]);

  const message = (inv: Invoice, level: 1 | 2 | 3, daysLate: number) => {
    const c = L.client(inv.clientId);
    return fillTemplate(s.company.reminderTemplates[level - 1], {
      contact: c?.contactName || c?.name || "", client: c?.name ?? "", numero: inv.number, montant: gnf(balance(inv)),
      echeance: fd(inv.dueDate), jours: String(daysLate), entreprise: s.company.name,
    });
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast("Message copié."); }
    catch { toast("Copie impossible ici : sélectionnez le texte du message.", "info"); }
  };

  const Row = ({ r }: { r: ReminderDue }) => {
    const inv = r.invoice;
    const c = L.client(inv.clientId);
    const level = r.nextLevel ?? 3;
    const text = message(inv, level, r.daysLate);
    const log = (channel: "whatsapp" | "telephone" | "email") => { s.logReminder(inv.id, { date: t, level, channel }); toast(`${REMINDER_LEVELS[level - 1]} enregistrée pour ${inv.number}.`); };
    return (
      <li className="px-4 py-4">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
          <button type="button" className="min-w-0 text-left" onClick={() => openSheet({ kind: "invoice-view", id: inv.id })}>
            <span className="block font-semibold">{c?.name ?? "Client"}</span>
            <span className="num block text-[12.5px] text-muted">{inv.number} · échue le {fd(inv.dueDate)} · {inv.reminders.length} relance{inv.reminders.length > 1 ? "s" : ""} envoyée{inv.reminders.length > 1 ? "s" : ""}</span>
          </button>
          <div className="ml-auto text-right">
            <div className="num font-bold">{gnf(balance(inv))}</div>
            <div className={cx("num text-[12.5px] font-semibold", r.daysLate > 30 ? "text-bad" : "text-warn")}>{r.daysLate} jours de retard</div>
          </div>
        </div>
        {r.nextLevel ? (
          <>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone={level === 3 ? "bad" : level === 2 ? "warn" : "accent"}>Niveau {level} · {REMINDER_LEVELS[level - 1]}</Badge>
              {!r.due && <span className="text-[12.5px] text-muted">prévue à J+{s.company.reminderDays[level - 1]} ({fd(addDays(inv.dueDate, s.company.reminderDays[level - 1]))})</span>}
            </div>
            <p className="mt-2 select-text rounded-lg bg-sunken/70 p-3 text-[13px] leading-relaxed">{text}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`https://wa.me/${waNumber(c?.phone ?? "")}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" onClick={() => log("whatsapp")}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#1FA855] bg-[#1FA855] px-2.5 text-[13px] font-semibold text-white hover:brightness-110"><MessageCircle className="size-4" />Relancer sur WhatsApp</a>
              <Button size="sm" icon={<Copy />} onClick={() => copy(text)}>Copier</Button>
              <Button size="sm" icon={<Phone />} onClick={() => log("telephone")}>Relancé par téléphone</Button>
              <Button size="sm" variant="ghost" icon={<Download />} onClick={() => act.invoice(inv)}>Facture PDF</Button>
            </div>
            {c?.phone ? null : <p className="mt-2 text-[12px] text-warn">Pas de numéro pour ce client : ajoutez-le dans Paramètres › Clients.</p>}
          </>
        ) : (
          <p className="mt-2 text-sm text-bad">Les trois relances ont été envoyées. Étape suivante : recouvrement (courrier recommandé, médiation ou procédure).</p>
        )}
      </li>
    );
  };

  return (
    <div className="fade-in">
      <PageHeader title="Relances" sub={`Calendrier automatique : rappel à J+${s.company.reminderDays[0]}, relance ferme à J+${s.company.reminderDays[1]}, mise en demeure à J+${s.company.reminderDays[2]}.`}
        actions={<Button variant="ghost" onClick={() => go("parametres")}>Modifier le calendrier et les messages</Button>} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat icon={<BellRing />} label="À relancer aujourd'hui" value={due.length} tone={due.length ? "bad" : undefined} />
        <Stat label="Impayés en retard" value={gnfShort(totalLate)} sub={`${due.length + waiting.length} facture${due.length + waiting.length > 1 ? "s" : ""}`} tone="warn" />
        <Stat icon={<CalendarClock />} label="Échéances sous 7 jours" value={upcoming.length} />
      </div>

      {due.length === 0 && waiting.length === 0 ? (
        <EmptyState icon={<Check />} title="Aucun impayé en retard">Les factures envoyées apparaîtront ici dès qu&apos;elles dépassent leur échéance.</EmptyState>
      ) : (
        <div className="flex flex-col gap-5">
          {due.length > 0 && (
            <Card pad={false} className="border-bad/40">
              <div className="border-b border-line px-4 py-3"><h2 className="font-display font-bold">À envoyer aujourd&apos;hui ({due.length})</h2></div>
              <ul className="divide-y divide-line">{due.map((r) => <Row key={r.invoice.id} r={r} />)}</ul>
            </Card>
          )}
          {waiting.length > 0 && (
            <Card pad={false}>
              <div className="border-b border-line px-4 py-3"><h2 className="font-display font-bold">Déjà relancées, prochaine étape planifiée ({waiting.length})</h2></div>
              <ul className="divide-y divide-line">{waiting.map((r) => <Row key={r.invoice.id} r={r} />)}</ul>
            </Card>
          )}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mt-5">
          <SectionTitle title="Échéances à venir" sub="Un message courtois avant l'échéance réduit les retards." />
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {upcoming.map((i) => (
              <li key={i.id}>
                <button type="button" onClick={() => openSheet({ kind: "invoice-view", id: i.id })} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{L.clientName(i.clientId)}</span><span className="num text-[12.5px] text-muted">{i.number}</span></span>
                  <span className="num text-right text-sm"><span className="block font-semibold">{gnf(balance(i))}</span><span className="text-[12.5px] text-muted">dans {daysBetween(t, i.dueDate)} j · {fd(i.dueDate)}</span></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
