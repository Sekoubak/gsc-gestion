import type { InvoiceState, PaymentMethod, POStatus, ProjectStatus, ReminderChannel } from "./types";

export type Tone = "neutral" | "accent" | "ok" | "warn" | "bad";

export const PROJECT_STATUS: Record<ProjectStatus, { label: string; tone: Tone }> = {
  en_cours: { label: "En cours", tone: "accent" },
  en_attente: { label: "En attente", tone: "warn" },
  termine: { label: "Terminé", tone: "neutral" },
};

export const INVOICE_STATE: Record<InvoiceState, { label: string; tone: Tone }> = {
  brouillon: { label: "Brouillon", tone: "neutral" },
  envoyee: { label: "Envoyée", tone: "accent" },
  partielle: { label: "Paiement partiel", tone: "warn" },
  en_retard: { label: "En retard", tone: "bad" },
  payee: { label: "Payée", tone: "ok" },
  annulee: { label: "Annulée", tone: "neutral" },
};

export const PO_STATUS: Record<POStatus, { label: string; tone: Tone }> = {
  brouillon: { label: "Brouillon", tone: "neutral" },
  emis: { label: "Émis", tone: "accent" },
  livre: { label: "Livré", tone: "warn" },
  paye: { label: "Payé", tone: "ok" },
  annule: { label: "Annulé", tone: "neutral" },
};

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  virement: "Virement bancaire",
  especes: "Espèces",
  orange_money: "Orange Money",
  mtn_momo: "MTN MoMo",
  cheque: "Chèque",
};

export const REMINDER_CHANNELS: Record<ReminderChannel, string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
  telephone: "Téléphone",
};

export const REMINDER_LEVELS = ["Rappel courtois", "Relance ferme", "Mise en demeure"] as const;

export const UNITS = ["jour", "mois", "forfait", "agent", "heure", "unité", "lot"];
