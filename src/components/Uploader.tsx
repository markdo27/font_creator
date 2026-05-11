'use client';
import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ImageIcon, AlertCircle } from 'lucide-react';

interface UploaderProps {
  onFile: (file: File) => void;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

export function Uploader({ onFile }: UploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((file: File): boolean => {
    if (!ACCEPTED.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image.');
      return false;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File too large. Max 20 MB.');
      return false;
    }
    setError(null);
    return true;
  }, []);

  const handle = useCallback((file: File) => {
    if (validate(file)) onFile(file);
  }, [validate, onFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handle(file);
  }, [handle]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto">
      <motion.div
        className={`relative w-full rounded-2xl cursor-pointer overflow-hidden transition-all duration-300 ${
          dragging ? 'scale-[1.02]' : 'scale-100'
        }`}
        style={{ background: 'var(--surface-1)', border: '1.5px dashed' }}
        animate={{ borderColor: dragging ? 'var(--accent)' : 'var(--border-strong)' }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {/* Glow bg when dragging */}
        <AnimatePresence>
          {dragging && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 70%)' }}
            />
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center justify-center gap-5 py-16 px-8 text-center">
          <motion.div
            animate={{ y: dragging ? -6 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            {dragging
              ? <ImageIcon size={28} style={{ color: 'var(--accent-light)' }} />
              : <Upload size={28} style={{ color: '#64748B' }} />
            }
          </motion.div>

          <div>
            <p className="text-base font-semibold text-slate-200 mb-1">
              {dragging ? 'Drop to upload' : 'Drop your character sheet here'}
            </p>
            <p className="text-sm" style={{ color: '#475569' }}>
              JPG · PNG · WebP &nbsp;·&nbsp; max 20 MB
            </p>
          </div>

          <div
            className="btn-ghost text-sm"
            style={{ pointerEvents: 'none' }}
          >
            Browse file
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }}
          id="file-upload"
        />
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertCircle size={14} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
