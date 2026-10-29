"use client";

import dynamic from "next/dynamic";

/**
 * L'application est une SPA : la navigation entre modules se fait côté client,
 * sans rechargement. Le rendu serveur est désactivé car l'état vit dans le navigateur.
 */
const AppShell = dynamic(() => import("@/components/layout/AppShell"), { ssr: false });

export default function Page() {
  return <AppShell />;
}
