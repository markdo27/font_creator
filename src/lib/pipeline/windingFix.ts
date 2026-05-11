/**
 * Winding order normalizer for opentype.js.
 * opentype.js requires:
 *   - Outer contours: counter-clockwise (negative signed area)
 *   - Holes (inner contours): clockwise (positive signed area)
 *
 * Uses the Shoelace formula to compute signed area per sub-path.
 */
export function fixWinding(pathD: string): string {
  if (!pathD) return '';
  const subPaths = splitSubPaths(pathD);
  return subPaths.map(normalizeSubPath).join(' ');
}

function splitSubPaths(d: string): string[] {
  return d.split(/(?=M\s)/i).map(s => s.trim()).filter(Boolean);
}

function normalizeSubPath(d: string): string {
  const points = extractPoints(d);
  if (points.length < 3) return d;

  const signedArea = shoelaceArea(points);
  // opentype.js: outer contours should be CCW → negative area in screen coords
  if (signedArea > 0) {
    // Reverse to CCW
    return reverseSubPath(d, points);
  }
  return d;
}

/**
 * Shoelace formula: returns positive for CW, negative for CCW (y-down coords).
 */
function shoelaceArea(pts: [number, number][]): number {
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    sum += (x2 - x1) * (y2 + y1);
  }
  return sum / 2;
}

/**
 * Naively extract M/L/Z point coordinates (works for polygonal paths).
 * For curves we sample the start points of each segment.
 */
function extractPoints(d: string): [number, number][] {
  const pts: [number, number][] = [];
  const cmdRe = /([MLCQSTAZmlcqstaz])([^MLCQSTAZmlcqstaz]*)/g;
  let m: RegExpExecArray | null;
  while ((m = cmdRe.exec(d)) !== null) {
    const cmd = m[1].toUpperCase();
    if (cmd === 'Z') continue;
    const nums = m[2].trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    if (cmd === 'M' || cmd === 'L') {
      for (let i = 0; i + 1 < nums.length; i += 2) {
        pts.push([nums[i], nums[i + 1]]);
      }
    } else if (cmd === 'C') {
      // Cubic: take last control point (end point)
      for (let i = 0; i + 5 < nums.length; i += 6) {
        pts.push([nums[i + 4], nums[i + 5]]);
      }
    } else if (cmd === 'Q') {
      for (let i = 0; i + 3 < nums.length; i += 4) {
        pts.push([nums[i + 2], nums[i + 3]]);
      }
    }
  }
  return pts;
}

/**
 * Reverse a simple M/L/Z path by reversing its point list.
 */
function reverseSubPath(d: string, pts: [number, number][]): string {
  if (pts.length === 0) return d;
  const rev = [...pts].reverse();
  const cmds = [`M ${rev[0][0]} ${rev[0][1]}`];
  for (let i = 1; i < rev.length; i++) {
    cmds.push(`L ${rev[i][0]} ${rev[i][1]}`);
  }
  cmds.push('Z');
  return cmds.join(' ');
}
