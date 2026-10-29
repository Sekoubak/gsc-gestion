/**
 * Modèle de données de GSC Gestion.
 *
 * Le Projet est le pivot : il relie un Client à un ou plusieurs Prestataires,
 * et porte l'historique des Factures (entrées), des Bons de commande (sorties)
 * et des Attestations de service.
 */

export type ID = string;
export type ISODate = string; // "2026-10-29"

export type ProjectStatus = "en_cours" | "en_attente" | "termine";
/** Statut saisi. « Payée », « Partielle » et « En retard » sont calculés (voir lib/calc.ts). */
export type InvoiceStatus = "brouillon" | "envoyee" | "annulee";
export type InvoiceState = "brouillon" | "envoyee" | "partielle" | "en_retard" | "payee" | "annulee";
export type POStatus = "brouillon" | "emis" | "livre" | "paye" | "annule";
export type PaymentMethod = "virement" | "especes" | "orange_money" | "mtn_momo" | "cheque";
export type ReminderChannel = "whatsapp" | "email" | "telephone";

export interface LineItem {
  id: ID;
  description: string;
  quantity: number;
  unit: string; // jour, mois, forfait, agent…
  unitPrice: number; // GNF HT
}

export interface Company {
  name: string;
  tagline: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  rccm: string;
  nif: string;
  bankName: string;
  bankAccount: string;
  mobileMoney: string;
  signatoryName: string;
  signatoryTitle: string;
  vatRate: number;
  paymentTermsDays: number;
  invoicePrefix: string;
  poPrefix: string;
  attestationPrefix: string;
  invoiceFooter: string;
  /** Seuils de relance en jours après l'échéance : niveau 1, 2, 3. */
  reminderDays: [number, number, number];
  reminderTemplates: [string, string, string];
}

export interface Branding {
  logo: string | null; // data URL PNG
  signature: string | null;
  stamp: string | null;
}

interface Base {
  id: ID;
  createdAt: number;
  /** Données d'exemple : supprimables en un clic dans Paramètres › Données. */
  demo?: boolean;
}

export interface Client extends Base {
  name: string;
  address: string;
  nif: string;
  rccm: string;
  contactName: string;
  phone: string;
  email: string;
}

export interface Provider extends Base {
  name: string;
  kind: "individuel" | "societe";
  skills: string[];
  dailyRate: number; // TJM en GNF
  phone: string;
  email: string;
  nif: string;
  bankName: string;
  bankAccount: string;
  mobileMoney: string;
}

export interface Project extends Base {
  code: string;
  name: string;
  clientId: ID;
  providerIds: ID[];
  status: ProjectStatus;
  startDate: ISODate;
  endDate: ISODate | "";
  budget: number; // budget HT vendu au client
  location: string;
  description: string;
}

export interface Payment {
  id: ID;
  date: ISODate;
  amount: number;
  method: PaymentMethod;
  reference: string;
}

export interface Reminder {
  id: ID;
  date: ISODate;
  level: 1 | 2 | 3;
  channel: ReminderChannel;
}

export interface Invoice extends Base {
  number: string;
  year: number;
  seq: number;
  projectId: ID;
  clientId: ID;
  issueDate: ISODate;
  dueDate: ISODate;
  subject: string;
  clientPoRef: string;
  items: LineItem[];
  vatEnabled: boolean;
  vatRate: number;
  discount: number;
  notes: string;
  status: InvoiceStatus;
  sentAt: number | null;
  payments: Payment[];
  reminders: Reminder[];
}

export interface PurchaseOrder extends Base {
  number: string;
  year: number;
  seq: number;
  projectId: ID;
  providerId: ID;
  issueDate: ISODate;
  deliveryDate: ISODate | "";
  subject: string;
  items: LineItem[];
  vatEnabled: boolean;
  vatRate: number;
  notes: string;
  status: POStatus;
  paidDate: ISODate | "";
}

export interface Attestation extends Base {
  number: string;
  year: number;
  seq: number;
  projectId: ID;
  providerId: ID;
  issueDate: ISODate;
  periodStart: ISODate;
  periodEnd: ISODate;
  days: number;
  mission: string;
  location: string;
  appreciation: string;
}

export interface AppData {
  company: Company;
  branding: Branding;
  clients: Client[];
  providers: Provider[];
  projects: Project[];
  invoices: Invoice[];
  purchaseOrders: PurchaseOrder[];
  attestations: Attestation[];
}

export type ModuleKey =
  | "dashboard"
  | "projets"
  | "factures"
  | "commandes"
  | "attestations"
  | "relances"
  | "bilan"
  | "parametres";
