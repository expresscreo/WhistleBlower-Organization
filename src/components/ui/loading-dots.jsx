import { cn } from '@/lib/utils';

const LoadingDots = ({ className, ...props }) => (
  <span
    className={cn('inline-flex items-center gap-1.5', className)}
    role="status"
    aria-label="Loading"
    {...props}
  >
    <span className="h-2.5 w-2.5 min-h-2.5 min-w-2.5 flex-shrink-0 aspect-square rounded-full bg-current animate-loading-dot [animation-delay:0ms]" />
    <span className="h-2.5 w-2.5 min-h-2.5 min-w-2.5 flex-shrink-0 aspect-square rounded-full bg-current animate-loading-dot [animation-delay:150ms]" />
    <span className="h-2.5 w-2.5 min-h-2.5 min-w-2.5 flex-shrink-0 aspect-square rounded-full bg-current animate-loading-dot [animation-delay:300ms]" />
  </span>
);

export { LoadingDots };
