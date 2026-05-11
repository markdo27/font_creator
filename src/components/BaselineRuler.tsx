'use client';
import { useCallback, useRef } from 'react';
import { useFontStore } from '@/hooks/useFontStore';

interface BaselineRulerProps {
  containerWidth: number;
  containerHeight: number;
}

export function BaselineRuler({ containerWidth, containerHeight }: BaselineRulerProps) {
  const { baseline, sourceHeight, sourceWidth, setBaseline } = useFontStore();
  const draggingRef = useRef<'baseline' | 'meanline' | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ── Coordinate helpers ──────────────────────────────────────────────────────
  // These are computed fresh on each render — no hooks needed here
  const scale = sourceHeight > 0 && sourceWidth > 0
    ? Math.min(containerWidth / sourceWidth, containerHeight / sourceHeight)
    : 1;
  const offsetY = (containerHeight - sourceHeight * scale) / 2;

  const toScreen = (imageY: number) => offsetY + imageY * scale;
  const toImage = useCallback((screenY: number) =>
    Math.round((screenY - offsetY) / scale),
    [offsetY, scale]
  );

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingRef.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rawY = e.clientY - rect.top;
    const clamped = Math.max(0, Math.min(containerHeight, rawY));
    const imgY = toImage(clamped);

    if (draggingRef.current === 'baseline') {
      setBaseline({ baselineY: imgY });
    } else {
      setBaseline({ meanLineY: imgY });
    }
  }, [containerHeight, setBaseline, toImage]);

  const onMouseUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  // ── Guard AFTER all hooks are called ───────────────────────────────────────
  if (!sourceHeight || !containerWidth) return null;

  const baselineScreen = toScreen(baseline.baselineY);
  const meanLineScreen = toScreen(baseline.meanLineY);

  const RulerLine = ({
    y, color, label, onDragStart
  }: { y: number; color: string; label: string; onDragStart: () => void }) => (
    <g style={{ cursor: 'ns-resize' }} onMouseDown={onDragStart}>
      {/* Hit area */}
      <rect x={0} y={y - 8} width={containerWidth} height={16} fill="transparent" />
      {/* Dashed line */}
      <line
        x1={0} y1={y} x2={containerWidth} y2={y}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="6 4"
        opacity={0.85}
      />
      {/* Label pill */}
      <rect x={containerWidth - 82} y={y - 10} width={78} height={18} rx={4}
        fill={`${color}22`} stroke={color} strokeWidth={0.8} />
      <text x={containerWidth - 43} y={y + 4} textAnchor="middle" fontSize={9} fontWeight="600"
        fill={color} style={{ fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </text>
      {/* Drag handle */}
      <circle cx={16} cy={y} r={6} fill={color} opacity={0.9} />
      <line x1={13} y1={y - 2} x2={19} y2={y - 2} stroke="white" strokeWidth={1} />
      <line x1={13} y1={y + 2} x2={19} y2={y + 2} stroke="white" strokeWidth={1} />
    </g>
  );

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0"
      width={containerWidth}
      height={containerHeight}
      style={{ position: 'absolute', top: 0, left: 0, userSelect: 'none' }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <RulerLine
        y={meanLineScreen}
        color="var(--meanline-color)"
        label="Mean Line"
        onDragStart={() => { draggingRef.current = 'meanline'; }}
      />
      <RulerLine
        y={baselineScreen}
        color="var(--baseline-color)"
        label="Baseline"
        onDragStart={() => { draggingRef.current = 'baseline'; }}
      />
    </svg>
  );
}
