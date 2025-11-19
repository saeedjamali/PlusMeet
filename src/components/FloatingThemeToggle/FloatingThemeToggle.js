'use client';

import { useState, useEffect } from 'react';
import { loadInitialTheme, toggleTheme as toggleThemeUtil } from '@/lib/utils/themeManager';
import styles from './FloatingThemeToggle.module.css';

export default function FloatingThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initialTheme = loadInitialTheme();
    setDarkMode(initialTheme === 'dark');
  }, []);

  const handleToggle = () => {
    const currentTheme = darkMode ? 'dark' : 'light';
    const newTheme = toggleThemeUtil(currentTheme);
    setDarkMode(newTheme === 'dark');
  };

  if (!mounted) return null;

  return (
    <button
      className={styles.floatingThemeBtn}
      onClick={handleToggle}
      title={darkMode ? 'حالت روشن' : 'حالت تاریک'}
      aria-label="تغییر تم"
    >
      <span className={styles.icon}>
        {darkMode ? '☀️' : '🌙'}
      </span>
    </button>
  );
}

