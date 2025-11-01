# فونت‌های پروژه PlusMeet

این پوشه برای نگهداری فونت‌های محلی پروژه است.

## 📦 فونت‌های استفاده شده

### فارسی

#### Vazirmatn

- **استفاده**: متن عمومی، فرم‌ها، دکمه‌ها
- **وزن‌ها**: Light (300), Regular (400), Medium (500), SemiBold (600), Bold (700)
- **دانلود**: [GitHub - Vazirmatn](https://github.com/rastikerdar/vazirmatn)

#### Yekan / IRANYekan

- **استفاده**: عناوین، تیترها، لوگو
- **وزن‌ها**: Regular (400), Medium (500), Bold (700), ExtraBold (800)
- **دانلود**: [FontIran - Yekan](https://fontiran.com)

#### Shabnam (اختیاری)

- **استفاده**: کارت‌ها، بخش‌های معرفی
- **وزن‌ها**: Light (300), Regular (400), Medium (500), Bold (700)
- **دانلود**: [GitHub - Shabnam](https://github.com/rastikerdar/shabnam-font)

### انگلیسی

#### Inter

- **استفاده**: متن پایه، پاراگراف‌ها، لیست‌ها
- **وزن‌ها**: 300-800 (Variable Font)
- **منبع**: Google Fonts (از قبل بارگذاری شده)

#### Poppins

- **استفاده**: عناوین، دکمه‌ها، CTA
- **وزن‌ها**: 400, 500, 600, 700
- **منبع**: Google Fonts (از قبل بارگذاری شده)

#### Source Sans Pro (اختیاری)

- **استفاده**: فرم‌ها، برچسب‌ها، UI
- **وزن‌ها**: 400, 600, 700
- **منبع**: Google Fonts

---

## 🔧 نصب فونت‌های فارسی

### روش 1: دانلود مستقیم (توصیه می‌شود)

#### Vazirmatn

\`\`\`bash

# دانلود از GitHub

wget https://github.com/rastikerdar/vazirmatn/releases/download/v33.003/vazirmatn-v33.003-webfonts.zip
unzip vazirmatn-v33.003-webfonts.zip -d public/fonts/vazirmatn
\`\`\`

یا از لینک مستقیم: https://github.com/rastikerdar/vazirmatn/releases

#### Yekan

\`\`\`bash

# دانلود از FontIran

# از وب‌سایت دانلود کنید: https://fontiran.com

# فایل‌های WOFF2 را در public/fonts/yekan قرار دهید

\`\`\`

### روش 2: استفاده از CDN (سریع‌تر برای توسعه)

فونت‌ها از CDN بارگذاری می‌شوند (در فایل layout.js تنظیم شده).

---

## 📁 ساختار پیشنهادی

\`\`\`
public/fonts/
├── vazirmatn/
│ ├── Vazirmatn-Light.woff2
│ ├── Vazirmatn-Regular.woff2
│ ├── Vazirmatn-Medium.woff2
│ ├── Vazirmatn-SemiBold.woff2
│ └── Vazirmatn-Bold.woff2
│
├── yekan/
│ ├── IRANYekan-Regular.woff2
│ ├── IRANYekan-Medium.woff2
│ ├── IRANYekan-Bold.woff2
│ └── IRANYekan-ExtraBold.woff2
│
└── shabnam/ (اختیاری)
├── Shabnam-Light.woff2
├── Shabnam-Regular.woff2
└── Shabnam-Bold.woff2
\`\`\`

---

## 🎨 نحوه استفاده

### در CSS

\`\`\`css
/_ متن عمومی فارسی _/
body {
font-family: var(--font-primary-fa);
}

/_ عناوین فارسی _/
h1, h2, h3 {
font-family: var(--font-secondary-fa);
}

/_ متن انگلیسی _/
[lang="en"] {
font-family: var(--font-primary-en);
}
\`\`\`

### در JSX با Tailwind (آینده)

\`\`\`jsx

<div className="font-fa-primary">متن فارسی</div>
<div className="font-fa-secondary">عنوان فارسی</div>
<div className="font-en-primary">English Text</div>
\`\`\`

---

## ⚡️ بهینه‌سازی

- فقط وزن‌های مورد نیاز را استفاده کنید
- از فرمت WOFF2 استفاده کنید (بهترین فشرده‌سازی)
- از `font-display: swap` برای جلوگیری از FOIT استفاده کنید
- فونت‌ها را Preload کنید برای بارگذاری سریع‌تر

---

## 📝 لایسنس

- **Vazirmatn**: SIL Open Font License 1.1
- **Yekan**: رایگان برای استفاده شخصی و تجاری
- **Shabnam**: SIL Open Font License 1.1
- **Inter**: SIL Open Font License 1.1
- **Poppins**: SIL Open Font License 1.1

---

**نکته**: در حال حاضر فونت‌ها از CDN بارگذاری می‌شوند. برای Production، فونت‌های محلی را دانلود و اضافه کنید.



