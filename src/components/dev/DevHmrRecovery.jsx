'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Last-resort recovery when Next.dev signals a full page reload is required.
 * Do NOT call router.refresh() on routine HMR sync/built events — that remounts
 * the App Router tree in a loop (especially with filesystem polling).
 */
export default function DevHmrRecovery() {
  const router = useRouter();
  const lastReloadAt = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return undefined;

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${window.location.host}/_next/webpack-hmr`;
    let ws;
    let reconnectTimer;

    const maybeReload = () => {
      const now = Date.now();
      if (now - lastReloadAt.current < 5000) return;
      lastReloadAt.current = now;
      router.refresh();
    };

    const connect = () => {
      ws = new WebSocket(url);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          // Fast Refresh already handles sync/built. Only nudge on explicit reload.
          if (payload.action === 'reload') {
            maybeReload();
          }
        } catch {
          // Ignore non-JSON websocket frames.
        }
      };

      ws.onclose = () => {
        reconnectTimer = window.setTimeout(connect, 2500);
      };
    };

    connect();

    return () => {
      window.clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [router]);

  return null;
}
