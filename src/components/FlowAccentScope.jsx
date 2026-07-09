'use client';

import { cn } from '@/lib/utils';

/**
 * Overrides primary accent tokens for multi-step flows.
 * Bounty wizard uses metallic gold (matches mobile FlowAccentScope).
 */
export default function FlowAccentScope({ accent = 'report', className, children }) {
  if (accent === 'report') {
    return children;
  }

  return (
    <div data-flow-accent={accent} className={cn(className)}>
      {children}
    </div>
  );
}
