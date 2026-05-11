import type { WorkerCommand, WorkerResult } from '@/types/fontify';
import { threshold } from '@/lib/pipeline/threshold';
import { detectBlobs } from '@/lib/pipeline/blobDetect';
import { traceAll } from '@/lib/pipeline/tracer';

function send(result: WorkerResult) {
  self.postMessage(result);
}

self.onmessage = async (e: MessageEvent<WorkerCommand>) => {
  const { type, payload } = e.data;

  try {
    if (type === 'THRESHOLD') {
      send({ type: 'PROGRESS', payload: { stage: 'Thresholding image…', pct: 5 } });
      const { imageData, config } = payload;
      const binaryData = threshold(imageData, config.threshold, config.blurRadius, config.invert);
      send({ type: 'THRESHOLD_DONE', payload: { binaryData, width: imageData.width, height: imageData.height } });

    } else if (type === 'DETECT_BLOBS') {
      send({ type: 'PROGRESS', payload: { stage: 'Detecting characters…', pct: 30 } });
      const { binaryData, width, height, config } = payload;
      const blobs = detectBlobs(binaryData, width, height, config.minArea);
      send({ type: 'BLOBS_DONE', payload: { blobs } });

    } else if (type === 'TRACE_ALL') {
      const { blobs, config } = payload;
      send({ type: 'PROGRESS', payload: { stage: 'Vectorizing glyphs…', pct: 50 } });
      const traced = await traceAll(blobs, config, (done, total) => {
        const pct = 50 + Math.round((done / total) * 45);
        send({ type: 'PROGRESS', payload: { stage: `Tracing ${done}/${total}…`, pct } });
      });
      send({ type: 'TRACE_DONE', payload: { blobs: traced } });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    send({ type: 'ERROR', payload: { message } });
  }
};
