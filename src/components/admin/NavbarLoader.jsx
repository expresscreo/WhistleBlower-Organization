'use client';

import React from 'react';
import { useNavigationProgressState, usePageLoading } from '@/contexts/NavigationProgressContext';

/**
 * Visual progress bar for the dashboard header. Mount once in the layout.
 */
export const NavbarProgress = () => {
  const { progress, visible, fading } = useNavigationProgressState();
  const className = [
    'navbar-loader',
    visible ? 'is-visible' : '',
    fading ? 'is-fading' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={className} aria-hidden="true">
      <div
        className="navbar-progress-orange"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
};

/**
 * Headless registrar — pages keep rendering this while they are loading.
 * The actual bar lives in the dashboard header.
 */
const NavbarLoader = () => {
  usePageLoading(true);
  return null;
};

export default NavbarLoader;
