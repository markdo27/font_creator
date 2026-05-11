import type { BlobDescriptor } from '@/types/fontify';

/**
 * Two-pass Connected Component Labeling (Rosenfeld & Pfaltz)
 * with Union-Find for O(n·α(n)) equivalence resolution.
 * Returns blobs sorted by left-to-right, top-to-bottom reading order.
 */
export function detectBlobs(
  binary: Uint8Array,
  width: number,
  height: number,
  minArea: number
): BlobDescriptor[] {
  const n = width * height;
  const labels = new Int32Array(n);
  const parent = new Int32Array(n + 1); // Union-Find parent array
  let nextLabel = 1;

  // Initialize Union-Find
  for (let i = 0; i <= n; i++) parent[i] = i;

  function find(x: number): number {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  }
  function union(a: number, b: number) {
    a = find(a); b = find(b);
    if (a !== b) parent[b] = a;
  }

  // ─── Pass 1: Assign provisional labels, record equivalences ─────────────
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (binary[idx] === 0) continue; // background

      const neighbors: number[] = [];
      if (x > 0 && labels[idx - 1] > 0) neighbors.push(labels[idx - 1]);
      if (y > 0 && labels[idx - width] > 0) neighbors.push(labels[idx - width]);

      if (neighbors.length === 0) {
        labels[idx] = nextLabel++;
      } else {
        const minLabel = Math.min(...neighbors);
        labels[idx] = minLabel;
        for (const nb of neighbors) union(minLabel, nb);
      }
    }
  }

  // ─── Pass 2: Flatten labels ──────────────────────────────────────────────
  const rootMap = new Map<number, number>();
  let canonical = 1;
  for (let i = 0; i < n; i++) {
    if (labels[i] === 0) continue;
    const root = find(labels[i]);
    if (!rootMap.has(root)) rootMap.set(root, canonical++);
    labels[i] = rootMap.get(root)!;
  }

  // ─── Accumulate per-blob stats ────────────────────────────────────────────
  const blobCount = canonical - 1;
  const minX = new Int32Array(blobCount + 1).fill(width);
  const minY = new Int32Array(blobCount + 1).fill(height);
  const maxX = new Int32Array(blobCount + 1).fill(0);
  const maxY = new Int32Array(blobCount + 1).fill(0);
  const sumX = new Float64Array(blobCount + 1);
  const sumY = new Float64Array(blobCount + 1);
  const area = new Int32Array(blobCount + 1);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const lbl = labels[y * width + x];
      if (lbl === 0) continue;
      if (x < minX[lbl]) minX[lbl] = x;
      if (y < minY[lbl]) minY[lbl] = y;
      if (x > maxX[lbl]) maxX[lbl] = x;
      if (y > maxY[lbl]) maxY[lbl] = y;
      sumX[lbl] += x; sumY[lbl] += y; area[lbl]++;
    }
  }

  // ─── Build BlobDescriptor array ───────────────────────────────────────────
  const blobs: BlobDescriptor[] = [];
  for (let lbl = 1; lbl <= blobCount; lbl++) {
    if (area[lbl] < minArea) continue;
    const bx = minX[lbl], by = minY[lbl];
    const bw = maxX[lbl] - bx + 1, bh = maxY[lbl] - by + 1;

    // Extract cropped pixel bitmap
    const pixels = new Uint8Array(bw * bh);
    for (let py = 0; py < bh; py++) {
      for (let px = 0; px < bw; px++) {
        const globalIdx = (by + py) * width + (bx + px);
        pixels[py * bw + px] = labels[globalIdx] === lbl ? 255 : 0;
      }
    }

    blobs.push({
      id: lbl,
      bbox: { x: bx, y: by, w: bw, h: bh },
      centroid: { x: Math.round(sumX[lbl] / area[lbl]), y: Math.round(sumY[lbl] / area[lbl]) },
      area: area[lbl],
      pixels,
    });
  }

  // Sort by reading order: top-to-bottom, left-to-right
  return blobs.sort((a, b) => {
    const rowDiff = Math.floor(a.bbox.y / 20) - Math.floor(b.bbox.y / 20);
    return rowDiff !== 0 ? rowDiff : a.bbox.x - b.bbox.x;
  });
}
