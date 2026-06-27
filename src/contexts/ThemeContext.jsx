import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [variant, setVariant] = useState(() => {
    return localStorage.getItem('theme-variant') || 'midnight';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all variant classes
    const variants = ['midnight', 'ocean', 'forest', 'purple', 'slate'];
    variants.forEach(v => root.classList.remove(`theme-${v}`));

    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.add(`theme-${variant}`);
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    
    localStorage.setItem('theme', theme);
    localStorage.setItem('theme-variant', variant);
  }, [theme, variant]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const changeVariant = (newVariant) => {
    setVariant(newVariant);
    if (theme === 'light') setTheme('dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, variant, toggleTheme, changeVariant }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
