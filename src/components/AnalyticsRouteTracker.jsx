'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { isAnalyticsAllowedPath } from '@/lib/analytics';

export default function AnalyticsRouteTracker({ gaId }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!gaId || typeof window.gtag !== 'function') return;
    if (!isAnalyticsAllowedPath(pathname)) return;

    window.gtag('config', gaId, { page_path: pathname });
  }, [pathname, gaId]);

  return null;
}
