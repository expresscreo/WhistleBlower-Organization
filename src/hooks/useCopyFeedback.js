import { useCallback, useState } from 'react';

/** Temporary "copied" state for copy buttons (auto-resets after 2s). */
export function useCopyFeedback(resetMs = 2000) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [copyError, setCopyError] = useState(null);

  const copy = useCallback(
    async (text, key = 'default') => {
      setCopyError(null);
      try {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), resetMs);
      } catch (err) {
        setCopyError(err.message || 'Failed to copy');
        setTimeout(() => setCopyError(null), resetMs);
      }
    },
    [resetMs]
  );

  const isCopied = useCallback((key = 'default') => copiedKey === key, [copiedKey]);

  return { copy, isCopied, copyError, clearCopyError: () => setCopyError(null) };
}
