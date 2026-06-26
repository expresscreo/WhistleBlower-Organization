'use client';

import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_DOT } from './voiceNoteUi';

export default function VoiceNoteCard({
  children,
  className,
  id,
  ariaLabel = 'Voice note',
  statusLabel,
  statusDetail,
  statusKey = 'Ready',
  showAnonymizedBadge = true,
  footer,
}) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn(
        'relative overflow-hidden border border-border/80 bg-card shadow-sm',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/[0.07] via-transparent to-transparent"
        aria-hidden="true"
      />

      <div className="relative px-4 py-4 sm:px-5 sm:py-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span
                className={cn(
                  'h-1.5 w-1.5 shrink-0 rounded-full',
                  STATUS_DOT[statusKey] || STATUS_DOT.Ready
                )}
                aria-hidden="true"
              />
              <p
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground tabular-nums"
                aria-live="polite"
              >
                {statusLabel}
                {statusDetail ? (
                  <>
                    {' '}
                    <span className="text-muted-foreground/60">—</span>
                    {' '}
                    {statusDetail}
                  </>
                ) : null}
              </p>
            </div>
          </div>
          {showAnonymizedBadge ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 border border-emerald-500/25 bg-emerald-500/[0.08] px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              Anonymized
            </span>
          ) : null}
        </div>

        {children}

        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </section>
  );
}
