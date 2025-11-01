/**
 * Root Layout
 * لی‌اوت اصلی اپلیکیشن - App Router
 */

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/NewAuthContext";
import "@/styles/globals.css";
import { Inter, Poppins } from "next/font/google";

// بارگذاری فونت‌های انگلیسی
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

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
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* فونت‌های فارسی از CDN */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/shabnam-font@v5.0.1/dist/font-face.css"
        />
      </head>
      <body className={`${inter.variable} ${poppins.variable}`}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
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
