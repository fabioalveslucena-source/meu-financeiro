import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(width, height, getPixel) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0);
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData.push(r, g, b, a);
    }
  }

  const compressed = zlib.deflateSync(Buffer.from(rawData));
  return Buffer.concat([
    header,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// Renderizador procedural do ícone de alta fidelidade
function renderPixel(x, y, w, h) {
  const u = x / w;
  const v = y / h;

  // Raio dos cantos arredondados do squircle (22% do tamanho)
  const cornerR = 0.22;
  const dx = Math.max(0, Math.abs(u - 0.5) - (0.5 - cornerR));
  const dy = Math.max(0, Math.abs(v - 0.5) - (0.5 - cornerR));
  const distFromCorner = Math.sqrt(dx * dx + dy * dy);

  // Fora do squircle: transparente
  if (distFromCorner > cornerR) {
    return [0, 0, 0, 0];
  }

  // Borda dourada externa sutil
  const borderDist = cornerR - distFromCorner;
  if (distFromCorner > cornerR - 0.015 && distFromCorner <= cornerR) {
    return [248, 209, 23, 220]; // Dourado
  }

  // Fundo com gradiente noturno profundo e glow central
  const bgR = Math.round(15 * (1 - v) + 4 * v);
  const bgG = Math.round(42 * (1 - v) + 10 * v);
  const bgB = Math.round(74 * (1 - v) + 20 * v);

  // Glow radial dourado suave no centro
  const radialDist = Math.sqrt((u - 0.5) ** 2 + (v - 0.46) ** 2);
  const glow = Math.max(0, 1 - radialDist / 0.5);
  let r = Math.min(255, bgR + glow * 40);
  let g = Math.min(255, bgG + glow * 32);
  let b = Math.min(255, bgB + glow * 5);

  // 1. Escudo / Losango Dourado Externo
  // Equação do losango: |u - 0.5| / a + |v - 0.47| / b <= 1
  const a = 0.28;
  const bAxis = 0.35;
  const diamondDist = Math.abs(u - 0.5) / a + Math.abs(v - 0.46) / bAxis;

  // Borda do losango dourado
  if (diamondDist >= 0.88 && diamondDist <= 1.0) {
    // Gradiente dourado metálico no losango
    const goldT = (u + v) / 2;
    return [
      Math.round(255 * (1 - goldT * 0.2)),
      Math.round(209 * (1 - goldT * 0.1)),
      23,
      255
    ];
  }

  // Interior do losango: azul safira profundo
  if (diamondDist < 0.88) {
    r = 12;
    g = 32;
    b = 56;
  }

  // 2. Barras de Crescimento Financeiro (3 barras)
  // Barra 1: Esquerda (Safira)
  if (u >= 0.35 && u <= 0.40 && v >= 0.48 && v <= 0.61) {
    return [80, 144, 211, 255];
  }
  // Barra 2: Centro (Ouro Médio)
  if (u >= 0.44 && u <= 0.49 && v >= 0.39 && v <= 0.61) {
    return [252, 211, 77, 255];
  }
  // Barra 3: Direita (Ouro Alto)
  if (u >= 0.53 && u <= 0.58 && v >= 0.30 && v <= 0.61) {
    return [248, 209, 23, 255];
  }

  // 3. Linha de Tendência Crescente (Flecha diagonal)
  // De (0.34, 0.53) até (0.64, 0.26)
  const lineP1 = { x: 0.34, y: 0.53 };
  const lineP2 = { x: 0.64, y: 0.26 };
  const segDx = lineP2.x - lineP1.x;
  const segDy = lineP2.y - lineP1.y;
  const segLenSq = segDx * segDx + segDy * segDy;
  const tProj = Math.max(0, Math.min(1, ((u - lineP1.x) * segDx + (v - lineP1.y) * segDy) / segLenSq));
  const projX = lineP1.x + tProj * segDx;
  const projY = lineP1.y + tProj * segDy;
  const distToLine = Math.sqrt((u - projX) ** 2 + (v - projY) ** 2);

  if (distToLine < 0.015 && tProj > 0.05 && tProj < 0.98) {
    return [255, 235, 120, 255]; // Dourado claro brilhante
  }

  // Ponta da flecha
  const arrowDist = Math.sqrt((u - 0.64) ** 2 + (v - 0.26) ** 2);
  if (arrowDist < 0.035) {
    return [248, 209, 23, 255];
  }

  // Ponto de luz da vitória no topo
  const starDist = Math.sqrt((u - 0.5) ** 2 + (v - 0.15) ** 2);
  if (starDist < 0.018) {
    return [255, 255, 255, 255];
  }

  return [r, g, b, 255];
}

const iconsDir = path.resolve(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [
  { name: 'icon-72.png', size: 72 },
  { name: 'icon-96.png', size: 96 },
  { name: 'icon-128.png', size: 128 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

console.log('Gerando ícones PWA para Meu Financeiro...');
for (const { name, size } of sizes) {
  const filePath = path.join(iconsDir, name);
  const buffer = createPng(size, size, renderPixel);
  fs.writeFileSync(filePath, buffer);
  console.log(`✓ Gerado: ${name} (${size}x${size}) - ${buffer.length} bytes`);
}

// Também salvar cópia de apple-touch-icon na raiz pública para fallback de navegadores antigos
fs.copyFileSync(path.join(iconsDir, 'apple-touch-icon.png'), path.resolve(__dirname, '../public/apple-touch-icon.png'));
console.log('✓ Todos os ícones gerados com sucesso!');
