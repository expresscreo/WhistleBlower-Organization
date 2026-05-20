'use client';

import { Mic, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DescriptionModeSwitch({ mode, onChange, disabled = false }) {
  return (
    <div
      role="group"
      aria-label="Report format"
      className="flex rounded-lg bg-muted p-1 gap-1"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('text')}
        className={cn(
          'flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold transition-colors',
          mode === 'text'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Type className="h-4 w-4" aria-hidden />
        TEXT REPORT
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('voice')}
        className={cn(
          'flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold transition-colors',
          mode === 'voice'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Mic className="h-4 w-4" aria-hidden />
        VOICE REPORT
      </button>
    </div>
  );
}
