'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMobileMenu } from '@/contexts/MobileMenuContext';
import { useReportCta } from '@/contexts/ReportCtaContext';
import { cn } from '@/lib/utils';

export default function StickyReportNowButton() {
  const { isMobileMenuOpen } = useMobileMenu();
  const { reportHref } = useReportCta();

  if (isMobileMenuOpen) return null;

  return (
    <nav
      aria-label="Report now"
      className={cn(
        'md:hidden fixed inset-x-0 bottom-0 z-[100]',
        'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
        'shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.2)]'
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
