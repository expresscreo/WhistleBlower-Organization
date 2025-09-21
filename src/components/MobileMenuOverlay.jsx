import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMobileMenu } from '@/contexts/MobileMenuContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const MobileMenuOverlay = ({ navItems }) => {
  const { isMobileMenuOpen, closeMobileMenu } = useMobileMenu();
  const [expandedItems, setExpandedItems] = useState({});
  const { user } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();

  const logoLight = "https://storage.googleapis.com/hostinger-horizons-assets-prod/7f090466-6ac5-4c98-9b96-8cfeb2ebf340/35d0622aeb226f9e365a63265e0667d1.png";
  const logoDark = "https://storage.googleapis.com/hostinger-horizons-assets-prod/7f090466-6ac5-4c98-9b96-8cfeb2ebf340/064fb39032844b545b5bc953f870bc69.png";

  const toggleExpanded = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const handleLinkClick = () => {
    closeMobileMenu();
    setExpandedItems({});
  };

  const overlayVariants = {
    hidden: { 
      opacity: 0
    },
    visible: { 
      opacity: 1
    },
    exit: { 
      opacity: 0
    }
  };

  const contentVariants = {
    hidden: { 
      opacity: 0
    },
    visible: { 
      opacity: 1
    }
  };

  const menuItemVariants = {
    hidden: { 
      opacity: 0
    },
    visible: { 
      opacity: 1
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isMobileMenuOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="md:hidden fixed inset-0 z-20 mobile-menu-bg"
          style={{ height: '100dvh' }}
        >
          {/* Logo header - left aligned like navbar */}
          <motion.div
            variants={contentVariants}
            className="flex items-center h-[80px] px-4 sm:px-6 lg:px-8 border-b border-border/20"
          >
            <Link to="/" onClick={handleLinkClick} className="flex-shrink-0">
              <img 
                src={theme === 'light' ? logoLight : logoDark}
                alt="WhistleBlower.ng Logo" 
                style={{ width: '220.38px', height: '32px' }}
              />
            </Link>
          </motion.div>

          {/* Navigation Items - Scrollable with proper height */}
          <motion.div 
            variants={contentVariants}
            className="px-6 pt-8 pb-6 overflow-y-auto"
            style={{ height: 'calc(100dvh - 80px - 80px)' }}
          >
            <nav className="space-y-4">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  variants={menuItemVariants}
                  custom={index}
                  className="space-y-2"
                >
                  {item.dropdown ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleExpanded(item.name)}
                        className="w-full flex items-center justify-between py-2 group"
                        aria-expanded={expandedItems[item.name]}
                      >
                        <span className="text-[36px] leading-[40px] font-semibold text-foreground group-hover:text-primary transition-colors duration-200 capitalize">
                          {item.name === 'FAQ' ? item.name : item.name.toLowerCase()}
                        </span>
                        <motion.div 
                          className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200"
                          animate={{ 
                            rotate: expandedItems[item.name] ? 180 : 0 
                          }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
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
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="pl-6 space-y-2 border-l-2 border-primary/20"
                          >
                            {item.items.map((subItem) => (
                              <Link
                                key={subItem.name}
                                to={subItem.path}
                                onClick={handleLinkClick}
                                className={cn(
                                  "block py-1 text-lg font-medium transition-colors duration-200",
                                  location.pathname === subItem.path 
                                    ? "text-primary" 
                                    : "text-muted-foreground hover:text-foreground"
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
                      to={item.path}
                      onClick={handleLinkClick}
                        className={cn(
                          "block py-2 text-[36px] leading-[40px] font-semibold transition-colors duration-200 capitalize",
                          location.pathname === item.path 
                            ? "text-primary" 
                            : "text-foreground hover:text-primary"
                        )}
                      style={{ minHeight: '44px' }}
                    >
                      {item.name === 'FAQ' ? item.name : item.name.toLowerCase()}
                    </Link>
                  )}
                </motion.div>
              ))}
            </nav>
          </motion.div>

          {/* Action Buttons - Fixed at absolute bottom */}
          <motion.div
            variants={contentVariants}
            className="absolute bottom-0 left-0 right-0 z-30 px-6 pb-safe bg-background shadow-2xl"
            style={{ height: '80px' }}
          >
            <div className="flex items-center space-x-3 h-full">
              {user && (
                <Link to="/admin/overview" onClick={handleLinkClick}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-10 px-4 border border-[#e2e8f0] dark:border-[#2e2e2e] hover:border-[#cbd5e1] dark:hover:border-[#404040] hover:bg-muted/50 transition-all duration-200"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link to="/submit-report" onClick={handleLinkClick} className="flex-1">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button 
                    size="sm"
                    className="w-full h-10 text-sm font-semibold uppercase tracking-[0.5px] bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200"
                  >
                    Submit Report
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenuOverlay;
