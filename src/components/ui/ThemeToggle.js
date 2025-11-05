/**
 * Theme Toggle Component
 * کامپوننت تغییر تم (روشن/تیره)
 */

"use client";

import { useTheme } from "@/contexts/ThemeContext";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle({ variant = "default" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`${styles.toggle} ${styles[variant]}`}
      aria-label={theme === "light" ? "تغییر به تم تیره" : "تغییر به تم روشن"}
      title={theme === "light" ? "تغییر به تم تیره" : "تغییر به تم روشن"}
    >
      {theme === "light" ? (
        // Moon Icon (Dark Mode)
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        // Sun Icon (Light Mode)
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}
    </button>
  );
}



