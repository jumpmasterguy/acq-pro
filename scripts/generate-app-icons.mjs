/**
 * Regenerate the native app icons and launch screens from the Acqlerate mark.
 *
 * The Capacitor scaffold ships its own placeholder art — a blue Capacitor logo
 * for the icon and the same logo on white for the splash — on both platforms.
 * This renders the real mark over the brand teal instead.
 *
 * Source of truth is client/public/acqlerate-icon.svg; the glyph geometry below
 * is copied from it. Run with `node scripts/generate-app-icons.mjs` after any
 * change to the mark.
 */

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const TEAL = '#01696F';

/** The hexagon mark, white on transparent, filling `size` px. */
const glyph = (size) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
     <g transform="translate(50,50)">
       <polygon points="0,-28 24.2,-14 24.2,14 0,28 -24.2,14 -24.2,-14"
         fill="none" stroke="white" stroke-width="3.5" stroke-linejoin="round"/>
       <polygon points="0,-16 13.9,-8 13.9,8 0,16 -13.9,8 -13.9,-8"
         fill="none" stroke="white" stroke-width="2.5" stroke-linejoin="round"
         transform="rotate(30)"/>
       <circle cx="0" cy="0" r="3.5" fill="white"/>
     </g>
   </svg>`);

/** Teal plate: `shape` is 'square' (full bleed), 'rounded' or 'circle'. */
const plate = (size, shape) => {
  const bg = shape === 'circle'
    ? `<circle cx="50" cy="50" r="50" fill="${TEAL}"/>`
    : `<rect width="100" height="100" rx="${shape === 'rounded' ? 22 : 0}" fill="${TEAL}"/>`;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${bg}</svg>`);
};

async function write(path, buf) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buf);
  console.log(`  ${path}`);
}

/**
 * Icon = teal plate + mark. `opaque` drops the alpha channel outright, which
 * App Store Connect requires of the marketing icon — but the rounded and round
 * Android icons need their corners transparent, so they keep it.
 */
async function icon(path, size, shape, opaque = false) {
  let img = sharp(plate(size, shape))
    .composite([{ input: await sharp(glyph(size)).png().toBuffer() }]);
  if (opaque) img = img.flatten({ background: TEAL }).removeAlpha();
  await write(path, await img.png().toBuffer());
}

/** Splash = teal field with the mark at ~22% of the short edge. */
async function splash(path, w, h) {
  const mark = Math.round(Math.min(w, h) * 0.22 / 0.56); // 0.56 = glyph/canvas ratio
  await write(path, await sharp({
    create: { width: w, height: h, channels: 4, background: TEAL },
  })
    .composite([{ input: await sharp(glyph(mark)).png().toBuffer(), gravity: 'centre' }])
    .flatten({ background: TEAL }).removeAlpha()
    .png().toBuffer());
}

// ── iOS ─────────────────────────────────────────────────────────────────────
// Square, not rounded: iOS applies its own mask and a pre-rounded icon reads as
// double-rounded on the home screen.
console.log('iOS:');
await icon('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', 1024, 'square', true);
// The imageset lists the same art at 1x/2x/3x, which is how Capacitor ships it.
for (const n of ['', '-1', '-2']) {
  await splash(`ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732${n}.png`, 2732, 2732);
}

// ── Android ─────────────────────────────────────────────────────────────────
// Legacy icons are rounded because not every launcher masks them. The adaptive
// foreground is transparent and stays inside the 66/108dp safe zone: the mark
// covers 56% of the canvas, so 60dp.
console.log('Android:');
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, scale] of Object.entries(DENSITIES)) {
  const res = `android/app/src/main/res/mipmap-${d}`;
  await icon(`${res}/ic_launcher.png`, Math.round(48 * scale), 'rounded');
  await icon(`${res}/ic_launcher_round.png`, Math.round(48 * scale), 'circle');
  const fg = Math.round(108 * scale);
  await write(`${res}/ic_launcher_foreground.png`, await sharp(glyph(fg)).png().toBuffer());
}

const SPLASH = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] };
for (const [d, [w, h]] of Object.entries(SPLASH)) {
  await splash(`android/app/src/main/res/drawable-port-${d}/splash.png`, w, h);
  await splash(`android/app/src/main/res/drawable-land-${d}/splash.png`, h, w);
}
await splash('android/app/src/main/res/drawable/splash.png', 480, 320);

console.log('\nDone.');
