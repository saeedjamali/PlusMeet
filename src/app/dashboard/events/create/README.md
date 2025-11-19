# 🎨 Event Create Pages - Dark Mode Support

این صفحات از سیستم تم دوگانه (روشن/تیره) پشتیبانی می‌کنند.

## 📁 فایل‌های مرتبط

- `eventCreate.module.css` - استایل‌های اصلی (Light Mode)
- `eventCreateDark.css` - استایل‌های Dark Mode (Global CSS، بدون Module)
- `page.js` - صفحه اصلی که هر دو فایل CSS را import می‌کند

## 🌓 نحوه کار تم‌ها

سیستم از CSS Variables و `data-theme` attribute استفاده می‌کند:

### Light Mode (پیش‌فرض):
```css
:root {
  --color-bg-default: #F5E6C8;
  --color-text-primary: #18333C;
  --color-primary: #F4A325;
  /* ... */
}
```

### Dark Mode:
```css
[data-theme='dark'] {
  --color-bg-default: #0D4C57;
  --color-text-primary: #FFFFFF;
  --color-primary: #E2981E;
  /* ... */
}
```

## 🎯 کامپوننت‌های پوشش داده شده

### ✅ مرحله 1: اطلاعات عمومی
- Category cards
- Image upload area
- Input fields
- Buttons

### ✅ مرحله 2: نوع برگزاری
- Format mode selection
- Location inputs
- Map picker
- Province/City selector

### ✅ مرحله 3: نحوه شرکت
- Participation type cards
- Ticket fields
- Discount codes
- Date picker

### ✅ مرحله 4: زمان برگزاری
- Radio cards
- Days of week selector
- Date inputs
- Duration options

### ✅ مرحله 5: نمایش و دسترسی
- Visibility cards
- Eligibility cards
- Target audience options
- Checkbox cards

### ✅ مرحله 6: سایر دسته‌بندی‌ها
- Multiple category sections
- Category description boxes
- Selection state

### ✅ مرحله 7: پیش‌نمایش
- Preview sections
- Info boxes
- Image thumbnails
- Category badges

## 🔧 نحوه تغییر تم

تم از طریق JavaScript تغییر می‌کند:

```javascript
// تغییر به تم تیره
document.documentElement.setAttribute('data-theme', 'dark');

// تغییر به تم روشن
document.documentElement.removeAttribute('data-theme');
// یا
document.documentElement.setAttribute('data-theme', 'light');
```

## 🎨 رنگ‌های کلیدی

### Light Theme (Cozy Harmony):
- Primary: `#F4A325` (نارنجی/زرد)
- Background: `#F5E6C8` (کرم)
- Text: `#18333C` (تیره)
- Border: `#E8DCC5` (بژ)

### Dark Theme (Cozy Harmony Dark):
- Primary: `#E2981E` (نارنجی کمرنگ‌تر)
- Background: `#0D4C57` (سبز-آبی تیره)
- Text: `#FFFFFF` (سفید)
- Border: `rgba(123, 79, 42, 0.3)` (قهوه‌ای شفاف)

## 🐛 رفع مشکلات رایج

### مشکل: دکمه‌ها در تم تیره دیده نمی‌شوند
**راه‌حل**: مطمئن شوید `darkModeSupport.css` import شده است.

### مشکل: متن‌ها در تم تیره دیده نمی‌شوند
**راه‌حل**: در CSS Modules نمی‌توانید به راحتی با `[data-theme]` کار کنید. بهترین راه حل استفاده از یک فایل CSS جداگانه است:

```
✅ راه حل نهایی (پیاده شده):
├── eventCreate.module.css   ← Light Mode styles
├── eventCreateDark.css       ← Dark Mode styles (Global CSS)
└── page.js                   ← imports both
```

**در `page.js`:**
```javascript
import styles from "./eventCreate.module.css";  // CSS Module
import "./eventCreateDark.css";                  // Global CSS
```

**در `eventCreateDark.css`:**
```css
/* ✅ استفاده از attribute selector برای match با hashed classes */
[data-theme='dark'] [class*='eventCreate_title'] {
    color: var(--color-text-primary) !important;
}

[data-theme='dark'] [class*='eventCreate_subtitle'] {
    color: var(--color-text-secondary) !important;
}
```

**مثال واقعی:**
```html
<!-- HTML تولید شده توسط Next.js -->
<h1 class="eventCreate_title__a1b2c3">عنوان</h1>

<!-- CSS Selector ما (با [class*=]) این را match می‌کند -->
```

**توضیح**: 
- CSS Modules کلاس‌ها را به `componentName_className__randomHash` تبدیل می‌کند
- مثلاً: `eventCreate_title__a1b2c3`
- نمی‌توان در CSS Modules از `:global([data-theme='dark'])` استفاده کرد
- **راه حل**: استفاده از `[class*='eventCreate_']` برای match با هر hash
- استفاده از `!important` برای override کردن styles اصلی

### مشکل: رنگ‌ها در تم تیره نادرست هستند
**راه‌حل**: از CSS variables استفاده کنید نه مقادیر hardcoded:
```css
/* ❌ Bad */
color: #111827;

/* ✅ Good */
color: var(--color-text-primary);
```

### مشکل: برخی المان‌ها contrast کافی ندارند
**راه‌حل**: از متغیرهای درست استفاده کنید:
- برای متن اصلی: `--color-text-primary`
- برای متن ثانویه: `--color-text-secondary`
- برای background: `--color-bg-default`, `--color-bg-secondary`, `--color-bg-elevated`

## 📝 نکات مهم

1. **همیشه از CSS Variables استفاده کنید** نه hardcoded colors
2. **Fallback values** را با دقت انتخاب کنید
3. **Contrast ratio** را در هر دو تم بررسی کنید
4. **Hover states** باید در هر دو تم قابل مشاهده باشند
5. **Focus states** برای accessibility ضروری است

## 🧪 تست

برای تست تم تیره:
1. در DevTools Console اجرا کنید:
   ```javascript
   document.documentElement.setAttribute('data-theme', 'dark');
   ```
2. همه مراحل را بررسی کنید
3. Hover، Focus، و Selected states را چک کنید
4. Contrast و readability را بررسی کنید

## 📚 منابع

- `src/styles/globals.css` - CSS Variables اصلی
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

