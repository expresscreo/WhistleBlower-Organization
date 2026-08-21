'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const NavigationProgressStateContext = createContext(null);
const NavigationProgressActionsContext = createContext(null);

const START_PROGRESS = 0.12;
const TRICKLE_CAP = 0.9;
const FLASH_SUPPRESS_MS = 80;
const MIN_VISIBLE_MS = 200;
const SETTLE_MS = 50;
const COMPLETE_FADE_MS = 220;
const TRICKLE_INTERVAL_MS = 350;

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function nextTrickle(current) {
  if (current >= TRICKLE_CAP) return current;
  const remaining = TRICKLE_CAP - current;
  const amount = remaining * clamp(Math.random() * current, 0.08, 0.35);
  return clamp(current + Math.max(0.01, amount), 0, TRICKLE_CAP);
}

function isInternalNavigationClick(event) {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;

  const eventTarget = event.target;
  const element = eventTarget?.nodeType === Node.ELEMENT_NODE
    ? eventTarget
    : eventTarget?.parentElement;
  const anchor = element?.closest?.('a[href]');
  if (!anchor) return false;
  if (anchor.hasAttribute('download')) return false;

  const target = anchor.getAttribute('target');
  if (target && target !== '_self') return false;

  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
    return false;
  }

  let url;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return false;
  }

  if (url.origin !== window.location.origin) return false;

  const current = new URL(window.location.href);
  if (url.pathname === current.pathname && url.search === current.search) {
    return false;
  }

  return true;
}

export const NavigationProgressProvider = ({ children }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  const statusRef = useRef('idle');
  const progressRef = useRef(0);
  const pageLoadingCountRef = useRef(0);
  const startedAtRef = useRef(0);
  const trickleTimerRef = useRef(null);
  const settleTimerRef = useRef(null);
  const completeTimerRef = useRef(null);
  const hideTimerRef = useRef(null);

  const stopTrickle = useCallback(() => {
    if (trickleTimerRef.current) {
      clearInterval(trickleTimerRef.current);
      trickleTimerRef.current = null;
    }
  }, []);

  const clearCompleteTimers = useCallback(() => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    if (completeTimerRef.current) {
      clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const beginTrickle = useCallback(() => {
    stopTrickle();
    trickleTimerRef.current = setInterval(() => {
      if (statusRef.current !== 'running') return;
      const next = nextTrickle(progressRef.current);
      progressRef.current = next;
      setProgress(next);
    }, TRICKLE_INTERVAL_MS);
  }, [stopTrickle]);

  const start = useCallback(() => {
    clearCompleteTimers();

    if (statusRef.current === 'running') return;

    if (statusRef.current === 'completing') {
      const resumeFrom = progressRef.current >= 1 ? 0.3 : progressRef.current;
      progressRef.current = resumeFrom;
      setProgress(resumeFrom);
      setVisible(true);
      setFading(false);
      statusRef.current = 'running';
      startedAtRef.current = Date.now();
      beginTrickle();
      return;
    }

    statusRef.current = 'running';
    startedAtRef.current = Date.now();
    progressRef.current = START_PROGRESS;
    setProgress(START_PROGRESS);
    setVisible(true);
    setFading(false);
    beginTrickle();
  }, [beginTrickle, clearCompleteTimers]);

  const done = useCallback(() => {
    if (pageLoadingCountRef.current > 0) return;
    if (statusRef.current !== 'running') return;

    stopTrickle();

    const elapsed = Date.now() - startedAtRef.current;
    if (elapsed < FLASH_SUPPRESS_MS) {
      statusRef.current = 'idle';
      progressRef.current = 0;
      setProgress(0);
      setVisible(false);
      setFading(false);
      return;
    }

    const finish = () => {
      statusRef.current = 'completing';
      progressRef.current = 1;
      setProgress(1);
      setFading(true);
      hideTimerRef.current = setTimeout(() => {
        progressRef.current = 0;
        statusRef.current = 'idle';
        setProgress(0);
        setVisible(false);
        setFading(false);
        hideTimerRef.current = null;
      }, COMPLETE_FADE_MS);
    };

    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    statusRef.current = 'completing';
    if (wait > 0) {
      completeTimerRef.current = setTimeout(finish, wait);
    } else {
      finish();
    }
  }, [stopTrickle]);

  const registerPageLoading = useCallback(() => {
    pageLoadingCountRef.current += 1;
    start();

    let released = false;
    return () => {
      if (released) return;
      released = true;
      pageLoadingCountRef.current = Math.max(0, pageLoadingCountRef.current - 1);
      if (pageLoadingCountRef.current === 0) {
        done();
      }
    };
  }, [start, done]);

  const notifyRouteChange = useCallback(() => {
    if (statusRef.current === 'idle' && pageLoadingCountRef.current === 0) {
      return;
    }

    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
    }

    settleTimerRef.current = setTimeout(() => {
      settleTimerRef.current = null;
      if (pageLoadingCountRef.current > 0) return;
      done();
    }, SETTLE_MS);
  }, [done]);

  useEffect(() => {
    const handleClick = (event) => {
      if (isInternalNavigationClick(event)) start();
    };
    const handlePopState = () => start();

    document.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handlePopState);
    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [start]);

  useEffect(() => () => {
    stopTrickle();
    clearCompleteTimers();
  }, [clearCompleteTimers, stopTrickle]);

  const stateValue = useMemo(
    () => ({ progress, visible, fading }),
    [progress, visible, fading]
  );

  const actionsValue = useMemo(
    () => ({ start, done, registerPageLoading, notifyRouteChange }),
    [start, done, registerPageLoading, notifyRouteChange]
  );

  return (
    <NavigationProgressActionsContext.Provider value={actionsValue}>
      <NavigationProgressStateContext.Provider value={stateValue}>
        <Suspense fallback={null}>
          <NavigationProgressWatcher />
        </Suspense>
        {children}
      </NavigationProgressStateContext.Provider>
    </NavigationProgressActionsContext.Provider>
  );
};

function NavigationProgressWatcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { notifyRouteChange } = useNavigationProgress();
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    notifyRouteChange();
  }, [pathname, searchParams, notifyRouteChange]);

  return null;
}

export const useNavigationProgress = () => {
  const actions = useContext(NavigationProgressActionsContext);
  if (!actions) {
    throw new Error('useNavigationProgress must be used within a NavigationProgressProvider');
  }
  return actions;
};

export const useNavigationProgressState = () => {
  const state = useContext(NavigationProgressStateContext);
  if (!state) {
    throw new Error('useNavigationProgressState must be used within a NavigationProgressProvider');
  }
  return state;
};

export const usePageLoading = (active = true) => {
  const actions = useContext(NavigationProgressActionsContext);
  const registerPageLoading = actions?.registerPageLoading;

  useEffect(() => {
    if (!active || !registerPageLoading) return undefined;
    return registerPageLoading();
  }, [active, registerPageLoading]);
};
