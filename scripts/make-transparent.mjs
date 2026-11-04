import fs from 'fs';
import zlib from 'zlib';

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ ((crc ^ byte) & 1 ? 0xedb88320 : 0);
      byte >>>= 1;
    }
  }
  return (crc ^ -1) >>> 0;
}

function processPNG(inputPath, outputPath, isBackgroundFn) {
  const buf = fs.readFileSync(inputPath);
  let pos = 8;
  const chunks = [];
  let idatData = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.slice(pos + 4, pos + 8).toString('ascii');
    const data = buf.slice(pos + 8, pos + 8 + len);
    if (type === 'IDAT') {
      idatData.push(data);
    } else {
      chunks.push({ type, data });
    }
    pos += 12 + len;
  }

  const ihdr = chunks[0].data;
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const decompressed = zlib.inflateSync(Buffer.concat(idatData));

  // Unfilter
  const bpp = 4;
  const stride = width * bpp + 1;
  const raw = Buffer.alloc(width * height * bpp);

  for (let y = 0; y < height; y++) {
    const filter = decompressed[y * stride];
    const lineOffset = y * stride + 1;
    const rawOffset = y * width * bpp;

    for (let x = 0; x < width * bpp; x++) {
      const xByte = decompressed[lineOffset + x];
      const a = (x >= bpp) ? raw[rawOffset + x - bpp] : 0;
      const b = (y > 0) ? raw[rawOffset - width * bpp + x] : 0;
      const c = (y > 0 && x >= bpp) ? raw[rawOffset - width * bpp + x - bpp] : 0;

      let val = xByte;
      if (filter === 1) val = (xByte + a) & 0xff;
      else if (filter === 2) val = (xByte + b) & 0xff;
      else if (filter === 3) val = (xByte + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        val = (xByte + pr) & 0xff;
      }
      raw[rawOffset + x] = val;
    }
  }

  // Remove background
  for (let i = 0; i < raw.length; i += 4) {
    const r = raw[i];
    const g = raw[i + 1];
    const b = raw[i + 2];
    const a = raw[i + 3];

    const alphaFactor = isBackgroundFn(r, g, b, a);
    raw[i + 3] = Math.round(a * (1 - alphaFactor));
  }

  // Filter with None (0)
  const filtered = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    filtered[y * stride] = 0;
    raw.copy(filtered, y * stride + 1, y * width * bpp, (y + 1) * width * bpp);
  }

  const newIdat = zlib.deflateSync(filtered);

  // Write PNG
  const outBuffers = [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])];

  function writeChunk(type, data) {
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    outBuffers.push(lenBuf, typeBuf, data, crcBuf);
  }

  writeChunk('IHDR', ihdr);
  writeChunk('IDAT', newIdat);
  writeChunk('IEND', Buffer.alloc(0));

  fs.writeFileSync(outputPath, Buffer.concat(outBuffers));
  console.log(`Successfully generated transparent ${outputPath}`);
}

// 1. Banco do Brasil: Remove yellow background (R > 180, G > 180, B < 80)
processPNG('src/assets/logo-bb.png', 'src/assets/logo-bb-transparent.png', (r, g, b) => {
  // If pixel is yellow: R > 170, G > 170, B < 90
  if (r > 160 && g > 160 && b < 100) {
    return 1; // 100% background -> 0% alpha
  }
  // Soft anti-aliasing edge
  if (r > 130 && g > 130 && b < 130) {
    return Math.max(0, Math.min(1, (r + g - 2 * b) / 300));
  }
  return 0; // Blue symbol -> keep 100% opaque
});

// 2. Bradesco: Remove black background (R < 50, G < 50, B < 50)
processPNG('src/assets/logo-bradesco.png', 'src/assets/logo-bradesco-transparent.png', (r, g, b) => {
  const maxBrightness = Math.max(r, g, b);
  if (maxBrightness < 35) {
    return 1; // 100% black -> 0% alpha
  }
  if (maxBrightness < 100) {
    // Smooth falloff
    return 1 - ((maxBrightness - 35) / 65);
  }
  return 0; // White tree -> keep 100% opaque
});
