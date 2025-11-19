/**
 * Theme Manager Utility
 * مدیریت تم روشن/تاریک در سراسر اپلیکیشن
 */

export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
};

export const THEME_CLASS = 'dark-mode';

/**
 * دریافت تم فعلی از localStorage
 */
export const getTheme = () => {
  if (typeof window === 'undefined') return THEME.LIGHT;
  return localStorage.getItem('theme') || THEME.LIGHT;
};

/**
 * ذخیره تم در localStorage
 */
export const saveTheme = (theme) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('theme', theme);
};

/**
 * اعمال تم به document
 */
export const applyTheme = (theme) => {
  if (typeof window === 'undefined') return;
  
  const isDark = theme === THEME.DARK;
  
  // Set data-theme attribute for globals.css
  document.documentElement.setAttribute('data-theme', theme);
  
  // Set class for component-specific dark mode styles
  if (isDark) {
    document.documentElement.classList.add(THEME_CLASS);
    document.body.classList.add(THEME_CLASS);
  } else {
    document.documentElement.classList.remove(THEME_CLASS);
    document.body.classList.remove(THEME_CLASS);
  }
  
  console.log(`🎨 Theme applied: ${theme}`);
};

/**
 * تغییر تم
 */
export const toggleTheme = (currentTheme) => {
  const newTheme = currentTheme === THEME.DARK ? THEME.LIGHT : THEME.DARK;
  saveTheme(newTheme);
  applyTheme(newTheme);
  return newTheme;
};

/**
 * بارگذاری تم اولیه
 */
export const loadInitialTheme = () => {
  const savedTheme = getTheme();
  applyTheme(savedTheme);
  return savedTheme;
};

