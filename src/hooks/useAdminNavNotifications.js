'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { fetchAdminNavNotifications } from '@/lib/adminNavNotifications';

const EMPTY_COUNTS = {
  reports: 0,
  bounties: 0,
  mostWanted: 0,
  feedback: 0,
  newsEditor: 0,
  unmatchedOrgs: 0,
  reward: 0,
};

const POLL_INTERVAL_MS = 60_000;

export function useAdminNavNotifications(profile) {
  const pathname = usePathname();
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const profileId = profile?.id;
  const profileUserType = profile?.user_type;
  const profileOrganizationId = profile?.organization_id;
  const isFetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!profileId || isFetchingRef.current) return;

    isFetchingRef.current = true;
    try {
      const nextCounts = await fetchAdminNavNotifications({
        id: profileId,
        user_type: profileUserType,
        organization_id: profileOrganizationId,
      });
      setCounts(nextCounts);
    } catch (error) {
      console.error('Failed to load admin nav notifications:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [profileId, profileUserType, profileOrganizationId]);

  useEffect(() => {
    if (!profileId) {
      setCounts(EMPTY_COUNTS);
      return;
    }

    refresh();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    }, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [profileId, refresh]);

  useEffect(() => {
    if (profileId) {
      refresh();
    }
  }, [pathname, profileId, refresh]);

  return { counts, refresh };
}
