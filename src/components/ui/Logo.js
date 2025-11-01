/**
 * Logo Component - Smart Logo with Theme Support
 * کامپوننت لوگو هوشمند با پشتیبانی از تم
 */

"use client";

import { useTheme } from "@/contexts/ThemeContext";
import Image from "next/image";
import Link from "next/link";

/**
 * Logo Component
 * @param {Object} props
 * @param {'horizontal'|'vertical'|'icon'} props.type - نوع لوگو
 * @param {string} props.className - CSS class اضافی
 * @param {string} props.href - لینک (اگر نیاز باشه)
 * @param {number} props.width - عرض (اختیاری)
 * @param {number} props.height - ارتفاع (اختیاری)
 * @param {string} props.alt - متن جایگزین
 * @param {boolean} props.priority - Priority loading برای Next.js Image
 */
export default function Logo({
  type = "horizontal",
  className = "",
  href = null,
  width,
  height,
  alt = "PlusMeet",
  priority = false,
  ...props
}) {
  const { theme } = useTheme();

  // تعیین مسیر آیکن بر اساس theme و type
  const getLogoPath = () => {
    const mode = theme === "dark" ? "dark-mode" : "light-mode";
    
    switch (type) {
      case "horizontal":
        return theme === "dark" 
          ? "/icons/dark-mode/Horizontal/logo-09-01.svg"
          : "/icons/light-mode/Horizontal/logo-06-01.svg";
          
      case "vertical":
        return theme === "dark" 
          ? "/icons/dark-mode/Vertical/logo-08-01.svg"
          : "/icons/light-mode/Verical/logo-07-01.svg";
          
      case "icon":
        return theme === "dark" 
          ? "/icons/dark-mode/icon/favicon.svg"
          : "/icons/light-mode/icon/icon-10-01.svg";
          
      default:
        return "/icons/light-mode/Horizontal/logo-06-01.svg";
    }
  };

  // تعیین ابعاد پیش‌فرض بر اساس نوع لوگو
  const getDefaultDimensions = () => {
    switch (type) {
      case "horizontal":
        return { width: width || 140, height: height || 40 };
      case "vertical":
        return { width: width || 80, height: height || 100 };
      case "icon":
        return { width: width || 40, height: height || 40 };
      default:
        return { width: width || 140, height: height || 40 };
    }
  };

  const { width: defaultWidth, height: defaultHeight } = getDefaultDimensions();
  const logoPath = getLogoPath();

  // کامپوننت Image
  const LogoImage = (
    <Image
      src={logoPath}
      alt={alt}
      width={defaultWidth}
      height={defaultHeight}
      priority={priority}
      className={className}
      style={{
        maxWidth: "100%",
        height: "auto",
      }}
      {...props}
    />
  );

  // اگر href داده شده باشد، لوگو رو در Link قرار بده
  if (href) {
    return (
      <Link href={href} className="logo-link">
        {LogoImage}
      </Link>
    );
  }

  return LogoImage;
}

/**
 * مثال‌های استفاده:
 * 
 * // لوگو افقی با لینک به صفحه اصلی
 * <Logo type="horizontal" href="/" />
 * 
 * // لوگو عمودی در سایدبار
 * <Logo type="vertical" width={60} height={80} />
 * 
 * // آیکن کوچک
 * <Logo type="icon" width={32} height={32} />
 * 
 * // لوگو با کلاس سفارشی
 * <Logo type="horizontal" className="my-custom-logo" />
 */

