import React from 'react';
import { cn, formatNumberWithCommas } from '@/lib/utils';

function shouldFormatNumericInput(type, inputMode) {
  return type === 'number' || inputMode === 'numeric' || inputMode === 'decimal';
}

function caretFromSignificantIndex(formatted, significantIndex) {
  let seen = 0;
  for (let index = 0; index <= formatted.length; index += 1) {
    if (seen === significantIndex) return index;
    if (formatted[index] !== ',') seen += 1;
  }
  return formatted.length;
}

const Input = React.forwardRef(
  (
    {
      className,
      type,
      inputMode,
      value,
      defaultValue,
      onChange,
      allowNegative = false,
      autoComplete,
      ...props
    },
    ref,
  ) => {
    const innerRef = React.useRef(null);
    const pendingCaret = React.useRef(null);
    React.useImperativeHandle(ref, () => innerRef.current);
    const formatFigures = shouldFormatNumericInput(type, inputMode);

    React.useLayoutEffect(() => {
      if (pendingCaret.current == null || !innerRef.current) return;
      innerRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    });

    const handleChange = (event) => {
      if (!formatFigures) {
        onChange?.(event);
        return;
      }

      const input = event.target;
      const caret = input.selectionStart ?? input.value.length;
      const significantBeforeCaret = input.value.slice(0, caret).replace(/,/g, '').length;
      const formatted = formatNumberWithCommas(input.value, { allowNegative });
      pendingCaret.current = caretFromSignificantIndex(formatted, significantBeforeCaret);

      onChange?.({
        ...event,
        target: {
          value: formatted,
          name: input.name,
          id: input.id,
        },
        currentTarget: {
          value: formatted,
          name: input.name,
          id: input.id,
        },
      });
    };

    const displayValue =
      formatFigures && value !== undefined && value !== null && value !== ''
        ? formatNumberWithCommas(value, { allowNegative })
        : value;
    const displayDefaultValue =
      formatFigures && defaultValue !== undefined && defaultValue !== null && defaultValue !== ''
        ? formatNumberWithCommas(defaultValue, { allowNegative })
        : defaultValue;
    const valueProps =
      value !== undefined
        ? { value: displayValue }
        : defaultValue !== undefined
          ? { defaultValue: displayDefaultValue }
          : {};

    return (
      <input
        {...props}
        {...valueProps}
        type={formatFigures ? 'text' : type}
        inputMode={formatFigures ? inputMode || 'decimal' : inputMode}
        autoComplete={formatFigures ? 'off' : autoComplete}
        onChange={handleChange}
        className={cn(
          'flex h-10 w-full border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={innerRef}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
