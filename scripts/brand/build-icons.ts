/**
 * Genera el logo y los íconos desde el logo vectorial (`assets-src/logo-berypez.svg`).
 * El ícono se rehace en vectorial (peces blancos sobre círculo azul #1A8EB3, como el
 * original de 225 px) para que sea nítido en cualquier tamaño.
 *
 * Salidas:
 *   src/components/brand/logo-paths.tsx  ← trazos del logo para usarlos con currentColor
 *   src/app/icon.svg                     ← favicon vectorial (navegadores modernos)
 *   src/app/favicon.ico                  ← 16/32/48 px (navegadores antiguos)
 *   src/app/apple-icon.png               ← 180 px (iPhone)
 *   public/icons/icon-192.png, icon-512.png, icon-maskable-512.png ← manifest
 *
 * Uso: npm run brand:icons
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const SOURCE = path.resolve("assets-src/logo-berypez.svg");
const ICON_BLUE = "#1A8EB3";
// Los peces ocupan x ∈ [0, 81] del viewBox 291×64 del logo; las letras empiezan en x≈97.
const FISH_VIEWBOX = "0 0 81 64";

function extractPaths(svg: string): string[] {
  return [...svg.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*>/g)].map((m) => m[1] ?? "");
}

/** Menor y mayor x absoluta de un trazo (aproximado: comandos absolutos M/L/C/S/Q/T/H). */
function xRange(d: string): [number, number] {
  const xs: number[] = [];
  for (const [, command = "", args = ""] of d.matchAll(/([MLCSQTH])([^A-Za-z]*)/g)) {
    const values = (args.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    if (command === "H") {
      xs.push(...values);
    } else {
      for (let i = 0; i < values.length; i += 2) xs.push(values[i] ?? 0);
    }
  }
  return [Math.min(...xs), Math.max(...xs)];
}

/** Trazos de los peces (x ≤ 82), ordenados de izquierda a derecha para animarlos en secuencia. */
function fishPaths(paths: string[]): string[] {
  return paths
    .map((d) => ({ d, range: xRange(d) }))
    .filter(({ range }) => range[1] <= 82)
    .sort((a, b) => a.range[0] - b.range[0])
    .map(({ d }) => d);
}

function logoComponent(paths: string[]): string {
  const jsx = paths.map((d) => `    <path d="${d}" />`).join("\n");
  const fish = fishPaths(paths)
    .map(
      (d, i) => `    <path className="pez" style={{ "--pez": ${i} } as CSSProperties} d="${d}" />`,
    )
    .join("\n");
  return `// Generado por scripts/brand/build-icons.ts desde assets-src/logo-berypez.svg. No editar a mano.
import type { CSSProperties } from "react";

export const LOGO_VIEWBOX = "0 0 291 64";
export const FISH_VIEWBOX = "${FISH_VIEWBOX}";

export function LogoPaths() {
  return (
    <>
${jsx}
    </>
  );
}

/** Solo los peces, de izquierda a derecha, con la variable --pez (0, 1, 2…) para animarlos en secuencia. */
export function FishPaths() {
  return (
    <>
${fish}
    </>
  );
}
`;
}

function iconSvg(paths: string[], { maskable = false } = {}): string {
  // En el ícono "maskable" el fondo llena todo y los peces quedan dentro de la zona segura (80 %).
  const background = maskable
    ? `<rect width="100" height="100" fill="${ICON_BLUE}"/>`
    : `<circle cx="50" cy="50" r="50" fill="${ICON_BLUE}"/>`;
  const box = maskable ? { x: 20, y: 25, w: 62, h: 49 } : { x: 17, y: 23, w: 68, h: 54 };
  const body = paths.map((d) => `<path d="${d}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${background}<svg x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" viewBox="${FISH_VIEWBOX}" fill="#FFFFFF">${body}</svg></svg>`;
}

/** ICO con imágenes PNG embebidas (formato admitido desde Windows Vista y por todos los navegadores). */
function buildIco(pngs: Array<{ size: number; data: Buffer }>): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

const png = (svg: string, size: number) =>
  sharp(Buffer.from(svg), { density: 600 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();

async function main(): Promise<void> {
  sharp.cache(false);
  const paths = extractPaths(await readFile(SOURCE, "utf8"));
  if (paths.length === 0) {
    throw new Error("No se encontraron trazos en el logo.");
  }

  await mkdir("src/components/brand", { recursive: true });
  await mkdir("public/icons", { recursive: true });

  const icon = iconSvg(paths);
  const maskable = iconSvg(paths, { maskable: true });

  await writeFile("src/components/brand/logo-paths.tsx", logoComponent(paths), "utf8");
  await writeFile("src/app/icon.svg", icon, "utf8");
  await writeFile(
    "src/app/favicon.ico",
    buildIco(
      await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(icon, size) }))),
    ),
  );
  await writeFile("src/app/apple-icon.png", await png(maskable, 180));
  await writeFile("public/icons/icon-192.png", await png(icon, 192));
  await writeFile("public/icons/icon-512.png", await png(icon, 512));
  await writeFile("public/icons/icon-maskable-512.png", await png(maskable, 512));

  process.stdout.write(`Logo (${paths.length} trazos) e íconos generados.\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
