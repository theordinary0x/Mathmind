// Procedural Seamless Halved-Scale Wood-Pulp Paper Texture Generator
// Features:
// 1. Halved grain tooth (~3px) for a subtle, natural, tactile paper feel without moldy clouding.
// 2. Toroidal periodic boundary conditions guaranteeing 100% seamless tile repetition.
// 3. Hairline-thin micro-fibers (2.5px - 3.5px, 0.5px line width) for authentic wood pulp texture.

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let cachedLightPaperDataUrl: string | null = null;
let cachedDarkPaperDataUrl: string | null = null;

export function getHybridPaperTexture(isDark: boolean = false): string {
  if (typeof document === 'undefined') return '';

  if (isDark && cachedDarkPaperDataUrl) return cachedDarkPaperDataUrl;
  if (!isDark && cachedLightPaperDataUrl) return cachedLightPaperDataUrl;

  const width = 128;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const baseColor = isDark ? [26, 22, 18] : [247, 245, 239];
  const baseR = baseColor[0];
  const baseG = baseColor[1];
  const baseB = baseColor[2];

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  const rand = mulberry32(112233);
  const grainSize = 3.0;
  const depthPct = isDark ? 16 : 18;
  const depthMultiplier = (depthPct / 100) * 30;

  // 1. Seamless Periodic Grid for Halved Scale
  const cellSize = grainSize;
  const gridW = Math.round(width / cellSize);
  const gridH = Math.round(height / cellSize);

  const grid: number[][] = [];
  for (let gy = 0; gy < gridH; gy++) {
    grid[gy] = [];
    for (let gx = 0; gx < gridW; gx++) {
      grid[gy][gx] = (rand() - 0.5) * 2.0;
    }
  }

  // Heightmap with periodic boundary conditions (toroidal wrap)
  const heightmap = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    const gy = (y / height) * gridH;
    const y0 = Math.floor(gy);
    const y1 = (y0 + 1) % gridH;
    const fy = gy - y0;
    const sfy = fy * fy * (3 - 2 * fy);

    for (let x = 0; x < width; x++) {
      const gx = (x / width) * gridW;
      const x0 = Math.floor(gx);
      const x1 = (x0 + 1) % gridW;
      const fx = gx - x0;
      const sfx = fx * fx * (3 - 2 * fx);

      const top = grid[y0][x0] * (1 - sfx) + grid[y0][x1] * sfx;
      const bottom = grid[y1][x0] * (1 - sfx) + grid[y1][x1] * sfx;
      heightmap[y * width + x] = top * (1 - sfy) + bottom * sfy;
    }
  }

  // 2. Emboss Lighting
  for (let y = 0; y < height; y++) {
    const ym1 = (y - 1 + height) % height;
    const yp1 = (y + 1) % height;

    for (let x = 0; x < width; x++) {
      const xm1 = (x - 1 + width) % width;
      const xp1 = (x + 1) % width;

      const dx = heightmap[y * width + xp1] - heightmap[y * width + xm1];
      const dy = heightmap[yp1 * width + x] - heightmap[ym1 * width + x];

      const light = (-dx - dy) * depthMultiplier;

      const idx = (y * width + x) * 4;
      data[idx] = Math.min(255, Math.max(0, baseR + light));
      data[idx + 1] = Math.min(255, Math.max(0, baseG + light * 0.96));
      data[idx + 2] = Math.min(255, Math.max(0, baseB + light * 0.9));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // 3. Micro Wood-Pulp Fibers
  const fiberCount = 65;
  const fiberLen = 3.0;

  ctx.save();
  for (let i = 0; i < fiberCount; i++) {
    const fx = rand() * width;
    const fy = rand() * height;
    const len = fiberLen * (0.8 + rand() * 0.5);
    const angle = rand() * Math.PI * 2;
    const curve = (rand() - 0.5) * 1.5;

    if (isDark) {
      const shade = 180 + rand() * 40;
      ctx.strokeStyle = `rgba(${shade}, ${shade - 10}, ${shade - 30}, 0.12)`;
    } else {
      const shade = 60 + rand() * 50;
      ctx.strokeStyle = `rgba(${shade}, ${shade - 6}, ${shade - 14}, 0.28)`;
    }
    ctx.lineWidth = 0.5;
    ctx.lineCap = 'round';

    const drawOne = (ox: number, oy: number) => {
      ctx.beginPath();
      ctx.moveTo(fx + ox, fy + oy);
      const midX = fx + ox + Math.cos(angle) * (len / 2) + Math.sin(angle) * curve;
      const midY = fy + oy + Math.sin(angle) * (len / 2) - Math.cos(angle) * curve;
      const endX = fx + ox + Math.cos(angle) * len;
      const endY = fy + oy + Math.sin(angle) * len;
      ctx.quadraticCurveTo(midX, midY, endX, endY);
      ctx.stroke();
    };

    drawOne(0, 0);
    if (fx + len > width) drawOne(-width, 0);
    if (fx - len < 0) drawOne(width, 0);
    if (fy + len > height) drawOne(0, -height);
    if (fy - len < 0) drawOne(0, height);
  }
  ctx.restore();

  const dataUrl = canvas.toDataURL('image/png');
  if (isDark) {
    cachedDarkPaperDataUrl = dataUrl;
  } else {
    cachedLightPaperDataUrl = dataUrl;
  }
  return dataUrl;
}

let cachedChalkboardDataUrl: string | null = null;

export function getChalkboardTexture(): string {
  if (typeof document === 'undefined') return '';
  if (cachedChalkboardDataUrl) return cachedChalkboardDataUrl;

  const width = 128;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Base dark chalkboard slate color: deep green-charcoal slate
  const baseR = 21;
  const baseG = 29;
  const baseB = 24;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  const rand = mulberry32(778899);
  const grainSize = 2.5; // Fine slate mineral tooth
  const depthMultiplier = 5.5; // Subtle embossed slate grain

  const gridW = Math.round(width / grainSize);
  const gridH = Math.round(height / grainSize);
  const grid: number[][] = [];
  for (let gy = 0; gy < gridH; gy++) {
    grid[gy] = [];
    for (let gx = 0; gx < gridW; gx++) {
      grid[gy][gx] = (rand() - 0.5) * 2.0;
    }
  }

  // Periodic heightmap (toroidal wrap for seamless tiling)
  const heightmap = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    const gy = (y / height) * gridH;
    const y0 = Math.floor(gy);
    const y1 = (y0 + 1) % gridH;
    const fy = gy - y0;
    const sfy = fy * fy * (3 - 2 * fy);

    for (let x = 0; x < width; x++) {
      const gx = (x / width) * gridW;
      const x0 = Math.floor(gx);
      const x1 = (x0 + 1) % gridW;
      const fx = gx - x0;
      const sfx = fx * fx * (3 - 2 * fx);

      const top = grid[y0][x0] * (1 - sfx) + grid[y0][x1] * sfx;
      const bottom = grid[y1][x0] * (1 - sfx) + grid[y1][x1] * sfx;
      heightmap[y * width + x] = top * (1 - sfy) + bottom * sfy;
    }
  }

  // Emboss slate lighting
  for (let y = 0; y < height; y++) {
    const ym1 = (y - 1 + height) % height;
    const yp1 = (y + 1) % height;

    for (let x = 0; x < width; x++) {
      const xm1 = (x - 1 + width) % width;
      const xp1 = (x + 1) % width;

      const dx = heightmap[y * width + xp1] - heightmap[y * width + xm1];
      const dy = heightmap[yp1 * width + x] - heightmap[ym1 * width + x];

      const light = (-dx - dy) * depthMultiplier;

      const idx = (y * width + x) * 4;
      data[idx] = Math.min(255, Math.max(0, baseR + light));
      data[idx + 1] = Math.min(255, Math.max(0, baseG + light * 1.05));
      data[idx + 2] = Math.min(255, Math.max(0, baseB + light * 0.95));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // 2. Subtle chalk dust / eraser haze (soft cloudy streaks with toroidal wrap)
  ctx.save();
  const dustCount = 35;
  for (let i = 0; i < dustCount; i++) {
    const cx = rand() * width;
    const cy = rand() * height;
    const radius = 6 + rand() * 12;
    const alpha = 0.02 + rand() * 0.035;

    const drawCloud = (ox: number, oy: number) => {
      const grad = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, radius);
      grad.addColorStop(0, `rgba(220, 235, 225, ${alpha})`);
      grad.addColorStop(1, 'rgba(220, 235, 225, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx + ox, cy + oy, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    drawCloud(0, 0);
    if (cx + radius > width) drawCloud(-width, 0);
    if (cx - radius < 0) drawCloud(width, 0);
    if (cy + radius > height) drawCloud(0, -height);
    if (cy - radius < 0) drawCloud(0, height);
  }

  // 3. Micro chalk specks (fine calcium particles from chalk eraser)
  const speckCount = 45;
  for (let i = 0; i < speckCount; i++) {
    const sx = rand() * width;
    const sy = rand() * height;
    const sAlpha = 0.08 + rand() * 0.12;
    const sSize = 0.6 + rand() * 0.6;
    ctx.fillStyle = `rgba(235, 245, 238, ${sAlpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, sSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const dataUrl = canvas.toDataURL('image/png');
  cachedChalkboardDataUrl = dataUrl;
  return dataUrl;
}

