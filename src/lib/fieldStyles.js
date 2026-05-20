export const fieldFocusRingClasses =
  'border border-transparent shadow-[inset_0_0_0_1px_hsl(var(--input))] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-[inset_0_0_0_2px_hsl(var(--primary))]';

export const inputFieldClasses = [
  'flex h-12 w-full rounded-md bg-background px-3 py-2 text-base',
  'placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
  fieldFocusRingClasses,
].join(' ');

export const textareaFieldClasses = [
  'flex min-h-[120px] w-full rounded-md bg-background px-3 py-2 text-base',
  'placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
  fieldFocusRingClasses,
].join(' ');

export const selectTriggerFieldClasses = [
  'flex h-12 w-full items-center justify-between rounded-md bg-background px-3 py-2 text-base',
  'placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
  // Reset shadcn SelectTrigger ring/border — radix uses :focus, not only :focus-visible
  'border-transparent ring-0 ring-offset-0',
  'focus:outline-none focus:ring-0 focus:ring-offset-0',
  'focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
  'data-[state=open]:outline-none data-[state=open]:ring-0 data-[state=open]:ring-offset-0',
  // Single inset border (same as Input/Textarea)
  'shadow-[inset_0_0_0_1px_hsl(var(--input))]',
  'hover:shadow-[inset_0_0_0_1px_hsl(var(--input))]',
  'focus:shadow-[inset_0_0_0_2px_hsl(var(--primary))]',
  'focus-visible:shadow-[inset_0_0_0_2px_hsl(var(--primary))]',
  'data-[state=open]:shadow-[inset_0_0_0_2px_hsl(var(--primary))]',
].join(' ');

export const dateInputFieldClasses = [
  inputFieldClasses,
  'submit-report-date-input',
].join(' ');

export const inputWithTrailingIconClasses = 'pr-10';
