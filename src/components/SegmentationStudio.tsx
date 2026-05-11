'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, ZoomIn, ZoomOut, RotateCcw, Sliders } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';

import { useFontStore } from '@/hooks/useFontStore';
import { useImageWorker } from '@/hooks/useImageWorker';
import { CharacterMap } from '@/components/CharacterMap';
import { GlyphCard } from '@/components/GlyphCard';
import { BlobGrid } from '@/components/BlobGrid';
import { BaselineRuler } from '@/components/BaselineRuler';
import { ExportPanel } from '@/components/ExportPanel';
import { FontPreview } from '@/components/FontPreview';
import { PreviewCanvas } from '@/components/PreviewCanvas';

export function SegmentationStudio() {
  const store = useFontStore();
  const { rerunThreshold } = useImageWorker();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [showControls, setShowControls] = useState(true);

  // Keep a ref to the latest store for use in callbacks (avoids stale closures)
  const storeRef = useRef(store);
  storeRef.current = store;

  // Measure canvas container
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setCanvasSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Assign selected blob to a character
  const handleCharSelect = useCallback((char: string) => {
    const s = storeRef.current;
    if (s.selectedBlobId === null) return;
    s.assignGlyph({
      blobId: s.selectedBlobId,
      unicode: char.charCodeAt(0),
      char,
      yNudge: 0,
    });
    // Auto-advance to next unassigned blob
    const assignedIds = new Set([...s.assignments.map(a => a.blobId), s.selectedBlobId]);
    const next = s.blobs.find(b => !assignedIds.has(b.id));
    s.selectBlob(next?.id ?? null);
  }, []);

  // Keyboard shortcut: alpha/digit keys assign directly
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const s = storeRef.current;
      if (e.key.length === 1 && /[\x20-\x7E]/.test(e.key) && s.selectedBlobId !== null) {
        handleCharSelect(e.key);
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const ids = s.blobs.map(b => b.id);
        const cur = ids.indexOf(s.selectedBlobId ?? -1);
        const next = ids[(cur + 1) % ids.length];
        s.selectBlob(next ?? null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCharSelect]);

  const blobMap = new Map(store.blobs.map(b => [b.id, b]));
  const isProcessing = ['thresholding', 'detecting', 'tracing'].includes(store.stage);

  return (
    <div className="flex h-full gap-3 overflow-hidden">
      {/* ── LEFT PANEL: Controls + CharMap ─────────────────────────────── */}
      <div className="flex flex-col gap-3 overflow-y-auto" style={{ width: 220, minWidth: 200, flexShrink: 0 }}>
        {/* Threshold controls */}
        <div className="panel">
          <div className="panel-header">
            <Sliders size={11} />
            Image Controls
          </div>
          <div className="flex flex-col gap-4 p-3">
            <SliderControl
              label="Threshold"
              value={store.thresholdConfig.threshold}
              min={0} max={255} step={1}
              display={store.thresholdConfig.threshold === 0 ? 'Auto' : String(store.thresholdConfig.threshold)}
              onChange={(v) => store.setThresholdConfig({ threshold: v })}
            />
            <SliderControl
              label="Blur"
              value={store.thresholdConfig.blurRadius}
              min={0} max={3} step={1}
              display={String(store.thresholdConfig.blurRadius)}
              onChange={(v) => store.setThresholdConfig({ blurRadius: v })}
            />
            <SliderControl
              label="Min Blob"
              value={store.blobDetectConfig.minArea}
              min={10} max={500} step={10}
              display={String(store.blobDetectConfig.minArea)}
              onChange={(v) => store.setBlobDetectConfig({ minArea: v })}
            />
            <div className="flex items-center justify-between">
              <label className="text-xs" style={{ color: '#64748B' }}>Invert</label>
              <button
                className={`w-9 h-5 rounded-full transition-colors relative ${store.thresholdConfig.invert ? '' : ''}`}
                style={{ background: store.thresholdConfig.invert ? 'var(--accent)' : 'var(--surface-3)' }}
                onClick={() => store.setThresholdConfig({ invert: !store.thresholdConfig.invert })}
                id="invert-toggle"
              >
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: store.thresholdConfig.invert ? 20 : 2 }} />
              </button>
            </div>
            <button className="btn-ghost text-xs w-full justify-center" onClick={rerunThreshold} disabled={isProcessing}>
              <RotateCcw size={11} />
              Re-detect
            </button>
          </div>
        </div>

        {/* Character Map */}
        <div className="panel flex flex-col flex-1 overflow-hidden">
          <div className="panel-header">
            <Settings2 size={11} />
            Character Map
            {store.selectedBlobId !== null && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded font-mono"
                style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--accent-light)' }}>
                Click to assign
              </span>
            )}
          </div>
          <div className="flex-1 p-3 overflow-hidden">
            <CharacterMap onCharSelect={handleCharSelect} />
          </div>
        </div>
      </div>

      {/* ── CENTER PANEL: Image Canvas ──────────────────────────────────── */}
      <div className="flex flex-col flex-1 gap-3 overflow-hidden">
        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: '#475569' }}>
            {store.blobs.length} blob{store.blobs.length !== 1 ? 's' : ''} detected
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button className="btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}>
              <ZoomOut size={12} />
            </button>
            <span className="text-xs font-mono px-2" style={{ color: '#64748B' }}>{Math.round(zoom * 100)}%</span>
            <button className="btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setZoom(z => Math.min(4, z + 0.25))}>
              <ZoomIn size={12} />
            </button>
            <button className="btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setZoom(1)}>1:1</button>
          </div>
        </div>

        {/* Canvas area */}
        <div
          className="flex-1 rounded-xl overflow-hidden relative"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          ref={canvasContainerRef}
        >
          {/* Processing overlay */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4"
                style={{ background: 'rgba(11,13,18,0.85)', backdropFilter: 'blur(4px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-sm font-medium" style={{ color: '#94A3B8' }}>{store.progressLabel}</div>
                <div className="w-64 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                  <motion.div
                    className="h-full rounded-full progress-shimmer"
                    initial={{ width: 0 }}
                    animate={{ width: `${store.progress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className="font-mono text-xs" style={{ color: '#475569' }}>{store.progress}%</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className="w-full h-full overflow-auto"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            <div className="relative" style={{ width: canvasSize.w / zoom, height: canvasSize.h / zoom }}>
              <PreviewCanvas />
              {!isProcessing && store.blobs.length > 0 && (
                <BlobGrid containerWidth={canvasSize.w / zoom} containerHeight={canvasSize.h / zoom} />
              )}
              {!isProcessing && store.sourceWidth > 0 && (
                <BaselineRuler containerWidth={canvasSize.w / zoom} containerHeight={canvasSize.h / zoom} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Assignments + Export ──────────────────────────── */}
      <div className="flex flex-col gap-3 overflow-hidden" style={{ width: 220, minWidth: 200, flexShrink: 0 }}>
        {/* Assigned glyphs */}
        <div className="panel flex flex-col flex-1 overflow-hidden">
          <div className="panel-header">
            <Settings2 size={11} />
            Assigned Glyphs
            <span className="ml-auto text-xs font-mono" style={{ color: '#475569' }}>{store.assignments.length}/95</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {store.assignments.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-center py-8"
                  style={{ color: '#475569' }}
                >
                  Click a blob, then click a character to assign it
                </motion.p>
              )}
              {store.assignments.map(asgn => {
                const blob = blobMap.get(asgn.blobId);
                if (!blob) return null;
                return <GlyphCard key={asgn.unicode} assignment={asgn} blob={blob} />;
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Live Font Preview */}
        <FontPreview />

        {/* Export */}
        <div className="panel p-3">
          <ExportPanel />
        </div>
      </div>
    </div>
  );
}

// ── Slider Control Helper ─────────────────────────────────────────────────────
function SliderControl({
  label, value, min, max, step, display, onChange
}: {
  label: string; value: number; min: number; max: number; step: number;
  display: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs" style={{ color: '#64748B' }}>{label}</label>
        <span className="font-mono text-xs" style={{ color: '#94A3B8' }}>{display}</span>
      </div>
      <Slider.Root
        className="relative flex items-center w-full h-4"
        min={min} max={max} step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      >
        <Slider.Track className="relative flex-1 h-1 rounded-full" style={{ background: 'var(--surface-3)' }}>
          <Slider.Range className="absolute h-full rounded-full" style={{ background: 'linear-gradient(90deg, var(--accent), var(--cyan))' }} />
        </Slider.Track>
        <Slider.Thumb
          className="block rounded-full outline-none"
          style={{ width: 12, height: 12, background: 'var(--accent)', border: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 0 6px var(--accent-glow)' }}
        />
      </Slider.Root>
    </div>
  );
}
