/**
 * Construit la démo interactive (un seul fichier HTML) à partir du même code que l'app Next.js.
 * - esbuild : bundle React + composants, en remplaçant l'adaptateur plateforme.
 * - Tailwind CLI : CSS compilé et intégré.
 * Usage : npm run build:artifact  →  artifact/dist/index.html
 */
import { build } from "esbuild";
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "artifact/dist");
mkdirSync(out, { recursive: true });

const platformAlias = {
  name: "platform-alias",
  setup(b) {
    b.onResolve({ filter: /^@\/lib\/platform$/ }, () => ({ path: resolve(root, "artifact/platform.ts") }));
  },
};

const js = await build({
  entryPoints: [resolve(root, "artifact/entry.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  write: false,
  legalComments: "none",
  charset: "ascii", // bundle 100 % ASCII : aucun souci d'encodage, quel que soit l'hôte
  tsconfig: resolve(root, "tsconfig.json"),
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [platformAlias],
  logLevel: "warning",
});

execSync(`npx tailwindcss -i src/app/globals.css -o ${out}/app.css --minify`, { cwd: root, stdio: "inherit" });
const css = readFileSync(`${out}/app.css`, "utf8");
const code = js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

const html = `<title>GSC Gestion</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Figtree:wght@400;500;600;700&display=swap">
<style>:root{--font-display:"Bricolage Grotesque";--font-body:"Figtree"}${css}</style>
<div id="root"></div>
<script>${code}</script>
`;
writeFileSync(`${out}/index.html`, html);
console.log(`artifact/dist/index.html — ${(html.length / 1024).toFixed(0)} Ko`);
