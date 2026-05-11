'use client';
import { useEffect, useRef } from 'react';
import { useFontStore } from '@/hooks/useFontStore';

export function PreviewCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { binaryData, sourceWidth, sourceHeight, sourceImage, stage } = useFontStore();

  // Render thresholded B&W preview (at source resolution in offscreen buffer)
  useEffect(() => {
    if (!canvasRef.current || !binaryData || !sourceWidth || !sourceHeight) return;
    const canvas = canvasRef.current;
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(sourceWidth, sourceHeight);
    for (let i = 0; i < binaryData.length; i++) {
      const v = binaryData[i];
      imgData.data[i * 4 + 0] = v;
      imgData.data[i * 4 + 1] = v;
      imgData.data[i * 4 + 2] = v;
      imgData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
  }, [binaryData, sourceWidth, sourceHeight]);

  // Fallback: render source image while processing
  useEffect(() => {
    if (!canvasRef.current || !sourceImage || binaryData) return;
    const canvas = canvasRef.current;
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(sourceImage, 0, 0, sourceWidth, sourceHeight);
  }, [sourceImage, sourceWidth, sourceHeight, binaryData]);

  if (!sourceImage && stage === 'idle') return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        imageRendering: 'auto',
        pointerEvents: 'none',
      }}
    />
  );
}
