'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMobileMenu } from '@/contexts/MobileMenuContext';
import { useReportCta } from '@/contexts/ReportCtaContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';
import NavLabelWithNewTag from '@/components/NavLabelWithNewTag';

const MobileMenuOverlay = ({ navItems }) => {
  const { isMobileMenuOpen, closeMobileMenu } = useMobileMenu();
  const { reportHref } = useReportCta();
  const [expandedItems, setExpandedItems] = useState({});
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleExpanded = (itemName) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  const handleLinkClick = () => {
    closeMobileMenu();
    setExpandedItems({});
  };

  if (!mounted) return null;

  const overlay = (
    <AnimatePresence mode="wait">
      {isMobileMenuOpen && (
        <div className="nav:hidden">
          <motion.button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 top-16 z-[9998] bg-black/40 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeMobileMenu}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="mobile-menu-overlay fixed inset-x-0 bottom-0 top-16 z-[9999] flex w-full flex-col mobile-menu-bg shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div
              className="flex-1 overflow-y-auto px-4 pt-8 pb-6"
              style={{
                paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
              }}
            >
              <nav className="space-y-4">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + index * 0.04, duration: 0.25 }}
                    className="space-y-2"
                  >
                    {item.dropdown ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(item.name)}
                          className="group flex w-full items-center justify-between py-2"
                          aria-expanded={expandedItems[item.name]}
                        >
                          <span className="text-[36px] font-semibold capitalize leading-[40px] text-foreground transition-colors duration-200 group-hover:text-primary">
                            {item.name === 'FAQ' ? item.name : item.name.toLowerCase()}
                          </span>
                          <motion.div
                            className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200"
                            animate={{
                              rotate: expandedItems[item.name] ? 180 : 0,
                            }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                          >
                            <ChevronDown className="h-5 w-5 text-primary" />
                          </motion.div>
                        </button>

                        <AnimatePresence>
                          {expandedItems[item.name] && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="space-y-2 border-l-2 border-primary/20 pl-6"
                            >
                              {item.items.map((subItem) => (
                                <Link
                                  key={subItem.name}
                                  href={subItem.path}
                                  onClick={handleLinkClick}
                                  className={cn(
                                    'block py-1 text-lg font-medium transition-colors duration-200',
                                    pathname === subItem.path
                                      ? 'text-primary'
                                      : 'text-muted-foreground hover:text-foreground'
                                  )}
                                  style={{ minHeight: '44px' }}
                                >
                                  {subItem.name}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        href={item.path}
                        onClick={handleLinkClick}
                        className={cn(
                          'relative block py-2 text-[36px] font-semibold capitalize leading-[40px] transition-colors duration-200',
                          pathname === item.path
                            ? item.activeAccent === 'bounty'
                              ? 'text-bounty-gold'
                              : 'text-primary'
                            : item.activeAccent === 'bounty'
                              ? 'text-foreground hover:text-bounty-gold'
                              : 'text-foreground hover:text-primary'
                        )}
                        style={{ minHeight: '44px' }}
                      >
                        <NavLabelWithNewTag
                          name={item.name === 'FAQ' ? item.name : item.name.toLowerCase()}
                          showNewTag={item.showNewTag}
                          tagClassName="rounded-[4px] px-1.5 py-0.5 text-[10px]"
                        />
                      </Link>
                    )}
                  </motion.div>
                ))}
              </nav>
            </div>

            <div
              className="shrink-0 border-t border-border/20 bg-background px-4 py-3 md:hidden"
              style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            >
              <div className="flex h-10 items-center space-x-3">
                {user && (
                  <Link href="/admin/overview" onClick={handleLinkClick}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 border border-[#e2e8f0] px-4 hover:border-[#cbd5e1] hover:bg-muted/50 dark:border-[#2e2e2e] dark:hover:border-[#404040] transition-all duration-200"
                    >
                      <User className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Link href={reportHref} onClick={handleLinkClick} className="flex-1">
                  <Button
                    size="sm"
                    className="group h-10 w-full bg-primary text-sm font-semibold uppercase tracking-[0.5px] hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200"
                  >
                    SUBMIT REPORT
                    <ArrowRight className="ml-2 h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
};

export default MobileMenuOverlay;
