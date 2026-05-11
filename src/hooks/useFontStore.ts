'use client';
import { create } from 'zustand';
import type {
  FontifyState,
  GlyphAssignment,
  BaselineConfig,
  FontMetrics,
  ThresholdConfig,
  BlobDetectConfig,
  TracerConfig,
  BlobDescriptor,
  PipelineStage,
} from '@/types/fontify';

interface FontifyActions {
  setStage: (stage: PipelineStage) => void;
  setProgress: (pct: number, label: string) => void;
  setSourceImage: (img: ImageBitmap, w: number, h: number) => void;
  setBinaryData: (data: Uint8Array) => void;
  setBlobs: (blobs: BlobDescriptor[]) => void;
  selectBlob: (id: number | null) => void;
  assignGlyph: (assignment: GlyphAssignment) => void;
  removeAssignment: (unicode: number) => void;
  updateNudge: (unicode: number, yNudge: number) => void;
  setBaseline: (cfg: Partial<BaselineConfig>) => void;
  setFontMetrics: (cfg: Partial<FontMetrics>) => void;
  setThresholdConfig: (cfg: Partial<ThresholdConfig>) => void;
  setBlobDetectConfig: (cfg: Partial<BlobDetectConfig>) => void;
  setTracerConfig: (cfg: Partial<TracerConfig>) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

const DEFAULT_STATE: FontifyState = {
  stage: 'idle',
  progress: 0,
  progressLabel: '',
  sourceImage: null,
  sourceWidth: 0,
  sourceHeight: 0,
  binaryData: null,
  blobs: [],
  assignments: [],
  baseline: { baselineY: 0, meanLineY: 0 },
  fontMetrics: {
    familyName: 'Fontify',
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    xHeight: 500,
    capHeight: 700,
  },
  thresholdConfig: { threshold: 0, invert: false, blurRadius: 1 },
  blobDetectConfig: { minArea: 50 },
  tracerConfig: { turdsize: 2, alphamax: 1.0, opttolerance: 0.2 },
  selectedBlobId: null,
  error: null,
};

export const useFontStore = create<FontifyState & FontifyActions>()(
  (set) => ({
    ...DEFAULT_STATE,

    setStage: (stage) => set({ stage }),
    setProgress: (progress, progressLabel) => set({ progress, progressLabel }),
    setSourceImage: (sourceImage, sourceWidth, sourceHeight) =>
      set({ sourceImage, sourceWidth, sourceHeight }),
    setBinaryData: (binaryData) => set({ binaryData }),
    setBlobs: (blobs) => set({ blobs }),
    selectBlob: (selectedBlobId) => set({ selectedBlobId }),

    assignGlyph: (assignment) =>
      set((s) => ({
        assignments: [
          ...s.assignments.filter(
            (a) => a.blobId !== assignment.blobId && a.unicode !== assignment.unicode
          ),
          assignment,
        ],
      })),

    removeAssignment: (unicode) =>
      set((s) => ({ assignments: s.assignments.filter((a) => a.unicode !== unicode) })),

    updateNudge: (unicode, yNudge) =>
      set((s) => ({
        assignments: s.assignments.map((a) =>
          a.unicode === unicode ? { ...a, yNudge } : a
        ),
      })),

    setBaseline: (cfg) =>
      set((s) => ({ baseline: { ...s.baseline, ...cfg } })),

    setFontMetrics: (cfg) =>
      set((s) => ({ fontMetrics: { ...s.fontMetrics, ...cfg } })),

    setThresholdConfig: (cfg) =>
      set((s) => ({ thresholdConfig: { ...s.thresholdConfig, ...cfg } })),

    setBlobDetectConfig: (cfg) =>
      set((s) => ({ blobDetectConfig: { ...s.blobDetectConfig, ...cfg } })),

    setTracerConfig: (cfg) =>
      set((s) => ({ tracerConfig: { ...s.tracerConfig, ...cfg } })),

    setError: (error) => set({ error }),

    reset: () => set({ ...DEFAULT_STATE }),
  })
);
