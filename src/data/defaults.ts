import type { AppData, Company } from "@/lib/types";

export const DEFAULT_COMPANY: Company = {
  name: "Guinea Services Consulting",
  tagline: "Intérim, recrutement et mise à disposition de personnel",
  address: "",
  city: "Conakry, Guinée",
  phone: "",
  email: "",
  website: "",
  rccm: "",
  nif: "",
  bankName: "",
  bankAccount: "",
  mobileMoney: "",
  signatoryName: "Sekouba Kourouma",
  signatoryTitle: "Le Directeur Général",
  vatRate: 18,
  paymentTermsDays: 30,
  invoicePrefix: "FAC",
  poPrefix: "BC",
  attestationPrefix: "ATT",
  invoiceFooter: "Merci de rappeler le numéro de facture lors de votre règlement.",
  reminderDays: [3, 15, 30],
  reminderTemplates: [
    "Bonjour {contact}, sauf erreur de notre part, la facture {numero} de {montant}, échue le {echeance}, reste en attente de règlement. Pourriez-vous nous indiquer la date de paiement prévue ? Merci. {entreprise}",
    "Bonjour {contact}, malgré notre premier rappel, la facture {numero} ({montant}) reste impayée depuis {jours} jours. Nous vous remercions de procéder au règlement sous 7 jours. {entreprise}",
    "Bonjour {contact}, la facture {numero} d'un montant de {montant} est impayée depuis {jours} jours malgré nos relances. Sans règlement sous 8 jours, nous serons contraints de suspendre nos prestations et d'engager les démarches de recouvrement. {entreprise}",
  ],
};

export const EMPTY_DATA: AppData = {
  company: DEFAULT_COMPANY,
  branding: { logo: null, signature: null, stamp: null },
  clients: [],
  providers: [],
  projects: [],
  invoices: [],
  purchaseOrders: [],
  attestations: [],
};
