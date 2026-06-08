'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMobileMenu } from '@/contexts/MobileMenuContext';
import { useReportCta } from '@/contexts/ReportCtaContext';
import { cn } from '@/lib/utils';

const HOME_HERO_ID = 'home-hero';
const MOBILE_MEDIA_QUERY = '(max-width: 767px)';

export default function StickyReportNowButton() {
  const pathname = usePathname();
  const { isMobileMenuOpen } = useMobileMenu();
  const { reportHref, stickyReportBarVisible, setStickyReportBarVisible } = useReportCta();
  const isHomePage = pathname === '/';

  useEffect(() => {
    if (!isHomePage) {
      setStickyReportBarVisible(true);
      return undefined;
    }

    const hero = document.getElementById(HOME_HERO_ID);
    if (!hero) {
      setStickyReportBarVisible(true);
      return undefined;
    }

    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);

    const syncVisibility = (pastHero) => {
      setStickyReportBarVisible(!mediaQuery.matches || pastHero);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        syncVisibility(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(hero);
    syncVisibility(false);

    const handleViewportChange = () => {
      if (!mediaQuery.matches) {
        setStickyReportBarVisible(true);
        return;
      }

      const rect = hero.getBoundingClientRect();
      syncVisibility(rect.bottom <= 0);
    };

    mediaQuery.addEventListener('change', handleViewportChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', handleViewportChange);
      setStickyReportBarVisible(true);
    };
  }, [isHomePage, setStickyReportBarVisible]);

  if (isMobileMenuOpen || !stickyReportBarVisible) return null;

  return (
    <nav
      aria-label="Report now"
      className={cn(
        'md:hidden fixed inset-x-0 bottom-0 z-[100]',
        'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
        'shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.2)]',
        'transition-transform duration-300 ease-out'
      )}
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="px-4 pt-3">
        <Link href={reportHref} className="block">
          <Button className="group h-11 w-full uppercase tracking-[1px] bg-primary hover:bg-[#e96601]">
            REPORT NOW
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>
    </nav>
  );
}
