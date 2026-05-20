'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Function to get theme based on time of day
const getTimeBasedTheme = () => {
  const hour = new Date().getHours();
  // Dark mode from 7 PM to 6 AM (19:00 to 06:00)
  return hour >= 19 || hour < 6 ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    const savedTheme = localStorage.getItem('theme');
    const savedMode = localStorage.getItem('themeMode');

    if (savedMode === 'manual' && savedTheme) {
      return savedTheme;
    }

    return getTimeBasedTheme();
  });

  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') return 'auto';
    return localStorage.getItem('themeMode') || 'auto';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  // Auto-update theme based on time when in auto mode
  useEffect(() => {
    if (themeMode === 'auto') {
      const updateThemeBasedOnTime = () => {
        const timeBasedTheme = getTimeBasedTheme();
        setTheme(timeBasedTheme);
      };

      // Update immediately
      updateThemeBasedOnTime();

      // Set up interval to check every minute
      const interval = setInterval(updateThemeBasedOnTime, 60000);

      return () => clearInterval(interval);
    }
  }, [themeMode]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    setThemeMode('manual');
  };

  const setAutoMode = () => {
    setThemeMode('auto');
    setTheme(getTimeBasedTheme());
  };

  const setLightMode = () => {
    setThemeMode('manual');
    setTheme('light');
  };

  const setDarkMode = () => {
    setThemeMode('manual');
    setTheme('dark');
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      themeMode, 
      toggleTheme, 
      setAutoMode, 
      setLightMode, 
      setDarkMode 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};