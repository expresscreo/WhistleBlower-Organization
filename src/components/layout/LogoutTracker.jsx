'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function LogoutTracker() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);

  useEffect(() => {
    const fromTrackPage = previousPath.current.startsWith('/track');
    const toAnotherPage = !pathname.startsWith('/track');

    if (fromTrackPage && toAnotherPage) {
      sessionStorage.removeItem('trackId');
      sessionStorage.removeItem('trackPassword');
      sessionStorage.removeItem('trackType');
    }
    previousPath.current = pathname;
  }, [pathname]);

  return null;
}
