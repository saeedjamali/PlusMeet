# 🎨 آیکون‌های PlusMeet

این پوشه برای نگهداری آیکون‌های PWA (Progressive Web App) است.

## 📋 آیکون‌های مورد نیاز

برای عملکرد کامل PWA، نیاز به آیکون‌های زیر دارید:

### 1. آیکون اصلی

- **icon-192x192.png**: آیکون 192×192 پیکسل
- **icon-512x512.png**: آیکون 512×512 پیکسل

### 2. Favicon

- **favicon.ico**: 32×32 یا 16×16
- **favicon.svg**: فرمت SVG (اختیاری)

---

## 🎨 راهنمای طراحی

### طراحی لوگو

لوگوی PlusMeet شامل:

- **متن**: PM (مخفف PlusMeet)
- **رنگ اصلی**: `#F4A325` (Amber Gold)
- **رنگ ثانویه**: `#FFC15E` (Golden Glow)
- **پس‌زمینه**: gradient یا رنگ ثابت
- **فونت**: Bold, Sans-serif

### نکات طراحی

1. **ساده و خواناً**: آیکون باید در اندازه‌های کوچک هم خوانا باشد
2. **Padding**: 10-15% فاصله از لبه‌ها
3. **رنگ‌بندی**: از پالت رنگی Cozy Harmony استفاده کنید
4. **Safe Area**: برای آیکون‌های maskable، 20% از لبه‌ها safe area است

---

## 🛠️ ابزارهای پیشنهادی

### آنلاین

- [Favicon Generator](https://realfavicongenerator.net/)
- [PWA Icon Generator](https://tools.crawlink.com/tools/pwa-icon-generator/)
- [Canva](https://www.canva.com/) - برای طراحی

### دسکتاپ

- Adobe Illustrator
- Figma
- Inkscape (رایگان)
- GIMP (رایگان)

---

## 📝 مثال طراحی ساده

### با CSS/HTML

می‌توانید از ابزارهای آنلاین برای تبدیل SVG به PNG استفاده کنید:

```svg
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background Gradient -->
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F4A325" />
      <stop offset="100%" style="stop-color:#FFC15E" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="80" fill="url(#bg)" />

  <!-- PM Text -->
  <text x="256" y="320"
        font-family="Arial, sans-serif"
        font-size="200"
        font-weight="bold"
        fill="white"
        text-anchor="middle">PM</text>
</svg>
```

### استفاده از ابزار CLI

```bash
# نصب ImageMagick
# Windows: choco install imagemagick
# Mac: brew install imagemagick
# Linux: sudo apt install imagemagick

# تبدیل SVG به PNG
convert icon.svg -resize 192x192 icon-192x192.png
convert icon.svg -resize 512x512 icon-512x512.png
```

---

## 🚀 نصب سریع (Placeholder)

اگر فعلاً نمی‌خواهید آیکون طراحی کنید، می‌توانید از یک آیکون ساده موقت استفاده کنید:

1. از [Placeholder.com](https://placeholder.com/) آیکون بگیرید:

   - https://via.placeholder.com/192/F4A325/FFFFFF?text=PM
   - https://via.placeholder.com/512/F4A325/FFFFFF?text=PM

2. یا از [UI Avatars](https://ui-avatars.com/):
   - https://ui-avatars.com/api/?name=PM&size=192&background=F4A325&color=fff&bold=true
   - https://ui-avatars.com/api/?name=PM&size=512&background=F4A325&color=fff&bold=true

---

## ✅ چک‌لیست

- [ ] icon-192x192.png ساخته شد
- [ ] icon-512x512.png ساخته شد
- [ ] favicon.ico ساخته شد
- [ ] آیکون‌ها در manifest.json تنظیم شدند
- [ ] آیکون‌ها در مرورگرها تست شدند

---

**نکته:** بعد از اضافه کردن آیکون‌ها، حتماً cache مرورگر را پاک کنید و PWA را دوباره نصب کنید.



