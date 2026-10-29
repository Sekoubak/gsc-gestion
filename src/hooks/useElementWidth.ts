"use client";
import { useEffect, useRef, useState } from "react";

/** Largeur réelle d'un conteneur, pour dessiner les graphiques SVG à l'échelle (texte non déformé). */
export function useElementWidth<T extends HTMLElement>(initial = 640) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}
