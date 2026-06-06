import { cn } from '@/lib/utils';

export const fieldErrorAlertClasses =
  'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 text-center dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200';

export function FieldError({ message, className }) {
  if (!message) return null;
  return (
    <p role="alert" className={cn(fieldErrorAlertClasses, className)}>
      {message}
    </p>
  );
}

export function FieldSuccess({ message, className }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className={cn(
        'text-xs text-green-700 text-center dark:text-green-300',
        className
      )}
    >
      {message}
    </p>
  );
}

export function FormFeedback({ error, success, className }) {
  return (
    <div className={className}>
      <FieldError message={error} />
      <FieldSuccess message={success} />
    </div>
  );
}

export function PageErrorBanner({ error, title, className }) {
  if (!error) return null;
  return (
    <div role="alert" className={cn(fieldErrorAlertClasses, 'text-left', className)}>
      {title ? <p className="font-semibold mb-1">{title}</p> : null}
      <p>{error}</p>
    </div>
  );
}
