#!/usr/bin/env node
// Regenerates every app icon from the SVG sources in assets/icon/:
//   icon.svg               full detail — 48px and up
//   icon-small.svg         simplified  — 16-32px, where the radar arcs and
//                          window mullions would turn to mush
//   installer-sidebar.svg  Windows installer welcome/finish sidebar
//
// Outputs (all committed, so a normal build never needs this script):
//   electron/icon.ico       Windows app + installer icon (16-256px)
//   src/app/favicon.ico     browser favicon (16-48px)
//   src/app/icon.svg        modern-browser favicon (the small variant)
//   src/app/apple-icon.png  iOS home-screen icon (180px)
//   electron/installer-sidebar.bmp  installer sidebar (164x314)
//   electron/installer-header.bmp   installer inner-page header (150x57)
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

// NSIS's wizard pages only take 24-bit uncompressed BMP, which sharp can't
// write — so encode it by hand: 54-byte header, then BGR rows bottom-up,
// each padded to a multiple of 4 bytes.
async function bmp(image) {
  const { data, info } = await image
    .flatten({ background: "#ffffff" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const out = Buffer.alloc(54 + rowSize * height);
  out.write("BM", 0, "ascii");
  out.writeUInt32LE(out.length, 2);
  out.writeUInt32LE(54, 10); // pixel data offset
  out.writeUInt32LE(40, 14); // BITMAPINFOHEADER size
  out.writeInt32LE(width, 18);
  out.writeInt32LE(height, 22); // positive height = bottom-up rows
  out.writeUInt16LE(1, 26); // planes
  out.writeUInt16LE(24, 28); // bits per pixel
  out.writeUInt32LE(rowSize * height, 34);
  out.writeInt32LE(2835, 38); // 72 DPI
  out.writeInt32LE(2835, 42);
  for (let y = 0; y < height; y++) {
    const row = 54 + (height - 1 - y) * rowSize;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      out[row + x * 3] = data[i + 2];
      out[row + x * 3 + 1] = data[i + 1];
      out[row + x * 3 + 2] = data[i];
    }
  }
  return out;
}

writeFileSync(path.join(root, "electron", "icon.ico"), await ico([16, 24, 32, 48, 64, 128, 256]));
writeFileSync(
  path.join(root, "electron", "installer-sidebar.bmp"),
  await bmp(sharp(src("installer-sidebar.svg"), { density: 288 }).resize(164, 314))
);
// Header: the app icon on white, right-aligned (NSIS draws it top-right).
writeFileSync(
  path.join(root, "electron", "installer-header.bmp"),
  await bmp(
    sharp({ create: { width: 150, height: 57, channels: 3, background: "#ffffff" } }).composite([
      { input: await png(41), left: 103, top: 8 },
    ])
  )
);
writeFileSync(path.join(root, "src", "app", "favicon.ico"), await ico([16, 32, 48]));
copyFileSync(src("icon-small.svg"), path.join(root, "src", "app", "icon.svg"));
writeFileSync(path.join(root, "src", "app", "apple-icon.png"), await png(180));
console.log(
  "Icons written: electron/icon.ico, electron/installer-{sidebar,header}.bmp, " +
    "src/app/favicon.ico, src/app/icon.svg, src/app/apple-icon.png"
);
