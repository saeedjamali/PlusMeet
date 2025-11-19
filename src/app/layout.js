/**
 * Root Layout
 * لی‌اوت اصلی اپلیکیشن - App Router
 */

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/NewAuthContext";
import FloatingThemeToggle from "@/components/FloatingThemeToggle";
import "@/styles/fonts.css";
import "@/styles/globals.css";
import "@/styles/datepicker.css";

// فونت‌های فارسی از فایل‌های محلی بارگذاری می‌شوند
// IRANSansXFaNum با اعداد فارسی در fonts.css تعریف شده است

export const metadata = {
  title: "PlusMeet - با هم، بهتر",
  description:
    "پلتفرم هوشمند اشتراک‌گذاری رویدادها و همکاری - Smart Event Sharing & Collaboration Platform",
  keywords: [
    "رویداد",
    "event",
    "collaboration",
    "همکاری",
    "اجتماعی",
    "social",
    "PlusMeet",
  ],
  authors: [{ name: "PlusMeet Team" }],
  creator: "PlusMeet",
  publisher: "PlusMeet",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "/",
    title: "PlusMeet - با هم، بهتر",
    description: "پلتفرم هوشمند اشتراک‌گذاری رویدادها و همکاری",
    siteName: "PlusMeet",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlusMeet - با هم، بهتر",
    description: "پلتفرم هوشمند اشتراک‌گذاری رویدادها و همکاری",
  },
  icons: {
    icon: "/icons/light-mode/icon/icon-10-01.svg",
    shortcut: "/icons/light-mode/icon/icon-10-01.svg",
    apple: "/icons/light-mode/icon/icon-10-01.png",
    other: [
      {
        rel: "icon",
        type: "image/svg+xml",
        url: "/icons/light-mode/icon/icon-10-01.svg",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        url: "/icons/light-mode/icon/icon-10-01.png",
      },
    ],
  },
  manifest: "/manifest.json",
  themeColor: "#F4A325",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
            
            {/* دکمه شناور تغییر تم - فقط در موبایل */}
            <FloatingThemeToggle />
          </AuthProvider>
        </ThemeProvider>

        {/* Fallback for users with JavaScript disabled */}
        <noscript>
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              backgroundColor: "#fef2f2",
              color: "#991b1b",
            }}
          >
            برای استفاده از PlusMeet، لطفاً JavaScript را فعال کنید.
            <br />
            Please enable JavaScript to use PlusMeet.
          </div>
        </noscript>
      </body>
    </html>
  );
}












