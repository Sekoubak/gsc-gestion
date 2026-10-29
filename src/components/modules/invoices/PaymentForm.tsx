"use client";

import { useState } from "react";
import { Button, Input, KV, MoneyInput, Select, Sheet } from "@/components/ui";
import { balance, docTotals } from "@/lib/calc";
import { gnf, today } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/labels";
import type { PaymentMethod } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { useUi } from "@/store/useUiStore";

export function PaymentForm({ invoiceId }: { invoiceId: string }) {
  const s = useAppStore();
  const { openSheet, closeSheet, toast } = useUi();
  const inv = s.invoices.find((i) => i.id === invoiceId);
  const [amount, setAmount] = useState(inv ? balance(inv) : 0);
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState<PaymentMethod>("virement");
  const [reference, setReference] = useState("");
  if (!inv) return null;

  const back = () => openSheet({ kind: "invoice-view", id: inv.id });
  const save = () => {
    if (amount <= 0) return toast("Indiquez le montant encaissé.", "bad");
    s.addPayment(inv.id, { amount, date, method, reference });
    toast(amount >= balance(inv) ? `Facture ${inv.number} soldée.` : `Encaissement de ${gnf(amount)} enregistré.`);
    back();
  };

  return (
    <Sheet title="Enregistrer un encaissement" sub={`Facture ${inv.number}`} onClose={closeSheet}
      footer={<><Button variant="primary" onClick={save}>Enregistrer</Button><Button variant="ghost" onClick={back}>Retour</Button></>}>
      <div className="mb-5 rounded-card border border-line bg-surface px-4 py-2">
        <KV k="Total TTC" v={gnf(docTotals(inv).ttc)} />
        <KV k="Reste dû" v={gnf(balance(inv))} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MoneyInput label="Montant reçu" value={amount} onChange={setAmount} hint="Un montant inférieur enregistre un paiement partiel." />
        <Input label="Date de réception" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Select label="Mode de paiement" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
          {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Input label="Référence" placeholder="N° de virement, de transaction…" value={reference} onChange={(e) => setReference(e.target.value)} />
      </div>
    </Sheet>
  );
}
