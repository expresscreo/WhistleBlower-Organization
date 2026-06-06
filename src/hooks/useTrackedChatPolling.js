import { useEffect, useRef } from 'react';
import { usePageVisibility } from '@/hooks/usePageVisibility';

const DEFAULT_INTERVAL_MS = 3000;

/**
 * Polls password-protected track APIs while the tab is visible.
 * Anonymous track pages cannot use Supabase Realtime after RLS hardening,
 * so this keeps chat in sync when admins message from the dashboard.
 */
export function useTrackedChatPolling(onPoll, { enabled = true, intervalMs = DEFAULT_INTERVAL_MS } = {}) {
  const isVisible = usePageVisibility();
  const onPollRef = useRef(onPoll);
  onPollRef.current = onPoll;

  useEffect(() => {
    if (!enabled || !isVisible) return undefined;

    const poll = () => {
      onPollRef.current();
    };

    poll();
    const intervalId = window.setInterval(poll, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [enabled, isVisible, intervalMs]);
}
