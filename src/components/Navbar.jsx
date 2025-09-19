
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

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

const Navbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { theme } = useTheme();

  const navItems = [
    { name: 'THE COMPANY', dropdown: true, items: [
        { name: 'About Us', path: '/about-us'},
        { name: 'How We Secure Your Data', path: '/how-we-secure-your-data' }
    ]},
    { name: 'NEWS', path: '/news' },
    { name: 'TRACK', path: '/track' },
    { name: 'PLACE A BOUNTY', path: '/place-bounty' },
    { name: 'FAQ', path: '/faq' }
  ];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const logoLight = "https://storage.googleapis.com/hostinger-horizons-assets-prod/7f090466-6ac5-4c98-9b96-8cfeb2ebf340/35d0622aeb226f9e365a63265e0667d1.png";
  const logoDark = "https://storage.googleapis.com/hostinger-horizons-assets-prod/7f090466-6ac5-4c98-9b96-8cfeb2ebf340/064fb39032844b545b5bc953f870bc69.png";
  
  const navRef = useRef(null);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      ref={navRef}
      className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
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
                <Button variant="outline">Dashboard</Button>
              </Link>
            )}
            <Link to="/submit-report">
              <Button className="uppercase tracking-[1px] px-6 bg-primary hover:bg-[#e96601]">
                Report Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                 if(item.dropdown) {
                     return (
                         <div key={item.name} className="px-3 py-2 text-base font-medium text-muted-foreground">
                             <p className="mb-2">{item.name}</p>
                             <ul className="pl-4 border-l">
                                 {item.items.map(subItem => (
                                      <li key={subItem.name}>
                                          <Link to={subItem.path} className="block py-2 hover:text-primary hover:bg-accent transition-colors">
                                             {subItem.name}
                                          </Link>
                                      </li>
                                 ))}
                             </ul>
                         </div>
                     )
                 }
                 return item.external ? (
                    <a
                      key={item.name}
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      key={item.name}
                      to={item.path}
                      className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                    >
                      {item.name}
                    </Link>
                  )
              })}
              {user && (
                <Link to="/admin/overview" className="block px-3 py-2">
                  <Button variant="outline" className="w-full">Dashboard</Button>
                </Link>
              )}
              <Link to="/submit-report" className="block px-3 py-2">
                <Button className="w-full uppercase tracking-[1px] px-6 bg-primary hover:bg-[#e96601]">
                  Report Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
