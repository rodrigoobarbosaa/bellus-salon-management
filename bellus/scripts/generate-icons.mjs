/**
 * Generate PWA icons for Bellus Salon Management
 * Creates minimal valid PNG files with "B" branding
 *
 * Colors:
 * - Background: #C9A96E (bellus-gold)
 * - Text: white
 *
 * Sizes: 192x192, 512x512, 180x180 (apple-touch-icon)
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { deflateSync } from "zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

// Bellus gold: #C9A96E → RGB(201, 169, 110)
const BG_R = 201, BG_G = 169, BG_B = 110;
// White text
const FG_R = 255, FG_G = 255, FG_B = 255;

/**
 * Simple bitmap "B" glyph patterns at different scales.
 * Each pattern is an array of strings where '#' = foreground pixel.
 */
function getBGlyph(size) {
  // Define "B" as a simple bitmap - proportional to icon size
  // We'll use a 10x14 base glyph and scale it
  const base = [
    "########  ",
    "##########",
    "##      ##",
    "##      ##",
    "##      ##",
    "##########",
    "########  ",
    "########  ",
    "##########",
    "##      ##",
    "##      ##",
    "##      ##",
    "##########",
    "########  ",
  ];
  return base;
}

/**
 * Create raw RGBA pixel data for an icon
 */
function createIconData(size) {
  const pixels = new Uint8Array(size * size * 3);

  // Fill with background color
  for (let i = 0; i < size * size; i++) {
    pixels[i * 3] = BG_R;
    pixels[i * 3 + 1] = BG_G;
    pixels[i * 3 + 2] = BG_B;
  }

  // Draw "B" glyph centered
  const glyph = getBGlyph(size);
  const glyphH = glyph.length;
  const glyphW = glyph[0].length;

  // Scale factor: glyph should occupy ~50% of the icon
  const targetH = Math.floor(size * 0.5);
  const scale = Math.floor(targetH / glyphH);

  const scaledW = glyphW * scale;
  const scaledH = glyphH * scale;

  const offsetX = Math.floor((size - scaledW) / 2);
  const offsetY = Math.floor((size - scaledH) / 2);

  for (let gy = 0; gy < glyphH; gy++) {
    for (let gx = 0; gx < glyphW; gx++) {
      if (glyph[gy][gx] === "#") {
        // Fill scaled block
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px = offsetX + gx * scale + sx;
            const py = offsetY + gy * scale + sy;
            if (px >= 0 && px < size && py >= 0 && py < size) {
              const idx = (py * size + px) * 3;
              pixels[idx] = FG_R;
              pixels[idx + 1] = FG_G;
              pixels[idx + 2] = FG_B;
            }
          }
        }
      }
    }
  }

  return pixels;
}

/**
 * Encode raw RGB data as a minimal valid PNG
 */
function encodePNG(width, height, rgbData) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT chunk - raw image data with filter bytes
  const rawData = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 3);
    rawData[rowOffset] = 0; // filter: none
    for (let x = 0; x < width * 3; x++) {
      rawData[rowOffset + 1 + x] = rgbData[y * width * 3 + x];
    }
  }

  const compressed = deflateSync(rawData);

  // Build chunks
  const chunks = [
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", compressed),
    makeChunk("IEND", Buffer.alloc(0)),
  ];

  return Buffer.concat([signature, ...chunks]);
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcInput);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 lookup table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xEDB88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate icons
const sizes = [
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
  { size: 180, name: "apple-touch-icon.png" },
];

for (const { size, name } of sizes) {
  console.log(`Generating ${name} (${size}x${size})...`);
  const rgbData = createIconData(size);
  const png = encodePNG(size, size, rgbData);
  const outPath = join(publicDir, name);
  writeFileSync(outPath, png);
  console.log(`  Written to ${outPath} (${png.length} bytes)`);
}

console.log("\nAll icons generated successfully!");
