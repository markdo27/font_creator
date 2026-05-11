'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, CheckCircle, AlertCircle, Type } from 'lucide-react';
import { useFontStore } from '@/hooks/useFontStore';
import { assembleFont } from '@/lib/font/assembler';

export function ExportPanel() {
  const store = useFontStore();
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const assignedCount = store.assignments.length;

  const handleExport = async () => {
    if (assignedCount === 0) return;
    setExporting(true);
    setExportError(null);
    setExported(false);

    try {
      const font = assembleFont(
        store.assignments,
        store.blobs,
        store.baseline,
        store.fontMetrics,
        store.sourceWidth,
        store.sourceHeight
      );

      // opentype.js browser download
      font.download(`${store.fontMetrics.familyName.replace(/\s+/g, '-')}.ttf`);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Export failed';
      setExportError(msg);
    } finally {
      setExporting(false);
    }
  };

  const MetricInput = ({ label, field, min, max }: { label: string; field: keyof typeof store.fontMetrics; min: number; max: number }) => (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs" style={{ color: '#64748B', minWidth: 80 }}>{label}</label>
      <input
        type="number"
        min={min} max={max}
        value={store.fontMetrics[field] as number}
        onChange={(e) => store.setFontMetrics({ [field]: Number(e.target.value) })}
        className="w-20 text-right text-xs px-2 py-1 rounded-md font-mono outline-none focus:outline-none"
        style={{
          background: 'var(--surface-3)',
          border: '1px solid var(--border)',
          color: '#E2E8F0',
        }}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Font name */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest block mb-2" style={{ color: '#475569' }}>
          Font Family Name
        </label>
        <input
          type="text"
          value={store.fontMetrics.familyName}
          onChange={(e) => store.setFontMetrics({ familyName: e.target.value })}
          placeholder="My Handwriting"
          className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: '#E2E8F0',
          }}
          id="font-name-input"
        />
      </div>

      {/* Metrics */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#475569' }}>
          Font Metrics
        </p>
        <div className="flex flex-col gap-2 p-3 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <MetricInput label="UPM" field="unitsPerEm" min={500} max={2048} />
          <MetricInput label="Ascender" field="ascender" min={400} max={1200} />
          <MetricInput label="Descender" field="descender" min={-600} max={0} />
          <MetricInput label="x-Height" field="xHeight" min={200} max={900} />
          <MetricInput label="Cap Height" field="capHeight" min={300} max={1000} />
        </div>
      </div>

      {/* Assigned count */}
      <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <Type size={14} style={{ color: assignedCount > 0 ? 'var(--green)' : '#475569' }} />
        <span className="text-xs" style={{ color: '#94A3B8' }}>
          <span className="font-mono font-bold" style={{ color: assignedCount > 0 ? 'var(--green)' : '#E2E8F0' }}>{assignedCount}</span>
          {' '}glyph{assignedCount !== 1 ? 's' : ''} assigned
        </span>
      </div>

      {/* Export error */}
      {exportError && (
        <div className="flex items-center gap-2 p-2 rounded-lg text-xs"
          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={12} />
          {exportError}
        </div>
      )}

      {/* Export button */}
      <motion.button
        id="export-font-btn"
        className="btn-primary w-full justify-center mt-auto"
        disabled={assignedCount === 0 || exporting}
        style={{ opacity: assignedCount === 0 ? 0.4 : 1 }}
        onClick={handleExport}
        whileTap={{ scale: 0.97 }}
      >
        {exporting ? (
          <><Loader2 size={14} className="animate-spin" />Assembling…</>
        ) : exported ? (
          <><CheckCircle size={14} />Downloaded!</>
        ) : (
          <><Download size={14} />Export .ttf</>
        )}
      </motion.button>

      {assignedCount === 0 && (
        <p className="text-xs text-center" style={{ color: '#475569' }}>
          Assign at least one glyph to export
        </p>
      )}
    </div>
  );
}
