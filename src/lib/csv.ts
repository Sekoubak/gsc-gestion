/** CSV compatible Excel (séparateur ;, BOM UTF-8 pour les accents). */
export function toCsv(rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = typeof v === "number" ? String(Math.round(v)) : String(v ?? "");
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return new Blob(["﻿" + rows.map((r) => r.map(esc).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" });
}
