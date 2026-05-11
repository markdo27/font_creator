'use client';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { useFontStore } from '@/hooks/useFontStore';
import type { GlyphAssignment, BlobDescriptor } from '@/types/fontify';

interface GlyphCardProps {
  assignment: GlyphAssignment;
  blob: BlobDescriptor;
}

export function GlyphCard({ assignment, blob }: GlyphCardProps) {
  const { removeAssignment, updateNudge, selectBlob, selectedBlobId } = useFontStore();
  const isSelected = selectedBlobId === assignment.blobId;

  // Draw blob thumbnail as data URL
  const svgThumb = blob.svgPath
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${blob.bbox.w} ${blob.bbox.h}"><path d="${blob.svgPath}" fill="white"/></svg>`
    : null;
  const thumbSrc = svgThumb
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgThumb)}`
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="rounded-xl p-3 cursor-pointer transition-all"
      style={{
        background: isSelected ? 'rgba(124,58,237,0.1)' : 'var(--surface-2)',
        border: `1px solid ${isSelected ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
        boxShadow: isSelected ? '0 0 12px rgba(124,58,237,0.2)' : 'none',
      }}
      onClick={() => selectBlob(isSelected ? null : assignment.blobId)}
    >
      <div className="flex items-start gap-2">
        {/* Character label */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-mono font-bold text-sm"
          style={{ background: 'var(--accent)', color: 'white' }}>
          {assignment.char}
        </div>

        {/* Thumbnail */}
        <div className="flex-1 flex items-center justify-center rounded-lg overflow-hidden min-h-[40px]"
          style={{ background: '#000', minWidth: 40 }}>
          {thumbSrc
            ? <img src={thumbSrc} alt={assignment.char} className="max-w-full max-h-10 object-contain" />
            : <div className="w-full h-10 flex items-center justify-center text-xs" style={{ color: '#475569' }}>
                No path
              </div>
          }
        </div>

        {/* Remove */}
        <button
          className="btn-danger p-1 flex-shrink-0"
          onClick={(e) => { e.stopPropagation(); removeAssignment(assignment.unicode); }}
          title="Remove assignment"
        >
          <X size={10} />
        </button>
      </div>

      {/* Y Nudge slider */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: '#475569' }}>Y Nudge</span>
          <span className="font-mono text-xs" style={{ color: assignment.yNudge !== 0 ? 'var(--accent-light)' : '#475569' }}>
            {assignment.yNudge > 0 ? '+' : ''}{assignment.yNudge}px
          </span>
        </div>
        <Slider.Root
          className="relative flex items-center w-full h-4"
          min={-20} max={20} step={1}
          value={[assignment.yNudge]}
          onValueChange={([v]) => updateNudge(assignment.unicode, v)}
          onClick={(e) => e.stopPropagation()}
        >
          <Slider.Track className="relative flex-1 h-1 rounded-full" style={{ background: 'var(--surface-3)' }}>
            <Slider.Range className="absolute h-full rounded-full" style={{ background: 'var(--accent)' }} />
          </Slider.Track>
          <Slider.Thumb
            className="block rounded-full outline-none focus:outline-none"
            style={{ width: 12, height: 12, background: 'var(--accent)', border: '2px solid rgba(255,255,255,0.3)', boxShadow: '0 0 6px var(--accent-glow)' }}
          />
        </Slider.Root>
      </div>
    </motion.div>
  );
}
