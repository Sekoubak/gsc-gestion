/**
 * Prépare une image (logo, signature, cachet) pour les documents :
 * redimensionnement, conversion PNG et, en option, suppression du fond blanc
 * pour que la signature et le cachet se superposent proprement.
 */
export async function prepareImage(file: File, { maxSide = 640, removeWhite = false, maxBytes = 180_000 } = {}): Promise<string> {
  const url = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file); });
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("image")); i.src = url; });
  let out = "";
  for (const side of [maxSide, 520, 420, 320, 240]) {
    const s = Math.min(1, side / img.naturalWidth, side / img.naturalHeight);
    const w = Math.max(1, Math.round(img.naturalWidth * s)), h = Math.max(1, Math.round(img.naturalHeight * s));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    if (removeWhite) {
      const d = ctx.getImageData(0, 0, w, h), p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        const l = (p[i] + p[i + 1] + p[i + 2]) / 3;
        if (l > 205) p[i + 3] = 0;
        else if (l > 165) p[i + 3] = Math.round((p[i + 3] * (205 - l)) / 40);
      }
      ctx.putImageData(d, 0, 0);
    }
    out = c.toDataURL("image/png");
    if (out.length < maxBytes) break;
  }
  return out;
}
