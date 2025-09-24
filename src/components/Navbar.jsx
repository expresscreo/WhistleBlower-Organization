
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
        <Link
            to={path}
            data-path={path}
            className={cn(
                "relative px-1 py-2 text-xs font-medium tracking-[2px] uppercase transition-colors",
                isActive ? "text-primary" : "text-foreground/80 hover:text-primary"
            )}
        >
            {name}
            {isActive && (
                <motion.div
                    className="absolute bottom-[-26px] left-0 right-0 h-[4px] bg-primary"
                    layoutId="underline"
                    transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.7 }}
                />
            )}
        </Link>
    );
};

const DropdownNavItem = ({ name, items }) => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const isParentActive = items.some(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'));

    return (
        <div 
            className="relative"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button className={cn(
                "group relative px-1 py-2 text-xs font-medium tracking-[2px] uppercase transition-colors flex items-center gap-1",
                isParentActive ? "text-primary" : "text-foreground/80 hover:text-primary"
            )}>
                {name}
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "")} />
            </button>
            {isParentActive && (
                 <motion.div
                    className="absolute bottom-[-26px] left-0 right-0 h-[4px] bg-primary"
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
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max bg-background border rounded-md shadow-lg"
                    >
                        <ul className="py-1">
                            {items.map(item => (
                                <li key={item.name}>
                                    <Link 
                                        to={item.path}
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
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const isParentActive = items.some(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'));

    return (
        <div 
            className="relative"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button className={cn(
                "group relative px-1 py-2 text-xs font-medium tracking-[2px] uppercase transition-colors flex items-center gap-1",
                isParentActive ? "text-primary" : "text-foreground/80 hover:text-primary"
            )}>
                {name}
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "")} />
            </button>
            {isParentActive && (
                 <motion.div
                    className="absolute bottom-[-26px] left-0 right-0 h-[4px] bg-primary"
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
                        className="absolute top-full left-0 right-0 mt-2 w-80 mx-auto bg-background backdrop-blur-xl border border-border z-50"
                        style={{ borderRadius: 0 }}
                    >
                        <div className="p-6 space-y-6">
                            {items.map(item => (
                                <div key={item.name} className="group">
                                    <Link 
                                        to={item.path}
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
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const isParentActive = items.some(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'));

    return (
        <div 
            className="relative"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button className={cn(
                "group relative px-1 py-2 text-xs font-medium tracking-[2px] uppercase transition-colors flex items-center gap-1",
                isParentActive ? "text-primary" : "text-foreground/80 hover:text-primary"
            )}>
                {name}
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "")} />
            </button>
            {isParentActive && (
                 <motion.div
                    className="absolute bottom-[-26px] left-0 right-0 h-[4px] bg-primary"
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
                        className="absolute top-full left-0 right-0 mt-2 w-80 mx-auto bg-background backdrop-blur-xl border border-border z-50"
                        style={{ borderRadius: 0 }}
                    >
                        <div className="p-6 space-y-6">
                            {items.map(item => (
                                <div key={item.name} className="group">
                                    <Link 
                                        to={item.path}
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
  const location = useLocation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { isMobileMenuOpen, toggleMobileMenu } = useMobileMenu();

  const navItems = [
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
    { name: 'TRACK', path: '/track' },
    { name: 'PLACE A BOUNTY', path: '/place-bounty' },
    { name: 'FAQ', path: '/faq' }
  ];


  const logoLight = "/WBMedia/general/WhistleBlower-Logo-Light.png";
  const logoDark = "/WBMedia/general/whistleblower-logo-dark.png";
  
  const navRef = useRef(null);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      ref={navRef}
      className="sticky top-0 z-[9999] bg-background/80 backdrop-blur-md border-b border-border"
    >
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[80px]">
          <Link to="/" className="flex-shrink-0">
            <img 
              src={theme === 'light' ? logoLight : logoDark}
              alt="WhistleBlower.ng Logo" 
              style={{ width: '220.38px', height: '32px' }}
            />
          </Link>

          <div className="hidden md:flex flex-grow justify-end items-center space-x-8">
            <div className="relative flex space-x-8">
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
                  const isActive = location.pathname === item.path || (item.path === '/news' && location.pathname.startsWith('/news'));
                  return <NavItem key={item.name} name={item.name} path={item.path} isActive={isActive} isExternal={item.external} />;
              })}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2 ml-8">
            {user && (
              <Link to="/admin/overview">
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link to="/submit-report">
              <Button className="uppercase tracking-[1px] px-6 bg-primary hover:bg-[#e96601]">
                Report Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="md:hidden flex items-center">
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



