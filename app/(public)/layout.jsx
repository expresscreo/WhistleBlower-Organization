'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MobileMenuProvider } from '@/contexts/MobileMenuContext';

const PAGES_WITHOUT_FOOTER = ['/track', '/submit-report'];

export default function PublicLayout({ children }) {
  const pathname = usePathname();
  const showFooter = !PAGES_WITHOUT_FOOTER.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  return (
    <MobileMenuProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main id="main-content">{children}</main>
        {showFooter && <Footer />}
      </div>
    </MobileMenuProvider>
  );
}
