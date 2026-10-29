"use client";
import { useEffect } from "react";

/** Raccourci clavier global (Ctrl/Cmd + touche). */
export function useHotkey(key: string, handler: () => void) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === key) { e.preventDefault(); handler(); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [key, handler]);
}
