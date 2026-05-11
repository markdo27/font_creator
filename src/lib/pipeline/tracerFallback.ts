import type { BlobDescriptor } from '@/types/fontify';

/**
 * Pure-JS Marching Squares contour tracer.
 * Used as fallback when esm-potrace-wasm is unavailable.
 * Produces a polygonal SVG path with Douglas-Peucker simplification.
 */
export function traceWithFallback(blob: BlobDescriptor): string {
  const { bbox, pixels } = blob;
  const w = bbox.w, h = bbox.h;

  // Pad bitmap by 1px to handle edge cases
  const pw = w + 2, ph = h + 2;
  const padded = new Uint8Array(pw * ph);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      padded[(y + 1) * pw + (x + 1)] = pixels[y * w + x] > 0 ? 1 : 0;
    }
  }

  // Find all contour polygons using Marching Squares
  const startedFrom = new Set<number>(); // tracks which cells we already started a polygon from
  const polygons: [number, number][][] = [];

  for (let y = 0; y < ph - 1; y++) {
    for (let x = 0; x < pw - 1; x++) {
      const idx = y * pw + x;
      if (!padded[idx] || startedFrom.has(idx)) continue;
      startedFrom.add(idx);

      // Boundary trace (Moore neighborhood) — uses its own visited set
      const poly = traceBoundary(padded, pw, ph, x, y);
      if (poly.length >= 3) {
        // Mark all pixels in this polygon as started so we don't re-enter them
        for (const [px, py] of poly) startedFrom.add(py * pw + px);
        // Shift back by padding offset
        polygons.push(poly.map(([px, py]) => [px - 1, py - 1] as [number, number]));
      }
    }
  }

  if (polygons.length === 0) return '';

  // Simplify and build SVG path
  return polygons
    .map(poly => {
      const simplified = douglasPeucker(poly, 1.0);
      if (simplified.length < 2) return '';
      const [sx, sy] = simplified[0];
      const d = [`M ${sx} ${sy}`];
      for (let i = 1; i < simplified.length; i++) {
        d.push(`L ${simplified[i][0]} ${simplified[i][1]}`);
      }
      d.push('Z');
      return d.join(' ');
    })
    .filter(Boolean)
    .join(' ');
}

function traceBoundary(
  grid: Uint8Array,
  w: number,
  h: number,
  startX: number,
  startY: number,
): [number, number][] {
  const poly: [number, number][] = [];
  const visited = new Uint8Array(w * h);
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  let x = startX, y = startY, dir = 0;
  let steps = 0;
  const maxSteps = w * h * 2;

  do {
    visited[y * w + x] = 1;
    poly.push([x, y]);
    let found = false;
    for (let i = 0; i < 8; i++) {
      const nd = (dir + i) % 8;
      const nx = x + dirs[nd][0];
      const ny = y + dirs[nd][1];
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && grid[ny * w + nx] && !visited[ny * w + nx]) {
        x = nx; y = ny; dir = (nd + 5) % 8;
        found = true;
        break;
      }
    }
    if (!found || ++steps > maxSteps) break;
  } while (x !== startX || y !== startY);

  return poly;
}

function douglasPeucker(points: [number, number][], epsilon: number): [number, number][] {
  if (points.length <= 2) return points;
  let maxDist = 0, maxIdx = 0;
  const [sx, sy] = points[0];
  const [ex, ey] = points[points.length - 1];
  const len = Math.hypot(ex - sx, ey - sy);

  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const dist = len === 0
      ? Math.hypot(px - sx, py - sy)
      : Math.abs((ey - sy) * px - (ex - sx) * py + ex * sy - ey * sx) / len;
    if (dist > maxDist) { maxDist = dist; maxIdx = i; }
  }

  if (maxDist > epsilon) {
    return [
      ...douglasPeucker(points.slice(0, maxIdx + 1), epsilon),
      ...douglasPeucker(points.slice(maxIdx), epsilon).slice(1),
    ];
  }
  return [points[0], points[points.length - 1]];
}
