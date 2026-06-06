'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StickyReportNowButton from '@/components/StickyReportNowButton';
import { MobileMenuProvider } from '@/contexts/MobileMenuContext';
import { ReportCtaProvider } from '@/contexts/ReportCtaContext';
import { cn } from '@/lib/utils';
import { isMarketingPublicPage, isPublicPageWithFooter } from '@/lib/publicPagePaths';

export default function PublicLayout({ children }) {
  const pathname = usePathname();
  const showFooter = isPublicPageWithFooter(pathname);
  const showStickyReportCta = isMarketingPublicPage(pathname);

  return (
    <MobileMenuProvider>
      <ReportCtaProvider>
        <div
          className={cn(
            'min-h-screen flex flex-col bg-background text-foreground',
            showStickyReportCta && 'max-md:pb-[calc(4.5rem+env(safe-area-inset-bottom))]'
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
      </ReportCtaProvider>
    </MobileMenuProvider>
  );
}
