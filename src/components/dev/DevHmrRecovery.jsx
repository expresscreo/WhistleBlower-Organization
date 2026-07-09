'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * When Next dev recompiles but the browser misses the Fast Refresh update,
 * nudge the App Router to fetch fresh RSC/client payloads.
 */
export default function DevHmrRecovery() {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return undefined;

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${window.location.host}/_next/webpack-hmr`;
    let ws;

    const connect = () => {
      ws = new WebSocket(url);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.action === 'built' || payload.action === 'sync') {
            router.refresh();
          }
        } catch {
          // Ignore non-JSON websocket frames.
        }
      };

      ws.onclose = () => {
        window.setTimeout(connect, 1500);
      };
    };

    connect();

    return () => {
      ws?.close();
    };
  }, [router]);

  return null;
}
