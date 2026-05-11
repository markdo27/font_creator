/**
 * Otsu's thresholding + optional Gaussian blur and inversion.
 * Returns a binary Uint8Array where 255 = foreground (ink), 0 = background.
 */
export function threshold(
  imageData: ImageData,
  manualThreshold: number,   // 0 = auto Otsu
  blurRadius: number,
  invert: boolean
): Uint8Array {
  const { data, width, height } = imageData;
  const n = width * height;

  // 1) Convert to grayscale
  const gray = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  // 2) Gaussian blur (box-blur approximation, 3 passes)
  const blurred = blurRadius > 0 ? boxBlur(gray, width, height, blurRadius) : gray;

  // 3) Determine threshold
  const t = manualThreshold === 0 ? otsuThreshold(blurred) : manualThreshold;

  // 4) Binarize
  const binary = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const fg = invert ? blurred[i] > t : blurred[i] <= t;
    binary[i] = fg ? 255 : 0;
  }

  return binary;
}

// ─── Otsu's Method ────────────────────────────────────────────────────────────

function otsuThreshold(gray: Uint8Array): number {
  const hist = new Float64Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  const total = gray.length;
  for (let i = 0; i < 256; i++) hist[i] /= total;

  let sumB = 0, wB = 0, wF = 0;
  let maxVar = 0, bestT = 128;
  let sum1 = 0;
  for (let i = 0; i < 256; i++) sum1 += i * hist[i];

  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    wF = 1 - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum1 - sumB) / wF;
    const variance = wB * wF * (mB - mF) ** 2;
    if (variance > maxVar) { maxVar = variance; bestT = t; }
  }
  return bestT;
}

// ─── Box Blur (3-pass approximation of Gaussian) ─────────────────────────────

function boxBlur(src: Uint8Array, w: number, h: number, radius: number): Uint8Array<ArrayBuffer> {
  let result: Uint8Array<ArrayBuffer> = new Uint8Array(src.buffer.slice(0) as ArrayBuffer);
  for (let pass = 0; pass < 3; pass++) {
    result = singleBoxBlur(result, w, h, radius);
  }
  return result;
}

function singleBoxBlur(src: Uint8Array, w: number, h: number, r: number): Uint8Array<ArrayBuffer> {
  const out: Uint8Array<ArrayBuffer> = new Uint8Array(src.length);
  const size = 2 * r + 1;

  // Horizontal pass
  const temp: Uint8Array<ArrayBuffer> = new Uint8Array(src.length);
  for (let y = 0; y < h; y++) {
    let sum = 0, count = 0;
    for (let x = -r; x <= r; x++) {
      if (x >= 0 && x < w) { sum += src[y * w + x]; count++; }
    }
    for (let x = 0; x < w; x++) {
      temp[y * w + x] = Math.round(sum / count);
      const add = x + r + 1;
      const rem = x - r;
      if (add < w) { sum += src[y * w + add]; count++; }
      if (rem >= 0) { sum -= src[y * w + rem]; count--; }
    }
  }
  // Vertical pass
  for (let x = 0; x < w; x++) {
    let sum = 0, count = 0;
    for (let y = -r; y <= r; y++) {
      if (y >= 0 && y < h) { sum += temp[y * w + x]; count++; }
    }
    for (let y = 0; y < h; y++) {
      out[y * w + x] = Math.round(sum / count);
      const add = y + r + 1;
      const rem = y - r;
      if (add < h) { sum += temp[add * w + x]; count++; }
      if (rem >= 0) { sum -= temp[rem * w + x]; count--; }
    }
  }
  return out;
}
