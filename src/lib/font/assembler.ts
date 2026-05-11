import opentype from 'opentype.js';
import type { GlyphAssignment, BaselineConfig, FontMetrics, BlobDescriptor } from '@/types/fontify';

const UPM = 1000;

/**
 * Map from image-space Y coordinate to font em-space Y coordinate.
 * Font space: Y=0 is baseline, positive = up.
 * Image space: Y=0 is top, positive = down.
 */
function toFontY(imageY: number, baselineY: number, imageHeight: number): number {
  return -((imageY - baselineY) / imageHeight) * UPM;
}

function toFontX(imageX: number, imageWidth: number): number {
  return (imageX / imageWidth) * UPM;
}

/**
 * Parse an SVG path d-string into opentype.js Path commands.
 */
function svgPathToOpentypePath(
  d: string,
  blobBbox: { x: number; y: number; w: number; h: number },
  baselineY: number,
  imageWidth: number,
  imageHeight: number,
  yNudge: number
): opentype.Path {
  const path = new opentype.Path();
  if (!d) return path;

  const cmdRe = /([MLCQSTAZmlcqstaz])([^MLCQSTAZmlcqstaz]*)/g;
  let m: RegExpExecArray | null;

  // Transform: blob-local coords → image coords → font coords
  const tx = (lx: number) => toFontX(blobBbox.x + lx, imageWidth);
  const ty = (ly: number) => toFontY(blobBbox.y + ly + yNudge, baselineY, imageHeight);

  while ((m = cmdRe.exec(d)) !== null) {
    const cmd = m[1].toUpperCase();
    const nums = m[2].trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));

    if (cmd === 'M') {
      for (let i = 0; i + 1 < nums.length; i += 2) path.moveTo(tx(nums[i]), ty(nums[i + 1]));
    } else if (cmd === 'L') {
      for (let i = 0; i + 1 < nums.length; i += 2) path.lineTo(tx(nums[i]), ty(nums[i + 1]));
    } else if (cmd === 'C') {
      for (let i = 0; i + 5 < nums.length; i += 6) {
        path.curveTo(tx(nums[i]), ty(nums[i+1]), tx(nums[i+2]), ty(nums[i+3]), tx(nums[i+4]), ty(nums[i+5]));
      }
    } else if (cmd === 'Q') {
      for (let i = 0; i + 3 < nums.length; i += 4) {
        path.quadraticCurveTo(tx(nums[i]), ty(nums[i+1]), tx(nums[i+2]), ty(nums[i+3]));
      }
    } else if (cmd === 'Z') {
      path.close();
    }
  }

  return path;
}

/**
 * Assemble all assigned glyphs into an opentype.Font and return it.
 */
export function assembleFont(
  assignments: GlyphAssignment[],
  blobs: BlobDescriptor[],
  baseline: BaselineConfig,
  metrics: FontMetrics,
  imageWidth: number,
  imageHeight: number
): opentype.Font {
  const blobMap = new Map(blobs.map(b => [b.id, b]));

  // Notdef glyph (required by spec)
  const notdefPath = new opentype.Path();
  notdefPath.moveTo(50, metrics.descender);
  notdefPath.lineTo(50, metrics.ascender);
  notdefPath.lineTo(350, metrics.ascender);
  notdefPath.lineTo(350, metrics.descender);
  notdefPath.close();
  notdefPath.moveTo(100, metrics.descender + 50);
  notdefPath.lineTo(300, metrics.descender + 50);
  notdefPath.lineTo(300, metrics.ascender - 50);
  notdefPath.lineTo(100, metrics.ascender - 50);
  notdefPath.close();

  const glyphs: opentype.Glyph[] = [
    new opentype.Glyph({
      name: '.notdef',
      unicode: 0,
      advanceWidth: 400,
      path: notdefPath,
    }),
  ];

  for (const asgn of assignments) {
    const blob = blobMap.get(asgn.blobId);
    if (!blob?.svgPath) continue;

    const path = svgPathToOpentypePath(
      blob.svgPath,
      blob.bbox,
      baseline.baselineY,
      imageWidth,
      imageHeight,
      asgn.yNudge
    );

    // Advance width = blob width scaled to em
    const advanceWidth = Math.max(100, Math.round(toFontX(blob.bbox.w, imageWidth) + 60));

    glyphs.push(
      new opentype.Glyph({
        name: `uni${asgn.unicode.toString(16).toUpperCase().padStart(4, '0')}`,
        unicode: asgn.unicode,
        advanceWidth,
        path,
      })
    );
  }

  return new opentype.Font({
    familyName: metrics.familyName || 'Fontify',
    styleName: 'Regular',
    unitsPerEm: UPM,
    ascender: metrics.ascender,
    descender: metrics.descender,
    glyphs,
  });
}
