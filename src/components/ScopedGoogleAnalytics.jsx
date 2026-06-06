'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { GoogleAnalytics } from '@next/third-parties/google';
import AnalyticsRouteTracker from '@/components/AnalyticsRouteTracker';
import { isAnalyticsAllowedPath } from '@/lib/analytics';

export default function ScopedGoogleAnalytics({ gaId }) {
  const pathname = usePathname();
  const allowed = isAnalyticsAllowedPath(pathname);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (allowed) {
      setActivated(true);
    }
  }, [allowed]);

  if (!gaId || !activated) {
    return null;
  }

  return (
    <>
      <GoogleAnalytics gaId={gaId} />
      <Suspense fallback={null}>
        <AnalyticsRouteTracker gaId={gaId} />
      </Suspense>
    </>
  );
}
