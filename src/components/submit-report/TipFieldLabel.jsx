import { cn } from '@/lib/utils';

export function TipFieldLabel({ htmlFor, children, optional = false, className }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground',
        className
      )}
    >
      {children}
      {optional ? (
        <span className="font-normal normal-case tracking-normal"> (optional)</span>
      ) : null}
    </label>
  );
}

export function TipFieldGroup({
  isBountyMode,
  label,
  htmlFor,
  optional = false,
  className,
  labelClassName,
  children,
}) {
  return (
    <div className={cn('w-full min-w-0', className)}>
      {isBountyMode ? (
        <TipFieldLabel htmlFor={htmlFor} optional={optional} className={labelClassName}>
          {label}
        </TipFieldLabel>
      ) : null}
      {children}
    </div>
  );
}
