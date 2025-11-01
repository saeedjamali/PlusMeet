# راهنمای کامل سیستم تم PlusMeet

## 📚 فهرست

1. [مقدمه](#مقدمه)
2. [نحوه کار سیستم تم](#نحوه-کار-سیستم-تم)
3. [استفاده از رنگ‌ها](#استفاده-از-رنگها)
4. [استفاده از فونت‌ها](#استفاده-از-فونتها)
5. [سفارشی‌سازی تم](#سفارشیسازی-تم)
6. [Best Practices](#best-practices)

---

## 🎯 مقدمه

سیستم تم PlusMeet طراحی شده تا:

- تغییر آسان بین تم روشن و تیره
- سفارشی‌سازی سریع رنگ‌ها و فونت‌ها
- ثبات در طراحی کل پروژه
- دسترسی آسان به مقادیر طراحی

## 🔧 نحوه کار سیستم تم

### 1. Theme Configuration

فایل \`src/config/theme.config.js\` شامل تمام تنظیمات است:

\`\`\`javascript
export const themeConfig = {
light: {
primary: { main: '#6366f1', ... },
background: { default: '#ffffff', ... },
text: { primary: '#111827', ... },
// ...
},
dark: {
// تنظیمات تم تیره
}
};
\`\`\`

### 2. Theme Context

\`ThemeContext\` مدیریت state تم را بر عهده دارد:

\`\`\`javascript
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
const { theme, toggleTheme, colors } = useTheme();

// theme → 'light' or 'dark'
// toggleTheme → تابع تغییر تم
// colors → آبجکت رنگ‌های فعلی
}
\`\`\`

### 3. CSS Variables

رنگ‌ها به‌صورت CSS Variables در دسترس هستند:

\`\`\`css
.my-element {
color: var(--color-text-primary);
background: var(--color-bg-paper);
}
\`\`\`

این متغیرها به‌صورت خودکار با تغییر تم، آپدیت می‌شوند.

---

## 🎨 استفاده از رنگ‌ها

### دسته‌بندی رنگ‌ها

#### 1. Primary Colors (رنگ‌های اصلی)

\`\`\`javascript
colors.primary.main // رنگ اصلی برند (#6366f1)
colors.primary.light // نسخه روشن‌تر
colors.primary.dark // نسخه تیره‌تر
colors.primary.contrast // رنگ متن روی primary
\`\`\`

**زمان استفاده:**

- دکمه‌های اصلی (CTA)
- لینک‌ها
- المان‌های مهم

#### 2. Secondary Colors

\`\`\`javascript
colors.secondary.main // رنگ ثانویه (#ec4899)
\`\`\`

**زمان استفاده:**

- دکمه‌های ثانویه
- Accent ها
- نشانگرها

#### 3. Background Colors

\`\`\`javascript
colors.background.default // پس‌زمینه اصلی صفحه
colors.background.paper // پس‌زمینه کارت‌ها و سطوح
colors.background.elevated // المان‌های شناور (Dropdown, Modal)
colors.background.overlay // پس‌زمینه مودال‌ها
\`\`\`

#### 4. Text Colors

\`\`\`javascript
colors.text.primary // متن اصلی (تیره‌ترین)
colors.text.secondary // متن ثانویه (کمی کم‌رنگ‌تر)
colors.text.disabled // متن غیرفعال
colors.text.hint // متن راهنما (کم‌رنگ‌ترین)
\`\`\`

#### 5. Status Colors

\`\`\`javascript
colors.status.success // موفقیت (سبز)
colors.status.error // خطا (قرمز)
colors.status.warning // هشدار (نارنجی)
colors.status.info // اطلاعات (آبی)
\`\`\`

### مثال استفاده در کامپوننت

#### روش 1: استفاده از Hook

\`\`\`jsx
import { useTheme } from '@/contexts/ThemeContext';

function Card() {
const { colors } = useTheme();

return (
<div style={{
      background: colors.background.paper,
      color: colors.text.primary,
      border: \`1px solid \${colors.border.main}\`
    }}>
محتوای کارت
</div>
);
}
\`\`\`

#### روش 2: استفاده از CSS Variables

\`\`\`css
/_ Card.module.css _/
.card {
background: var(--color-bg-paper);
color: var(--color-text-primary);
border: 1px solid var(--color-border-main);
box-shadow: var(--shadow-md);
}
\`\`\`

---

## 🔤 استفاده از فونت‌ها

### Font Families

\`\`\`javascript
typography.fonts.fa.primary // فونت اصلی فارسی
typography.fonts.en.primary // فونت اصلی انگلیسی
\`\`\`

### Font Sizes

\`\`\`javascript
typography.fontSize.xs // 12px
typography.fontSize.sm // 14px
typography.fontSize.base // 16px
typography.fontSize.lg // 18px
typography.fontSize.xl // 20px
typography.fontSize['2xl'] // 24px
typography.fontSize['3xl'] // 30px
typography.fontSize['4xl'] // 36px
typography.fontSize['5xl'] // 48px
\`\`\`

یا از CSS Variables:

\`\`\`css
.title {
font-size: var(--font-size-2xl);
font-weight: 700;
}

.body {
font-size: var(--font-size-base);
}
\`\`\`

### Font Weights

\`\`\`javascript
typography.fontWeight.light // 300
typography.fontWeight.normal // 400
typography.fontWeight.medium // 500
typography.fontWeight.semibold // 600
typography.fontWeight.bold // 700
typography.fontWeight.extrabold // 800
\`\`\`

---

## ⚙️ سفارشی‌سازی تم

### تغییر رنگ برند

برای تغییر رنگ اصلی پروژه، فایل \`src/config/theme.config.js\` را ویرایش کنید:

\`\`\`javascript
export const themeConfig = {
light: {
primary: {
main: '#FF6B6B', // رنگ جدید شما
light: '#FF8E8E',
dark: '#CC5555',
contrast: '#ffffff',
}
}
};
\`\`\`

### اضافه کردن رنگ جدید

\`\`\`javascript
export const themeConfig = {
light: {
// رنگ‌های موجود...

    // رنگ جدید
    accent: {
      main: '#FFC107',
      light: '#FFD54F',
      dark: '#FFA000',
    }

}
};
\`\`\`

سپس در کامپوننت استفاده کنید:

\`\`\`jsx
const { colors } = useTheme();

<div style={{ color: colors.accent.main }}>...</div>
\`\`\`

### تغییر فونت

فونت خود را در \`public/fonts/\` قرار دهید و در \`theme.config.js\` معرفی کنید:

\`\`\`javascript
typography: {
fonts: {
fa: {
primary: 'MyCustomFont, Tahoma, sans-serif',
}
}
}
\`\`\`

---

## 📏 Spacing & Sizing

### Spacing Scale

\`\`\`javascript
spacing.xs // 4px
spacing.sm // 8px
spacing.md // 16px
spacing.lg // 24px
spacing.xl // 32px
spacing['2xl'] // 48px
spacing['3xl'] // 64px
\`\`\`

استفاده:

\`\`\`css
.container {
padding: var(--spacing-lg);
margin-bottom: var(--spacing-xl);
}
\`\`\`

### Border Radius

\`\`\`javascript
borderRadius.sm // 4px
borderRadius.md // 8px
borderRadius.lg // 12px
borderRadius.xl // 16px
borderRadius.full // 9999px (دایره)
\`\`\`

---

## ✅ Best Practices

### ✅ انجام دهید

1. **همیشه از Theme استفاده کنید**
   \`\`\`jsx
   // ✅ خوب
   <div style={{ color: colors.text.primary }}>

   // ❌ بد
   <div style={{ color: '#111827' }}>
   \`\`\`

2. **رنگ‌های Semantic استفاده کنید**
   \`\`\`jsx
   // ✅ خوب - معنا دارد
   <span style={{ color: colors.status.success }}>موفق</span>

   // ❌ بد - معنا ندارد
   <span style={{ color: colors.primary.main }}>موفق</span>
   \`\`\`

3. **از CSS Variables در CSS Modules استفاده کنید**
   \`\`\`css
   /_ ✅ خوب _/
   .button {
   background: var(--color-primary);
   }

   /_ ❌ بد _/
   .button {
   background: #6366f1;
   }
   \`\`\`

### ❌ انجام ندهید

1. **مقادیر Hardcoded ننویسید**
2. **رنگ‌های جدید به‌صورت inline تعریف نکنید**
3. **از !important استفاده نکنید (مگر ضروری باشد)**

---

## 🎨 مثال کامل: ساخت دکمه

\`\`\`jsx
// components/common/Button.jsx
import { useTheme } from '@/contexts/ThemeContext';
import styles from './Button.module.css';

export default function Button({
children,
variant = 'primary',
size = 'md',
...props
}) {
const { colors, config } = useTheme();

return (
<button
className={\`\${styles.button} \${styles[variant]} \${styles[size]}\`}
{...props} >
{children}
</button>
);
}
\`\`\`

\`\`\`css
/_ Button.module.css _/
.button {
font-family: inherit;
font-weight: 600;
border: none;
border-radius: var(--radius-lg);
cursor: pointer;
transition: all var(--transition-base);
}

.primary {
background: var(--color-primary);
color: var(--color-primary-contrast);
}

.primary:hover {
background: var(--color-primary-dark);
}

.secondary {
background: var(--color-bg-paper);
color: var(--color-text-primary);
border: 2px solid var(--color-border-main);
}

.md {
padding: var(--spacing-md) var(--spacing-xl);
font-size: var(--font-size-base);
}

.lg {
padding: var(--spacing-lg) var(--spacing-2xl);
font-size: var(--font-size-lg);
}
\`\`\`

---

این راهنما به‌صورت مداوم با پیشرفت پروژه به‌روز می‌شود.


