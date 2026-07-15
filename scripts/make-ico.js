import fs from 'fs';
import path from 'path';

const srcPng = path.join(process.cwd(), 'logo.png');
const destIco = path.join(process.cwd(), 'build', 'icon.ico');

try {
  if (!fs.existsSync(srcPng)) {
    console.error(`Error: Source logo.png not found at ${srcPng}`);
    process.exit(1);
  }

  const pngBuffer = fs.readFileSync(srcPng);
  const size = pngBuffer.length;

  // ICO header is 6 bytes + 16 bytes for single image directory entry = 22 bytes total
  const icoHeader = Buffer.alloc(22);

  // 1. ICO Header (6 bytes)
  icoHeader.writeUInt16LE(0, 0);     // Reserved
  icoHeader.writeUInt16LE(1, 2);     // Type (1 = ICO)
  icoHeader.writeUInt16LE(1, 4);     // Image count (1)

  // 2. Directory Entry (16 bytes)
  icoHeader.writeUInt8(0, 6);        // Width (0 means 256px)
  icoHeader.writeUInt8(0, 7);        // Height (0 means 256px)
  icoHeader.writeUInt8(0, 8);        // Color palette count (0)
  icoHeader.writeUInt8(0, 9);        // Reserved
  icoHeader.writeUInt16LE(1, 10);    // Color planes (1)
  icoHeader.writeUInt16LE(32, 12);   // Bits per pixel (32)
  icoHeader.writeUInt32LE(size, 14); // Size of image data in bytes
  icoHeader.writeUInt32LE(22, 18);   // Offset of image data (22)

  // Concatenate header and raw PNG data
  const icoBuffer = Buffer.concat([icoHeader, pngBuffer]);

  fs.writeFileSync(destIco, icoBuffer);
  console.log(`Successfully generated build/icon.ico (${icoBuffer.length} bytes) from logo.png`);
} catch (err) {
  console.error('Failed to generate ICO:', err);
  process.exit(1);
}
