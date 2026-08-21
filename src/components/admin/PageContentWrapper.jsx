import React from 'react';
import NavbarLoader from './NavbarLoader';

/**
 * PageContentWrapper - Handles loading state for individual admin page content
 * Layout (sidebar + topnav) stays visible while NavbarLoader registers
 * page loading with the header progress bar.
 */
const PageContentWrapper = ({ 
  loading, 
  children, 
  loadingText = "Loading...",
  className = ""
}) => {
  if (loading) {
    return (
      <>
        <NavbarLoader />
        <div className={`flex flex-col items-center justify-center min-h-[400px] space-y-4 ${className}`}>
          {/* Loading indication is handled by the header progress bar */}
        </div>
      </>
    );
  }

  return children;
};

export default PageContentWrapper;

