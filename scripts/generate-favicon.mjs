// scripts/generate-favicon.mjs
// Run with: node scripts/generate-favicon.mjs
// Requires: npm install -D sharp png-to-ico

import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '..', 'public');
const SOURCE = path.join(PUBLIC, 'favicon-dark-192x192.png');

console.log('🎨 Generating favicons from existing dark S logo (transparent background)...\n');

async function run() {
  // ── All sizes — logo only, transparent background ─────────────────────────
  const sizes16 = await sharp(SOURCE).resize(16, 16).png().toBuffer();
  const sizes32 = await sharp(SOURCE).resize(32, 32).png().toBuffer();
  const sizes48 = await sharp(SOURCE).resize(48, 48).png().toBuffer();

  await fs.writeFile(path.join(PUBLIC, 'favicon-16x16.png'), sizes16);
  console.log('✅ favicon-16x16.png');

  await fs.writeFile(path.join(PUBLIC, 'favicon-32x32.png'), sizes32);
  console.log('✅ favicon-32x32.png');

  await fs.writeFile(path.join(PUBLIC, 'favicon-48x48.png'), sizes48);
  console.log('✅ favicon-48x48.png');

  // ── favicon.ico — required by Google Search & all browsers ────────────────
  const ico = await pngToIco([
    await sharp(SOURCE).resize(16, 16).png().toBuffer(),
    await sharp(SOURCE).resize(32, 32).png().toBuffer(),
    await sharp(SOURCE).resize(48, 48).png().toBuffer(),
  ]);
  await fs.writeFile(path.join(PUBLIC, 'favicon.ico'), ico);
  console.log('✅ favicon.ico (16+32+48 sizes)');

  // ── Apple Touch Icon (180x180 for iOS) ────────────────────────────────────
  const apple = await sharp(SOURCE).resize(180, 180).png().toBuffer();
  await fs.writeFile(path.join(PUBLIC, 'apple-touch-icon.png'), apple);
  console.log('✅ apple-touch-icon.png (180x180)');

  // ── 512x512 for PWA / Android manifest ────────────────────────────────────
  const large = await sharp(SOURCE).resize(512, 512).png().toBuffer();
  await fs.writeFile(path.join(PUBLIC, 'favicon-512x512.png'), large);
  console.log('✅ favicon-512x512.png');

  console.log('\n🎉 All favicons generated successfully!');
}

run().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
