import opentype from 'opentype.js';

/**
 * Triggers a browser-side download of the assembled font as a .ttf file.
 * Uses the manual ArrayBuffer → Blob → <a> click approach for reliability.
 */
export function downloadFont(font: opentype.Font, filename = 'fontify.ttf'): void {
  try {
    // opentype.js's download() triggers browser download internally
    font.download(filename);
  } catch {
    // Fallback: manual download via ArrayBuffer
    const arrayBuffer = font.toArrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'font/ttf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

/**
 * Returns a Blob URL for live preview via @font-face.
 */
export function fontToBlobUrl(font: opentype.Font): string {
  const arrayBuffer = font.toArrayBuffer();
  const blob = new Blob([arrayBuffer], { type: 'font/ttf' });
  return URL.createObjectURL(blob);
}
