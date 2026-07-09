import { cn } from '@/lib/utils';
import { fieldLabelClasses } from '@/lib/fieldStyles';

export function TipFieldLabel({ htmlFor, children, optional = false, className }) {
  return (
    <label htmlFor={htmlFor} className={cn(fieldLabelClasses, className)}>
      {children}
      {optional ? (
        <span className="font-normal normal-case tracking-normal"> (optional)</span>
      ) : null}
    </label>
  );
}

export function TipFieldGroup({
  isBountyMode,
  showLabel,
  label,
  htmlFor,
  optional = false,
  className,
  labelClassName,
  children,
}) {
  const shouldShowLabel = showLabel ?? isBountyMode;

  return (
    <div className={cn('w-full min-w-0 text-left', className)}>
      {shouldShowLabel && label ? (
        <TipFieldLabel htmlFor={htmlFor} optional={optional} className={labelClassName}>
          {label}
        </TipFieldLabel>
      ) : null}
      {children}
    </div>
  );
}
