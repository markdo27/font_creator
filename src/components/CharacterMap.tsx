'use client';
import { useMemo } from 'react';
import { useFontStore } from '@/hooks/useFontStore';

// ASCII printable chars: 32-126 (space + 94 visible)
const ASCII_RANGES = [
  { label: 'Uppercase', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') },
  { label: 'Lowercase', chars: 'abcdefghijklmnopqrstuvwxyz'.split('') },
  { label: 'Digits', chars: '0123456789'.split('') },
  { label: 'Punctuation', chars: `!@#$%^&*()-_=+[]{}|;:'",.<>?/\`~\\`.split('') },
];

interface CharacterMapProps {
  onCharSelect: (char: string) => void;
}

export function CharacterMap({ onCharSelect }: CharacterMapProps) {
  const { assignments, selectedBlobId } = useFontStore();
  const assignedChars = useMemo(() => new Set(assignments.map(a => a.char)), [assignments]);

  return (
    <div className="flex flex-col gap-4 overflow-y-auto pr-1" style={{ maxHeight: '100%' }}>
      {ASCII_RANGES.map(({ label, chars }) => (
        <div key={label}>
          <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: '#475569' }}>
            {label}
          </p>
          <div className="flex flex-wrap gap-1">
            {chars.map(ch => {
              const isAssigned = assignedChars.has(ch);
              const isActive = selectedBlobId !== null && isAssigned && assignments.find(a => a.char === ch)?.blobId === selectedBlobId;
              return (
                <button
                  key={ch}
                  id={`char-${ch.charCodeAt(0)}`}
                  className={`char-cell ${isAssigned ? 'assigned' : ''} ${isActive ? 'active' : ''}`}
                  onClick={() => onCharSelect(ch)}
                  title={`Assign to '${ch}' (U+${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`}
                >
                  {ch}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
