# GSC Gestion

Application interne de **Guinea Services Consulting** : projets, factures, bons de commande, attestations de service, relances et bilan annuel. Tous les montants sont en francs guinéens (GNF).

Stack : **Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Lucide React · Zustand · jsPDF**.

---

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de production (vérifié)
npm run typecheck  # contrôle TypeScript
npm run lint       # ESLint
npm run build:artifact  # démo interactive en un seul fichier HTML (artifact/dist)
```

Node.js 22 est requis (fixé dans `package.json` pour Vercel). Les polices (Bricolage Grotesque, Figtree) sont chargées par `next/font` depuis Google Fonts au moment du build : Vercel y a accès sans configuration.

Au premier lancement, des **données d'exemple** (marquées « Exemple ») sont chargées. On les supprime en un clic : *Paramètres › Données › Supprimer les exemples*.

## Déployer sur Vercel (déploiement continu)

1. Créez un dépôt GitHub vide (ex. `gsc-gestion`) puis poussez ce dossier :
   ```bash
   git init && git add . && git commit -m "GSC Gestion v0.1"
   git branch -M main
   git remote add origin https://github.com/<votre-compte>/gsc-gestion.git
   git push -u origin main
   ```
2. Sur vercel.com : **Add New › Project › Import** le dépôt. Vercel détecte Next.js, aucun réglage n'est nécessaire.
3. Chaque `git push` sur `main` redéploie la production ; chaque branche ou pull request obtient une URL de prévisualisation.

---

## Structure du dépôt

```
gsc-gestion/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # polices, métadonnées, viewport
│   │   ├── page.tsx            # point d'entrée unique (SPA, sans SSR)
│   │   └── globals.css         # tokens de design (clair / sombre)
│   ├── components/
│   │   ├── layout/             # AppShell, Sidebar, CommandPalette, SheetHost, Toaster
│   │   ├── ui/                 # kit UI : Button, Card, Badge, Field, Sheet, Tabs, Stat…
│   │   ├── documents/          # ItemsEditor (lignes, TVA, remise, totaux) partagé
│   │   └── modules/
│   │       ├── dashboard/      # KPI, graphique des flux, raccourcis
│   │       ├── projects/       # liste, fiche projet, formulaire
│   │       ├── invoices/       # liste, formulaire, fiche, encaissements
│   │       ├── purchase-orders/# bons de commande prestataires
│   │       ├── attestations/   # générateur d'attestations de service
│   │       ├── reminders/      # relances automatiques
│   │       ├── reports/        # bilan annuel, marges, exports
│   │       └── settings/       # identité, signatures, registres, données
│   ├── hooks/                  # useLookups, useDocActions, useElementWidth, useHotkey
│   ├── store/                  # useAppStore (données persistées), useUiStore (navigation)
│   ├── data/                   # valeurs par défaut + jeu d'exemple
│   └── lib/
│       ├── types.ts            # modèle de données
│       ├── calc.ts             # totaux, statuts, marges, relances, bilan (logique pure)
│       ├── format.ts           # GNF, dates, montant en lettres, WhatsApp
│       ├── pdf/                # génération PDF (facture, BC, attestation, bilan)
│       ├── platform/           # adaptateur : stockage, téléchargement, partage
│       ├── csv.ts · image.ts · labels.ts
└── artifact/                   # build de la démo interactive (même code, un seul HTML)
```

### Principes d'architecture

- **Le projet est le pivot.** `Project` relie un `Client` et des `Provider` ; factures, bons de commande et attestations portent un `projectId`.
- **Logique pure dans `lib/calc.ts`.** Statuts calculés (une facture est « payée », « partielle » ou « en retard » d'après ses encaissements et son échéance), marges, flux et relances. Testable sans React.
- **Adaptateur plateforme (`lib/platform`).** Les composants n'appellent jamais `localStorage` ni l'API de téléchargement directement. Passer à une base de données (Supabase, Vercel Postgres) revient à remplacer `storage` dans ce module.
- **Navigation sans rechargement.** Le module actif vit dans `useUiStore` et se reflète dans l'ancre de l'URL (`#projets-<id>`), ce qui garde le bouton retour et les liens directs.

### Règles de calcul

| Indicateur | Définition |
|---|---|
| Marge brute | Facturé HT (hors brouillons et annulées) − bons de commande engagés HT |
| Entrées | Encaissements enregistrés sur les factures |
| Sorties | Bons de commande au statut « Payé », à leur date de paiement |
| Trésorerie nette | Entrées − sorties |
| Relances | Niveau 1 à J+3, niveau 2 à J+15, niveau 3 à J+30 après échéance (réglable) |

## Fonctionnalités incluses

- Numérotation séquentielle annuelle : `FAC-2026-0001`, `BC-2026-0001`, `ATT-2026-0001`.
- Montant en toutes lettres sur chaque document.
- Encaissements partiels et multiples (virement, espèces, Orange Money, MTN MoMo, chèque).
- PDF avec logo, signature et cachet (fond blanc rendu transparent automatiquement).
- Partage natif sur téléphone : le PDF part directement dans WhatsApp.
- Relances : file du jour, messages pré-rédigés à trois niveaux, historique.
- Attestations pré-remplies à partir des bons de commande (période, jours, mission).
- Palette de commandes **Ctrl/Cmd + K** : recherche globale et actions rapides.
- Exports : bilan PDF, CSV compatible Excel, sauvegarde/restauration JSON complète.
- Alerte de marge sous 15 % et suivi de consommation du budget par projet.
- Thème clair/sombre automatique, interface utilisable sur téléphone.

## Feuille de route conseillée

1. **Base de données et comptes** : Supabase (Postgres + Auth) ou Vercel Postgres + Auth.js, pour l'accès multi-poste et multi-utilisateur avec rôles (direction, comptabilité).
2. **Relances réellement automatiques** : route API + Vercel Cron quotidien qui envoie les relances par e-mail (Resend) ou WhatsApp Business API.
3. **Pièces jointes** : stockage des BC clients signés et justificatifs (Vercel Blob / Supabase Storage).
4. **Journal d'audit** et verrouillage des factures émises (conformité).
5. **Tests** : Vitest sur `lib/calc.ts` et `lib/format.ts`, Playwright sur les parcours principaux.
