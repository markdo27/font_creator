'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFontStore } from '@/hooks/useFontStore';

// 12-color palette for blob bounding boxes
const BLOB_COLORS = [
  '#7C3AED', '#06B6D4', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6',
  '#F97316', '#6366F1', '#84CC16', '#E879F9',
];

interface BlobGridProps {
  containerWidth: number;
  containerHeight: number;
}

export function BlobGrid({ containerWidth, containerHeight }: BlobGridProps) {
  const { blobs, assignments, selectedBlobId, sourceWidth, sourceHeight, selectBlob } = useFontStore();

  if (blobs.length === 0 || !sourceWidth || !containerWidth) return null;

  const scaleX = containerWidth / sourceWidth;
  const scaleY = containerHeight / sourceHeight;
  const scale = Math.min(scaleX, scaleY);

  // Centering offsets (letterbox)
  const offsetX = (containerWidth - sourceWidth * scale) / 2;
  const offsetY = (containerHeight - sourceHeight * scale) / 2;

  const assignedIds = new Set(assignments.map(a => a.blobId));

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={containerWidth}
      height={containerHeight}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      {blobs.map((blob, i) => {
        const color = BLOB_COLORS[i % BLOB_COLORS.length];
        const x = offsetX + blob.bbox.x * scale;
        const y = offsetY + blob.bbox.y * scale;
        const w = blob.bbox.w * scale;
        const h = blob.bbox.h * scale;
        const isSelected = blob.id === selectedBlobId;
        const isAssigned = assignedIds.has(blob.id);
        const assignment = assignments.find(a => a.blobId === blob.id);

        return (
          <g
            key={blob.id}
            style={{ pointerEvents: 'all', cursor: 'pointer' }}
            onClick={() => selectBlob(isSelected ? null : blob.id)}
          >
            {/* Hover fill */}
            <rect
              x={x} y={y} width={w} height={h}
              fill={isSelected ? `${color}33` : `${color}10`}
              stroke={color}
              strokeWidth={isSelected ? 2 : 1.5}
              rx={3}
              className={isSelected ? 'blob-selected-ring' : ''}
            />

            {/* Selection glow ring */}
            {isSelected && (
              <rect
                x={x - 3} y={y - 3} width={w + 6} height={h + 6}
                fill="none"
                stroke={color}
                strokeWidth={1}
                strokeDasharray="4 4"
                rx={5}
                opacity={0.5}
              />
            )}

            {/* Assignment label */}
            {isAssigned && assignment && (
              <g>
                <rect
                  x={x} y={y - 18} width={20} height={16}
                  fill={color}
                  rx={3}
                />
                <text
                  x={x + 10} y={y - 7}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight="bold"
                  fill="white"
                  style={{ fontFamily: 'monospace' }}
                >
                  {assignment.char}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
