// ─── Fontify Shared Types ────────────────────────────────────────────────────

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BlobDescriptor {
  id: number;
  bbox: BoundingBox;
  centroid: { x: number; y: number };
  area: number;
  /** Cropped binary bitmap (0=bg, 255=fg), row-major, width=bbox.w, height=bbox.h */
  pixels: Uint8Array;
  /** SVG path d-string after vectorization (filled in after tracing stage) */
  svgPath?: string;
}

export interface GlyphAssignment {
  blobId: number;
  unicode: number;       // Unicode code point, e.g. 65 for 'A'
  char: string;          // e.g. 'A'
  yNudge: number;        // Per-glyph vertical offset in image pixels (−20…+20)
}

export interface BaselineConfig {
  /** Y position of baseline in image pixels from top */
  baselineY: number;
  /** Y position of mean line (x-height) in image pixels from top */
  meanLineY: number;
}

export interface FontMetrics {
  familyName: string;
  unitsPerEm: number;      // default 1000
  ascender: number;        // default 800
  descender: number;       // default -200
  xHeight: number;         // default 500
  capHeight: number;       // default 700
}

export interface ThresholdConfig {
  threshold: number;       // 0–255, 0 = auto (Otsu)
  invert: boolean;
  blurRadius: number;      // 0–3
}

export interface BlobDetectConfig {
  minArea: number;         // minimum px² to keep a blob
}

export interface TracerConfig {
  turdsize: number;        // 0–10, default 2
  alphamax: number;        // 0–1.33, default 1.0
  opttolerance: number;    // 0–1, default 0.2
}

// ─── Worker Message Protocol ─────────────────────────────────────────────────

export type WorkerCommand =
  | { type: 'THRESHOLD'; payload: { imageData: ImageData; config: ThresholdConfig } }
  | { type: 'DETECT_BLOBS'; payload: { binaryData: Uint8Array; width: number; height: number; config: BlobDetectConfig } }
  | { type: 'TRACE_ALL'; payload: { blobs: BlobDescriptor[]; config: TracerConfig } };

export type WorkerResult =
  | { type: 'THRESHOLD_DONE'; payload: { binaryData: Uint8Array; width: number; height: number } }
  | { type: 'BLOBS_DONE'; payload: { blobs: BlobDescriptor[] } }
  | { type: 'TRACE_DONE'; payload: { blobs: BlobDescriptor[] } }
  | { type: 'PROGRESS'; payload: { stage: string; pct: number } }
  | { type: 'ERROR'; payload: { message: string } };

// ─── Pipeline Stage State ─────────────────────────────────────────────────────

export type PipelineStage =
  | 'idle'
  | 'thresholding'
  | 'detecting'
  | 'tracing'
  | 'done'
  | 'error';

export interface FontifyState {
  stage: PipelineStage;
  progress: number;
  progressLabel: string;
  sourceImage: ImageBitmap | null;
  sourceWidth: number;
  sourceHeight: number;
  binaryData: Uint8Array | null;
  blobs: BlobDescriptor[];
  assignments: GlyphAssignment[];
  baseline: BaselineConfig;
  fontMetrics: FontMetrics;
  thresholdConfig: ThresholdConfig;
  blobDetectConfig: BlobDetectConfig;
  tracerConfig: TracerConfig;
  selectedBlobId: number | null;
  error: string | null;
}
