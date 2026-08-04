'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Run an async loader exactly once when `ready` becomes true.
 * The latest `load` is kept in a ref so callback identity churn cannot retrigger.
 */
export function useLoadOnce(ready, load) {
  const hasLoadedRef = useRef(false);
  const inFlightRef = useRef(false);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!ready || hasLoadedRef.current || inFlightRef.current) {
      return undefined;
    }

    let cancelled = false;
    inFlightRef.current = true;

    (async () => {
      try {
        await loadRef.current();
        if (!cancelled) {
          hasLoadedRef.current = true;
        }
      } finally {
        inFlightRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready]);

  const reload = useCallback(async () => {
    await loadRef.current();
    hasLoadedRef.current = true;
  }, []);

  return { reload, hasLoadedRef };
}

/**
 * Run an async loader whenever `ready` is true and any listed dep changes.
 * Does not depend on `load` identity — safe with unstable fetch callbacks.
 */
export function useLoadOnDeps(ready, load, deps = []) {
  const inFlightRef = useRef(false);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!ready) return undefined;

    let cancelled = false;
    inFlightRef.current = true;

    (async () => {
      try {
        await loadRef.current();
      } finally {
        if (!cancelled) {
          inFlightRef.current = false;
        } else {
          inFlightRef.current = false;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentional: only re-run on ready + caller deps, never on load identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, ...deps]);

  const reload = useCallback(async () => {
    await loadRef.current();
  }, []);

  return { reload };
}
