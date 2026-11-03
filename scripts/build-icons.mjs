#!/usr/bin/env node
// Regenerates every app icon from the two SVG sources in assets/icon/:
//   icon.svg        full detail — 48px and up
//   icon-small.svg  simplified  — 16-32px, where the radar arcs and
//                   window mullions would turn to mush
//
// Outputs (all committed, so a normal build never needs this script):
//   electron/icon.ico       Windows app + installer icon (16-256px)
//   src/app/favicon.ico     browser favicon (16-48px)
//   src/app/icon.svg        modern-browser favicon (the small variant)
//   src/app/apple-icon.png  iOS home-screen icon (180px)
//
// Run after editing either SVG: `node scripts/build-icons.mjs`. Uses
// sharp, which Next.js already installs.

import { copyFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = (name) => path.join(root, "assets", "icon", name);
const SMALL_MAX = 32;

function png(size) {
  const svg = size <= SMALL_MAX ? src("icon-small.svg") : src("icon.svg");
  // Rasterize well above the target size, then downscale, for clean edges.
  return sharp(svg, { density: Math.max(72, (size / 1024) * 72 * 4) })
    .resize(size, size)
    .png()
    .toBuffer();
}

// ICO = 6-byte header + 16-byte entry per image + the images themselves.
// Entries hold plain PNG data, which Windows has read since Vista.
async function ico(sizes) {
  const images = await Promise.all(sizes.map(png));
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e); // 0 means 256
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt8(0, e + 2); // palette size
    header.writeUInt8(0, e + 3); // reserved
    header.writeUInt16LE(1, e + 4); // color planes
    header.writeUInt16LE(32, e + 6); // bits per pixel
    header.writeUInt32LE(images[i].length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += images[i].length;
  });
  return Buffer.concat([header, ...images]);
}

writeFileSync(path.join(root, "electron", "icon.ico"), await ico([16, 24, 32, 48, 64, 128, 256]));
writeFileSync(path.join(root, "src", "app", "favicon.ico"), await ico([16, 32, 48]));
copyFileSync(src("icon-small.svg"), path.join(root, "src", "app", "icon.svg"));
writeFileSync(path.join(root, "src", "app", "apple-icon.png"), await png(180));
console.log("Icons written: electron/icon.ico, src/app/favicon.ico, src/app/icon.svg, src/app/apple-icon.png");
