/**
 * Données d'exemple (marquées demo: true).
 * Elles montrent l'application en situation réelle au premier lancement et se
 * suppriment en un clic : Paramètres › Données › « Supprimer les exemples ».
 */
import { docTotals } from "@/lib/calc";
import type { AppData, Client, Invoice, LineItem, Project, Provider, PurchaseOrder, Attestation } from "@/lib/types";

const t0 = Date.UTC(2026, 0, 5);
let n = 0;
const id = (p: string) => `${p}demo${(++n).toString().padStart(3, "0")}`;
const li = (description: string, quantity: number, unit: string, unitPrice: number): LineItem => ({ id: id("li"), description, quantity, unit, unitPrice });

export function buildSeed(): Omit<AppData, "company" | "branding"> {
  n = 0;
  const clients: Client[] = [
    { id: "cldemomine", createdAt: t0, demo: true, name: "Compagnie Minière de Kakandé (exemple)", address: "Kamsar, Boké", nif: "123456789", rccm: "GN.TCC.2019.B.01234", contactName: "M. Camara", phone: "622 00 00 01", email: "achats@exemple-mine.gn" },
    { id: "cldemotel", createdAt: t0, demo: true, name: "Opérateur Télécom Guinée (exemple)", address: "Kaloum, Conakry", nif: "987654321", rccm: "GN.TCC.2015.B.04567", contactName: "Mme Diallo", phone: "664 00 00 02", email: "rh@exemple-telecom.gn" },
    { id: "cldemoong", createdAt: t0, demo: true, name: "ONG Santé Pour Tous (exemple)", address: "Ratoma, Conakry", nif: "456123789", rccm: "", contactName: "Dr Bah", phone: "655 00 00 03", email: "admin@exemple-ong.org" },
  ];
  const providers: Provider[] = [
    { id: "prdemosec", createdAt: t0, demo: true, name: "Sécuri-Garde SARL (exemple)", kind: "societe", skills: ["Gardiennage", "Sécurité de site"], dailyRate: 180000, phone: "620 10 10 10", email: "contact@exemple-securigarde.gn", nif: "741852963", bankName: "Ecobank Guinée", bankAccount: "GN00 0000 0000 0000 0001", mobileMoney: "" },
    { id: "prdemoit", createdAt: t0, demo: true, name: "Mamadou Sylla (exemple)", kind: "individuel", skills: ["Réseaux", "Support informatique", "Fibre optique"], dailyRate: 650000, phone: "621 20 20 20", email: "m.sylla@exemple.gn", nif: "", bankName: "", bankAccount: "", mobileMoney: "621 20 20 20 (Orange Money)" },
    { id: "prdemorh", createdAt: t0, demo: true, name: "Aïssatou Barry (exemple)", kind: "individuel", skills: ["Recrutement", "Évaluation RH", "Formation"], dailyRate: 550000, phone: "623 30 30 30", email: "a.barry@exemple.gn", nif: "", bankName: "Orabank", bankAccount: "GN00 0000 0000 0000 0002", mobileMoney: "" },
    { id: "prdemolog", createdAt: t0, demo: true, name: "Trans-Logistique GN (exemple)", kind: "societe", skills: ["Chauffeurs", "Logistique"], dailyRate: 250000, phone: "628 40 40 40", email: "ops@exemple-translog.gn", nif: "369258147", bankName: "Société Générale Guinée", bankAccount: "GN00 0000 0000 0000 0003", mobileMoney: "" },
  ];
  const projects: Project[] = [
    { id: "pjdemo1", createdAt: t0, demo: true, code: "PRJ-2026-001", name: "Gardiennage site de Kamsar", clientId: "cldemomine", providerIds: ["prdemosec", "prdemolog"], status: "en_cours", startDate: "2026-01-15", endDate: "2026-12-31", budget: 420000000, location: "Kamsar, Boké", description: "Mise à disposition de 12 agents de sécurité et de 2 chauffeurs pour la surveillance du site portuaire." },
    { id: "pjdemo2", createdAt: t0, demo: true, code: "PRJ-2026-002", name: "Déploiement réseau agences", clientId: "cldemotel", providerIds: ["prdemoit"], status: "en_cours", startDate: "2026-04-01", endDate: "2026-11-30", budget: 185000000, location: "Conakry et Kindia", description: "Installation et configuration du réseau local de 8 agences commerciales." },
    { id: "pjdemo3", createdAt: t0, demo: true, code: "PRJ-2026-003", name: "Recrutement de 25 agents de santé", clientId: "cldemoong", providerIds: ["prdemorh"], status: "termine", startDate: "2026-02-01", endDate: "2026-05-31", budget: 68000000, location: "Conakry", description: "Présélection, entretiens et tests techniques pour 25 postes d'agents de santé communautaire." },
    { id: "pjdemo4", createdAt: t0, demo: true, code: "PRJ-2026-004", name: "Audit RH du siège", clientId: "cldemotel", providerIds: ["prdemorh"], status: "en_attente", startDate: "2026-11-15", endDate: "", budget: 45000000, location: "Kaloum, Conakry", description: "Audit des processus RH et cartographie des compétences, en attente du bon de commande client." },
  ];

  const inv = (p: Partial<Invoice> & Pick<Invoice, "seq" | "projectId" | "clientId" | "issueDate" | "dueDate" | "subject" | "items">): Invoice => ({
    id: id("in"), createdAt: t0, demo: true, year: 2026, number: `FAC-2026-${String(p.seq).padStart(4, "0")}`,
    clientPoRef: "", vatEnabled: true, vatRate: 18, discount: 0, notes: "", status: "envoyee", sentAt: t0, payments: [], reminders: [], ...p,
  });
  const FULL = -1;
  const pay = (date: string, amount: number, method: Invoice["payments"][number]["method"] = "virement") => ({ id: id("pa"), date, amount, method, reference: "" });

  const invoices: Invoice[] = [
    inv({ seq: 1, projectId: "pjdemo1", clientId: "cldemomine", issueDate: "2026-02-02", dueDate: "2026-03-04", subject: "Gardiennage — janvier 2026", clientPoRef: "PO-SMB-2026-011", items: [li("Agents de sécurité (12 agents)", 204, "jour", 165000), li("Chauffeurs (2)", 34, "jour", 230000)], payments: [pay("2026-03-02", FULL)] }),
    inv({ seq: 2, projectId: "pjdemo3", clientId: "cldemoong", issueDate: "2026-03-10", dueDate: "2026-04-09", subject: "Recrutement — phase 1 (présélection)", vatEnabled: false, items: [li("Présélection et tests écrits", 1, "forfait", 28000000)], payments: [pay("2026-04-02", FULL, "orange_money")] }),
    inv({ seq: 3, projectId: "pjdemo1", clientId: "cldemomine", issueDate: "2026-04-01", dueDate: "2026-05-01", subject: "Gardiennage — février et mars 2026", clientPoRef: "PO-SMB-2026-011", items: [li("Agents de sécurité (12 agents)", 456, "jour", 165000), li("Chauffeurs (2)", 76, "jour", 230000)], payments: [pay("2026-05-12", FULL)] }),
    inv({ seq: 4, projectId: "pjdemo2", clientId: "cldemotel", issueDate: "2026-05-05", dueDate: "2026-06-04", subject: "Réseau agences — lot 1 (4 agences)", items: [li("Ingénieur réseau", 40, "jour", 1150000), li("Câblage et baies", 4, "lot", 6500000)], payments: [pay("2026-06-20", FULL)] }),
    inv({ seq: 5, projectId: "pjdemo3", clientId: "cldemoong", issueDate: "2026-06-02", dueDate: "2026-07-02", subject: "Recrutement — phase 2 (entretiens et placement)", vatEnabled: false, items: [li("Entretiens et tests techniques", 1, "forfait", 22000000), li("Frais de placement", 25, "agent", 600000)], payments: [pay("2026-07-01", FULL, "virement")] }),
    inv({ seq: 6, projectId: "pjdemo1", clientId: "cldemomine", issueDate: "2026-07-01", dueDate: "2026-07-31", subject: "Gardiennage — avril à juin 2026", clientPoRef: "PO-SMB-2026-011", items: [li("Agents de sécurité (12 agents)", 702, "jour", 165000), li("Chauffeurs (2)", 117, "jour", 230000)], payments: [pay("2026-08-10", 100000000), pay("2026-09-05", FULL)] }),
    inv({ seq: 7, projectId: "pjdemo2", clientId: "cldemotel", issueDate: "2026-08-20", dueDate: "2026-09-19", subject: "Réseau agences — lot 2 (4 agences)", items: [li("Ingénieur réseau", 38, "jour", 1150000), li("Câblage et baies", 4, "lot", 6500000)], payments: [pay("2026-10-02", 30000000)], reminders: [{ id: id("re"), date: "2026-09-23", level: 1, channel: "whatsapp" }] }),
    inv({ seq: 8, projectId: "pjdemo1", clientId: "cldemomine", issueDate: "2026-10-01", dueDate: "2026-10-31", subject: "Gardiennage — juillet à septembre 2026", clientPoRef: "PO-SMB-2026-011", items: [li("Agents de sécurité (12 agents)", 702, "jour", 165000), li("Chauffeurs (2)", 117, "jour", 230000)] }),
    inv({ seq: 9, projectId: "pjdemo2", clientId: "cldemotel", issueDate: "2026-10-28", dueDate: "2026-11-27", subject: "Réseau agences — recette et documentation", status: "brouillon", sentAt: null, items: [li("Recette et documentation", 1, "forfait", 9500000)] }),
  ];
  // FULL = solde exact de la facture (reste dû après les paiements précédents)
  for (const i of invoices) {
    let paid = 0;
    i.payments = i.payments.map((p) => { const amount = p.amount === FULL ? docTotals(i).ttc - paid : p.amount; paid += amount; return { ...p, amount }; });
  }

  const po = (p: Partial<PurchaseOrder> & Pick<PurchaseOrder, "seq" | "projectId" | "providerId" | "issueDate" | "subject" | "items" | "status">): PurchaseOrder => ({
    id: id("po"), createdAt: t0, demo: true, year: 2026, number: `BC-2026-${String(p.seq).padStart(4, "0")}`, deliveryDate: "", vatEnabled: false, vatRate: 18, notes: "", paidDate: "", ...p,
  });
  const purchaseOrders: PurchaseOrder[] = [
    po({ seq: 1, projectId: "pjdemo1", providerId: "prdemosec", issueDate: "2026-01-20", subject: "Agents de sécurité — T1 2026", items: [li("Agents de sécurité (12 agents)", 660, "jour", 120000)], status: "paye", paidDate: "2026-04-10" }),
    po({ seq: 2, projectId: "pjdemo1", providerId: "prdemolog", issueDate: "2026-01-20", subject: "Chauffeurs — T1 2026", items: [li("Chauffeurs (2)", 110, "jour", 175000)], status: "paye", paidDate: "2026-04-12" }),
    po({ seq: 3, projectId: "pjdemo3", providerId: "prdemorh", issueDate: "2026-02-05", subject: "Mission recrutement agents de santé", items: [li("Consultante RH", 60, "jour", 550000)], status: "paye", paidDate: "2026-07-05" }),
    po({ seq: 4, projectId: "pjdemo2", providerId: "prdemoit", issueDate: "2026-04-03", subject: "Ingénieur réseau — lots 1 et 2", items: [li("Ingénieur réseau", 78, "jour", 650000)], status: "livre" }),
    po({ seq: 5, projectId: "pjdemo1", providerId: "prdemosec", issueDate: "2026-04-02", subject: "Agents de sécurité — T2 et T3 2026", items: [li("Agents de sécurité (12 agents)", 1404, "jour", 120000)], status: "paye", paidDate: "2026-09-15" }),
    po({ seq: 6, projectId: "pjdemo1", providerId: "prdemolog", issueDate: "2026-04-02", subject: "Chauffeurs — T2 et T3 2026", items: [li("Chauffeurs (2)", 234, "jour", 175000)], status: "emis" }),
  ];

  const attestations: Attestation[] = [
    { id: id("at"), createdAt: t0, demo: true, number: "ATT-2026-0001", year: 2026, seq: 1, projectId: "pjdemo3", providerId: "prdemorh", issueDate: "2026-06-05", periodStart: "2026-02-05", periodEnd: "2026-05-29", days: 60, mission: "Conduite du processus de recrutement de 25 agents de santé communautaire : rédaction des fiches de poste, présélection, tests écrits, entretiens et rapport final de placement.", location: "Conakry", appreciation: "à notre entière satisfaction" },
  ];

  return { clients, providers, projects, invoices, purchaseOrders, attestations };
}
