import { usePathname } from 'next/navigation';
import Link from 'next/link';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useMobileMenu } from '@/contexts/MobileMenuContext';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import AnimatedHamburger from '@/components/AnimatedHamburger';
import MobileMenuOverlay from '@/components/MobileMenuOverlay';

const NavItem = ({ name, path, isActive, isExternal = false }) => {
    return isExternal ? (
        <a
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            className="relative px-1 py-2 text-xs font-medium tracking-[2px] uppercase transition-colors text-foreground/80 hover:text-primary"
        >
            {name}
        </a>
    ) : (
        <Link href={path}
            data-path={path}
            className={cn(
                "relative flex items-center h-full px-1 text-xs font-medium tracking-[2px] uppercase transition-colors",
                isActive ? "text-primary" : "text-foreground/80 hover:text-primary"
            )}
        >
            {name}
            {isActive && (
                <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
                    layoutId="underline"
                    transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.7 }}
                />
            )}
        </Link>
    );
};

const DropdownNavItem = ({ name, items }) => {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const closeTimerRef = useRef(null);
    const isParentActive = items.some(item => pathname === item.path || pathname.startsWith(item.path + '/'));
    const clearCloseTimer = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };
    const openDropdown = () => {
        clearCloseTimer();
        setIsOpen(true);
    };
    const closeDropdownWithDelay = () => {
        clearCloseTimer();
        closeTimerRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 180);
    };

    useEffect(() => {
        return () => clearCloseTimer();
    }, []);

    return (
        <div 
            className="relative h-full flex items-center"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdownWithDelay}
        >
            <button className={cn(
                "group relative flex items-center h-full gap-1 px-1 text-xs font-medium tracking-[2px] uppercase transition-colors",
                isParentActive ? "text-primary" : "text-foreground/80 hover:text-primary"
            )}>
                {name}
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "")} />
            </button>
            {isParentActive && (
                 <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
                    layoutId="underline"
                    transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.7 }}
                />
            )}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max bg-background border rounded-md shadow-lg"
                        onMouseEnter={openDropdown}
                        onMouseLeave={closeDropdownWithDelay}
                    >
                        <ul className="py-1">
                            {items.map(item => (
                                <li key={item.name}>
                                    <Link href={item.path}
                                        className="block px-4 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-primary whitespace-nowrap"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const NewsDropdownNavItem = ({ name, items }) => {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const closeTimerRef = useRef(null);
    const isParentActive = items.some(item => pathname === item.path || pathname.startsWith(item.path + '/'));
    const clearCloseTimer = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };
    const openDropdown = () => {
        clearCloseTimer();
        setIsOpen(true);
    };
    const closeDropdownWithDelay = () => {
        clearCloseTimer();
        closeTimerRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 180);
    };

    useEffect(() => {
        return () => clearCloseTimer();
    }, []);

    return (
        <div 
            className="relative h-full flex items-center"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdownWithDelay}
        >
            <button className={cn(
                "group relative flex items-center h-full gap-1 px-1 text-xs font-medium tracking-[2px] uppercase transition-colors",
                isParentActive ? "text-primary" : "text-foreground/80 hover:text-primary"
            )}>
                {name}
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "")} />
            </button>
            {isParentActive && (
                 <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
                    layoutId="underline"
                    transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.7 }}
                />
            )}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-1 w-80 mx-auto bg-background backdrop-blur-xl border border-border z-50"
                        style={{ borderRadius: 0 }}
                        onMouseEnter={openDropdown}
                        onMouseLeave={closeDropdownWithDelay}
                    >
                        <div className="p-6 space-y-6">
                            {items.map(item => (
                                <div key={item.name} className="group">
                                    <Link href={item.path}
                                        className="block"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors mb-1">
                                            {item.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors">
                                            {item.description}
                                        </p>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const CompanyDropdownNavItem = ({ name, items }) => {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const closeTimerRef = useRef(null);
    const isParentActive = items.some(item => pathname === item.path || pathname.startsWith(item.path + '/'));
    const clearCloseTimer = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };
    const openDropdown = () => {
        clearCloseTimer();
        setIsOpen(true);
    };
    const closeDropdownWithDelay = () => {
        clearCloseTimer();
        closeTimerRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 180);
    };

    useEffect(() => {
        return () => clearCloseTimer();
    }, []);

    return (
        <div 
            className="relative h-full flex items-center"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdownWithDelay}
        >
            <button className={cn(
                "group relative flex items-center h-full gap-1 px-1 text-xs font-medium tracking-[2px] uppercase transition-colors",
                isParentActive ? "text-primary" : "text-foreground/80 hover:text-primary"
            )}>
                {name}
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "")} />
            </button>
            {isParentActive && (
                 <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
                    layoutId="underline"
                    transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.7 }}
                />
            )}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-1 w-80 mx-auto bg-background backdrop-blur-xl border border-border z-50"
                        style={{ borderRadius: 0 }}
                        onMouseEnter={openDropdown}
                        onMouseLeave={closeDropdownWithDelay}
                    >
                        <div className="p-6 space-y-6">
                            {items.map(item => (
                                <div key={item.name} className="group">
                                    <Link href={item.path}
                                        className="block"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors mb-1">
                                            {item.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors">
                                            {item.description}
                                        </p>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Navbar = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { isMobileMenuOpen, toggleMobileMenu } = useMobileMenu();

  const navItems = [
    { name: 'TRACK', path: '/track' },
    { name: 'THE COMPANY', dropdown: true, isCompanyDropdown: true, items: [
        { name: 'About Us', path: '/about-us', description: 'Learn about our mission to protect whistleblowers and ensure transparency.' },
        { name: 'How We Secure Your Data', path: '/how-we-secure-your-data', description: 'Discover our advanced security measures and data protection protocols.' },
        { name: 'Rewards for Information', path: '/rewards-for-information', description: 'Learn about our cash reward system and how to claim rewards for valuable information.' }
    ]},
    { name: 'NEWS', dropdown: true, isNewsDropdown: true, items: [
        { name: 'All News', path: '/news', description: 'Stay informed with all the latest whistleblower news and updates.' },
        { name: 'Latest News', path: '/news/news', description: 'Get the most recent breaking news and investigative reports.' },
        { name: 'Active Bounties', path: '/news/bounty', description: 'View current bounties and opportunities to earn rewards.' },
        { name: 'Most Wanted', path: '/news/most_wanted', description: 'Discover high-priority cases seeking whistleblower information.' }
    ]},
    { name: 'PLACE A BOUNTY', path: '/place-bounty' },
    { name: 'FAQ', path: '/faq' }
  ];


  const logoLight = "/WBMedia/general/whistleblower-logo-light.png";
  const logoDark = "/WBMedia/general/whistleblower-logo-dark.png";
  
  const navRef = useRef(null);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      ref={navRef}
      className="sticky top-0 z-[9999] bg-background/80 backdrop-blur-md border-b border-border relative overflow-visible"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch h-16 w-full">
          <Link href="/" className="justify-self-start flex items-center min-w-0 max-w-[calc(100vw-5.5rem)]">
            <img 
              src={theme === 'light' ? logoLight : logoDark}
              alt="WhistleBlower.ng Logo" 
              className="max-h-7 w-auto max-w-full object-contain"
            />
          </Link>

          <div className="hidden md:flex col-start-2 justify-self-center items-stretch h-full">
            <div className="relative flex h-full items-center space-x-8">
              {navItems.map((item) => {
                  if (item.dropdown) {
                      if (item.isNewsDropdown) {
                          return <NewsDropdownNavItem key={item.name} name={item.name} items={item.items} />;
                      }
                      if (item.isCompanyDropdown) {
                          return <CompanyDropdownNavItem key={item.name} name={item.name} items={item.items} />;
                      }
                      return <DropdownNavItem key={item.name} name={item.name} items={item.items} />;
                  }
                  const isActive = pathname === item.path || (item.path === '/news' && pathname.startsWith('/news'));
                  return <NavItem key={item.name} name={item.name} path={item.path} isActive={isActive} isExternal={item.external} />;
              })}
            </div>
          </div>

          <div className="hidden md:flex col-start-3 justify-self-end items-center space-x-2 self-center">
            {user && (
              <Link href="/admin/overview">
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link href="/submit-report">
              <Button className="uppercase tracking-[1px] px-6 bg-primary hover:bg-[#e96601] group">
                REPORT NOW
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="md:hidden flex justify-self-end items-center col-start-3 self-center">
            <AnimatedHamburger 
              isOpen={isMobileMenuOpen} 
              onClick={toggleMobileMenu}
            />
          </div>
        </div>

        <MobileMenuOverlay navItems={navItems} />
      </div>
    </motion.nav>
  );
};

export default Navbar;



