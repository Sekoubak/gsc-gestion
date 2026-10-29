"use client";
import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { Client, Project, Provider } from "@/lib/types";

/** Index id → entité, pour afficher les noms liés sans recherches répétées. */
export function useLookups() {
  const clients = useAppStore((s) => s.clients);
  const providers = useAppStore((s) => s.providers);
  const projects = useAppStore((s) => s.projects);
  return useMemo(() => {
    const c = new Map<string, Client>(clients.map((x) => [x.id, x]));
    const p = new Map<string, Provider>(providers.map((x) => [x.id, x]));
    const j = new Map<string, Project>(projects.map((x) => [x.id, x]));
    return {
      client: (id?: string) => (id ? c.get(id) : undefined),
      provider: (id?: string) => (id ? p.get(id) : undefined),
      project: (id?: string) => (id ? j.get(id) : undefined),
      clientName: (id?: string) => (id && c.get(id)?.name) || "Client supprimé",
      providerName: (id?: string) => (id && p.get(id)?.name) || "Prestataire supprimé",
      projectName: (id?: string) => (id && j.get(id)?.name) || "Projet supprimé",
    };
  }, [clients, providers, projects]);
}
