/**
 * Adaptateur plateforme — version « artefact Claude » (démo publiée).
 * Remplace src/lib/platform/index.ts au moment du bundle (voir artifact/build.mjs).
 *  - Persistance : base partagée de l'artefact (capability `db`), un document par
 *    enregistrement pour rester loin de la limite de 256 Ko par document.
 *  - Fichiers : capability `downloads` (le navigateur bloque les téléchargements directs).
 */
import { createJSONStorage, type StateStorage } from "zustand/middleware";

type Doc = { get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>; set(d: Record<string, unknown>): Promise<void>; delete(): Promise<void> };
type Coll = { limit(n: number): { get(): Promise<{ docs: { id: string; data(): Record<string, unknown> | undefined }[] }> } };
type DB = { doc(p: string): Doc; collection(p: string): Coll };
type Downloads = { save(r: { filename: string; data: Blob | string }): Promise<unknown> };
declare global { interface Window { claude?: { use(name: string): Promise<unknown> } } }

const ARRAYS = ["clients", "providers", "projects", "invoices", "purchaseOrders", "attestations"] as const;
const SINGLE = ["company"] as const;
const IMAGES = ["logo", "signature", "stamp"] as const; // un document par image (limite 256 Ko/doc)

const dbP: Promise<DB | null> = (async () => { try { return ((await window.claude?.use("db")) as DB) ?? null; } catch { return null; } })();
const dlP: Promise<Downloads | null> = (async () => { try { return ((await window.claude?.use("downloads")) as Downloads) ?? null; } catch { return null; } })();

const emit = (detail: string) => window.dispatchEvent(new CustomEvent("gsc:storage-error", { detail }));

/* Dernière valeur écrite par document, pour n'envoyer que ce qui change. */
const last = new Map<string, string>();
const pending = new Map<string, unknown>(); // path -> valeur à écrire (undefined = supprimer)
const chains = new Map<string, Promise<void>>();
let timer: ReturnType<typeof setTimeout> | null = null;
let warned = false;
let readFailed = false; // si la lecture initiale échoue, on n'écrit rien pour ne pas écraser les données

function schedule(path: string, value: unknown) {
  pending.set(path, value);
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 500);
}

async function flush() {
  timer = null;
  const db = await dbP;
  if (!db) { if (!warned) { warned = true; emit("nodb"); } return; }
  const batch = [...pending.entries()];
  pending.clear();
  for (const [path, value] of batch) {
    // Une écriture à la fois par document.
    const prev = chains.get(path) ?? Promise.resolve();
    const next = prev.then(async () => {
      try {
        if (value === undefined) await db.doc(path).delete();
        else await db.doc(path).set({ v: value as never });
      } catch (e) {
        last.delete(path);
        const code = (e as { code?: string })?.code;
        emit(code === "quota_exceeded" ? "quota" : code === "revoked" || code === "invalid_argument" ? "nodb" : "retry");
      }
    });
    chains.set(path, next);
  }
}

const dbStorage: StateStorage = {
  async getItem() {
    const db = await dbP;
    if (!db) { emit("nodb"); return null; }
    try { return await readAll(db); }
    catch { readFailed = true; emit("retry"); return null; }
  },
  setItem(_name, value) {
    if (readFailed) return;
    let parsed: { state: Record<string, unknown> };
    try { parsed = JSON.parse(value); } catch { return; }
    writeDiff(parsed.state);
  },
  removeItem() { /* non utilisé */ },
};

async function readAll(db: DB) {
    const state: Record<string, unknown> = {};
    let found = false;
    const single = await db.collection("store").limit(50).get();
    const branding: Record<string, unknown> = { logo: null, signature: null, stamp: null };
    for (const d of single.docs) {
      const v = d.data()?.v;
      if (v === undefined) continue;
      last.set(`store/${d.id}`, JSON.stringify(v));
      if (d.id.startsWith("img_")) branding[d.id.slice(4)] = v;
      else state[d.id] = v;
      found = true;
    }
    state.branding = branding;
    for (const key of ARRAYS) {
      const snap = await db.collection(`r_${key}`).limit(1000).get();
      const rows = snap.docs.map((d) => d.data()?.v).filter(Boolean) as { id: string; createdAt?: number }[];
      rows.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
      rows.forEach((r) => last.set(`r_${key}/${r.id}`, JSON.stringify(r)));
      if (rows.length) found = true;
      state[key] = rows;
    }
    return found ? JSON.stringify({ state, version: 1 }) : null;
}

function writeDiff(st: Record<string, unknown>) {
    for (const key of SINGLE) {
      const path = `store/${key}`;
      const s = JSON.stringify(st[key]);
      if (last.get(path) !== s) { last.set(path, s); schedule(path, st[key]); }
    }
    const branding = (st.branding ?? {}) as Record<string, unknown>;
    for (const k of IMAGES) {
      const path = `store/img_${k}`;
      const v = branding[k] ?? null;
      const s = JSON.stringify(v);
      if ((last.get(path) ?? "null") !== s) { last.set(path, s); schedule(path, v); }
    }
    for (const key of ARRAYS) {
      const rows = (st[key] as { id: string }[]) ?? [];
      const seen = new Set<string>();
      for (const r of rows) {
        const path = `r_${key}/${r.id}`;
        seen.add(path);
        const s = JSON.stringify(r);
        if (last.get(path) !== s) { last.set(path, s); schedule(path, r); }
      }
      for (const path of [...last.keys()]) {
        if (path.startsWith(`r_${key}/`) && !seen.has(path)) { last.delete(path); schedule(path, undefined); }
      }
    }
}

export const storage = createJSONStorage(() => dbStorage);
export const AUTOLOAD_DEMO = false;
export const PLATFORM = "artifact" as const;

export async function saveFile(blob: Blob, filename: string): Promise<boolean> {
  const dl = await dlP;
  if (!dl) { emit("nodownload"); return false; }
  try { await dl.save({ filename, data: blob }); return true; }
  catch (e) {
    const code = (e as { code?: string })?.code;
    if (code !== "declined") emit(code === "rate_limited" ? "busy" : "nodownload");
    return false;
  }
}

export async function shareFile(blob: Blob, filename: string, _text: string): Promise<"shared" | "saved" | "cancelled"> {
  return (await saveFile(blob, filename)) ? "saved" : "cancelled";
}

export const canNativeShare = () => false;
