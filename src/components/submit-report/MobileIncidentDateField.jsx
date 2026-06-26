'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fieldFocusRingClasses } from '@/lib/fieldStyles';
import { parseDateInputValue, toDateInputValue } from './reportFormUtils';

export default function MobileIncidentDateField({
  id = 'dateOfIncident',
  value,
  onChange,
  placeholder = 'Select incident date',
  ariaLabel = 'Date of incident',
  maxDate = new Date(),
}) {
  const max = useMemo(() => toDateInputValue(maxDate), [maxDate]);
  const displayLabel = value ? format(value, 'MMMM d, yyyy') : placeholder;

  const handleDateChange = (event) => {
    onChange(parseDateInputValue(event.target.value));
  };

  return (
    <label
      htmlFor={id}
      className={cn(
        'submit-report-mobile-date-trigger relative isolate block h-12 w-full min-h-[48px] cursor-pointer touch-manipulation md:hidden',
        fieldFocusRingClasses,
        'focus-within:shadow-[inset_0_0_0_2px_hsl(var(--primary))]'
      )}
    >
      <span
        className={cn(
          'pointer-events-none flex h-full w-full items-center gap-2 rounded-md bg-background px-3 text-base',
          !value && 'text-muted-foreground'
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        {displayLabel}
      </span>
      <input
        id={id}
        type="date"
        aria-label={ariaLabel}
        className="submit-report-mobile-date-input z-20"
        value={toDateInputValue(value)}
        onChange={handleDateChange}
        max={max}
        min="1900-01-01"
      />
    </label>
  );
}
