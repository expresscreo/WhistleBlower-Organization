import React from 'react';
import NavbarLoader from './NavbarLoader';

/**
 * PageContentWrapper - Handles loading state for individual admin page content
 * This allows the layout (sidebar + topnav) to render immediately while 
 * the NavbarLoader shows at the navbar border during loading
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
          {/* Loading indication is handled by NavbarLoader */}
        </div>
      </>
    );
  }

  return children;
};

export default PageContentWrapper;

