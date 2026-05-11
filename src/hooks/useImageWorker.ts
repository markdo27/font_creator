'use client';
import { useRef, useCallback, useEffect } from 'react';
import { useFontStore } from './useFontStore';
import type { WorkerCommand, WorkerResult } from '@/types/fontify';

export function useImageWorker() {
  const workerRef = useRef<Worker | null>(null);
  const store = useFontStore();

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('@/lib/worker/imageProcessor.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e: MessageEvent<WorkerResult>) => {
      const { type, payload } = e.data;

      if (type === 'PROGRESS') {
        store.setProgress(payload.pct, payload.stage);
      } else if (type === 'THRESHOLD_DONE') {
        store.setBinaryData(payload.binaryData);
        store.setProgress(25, 'Detecting blobs…');
        // Auto-chain to blob detection
        workerRef.current?.postMessage({
          type: 'DETECT_BLOBS',
          payload: {
            binaryData: payload.binaryData,
            width: payload.width,
            height: payload.height,
            config: store.blobDetectConfig,
          },
        } satisfies WorkerCommand);
        store.setStage('detecting');
      } else if (type === 'BLOBS_DONE') {
        store.setBlobs(payload.blobs);
        store.setProgress(50, 'Vectorizing…');
        // Auto-chain to tracing
        workerRef.current?.postMessage({
          type: 'TRACE_ALL',
          payload: {
            blobs: payload.blobs,
            config: store.tracerConfig,
          },
        } satisfies WorkerCommand);
        store.setStage('tracing');
      } else if (type === 'TRACE_DONE') {
        store.setBlobs(payload.blobs);
        store.setProgress(100, 'Done!');
        store.setStage('done');
      } else if (type === 'ERROR') {
        store.setError(payload.message);
        store.setStage('error');
      }
    };

    workerRef.current.onerror = (e) => {
      store.setError(e.message);
      store.setStage('error');
    };

    return () => {
      workerRef.current?.terminate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processImage = useCallback(async (file: File) => {
    try {
      store.setStage('thresholding');
      store.setProgress(0, 'Loading image…');
      store.setError(null);

      // Decode image
      const bitmap = await createImageBitmap(file);

      // Guard max resolution
      const MAX = 2048;
      let w = bitmap.width, h = bitmap.height;
      let finalBitmap = bitmap;

      if (w > MAX || h > MAX) {
        const scale = MAX / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
        finalBitmap = await createImageBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, { resizeWidth: w, resizeHeight: h });
      }

      store.setSourceImage(finalBitmap, w, h);

      // Draw to OffscreenCanvas to get ImageData
      const osc = new OffscreenCanvas(w, h);
      const ctx = osc.getContext('2d')!;
      ctx.drawImage(finalBitmap, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);

      // Set default baseline to 75% of image height
      store.setBaseline({ baselineY: Math.round(h * 0.75), meanLineY: Math.round(h * 0.35) });

      workerRef.current?.postMessage({
        type: 'THRESHOLD',
        payload: { imageData, config: store.thresholdConfig },
      } satisfies WorkerCommand, [imageData.data.buffer]);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load image';
      store.setError(msg);
      store.setStage('error');
    }
  }, [store]);

  const rerunThreshold = useCallback(async () => {
    if (!store.sourceImage || !workerRef.current) return;
    store.setStage('thresholding');
    store.setProgress(0, 'Re-thresholding…');

    const osc = new OffscreenCanvas(store.sourceWidth, store.sourceHeight);
    const ctx = osc.getContext('2d')!;
    ctx.drawImage(store.sourceImage, 0, 0);
    const imageData = ctx.getImageData(0, 0, store.sourceWidth, store.sourceHeight);

    workerRef.current.postMessage({
      type: 'THRESHOLD',
      payload: { imageData, config: store.thresholdConfig },
    } satisfies WorkerCommand, [imageData.data.buffer]);
  }, [store]);

  return { processImage, rerunThreshold };
}
