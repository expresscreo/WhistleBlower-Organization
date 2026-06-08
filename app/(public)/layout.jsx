'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StickyReportNowButton from '@/components/StickyReportNowButton';
import { MobileMenuProvider } from '@/contexts/MobileMenuContext';
import { ReportCtaProvider, useReportCta } from '@/contexts/ReportCtaContext';
import { cn } from '@/lib/utils';
import { isMarketingPublicPage, isPublicPageWithFooter } from '@/lib/publicPagePaths';

function PublicLayoutShell({ children, showFooter, showStickyReportCta }) {
  const { stickyReportBarVisible } = useReportCta();

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col bg-background text-foreground',
        showStickyReportCta &&
          stickyReportBarVisible &&
          'max-md:pb-[calc(4.5rem+env(safe-area-inset-bottom))]'
      )}
    >
      <Navbar />
      <main id="main-content" className="flex-1 flex flex-col min-h-0">
        {children}
      </main>
      {showFooter && (
        <div className="relative z-10 shrink-0">
          <Footer />
        </div>
      )}
      {showStickyReportCta && <StickyReportNowButton />}
    </div>
  );
}

export default function PublicLayout({ children }) {
  const pathname = usePathname();
  const showFooter = isPublicPageWithFooter(pathname);
  const showStickyReportCta = isMarketingPublicPage(pathname);

  return (
    <MobileMenuProvider>
      <ReportCtaProvider>
        <PublicLayoutShell showFooter={showFooter} showStickyReportCta={showStickyReportCta}>
          {children}
        </PublicLayoutShell>
      </ReportCtaProvider>
    </MobileMenuProvider>
  );
}
