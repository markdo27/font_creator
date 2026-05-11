'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pen, Sparkles, Github } from 'lucide-react';
import { Uploader } from '@/components/Uploader';
import { StepNav } from '@/components/StepNav';
import { SegmentationStudio } from '@/components/SegmentationStudio';
import { useImageWorker } from '@/hooks/useImageWorker';
import { useFontStore } from '@/hooks/useFontStore';

export default function Home() {
  const { processImage } = useImageWorker();
  const { stage, reset } = useFontStore();

  const currentStep = stage === 'idle' ? 0 : stage === 'done' ? 2 : 1;

  const handleFile = useCallback(async (file: File) => {
    await processImage(file);
  }, [processImage]);

  const isStudio = stage !== 'idle';

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── Top Nav ───────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{
          background: 'rgba(13,15,20,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          zIndex: 50,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent)', boxShadow: '0 0 16px var(--accent-glow)' }}
          >
            <Pen size={15} color="white" />
          </div>
          <span className="font-bold text-base tracking-tight">
            Font<span className="gradient-text">ify</span>
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'var(--surface-2)', color: '#475569', border: '1px solid var(--border)' }}
          >
            v1.0
          </span>
        </div>

        <StepNav currentStep={currentStep} />

        <div className="flex items-center gap-2">
          {isStudio && (
            <button className="btn-ghost text-xs" onClick={() => reset()} id="back-to-upload-btn">
              ← New Image
            </button>
          )}
          <a
            href="https://github.com"
            className="btn-ghost text-xs"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github size={12} />
            GitHub
          </a>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {!isStudio ? (
            /* Landing / Upload */
            <motion.div
              key="upload"
              className="h-full flex flex-col items-center justify-center px-6 gap-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Hero */}
              <div className="text-center max-w-xl">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles size={16} style={{ color: 'var(--accent-light)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--accent-light)' }}>
                    100% client-side · no uploads · no account
                  </span>
                </div>
                <h1 className="text-4xl font-bold mb-3 tracking-tight leading-tight">
                  Turn your handwriting into a{' '}
                  <span className="gradient-text">real font</span>
                </h1>
                <p className="text-base" style={{ color: '#64748B', lineHeight: 1.6 }}>
                  Upload a character sheet, segment your glyphs, set the baseline,
                  and download a production-ready <code className="font-mono text-sm px-1 py-0.5 rounded"
                    style={{ background: 'var(--surface-2)', color: 'var(--accent-light)' }}>.ttf</code> file — all in your browser.
                </p>
              </div>

              <Uploader onFile={handleFile} />

              {/* Feature pills */}
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  'Wasm Potrace vectorizer',
                  'Otsu thresholding',
                  'Connected component detection',
                  'Dual baseline system',
                  'Per-glyph Y-nudge',
                  'opentype.js assembly',
                ].map(feat => (
                  <span key={feat} className="text-xs px-3 py-1.5 rounded-full"
                    style={{ background: 'var(--surface-1)', color: '#64748B', border: '1px solid var(--border)' }}>
                    {feat}
                  </span>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Studio */
            <motion.div
              key="studio"
              className="h-full p-3"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <SegmentationStudio />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
