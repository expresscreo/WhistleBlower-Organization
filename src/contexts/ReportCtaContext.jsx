'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SUBMIT_REPORT_HREF } from '@/lib/submitReportHref';

const ReportCtaContext = createContext({
  reportHref: DEFAULT_SUBMIT_REPORT_HREF,
  setReportHref: () => {},
  resetReportHref: () => {},
});

export function ReportCtaProvider({ children }) {
  const [reportHref, setReportHrefState] = useState(DEFAULT_SUBMIT_REPORT_HREF);

  const setReportHref = useCallback((href) => {
    setReportHrefState(href || DEFAULT_SUBMIT_REPORT_HREF);
  }, []);

  const resetReportHref = useCallback(() => {
    setReportHrefState(DEFAULT_SUBMIT_REPORT_HREF);
  }, []);

  const value = useMemo(
    () => ({ reportHref, setReportHref, resetReportHref }),
    [reportHref, setReportHref, resetReportHref]
  );

  return <ReportCtaContext.Provider value={value}>{children}</ReportCtaContext.Provider>;
}

export function useReportCta() {
  return useContext(ReportCtaContext);
}

/** Set a contextual sticky report href for the current page; resets on unmount. */
export function useStickyReportHref(href) {
  const { setReportHref, resetReportHref } = useReportCta();

  useEffect(() => {
    if (href) {
      setReportHref(href);
    }

    return () => {
      resetReportHref();
    };
  }, [href, setReportHref, resetReportHref]);
}
