'use client';

import { Suspense } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import ScrollToTop from '@/components/layout/ScrollToTop';
import LogoutTracker from '@/components/layout/LogoutTracker';
import ErrorBoundary from '@/components/layout/ErrorBoundary';
import DevHmrRecovery from '@/components/dev/DevHmrRecovery';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <Suspense fallback={null}>
            {process.env.NODE_ENV === 'development' ? <DevHmrRecovery /> : null}
            <ScrollToTop />
            <LogoutTracker />
            {children}
          </Suspense>
        </ErrorBoundary>
      </ThemeProvider>
    </AuthProvider>
  );
}
