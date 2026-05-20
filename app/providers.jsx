'use client';

import { Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import ScrollToTop from '@/components/layout/ScrollToTop';
import LogoutTracker from '@/components/layout/LogoutTracker';
import ErrorBoundary from '@/components/layout/ErrorBoundary';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <Suspense fallback={null}>
            <ScrollToTop />
            <LogoutTracker />
            {children}
          </Suspense>
          <Toaster />
        </ErrorBoundary>
      </ThemeProvider>
    </AuthProvider>
  );
}
