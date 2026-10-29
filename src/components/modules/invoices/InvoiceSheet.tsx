"use client";

import { Ban, Copy, Download, HandCoins, MessageCircle, Pencil, Send, Trash2, Undo2, X } from "lucide-react";
import { Badge, Button, ConfirmButton, IconButton, KV, LinkButton, Sheet } from "@/components/ui";
import { balance, docTotals, invoiceState, lineTotal, paidAmount } from "@/lib/calc";
import { amountInWords, cap, fd, gnf, waLink } from "@/lib/format";
import { INVOICE_STATE, PAYMENT_METHODS, REMINDER_CHANNELS, REMINDER_LEVELS } from "@/lib/labels";
import { canNativeShare } from "@/lib/platform";
import { useDocActions } from "@/hooks/useDocActions";
import { useLookups } from "@/hooks/useLookups";
import { useAppStore } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";

export function InvoiceSheet({ id }: { id: string }) {
  const s = useAppStore();
  const { closeSheet, openSheet, toast, go } = useUi();
  const L = useLookups();
  const act = useDocActions();
  const inv = s.invoices.find((i) => i.id === id);
  if (!inv) return <Sheet title="Facture introuvable" onClose={closeSheet}><p className="text-sm text-muted">Cette facture a été supprimée.</p></Sheet>;

  const st = invoiceState(inv);
  const t = docTotals(inv);
  const client = L.client(inv.clientId);
  const project = L.project(inv.projectId);
  const msg = `Bonjour ${client?.contactName || client?.name || ""}, veuillez trouver ci-joint la facture ${inv.number} de ${gnf(t.ttc)}, payable avant le ${fd(inv.dueDate)}. Merci de votre confiance. ${s.company.name}`;
  const cancelled = inv.status === "annulee";

  return (
    <Sheet wide title={`Facture ${inv.number}`} sub={<span className="inline-flex flex-wrap items-center gap-2"><Badge tone={INVOICE_STATE[st].tone}>{INVOICE_STATE[st].label}</Badge>{client?.name}</span>} onClose={closeSheet}
      footer={<>
        <Button icon={<Pencil />} onClick={() => openSheet({ kind: "invoice", id: inv.id })} disabled={cancelled}>Modifier</Button>
        <Button icon={<Copy />} onClick={() => { const c = s.duplicateInvoice(inv.id); if (c) { toast(`Copie créée : ${c.number}.`); openSheet({ kind: "invoice-view", id: c.id }); } }}>Dupliquer</Button>
        {!cancelled && inv.status !== "brouillon" && paidAmount(inv) === 0 && (
          <Button variant="ghost" icon={<Ban />} onClick={() => { s.upsert("invoices", { ...inv, status: "annulee" }); toast("Facture annulée. Elle reste numérotée dans l'historique."); }}>Annuler la facture</Button>
        )}
        {cancelled && <Button variant="ghost" icon={<Undo2 />} onClick={() => s.upsert("invoices", { ...inv, status: "envoyee" })}>Rétablir</Button>}
        <span className="ml-auto" />
        {inv.status === "brouillon" && <ConfirmButton icon={<Trash2 />} onConfirm={() => { s.remove("invoices", inv.id); closeSheet(); toast("Brouillon supprimé."); }}>Supprimer</ConfirmButton>}
      </>}>
      <div className="flex flex-col gap-5">
        {/* Envoi */}
        {!cancelled && (
          <div className="rounded-card border border-accent/40 bg-accent-soft/50 p-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" icon={<Send />} onClick={() => act.invoice(inv, true)}>{canNativeShare() ? "Envoyer le PDF" : "Préparer le PDF"}</Button>
              <LinkButton variant="whatsapp" icon={<MessageCircle />} href={waLink(client?.phone ?? "", msg)}>WhatsApp {client?.phone ? "du client" : ""}</LinkButton>
              <Button icon={<Download />} onClick={() => act.invoice(inv)}>PDF</Button>
              {st !== "payee" && <Button icon={<HandCoins />} onClick={() => openSheet({ kind: "payment", invoiceId: inv.id })}>Encaissement</Button>}
            </div>
            <p className="mt-2.5 text-[12.5px] text-muted">
              Sur téléphone, « Envoyer le PDF » ouvre le menu de partage : choisissez WhatsApp puis le client. Sur ordinateur, le PDF est enregistré ; le bouton WhatsApp ouvre la conversation avec le message prêt, il reste à joindre le fichier.
              {inv.status === "brouillon" && " La facture passe en « Envoyée » après le partage."}
            </p>
            {inv.status === "brouillon" && <Button size="sm" variant="ghost" className="mt-1 -ml-2" onClick={() => { s.markInvoiceSent(inv.id); toast("Facture marquée envoyée."); }}>Marquer envoyée sans partager</Button>}
          </div>
        )}

        {/* Montants */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-card border border-line bg-surface px-4 py-2">
            <KV k="Total TTC" v={gnf(t.ttc)} />
            <KV k="Encaissé" v={<span className="text-ok">{gnf(paidAmount(inv))}</span>} />
            <KV k="Reste dû" v={<span className={balance(inv) && st === "en_retard" ? "text-bad" : ""}>{gnf(balance(inv))}</span>} />
            <KV k="Échéance" v={fd(inv.dueDate)} />
          </div>
          <div className="rounded-card border border-line bg-surface px-4 py-3 text-sm">
            <div className="label-caps mb-1">Projet</div>
            <button type="button" className="text-left font-semibold text-accent hover:underline" onClick={() => { closeSheet(); go("projets", inv.projectId); }}>{project ? `${project.code} — ${project.name}` : "Projet supprimé"}</button>
            <div className="mt-2 text-muted">{inv.subject}</div>
            {inv.clientPoRef && <div className="mt-1 text-[12.5px] text-muted">BC client : {inv.clientPoRef}</div>}
          </div>
        </div>

        {/* Lignes */}
        <div className="overflow-x-auto rounded-card border border-line bg-surface">
          <table className="num w-full min-w-[480px] text-sm">
            <thead><tr className="bg-sunken/70 text-left text-[12px] text-muted"><th className="px-3 py-2 font-semibold">Désignation</th><th className="px-3 py-2 text-right font-semibold">Qté</th><th className="px-3 py-2 text-right font-semibold">P.U. HT</th><th className="px-3 py-2 text-right font-semibold">Montant HT</th></tr></thead>
            <tbody>{inv.items.map((it) => (
              <tr key={it.id} className="border-t border-line"><td className="px-3 py-2">{it.description}</td><td className="px-3 py-2 text-right">{it.quantity} {it.unit}</td><td className="px-3 py-2 text-right">{gnf(it.unitPrice)}</td><td className="px-3 py-2 text-right font-semibold">{gnf(lineTotal(it))}</td></tr>
            ))}</tbody>
          </table>
          <div className="border-t border-line px-3 py-2 text-right text-[12.5px] italic text-muted">{cap(amountInWords(t.ttc))} francs guinéens{inv.vatEnabled ? ` (TVA ${inv.vatRate} % : ${gnf(t.vat)})` : ""}</div>
        </div>

        {/* Encaissements */}
        <div>
          <h3 className="mb-2 font-display font-bold">Encaissements</h3>
          {inv.payments.length === 0 ? <p className="text-sm text-muted">Aucun encaissement enregistré.</p> : (
            <ul className="divide-y divide-line rounded-card border border-line bg-surface">
              {inv.payments.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="num">{fd(p.date)}</span><span className="text-muted">{PAYMENT_METHODS[p.method]}{p.reference ? ` · ${p.reference}` : ""}</span>
                  <span className="num ml-auto font-semibold text-ok">{gnf(p.amount)}</span>
                  <IconButton label="Supprimer l'encaissement" onClick={() => { s.removePayment(inv.id, p.id); toast("Encaissement supprimé."); }}><X /></IconButton>
                </li>
              ))}
            </ul>
          )}
        </div>

        {inv.reminders.length > 0 && (
          <div>
            <h3 className="mb-2 font-display font-bold">Relances envoyées</h3>
            <ul className="text-sm text-muted">{inv.reminders.map((r) => <li key={r.id} className="num">{fd(r.date)} · {REMINDER_LEVELS[r.level - 1]} · {REMINDER_CHANNELS[r.channel]}</li>)}</ul>
          </div>
        )}
      </div>
    </Sheet>
  );
}
