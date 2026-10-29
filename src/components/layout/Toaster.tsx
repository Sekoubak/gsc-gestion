"use client";

import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useUi } from "@/store/useUiStore";

export function Toaster() {
  const { toasts, dismiss } = useUi();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 lg:items-start lg:pl-[284px]"
      style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div key={t.id} className="fade-in pointer-events-auto flex max-w-md items-center gap-3 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-bg shadow-pop">
          {t.tone === "ok" ? <CheckCircle2 className="size-[18px] shrink-0 text-ok" /> : t.tone === "bad" ? <TriangleAlert className="size-[18px] shrink-0 text-bad" /> : <Info className="size-[18px] shrink-0" />}
          <span className="min-w-0">{t.text}</span>
          <button type="button" aria-label="Fermer" onClick={() => dismiss(t.id)} className="-mr-1 ml-1 opacity-60 hover:opacity-100"><X className="size-4" /></button>
        </div>
      ))}
    </div>
  );
}
