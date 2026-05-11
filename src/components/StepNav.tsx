'use client';
import { motion } from 'framer-motion';
import { Upload, Grid2X2, Download } from 'lucide-react';

const STEPS = [
  { id: 0, label: 'Upload', icon: Upload },
  { id: 1, label: 'Segment', icon: Grid2X2 },
  { id: 2, label: 'Export', icon: Download },
];

interface StepNavProps {
  currentStep: number;
}

export function StepNav({ currentStep }: StepNavProps) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const isDone = currentStep > step.id;
        const isActive = currentStep === step.id;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <motion.div
                className="flex items-center justify-center w-7 h-7 rounded-full"
                animate={{
                  background: isDone ? 'var(--green)' : isActive ? 'var(--accent)' : 'var(--surface-3)',
                  boxShadow: isActive ? '0 0 12px var(--accent-glow)' : 'none',
                }}
                transition={{ duration: 0.3 }}
              >
                <Icon size={13} color="white" />
              </motion.div>
              <span
                className="text-xs font-semibold hidden sm:block"
                style={{ color: isActive ? '#E2E8F0' : isDone ? 'var(--green)' : '#475569' }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <motion.div
                className="w-8 h-px mx-3"
                animate={{ background: isDone ? 'var(--green)' : 'var(--border)' }}
                transition={{ duration: 0.3 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
