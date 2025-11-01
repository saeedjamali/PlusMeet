/**
 * Theme Configuration
 * تنظیمات کامل تم برای PlusMeet
 *
 * این فایل شامل تمام رنگ‌ها، فونت‌ها و سایزهای پروژه است
 * برای تغییر تم کل پروژه فقط این فایل را ویرایش کنید
 */

export const themeConfig = {
  // ========================================
  // رنگ‌های تم روشن (Light Theme) - Cozy Harmony
  // ========================================
  light: {
    // رنگ‌های اصلی - Amber Gold
    primary: {
      main: "#F4A325", // Amber Gold - رنگ اصلی برند
      light: "#FFC15E", // Golden Glow
      dark: "#E2981E", // Amber Gold Dark
      contrast: "#ffffff", // متن روی رنگ اصلی
    },

    // رنگ‌های ثانویه - Ocean Mist
    secondary: {
      main: "#267D88", // Ocean Mist - دکمه‌های ثانویه
      light: "#3A9AA6", // Ocean Mist Light
      dark: "#1C5F67", // Ocean Mist Dark
      contrast: "#ffffff",
    },

    // رنگ مکمل - Deep Teal
    complement: {
      main: "#0D4C57", // Deep Teal - هدر و پس‌زمینه
      light: "#146572",
      dark: "#092E35",
      contrast: "#ffffff",
    },

    // رنگ برجسته - Golden Glow
    accent: {
      main: "#FFC15E", // Golden Glow - آیکون‌ها و هایلایت
      light: "#FFD68F",
      dark: "#CC993C",
      contrast: "#18333C",
    },

    // رنگ‌های پس‌زمینه
    background: {
      default: "#F5E6C8", // Soft Cream - پس‌زمینه صفحات
      paper: "#FFFFFF", // Ivory White - کارت‌ها
      elevated: "#FFFFFF", // المان‌های شناور
      overlay: "rgba(13, 76, 87, 0.5)", // Deep Teal با شفافیت
    },

    // رنگ‌های متن
    text: {
      primary: "#18333C", // Shadow Blue - متن اصلی
      secondary: "#A39B8F", // Warm Gray - متن فرعی
      disabled: "#C5BDB3", // Warm Gray روشن‌تر
      hint: "#D4CFC7", // راهنما
    },

    // رنگ‌های مرز و جداکننده
    border: {
      light: "#E8DCC5", // Soft Cream تیره‌تر
      main: "#7B4F2A", // Clay Brown - خطوط اصلی
      dark: "#5E3D24", // Clay Brown تیره‌تر
    },

    // رنگ‌های وضعیت
    status: {
      success: "#2D8B57", // سبز هماهنگ با تم
      error: "#C44536", // قرمز گرم
      warning: "#F4A325", // Amber Gold
      info: "#267D88", // Ocean Mist
    },

    // رنگ‌های سایه
    shadow: {
      sm: "0 1px 2px 0 rgba(123, 79, 42, 0.08)",
      md: "0 4px 6px -1px rgba(123, 79, 42, 0.12)",
      lg: "0 10px 15px -3px rgba(123, 79, 42, 0.15)",
      xl: "0 20px 25px -5px rgba(123, 79, 42, 0.18)",
    },

    // گرادیان‌های پیشنهادی
    gradients: {
      sunset: "linear-gradient(90deg, #F4A325, #FFC15E)", // Sunset Glow
      ocean: "linear-gradient(90deg, #267D88, #0D4C57)", // Ocean Calm
      warmth: "linear-gradient(180deg, #F5E6C8, #F4A325)", // Warm Embrace
    },
  },

  // ========================================
  // رنگ‌های تم تیره (Dark Theme) - Cozy Harmony Dark
  // ========================================
  dark: {
    // رنگ‌های اصلی - Amber Gold Dark
    primary: {
      main: "#E2981E", // Amber Gold Dark - دکمه‌ها فعال
      light: "#F4A325", // Amber Gold
      dark: "#CC7A15", // تیره‌تر
      contrast: "#18333C",
    },

    // رنگ‌های ثانویه - Ocean Mist Dark
    secondary: {
      main: "#1C5F67", // Ocean Mist Dark - دکمه‌های ثانویه
      light: "#267D88", // Ocean Mist
      dark: "#154850",
      contrast: "#F5E6C8",
    },

    // رنگ مکمل - Deep Teal Dark
    complement: {
      main: "#092E35", // Deep Teal Dark - پس‌زمینه اصلی
      light: "#0D4C57",
      dark: "#051A1E",
      contrast: "#C8D5D8",
    },

    // رنگ برجسته - Golden Glow Dark
    accent: {
      main: "#CC993C", // Golden Glow Dark - هایلایت
      light: "#FFC15E",
      dark: "#B8812A",
      contrast: "#18333C",
    },

    // رنگ‌های پس‌زمینه
    background: {
      default: "#0D4C57", // Deep Teal - پس‌زمینه اصلی
      paper: "#1E4049", // Shadow Blue 85% - کارت‌ها
      elevated: "#2A5560", // سطح بالاتر
      overlay: "rgba(9, 46, 53, 0.85)", // Deep Teal Dark
    },

    // رنگ‌های متن
    text: {
      primary: "#FFFFFF", // Ivory White - متن اصلی
      secondary: "#C8C0B5", // Warm Gray Light - متن فرعی
      disabled: "#8C8578", // Warm Gray Dark
      hint: "#7A7267", // کم‌رنگ‌تر
    },

    // رنگ‌های مرز و جداکننده
    border: {
      light: "rgba(123, 79, 42, 0.15)", // Clay Brown نیمه‌شفاف
      main: "rgba(123, 79, 42, 0.3)", // Clay Brown 30%
      dark: "#5E3D24", // Clay Brown Dark
    },

    // تاکید و آیکون
    emphasis: {
      main: "#F5E6C8", // Soft Cream - آیکون‌های ملایم
      highlight: "#1E5A62", // Ocean Mist 20% - ناحیه برجسته
    },

    // رنگ‌های وضعیت
    status: {
      success: "#3DA672", // سبز روشن‌تر
      error: "#E5644F", // قرمز گرم
      warning: "#E2981E", // Amber Gold Dark
      info: "#1C5F67", // Ocean Mist Dark
    },

    // رنگ‌های سایه
    shadow: {
      sm: "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.5)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.6)",
      xl: "0 20px 25px -5px rgba(0, 0, 0, 0.7)",
    },

    // گرادیان‌های پیشنهادی
    gradients: {
      nightEmber: "linear-gradient(90deg, #F4A325, #7B4F2A)", // Night Ember
      deepOcean: "linear-gradient(90deg, #0D4C57, #267D88)", // Deep Ocean
      softGlow: "linear-gradient(180deg, #1E4049, #18333C)", // Soft Glow
    },
  },

  // ========================================
  // تنظیمات فونت (Typography)
  // ========================================
  typography: {
    // فونت‌های فارسی
    fonts: {
      fa: {
        primary: "Vazirmatn, Tahoma, Arial, sans-serif", // متن عمومی
        secondary: "Yekan, IRANYekan, Tahoma, sans-serif", // عناوین و تیترها
        tertiary: "Shabnam, Vazirmatn, sans-serif", // کارت‌ها و بخش‌های دوستانه
        mono: "Vazirmatn, Courier New, monospace", // کدها
      },
      en: {
        primary:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', // متن پایه
        secondary: "Poppins, -apple-system, sans-serif", // عناوین و دکمه‌ها
        tertiary: "Source Sans Pro, system-ui, sans-serif", // فرم‌ها و UI
        mono: "Fira Code, Consolas, Monaco, monospace", // کدها
      },
    },

    // اندازه فونت‌ها
    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
      "5xl": "3rem", // 48px
    },

    // وزن فونت
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },

    // فاصله خطوط
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },

    // فاصله حروف
    letterSpacing: {
      tight: "-0.05em",
      normal: "0",
      wide: "0.05em",
    },
  },

  // ========================================
  // فاصله‌گذاری و اندازه‌ها
  // ========================================
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
    "3xl": "4rem", // 64px
  },

  // ========================================
  // گوشه‌های گرد (Border Radius)
  // ========================================
  borderRadius: {
    none: "0",
    sm: "0.25rem", // 4px
    md: "0.5rem", // 8px
    lg: "0.75rem", // 12px
    xl: "1rem", // 16px
    full: "9999px", // دایره کامل
  },

  // ========================================
  // نقاط شکست (Breakpoints) - Responsive
  // ========================================
  breakpoints: {
    xs: "320px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  // ========================================
  // انیمیشن و Transition
  // ========================================
  transition: {
    fast: "150ms",
    base: "200ms",
    slow: "300ms",
    slower: "500ms",
  },

  // ========================================
  // Z-Index
  // ========================================
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

export default themeConfig;
