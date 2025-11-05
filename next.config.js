/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // بهینه‌سازی فونت‌ها
  optimizeFonts: true,

  // تنظیمات سازگاری با مرورگرهای مختلف
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Headers برای امنیت و کش
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // بهینه‌سازی تصاویر
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

module.exports = nextConfig;




