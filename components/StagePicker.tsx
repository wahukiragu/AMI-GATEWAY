'use client';

import type { FrameworkStage } from '@/lib/types';

interface Props {
  stages: FrameworkStage[];
  name?: string;
  value: number;
  onChange: (stage: number) => void;
  /** Lowest stage that can be chosen (when updating an existing connection). */
  min?: number;
}

/** Five bars, like the AMI logo. Picking one explains what the stage means. */
export function StagePicker({ stages, name = 'stage', value, onChange, min = 1 }: Props) {
  const current = stages.find((s) => s.stage_no === value) ?? stages[0];
  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div role="radiogroup" aria-label="Stage reached" className="grid grid-cols-1 gap-2 sm:grid-cols-5 sm:gap-3">
        {stages.map((s) => {
          const selected = s.stage_no === value;
          const disabled = s.stage_no < min;
          return (
            <button
              key={s.stage_no}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(s.stage_no)}
              className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition sm:flex-col sm:items-stretch sm:text-center ${
                selected ? 'border-navy bg-navy-50' : 'border-navy/15 bg-white hover:border-navy/40'
              } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              <span className="flex items-end sm:h-24 sm:justify-center">
                <span
                  className={`block w-3.5 rounded-full h-8 sm:h-[var(--h)] ${selected ? 'bg-gold' : 'bg-navy/25'}`}
                  style={{ ['--h' as string]: `${28 + s.stage_no * 14}px` }}
                />
              </span>
              <span>
                <span className="block text-sm font-bold">{s.name}</span>
                <span className="block text-xs text-navy-500">{s.short_label}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 rounded-xl bg-sand p-4 text-sm" aria-live="polite">
        <p className="font-semibold">{current.name}: {current.meaning}</p>
        <p className="mt-1 text-navy-500">For example: {current.example}</p>
        <p className="mt-1 text-navy-500">Good evidence: {current.evidence_guidance}</p>
      </div>
    </div>
  );
}
