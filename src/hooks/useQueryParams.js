'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * React Router–compatible tuple API for admin filters (status/category query strings).
 */
export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setSearchParams = useCallback(
    (nextInit, options = {}) => {
      let search = '';
      if (nextInit instanceof URLSearchParams) {
        search = nextInit.toString();
      } else if (typeof nextInit === 'object' && nextInit !== null) {
        const params = new URLSearchParams();
        Object.entries(nextInit).forEach(([key, value]) => {
          if (value != null && value !== '') {
            params.set(key, String(value));
          }
        });
        search = params.toString();
      }
      const url = search ? `${pathname}?${search}` : pathname;
      if (options.replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    [router, pathname],
  );

  return [searchParams, setSearchParams];
}
