/**
 * Regenerate the native app icons and launch screens from the brand masters.
 *
 * Source of truth is brand/*.svg — the same masters the web icons in
 * client/public come from. Nothing here redraws the mark: an earlier version of
 * this script had the glyph geometry copied inline, which meant running it
 * silently reverted the app to the previous logo. Render, never redraw.
 *
 * Run with `node scripts/generate-app-icons.mjs` after any change to the mark,
 * then `npx cap sync`.
 */

import sharp from 'sharp';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const TEAL = '#01696F';        // splash + adaptive-icon background
const MARK_FRAC = 0.2039;      // mark width as a fraction of the splash short edge
const GEOM = 0.92;             // the mark fills 92% of its own viewBox
const FG_FRAC = 0.60;          // mark width on the 108dp adaptive canvas

const TILE     = 'brand/acqlerate-icon.svg';          // rounded tile
const SQUARE   = 'brand/acqlerate-icon-square.svg';   // square, no rounding
const MASKABLE = 'brand/acqlerate-icon-maskable.svg'; // full bleed, mark at 72%
const MARK     = 'brand/acqlerate-mark-only.svg';     // mark on transparent

const svg = async (p) => await readFile(p);
const render = async (p, size) =>
  sharp(await svg(p), { density: 384 }).resize(size, size).png().toBuffer();

async function write(path, buf) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buf);
  console.log(`  ${path}`);
}

/** Circle mask, for the Android round icon. */
const circle = (size) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
     <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`);

/** Splash: teal field, mark centred at MARK_FRAC of the short edge. */
async function splash(path, w, h) {
  const markPx = Math.max(2, Math.round(MARK_FRAC * Math.min(w, h) / GEOM));
  await write(path, await sharp({
    create: { width: w, height: h, channels: 4, background: TEAL },
  })
    .composite([{ input: await render(MARK, markPx), gravity: 'centre' }])
    .flatten({ background: TEAL }).removeAlpha()
    .png().toBuffer());
}

// ── iOS ─────────────────────────────────────────────────────────────────────
// Square, not rounded: iOS applies its own mask and pre-rounded art reads as
// double-rounded. App Store Connect also rejects an alpha channel here.
console.log('iOS:');
await write(
  'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png',
  await sharp(await render(SQUARE, 1024)).flatten({ background: TEAL }).removeAlpha().png().toBuffer());
for (const n of ['', '-1', '-2']) {
  await splash(`ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732${n}.png`, 2732, 2732);
}

// ── Android ─────────────────────────────────────────────────────────────────
// Legacy ic_launcher keeps the rounded tile because not every launcher masks.
// ic_launcher_round is the maskable art (mark at 72%) circle-cropped.
// The adaptive foreground is the bare mark at 60% of the 108dp canvas, well
// inside the 66/108 safe zone; its background is drawable/ic_launcher_background.
console.log('Android:');
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, scale] of Object.entries(DENSITIES)) {
  const res = `android/app/src/main/res/mipmap-${d}`;
  const px = Math.round(48 * scale);

  await write(`${res}/ic_launcher.png`, await render(TILE, px));

  await write(`${res}/ic_launcher_round.png`, await sharp(await render(MASKABLE, px))
    .composite([{ input: circle(px), blend: 'dest-in' }])
    .png().toBuffer());

  const fg = Math.round(108 * scale);
  await write(`${res}/ic_launcher_foreground.png`, await sharp({
    create: { width: fg, height: fg, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: await render(MARK, Math.round(fg * FG_FRAC)), gravity: 'centre' }])
    .png().toBuffer());
}

const SPLASH = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] };
for (const [d, [w, h]] of Object.entries(SPLASH)) {
  await splash(`android/app/src/main/res/drawable-port-${d}/splash.png`, w, h);
  await splash(`android/app/src/main/res/drawable-land-${d}/splash.png`, h, w);
}
await splash('android/app/src/main/res/drawable/splash.png', 480, 320);

console.log('\nDone. Run `npx cap sync` to copy into the native projects.');
