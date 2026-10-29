/**
 * Adaptateur plateforme — version web (Next.js / Vercel).
 * La démo publiée remplace ce module par artifact/platform.ts au moment du bundle :
 * le reste du code ne dépend que de cette interface.
 */
import { createJSONStorage, type StateStorage } from "zustand/middleware";

/** Persistance locale (navigateur). Remplaçable par une API (Supabase, Postgres…) sans toucher aux composants. */
const local: StateStorage = {
  getItem: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  setItem: (k, v) => {
    try { localStorage.setItem(k, v); }
    catch { window.dispatchEvent(new CustomEvent("gsc:storage-error", { detail: "quota" })); }
  },
  removeItem: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};
export const storage = createJSONStorage(() => local);

/** Charger les données d'exemple au tout premier lancement. */
export const AUTOLOAD_DEMO = true;

export const PLATFORM = "web" as const;

export async function saveFile(blob: Blob, filename: string): Promise<boolean> {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}

/**
 * Partage natif (téléphone) : ouvre la feuille de partage avec le PDF joint,
 * l'utilisateur choisit WhatsApp. Sinon, téléchargement.
 */
export async function shareFile(blob: Blob, filename: string, text: string): Promise<"shared" | "saved" | "cancelled"> {
  const file = new File([blob], filename, { type: blob.type || "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text, title: filename });
      return "shared";
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return "cancelled";
    }
  }
  await saveFile(blob, filename);
  return "saved";
}

export const canNativeShare = () =>
  typeof navigator !== "undefined" && "canShare" in navigator;
