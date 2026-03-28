/**
 * Generate Open Graph image for Bellus Salon Management
 * Creates a 1200x630 PNG with gold background and white text
 *
 * Colors:
 * - Background: #C9A96E (bellus-gold)
 * - Text: white
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { deflateSync } from "zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const WIDTH = 1200;
const HEIGHT = 630;

// Bellus gold: #C9A96E -> RGB(201, 169, 110)
const BG_R = 201, BG_G = 169, BG_B = 110;
// White text
const FG_R = 255, FG_G = 255, FG_B = 255;
// Darker gold for subtle bottom bar: #A07D3A -> RGB(160, 125, 58)
const ACCENT_R = 160, ACCENT_G = 125, ACCENT_B = 58;

/**
 * Bitmap font glyphs for simple text rendering (8x14 base)
 */
const GLYPHS = {
  B: [
    "######  ",
    "########",
    "##    ##",
    "##    ##",
    "########",
    "######  ",
    "######  ",
    "########",
    "##    ##",
    "##    ##",
    "########",
    "######  ",
  ],
  e: [
    "        ",
    "        ",
    "  ##### ",
    " ##   ##",
    " #######",
    " ##     ",
    " ##   ##",
    "  ##### ",
    "        ",
    "        ",
    "        ",
    "        ",
  ],
  l: [
    " ##     ",
    " ##     ",
    " ##     ",
    " ##     ",
    " ##     ",
    " ##     ",
    " ##     ",
    " ##     ",
    " ##     ",
    "  ####  ",
    "        ",
    "        ",
  ],
  u: [
    "        ",
    "        ",
    " ##   ##",
    " ##   ##",
    " ##   ##",
    " ##   ##",
    " ##   ##",
    "  ##### ",
    "        ",
    "        ",
    "        ",
    "        ",
  ],
  s: [
    "        ",
    "        ",
    "  ##### ",
    " ##     ",
    "  ####  ",
    "     ## ",
    " ##  ## ",
    "  ##### ",
    "        ",
    "        ",
    "        ",
    "        ",
  ],
  S: [
    "  ##### ",
    " ##   ##",
    " ##     ",
    "  ####  ",
    "     ## ",
    "     ## ",
    " ##   ##",
    "  ##### ",
    "        ",
    "        ",
    "        ",
    "        ",
  ],
  a: [
    "        ",
    "        ",
    "  ##### ",
    "      ##",
    "  ######",
    " ##   ##",
    " ##   ##",
    "  ######",
    "        ",
    "        ",
    "        ",
    "        ",
  ],
  o: [
    "        ",
    "        ",
    "  ##### ",
    " ##   ##",
    " ##   ##",
    " ##   ##",
    " ##   ##",
    "  ##### ",
    "        ",
    "        ",
    "        ",
    "        ",
  ],
  n: [
    "        ",
    "        ",
    " ###### ",
    " ##   ##",
    " ##   ##",
    " ##   ##",
    " ##   ##",
    " ##   ##",
    "        ",
    "        ",
    "        ",
    "        ",
  ],
  M: [
    "##    ##",
    "###  ###",
    "########",
    "## ## ##",
    "##    ##",
    "##    ##",
    "##    ##",
    "##    ##",
    "        ",
    "        ",
    "        ",
    "        ",
  ],
  g: [
    "        ",
    "        ",
    "  ######",
    " ##   ##",
    " ##   ##",
    "  ######",
    "      ##",
    "  ##### ",
    "        ",
    "        ",
    "        ",
    "        ",
  ],
  m: [
    "        ",
    "        ",
    "########",
    "## ## ##",
    "## ## ##",
    "## ## ##",
    "## ## ##",
    "##    ##",
    "        ",
    "        ",
    "        ",
    "        ",
  ],
  t: [
    "  ##    ",
    "  ##    ",
    " ###### ",
    "  ##    ",
    "  ##    ",
    "  ##    ",
    "  ##  # ",
    "   ###  ",
    "        ",
    "        ",
    "        ",
    "        ",
  ],
  " ": [
    "        ",
    "        ",
    "        ",
    "        ",
    "        ",
    "        ",
    "        ",
    "        ",
    "        ",
    "        ",
    "        ",
    "        ",
  ],
};

/**
 * Draw text on pixel buffer
 */
function drawText(pixels, text, startX, startY, scale, r, g, b) {
  const glyphW = 8;
  const glyphH = 12;
  let cursorX = startX;

  for (const ch of text) {
    const glyph = GLYPHS[ch];
    if (!glyph) {
      cursorX += glyphW * scale;
      continue;
    }

    for (let gy = 0; gy < glyphH; gy++) {
      for (let gx = 0; gx < glyphW; gx++) {
        if (glyph[gy] && glyph[gy][gx] === "#") {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const px = cursorX + gx * scale + sx;
              const py = startY + gy * scale + sy;
              if (px >= 0 && px < WIDTH && py >= 0 && py < HEIGHT) {
                const idx = (py * WIDTH + px) * 3;
                pixels[idx] = r;
                pixels[idx + 1] = g;
                pixels[idx + 2] = b;
              }
            }
          }
        }
      }
    }
    cursorX += glyphW * scale;
  }
}

/**
 * Create the OG image pixel data
 */
function createOGImage() {
  const pixels = new Uint8Array(WIDTH * HEIGHT * 3);

  // Fill with gold background
  for (let i = 0; i < WIDTH * HEIGHT; i++) {
    pixels[i * 3] = BG_R;
    pixels[i * 3 + 1] = BG_G;
    pixels[i * 3 + 2] = BG_B;
  }

  // Draw a subtle darker accent bar at bottom (20px)
  for (let y = HEIGHT - 20; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const idx = (y * WIDTH + x) * 3;
      pixels[idx] = ACCENT_R;
      pixels[idx + 1] = ACCENT_G;
      pixels[idx + 2] = ACCENT_B;
    }
  }

  // Draw "Bellus" large (scale 8) - centered
  const titleText = "Bellus";
  const titleScale = 8;
  const titleCharW = 8 * titleScale;
  const titleW = titleText.length * titleCharW;
  const titleX = Math.floor((WIDTH - titleW) / 2);
  const titleY = Math.floor(HEIGHT / 2) - 90;
  drawText(pixels, titleText, titleX, titleY, titleScale, FG_R, FG_G, FG_B);

  // Draw "Salon Management" smaller (scale 4) - centered below
  const subText = "Salon Management";
  const subScale = 4;
  const subCharW = 8 * subScale;
  const subW = subText.length * subCharW;
  const subX = Math.floor((WIDTH - subW) / 2);
  const subY = titleY + 12 * titleScale + 30;
  drawText(pixels, subText, subX, subY, subScale, FG_R, FG_G, FG_B);

  return pixels;
}

/**
 * Encode raw RGB data as a minimal valid PNG
 */
function encodePNG(width, height, rgbData) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const rawData = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 3);
    rawData[rowOffset] = 0; // filter: none
    for (let x = 0; x < width * 3; x++) {
      rawData[rowOffset + 1 + x] = rgbData[y * width * 3 + x];
    }
  }

  const compressed = deflateSync(rawData);

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

// Generate OG image
console.log("Generating og-image.png (1200x630)...");
const rgbData = createOGImage();
const png = encodePNG(WIDTH, HEIGHT, rgbData);
const outPath = join(publicDir, "og-image.png");
writeFileSync(outPath, png);
console.log(`  Written to ${outPath} (${png.length} bytes)`);
console.log("\nOG image generated successfully!");
