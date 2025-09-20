import { useState, useEffect } from 'react';

/**
 * Custom hook to track page visibility and prevent unnecessary operations when page is hidden
 */
export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
};

/**
 * Custom hook to debounce function calls and prevent rapid successive executions
 */
export const useDebounce = (callback, delay) => {
  const [timeoutId, setTimeoutId] = useState(null);

  const debouncedCallback = (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback;
};

/**
 * Custom hook that combines page visibility and debouncing for optimal data fetching
 */
export const useSmartFetch = (fetchFunction, dependencies = [], debounceDelay = 300) => {
  const isVisible = usePageVisibility();
  const debouncedFetch = useDebounce(fetchFunction, debounceDelay);

  const smartFetch = (forceRefresh = false) => {
    if (forceRefresh || isVisible) {
      if (debounceDelay > 0) {
        debouncedFetch();
      } else {
        fetchFunction();
      }
    }
  };

  return { smartFetch, isVisible };
};
