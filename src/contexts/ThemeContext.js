/**
 * Theme Context - App Router Compatible
 * مدیریت تم (روشن/تیره) برای کل اپلیکیشن
 */

"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { themeConfig } from "@/config/theme.config";

const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
  colors: themeConfig.light,
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  // جلوگیری از hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // خواندن تم از localStorage هنگام بارگذاری
  useEffect(() => {
    if (!mounted) return;

    const savedTheme = localStorage.getItem("pm-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme) {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme("dark");
    }
  }, [mounted]);

  // اعمال تم به HTML و ذخیره در localStorage
  useEffect(() => {
    if (!mounted) return;

    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pm-theme", theme);

    // تغییر رنگ theme-color برای مرورگرهای موبایل
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        theme === "dark" ? "#0D4C57" : "#F5E6C8"
      );
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const colors = theme === "light" ? themeConfig.light : themeConfig.dark;

  const value = {
    theme,
    toggleTheme,
    colors,
    config: themeConfig,
  };

  // جلوگیری از flash در server-side rendering
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Custom Hook برای استفاده از Theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export default ThemeContext;
