'use client';
import { useEffect, useState, useRef } from 'react';
import { useFontStore } from '@/hooks/useFontStore';
import { assembleFont } from '@/lib/font/assembler';

/**
 * Live preview that renders assigned glyphs using @font-face.
 * Rebuilds the font on every assignment change and displays it inline.
 */
export function FontPreview() {
  const store = useFontStore();
  const [fontUrl, setFontUrl] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState('');
  const prevUrlRef = useRef<string | null>(null);
  const fontIdRef = useRef(0);

  useEffect(() => {
    if (store.assignments.length === 0) {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
      setFontUrl(null);
      return;
    }

    try {
      const font = assembleFont(
        store.assignments,
        store.blobs,
        store.baseline,
        store.fontMetrics,
        store.sourceWidth,
        store.sourceHeight
      );

      const ab = font.toArrayBuffer();
      const blob = new Blob([ab], { type: 'font/ttf' });
      const url = URL.createObjectURL(blob);

      // Revoke old URL
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = url;

      // Unique font family name to force browser re-render
      const fontFamily = `FontifyPreview_${++fontIdRef.current}`;

      // Inject @font-face rule
      const style = document.createElement('style');
      style.textContent = `
        @font-face {
          font-family: '${fontFamily}';
          src: url('${url}') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
      `;
      document.head.appendChild(style);

      setFontUrl(fontFamily);

      // Build default preview from assigned chars
      const chars = store.assignments.map(a => a.char).join('');
      if (!previewText) setPreviewText(chars);

      // Cleanup
      return () => {
        document.head.removeChild(style);
      };
    } catch (e) {
      console.error('[Fontify] Preview build failed:', e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.assignments, store.blobs, store.baseline, store.fontMetrics, store.sourceWidth, store.sourceHeight]);

  if (store.assignments.length === 0) return null;

  const sampleChars = store.assignments.map(a => a.char).join('');

  return (
    <div className="panel">
      <div className="panel-header">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
        Live Preview
      </div>
      <div className="p-3 flex flex-col gap-3">
        {/* Preview display */}
        <div
          className="rounded-lg p-4 text-center overflow-hidden"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            minHeight: 60,
          }}
        >
          {fontUrl ? (
            <p
              style={{
                fontFamily: `'${fontUrl}', serif`,
                fontSize: 32,
                lineHeight: 1.3,
                color: '#E2E8F0',
                wordBreak: 'break-all',
                transition: 'font-family 0.15s',
              }}
            >
              {previewText || sampleChars}
            </p>
          ) : (
            <p className="text-xs" style={{ color: '#475569' }}>Building preview…</p>
          )}
        </div>

        {/* Custom text input */}
        <input
          type="text"
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          placeholder={`Type to preview (${sampleChars})`}
          className="w-full px-3 py-2 rounded-lg text-xs outline-none font-mono"
          style={{
            background: 'var(--surface-3)',
            border: '1px solid var(--border)',
            color: '#94A3B8',
          }}
          id="preview-text-input"
        />
      </div>
    </div>
  );
}
