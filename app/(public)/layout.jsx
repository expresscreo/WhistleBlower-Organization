'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MobileMenuProvider } from '@/contexts/MobileMenuContext';

const PAGES_WITHOUT_FOOTER = ['/track', '/submit-report', '/place-bounty'];

export default function PublicLayout({ children }) {
  const pathname = usePathname();
  const showFooter = !PAGES_WITHOUT_FOOTER.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  return (
    <MobileMenuProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main id="main-content" className={showFooter ? undefined : 'flex-1 flex flex-col min-h-0'}>
          {children}
        </main>
        {showFooter && (
          <div className="relative z-10 shrink-0">
            <Footer />
          </div>
        )}
      </div>
    </MobileMenuProvider>
  );
}
