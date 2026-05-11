import type { BlobDescriptor, TracerConfig } from '@/types/fontify';
import { fixWinding } from './windingFix';
import { traceWithFallback } from './tracerFallback';

/**
 * Trace all blobs into SVG paths.
 *
 * ARCHITECTURE NOTE: esm-potrace-wasm has Node.js `fs` dependencies that
 * cannot be shimmed by Webpack/Turbopack in browser contexts. We therefore
 * use the pure-JS Marching Squares tracer as the primary path.
 *
 * A future migration path: compile potrace.c to WASM yourself and serve
 * it from /public/potrace.wasm, loading it via fetch() inside this worker.
 */
export async function traceAll(
  blobs: BlobDescriptor[],
  config: TracerConfig,
  onProgress?: (done: number, total: number) => void
): Promise<BlobDescriptor[]> {
  const result: BlobDescriptor[] = [];

  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i];
    let svgPath = '';

    try {
      svgPath = traceWithFallback(blob);
      svgPath = fixWinding(svgPath);
    } catch (e) {
      console.error(`[Fontify] Tracing blob ${blob.id} failed:`, e);
      svgPath = '';
    }

    result.push({ ...blob, svgPath });
    onProgress?.(i + 1, blobs.length);
  }

  return result;
}
