# 🎨 سیستم تم PlusMeet

## 📖 نمای کلی

PlusMeet از یک سیستم تم پیشرفته با پشتیبانی از **تم روشن** و **تم تیره** استفاده می‌کند. تغییر تم به صورت Real-time و بدون نیاز به Reload صفحه انجام می‌شود.

---

## 🎯 کامپوننت ThemeToggle

### مسیر

```
src/components/ui/ThemeToggle.js
```

### استفاده

```jsx
import ThemeToggle from "@/components/ui/ThemeToggle";

// پیش‌فرض
<ThemeToggle />

// Floating (گوشه صفحه)
<ThemeToggle variant="floating" />

// Small
<ThemeToggle variant="small" />

// Large
<ThemeToggle variant="large" />

// Inline (بدون پس‌زمینه)
<ThemeToggle variant="inline" />
```

### Variants

| Variant    | اندازه  | محل استفاده            | موقعیت       |
| ---------- | ------- | ---------------------- | ------------ |
| `default`  | 44×44px | Navbar, Header         | Inline       |
| `floating` | 56×56px | صفحات Login، صفحه اصلی | Fixed (گوشه) |
| `small`    | 36×36px | Sidebar (ادمین)        | Inline       |
| `large`    | 52×52px | Settings               | Inline       |
| `inline`   | Auto    | منوها                  | Inline       |

### آیکون‌ها

#### تم روشن (Light)

```jsx
// نمایش آیکون ماه (برای تغییر به تیره)
<svg>
  <path d="M20.354 15.354A9 9 0 018.646 3.646..." />
</svg>
```

#### تم تیره (Dark)

```jsx
// نمایش آیکون خورشید (برای تغییر به روشن)
<svg>
  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3..." />
</svg>
```

---

## 🎨 ThemeContext

### مسیر

```
src/contexts/ThemeContext.js
```

### State Management

```javascript
const ThemeContext = createContext({
  theme: "light", // 'light' | 'dark'
  toggleTheme: () => {},
  colors: {}, // رنگ‌های فعلی تم
  config: {}, // تنظیمات تم
});
```

### استفاده در کامپوننت‌ها

```jsx
import { useTheme } from "@/contexts/ThemeContext";

function MyComponent() {
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <div>
      <p>تم فعلی: {theme}</p>
      <button onClick={toggleTheme}>تغییر تم</button>
      <div style={{ color: colors.primary }}>متن با رنگ primary</div>
    </div>
  );
}
```

### Methods

#### `toggleTheme()`

تغییر تم بین روشن و تیره

```javascript
toggleTheme(); // light → dark یا dark → light
```

#### `setTheme(theme)`

تنظیم مستقیم تم

```javascript
setTheme("dark"); // تم تیره
setTheme("light"); // تم روشن
```

---

## 🎨 CSS Variables

### تم روشن (Light)

```css
:root {
  /* Primary Colors */
  --color-primary: #f4a325;
  --color-accent: #ffc15e;
  --color-secondary: #267d88;

  /* Background */
  --color-bg-default: #f5e6c8;
  --color-bg-secondary: #ffffff;
  --color-bg-paper: #ffffff;

  /* Text */
  --color-text-primary: #18333c;
  --color-text-secondary: #a39b8f;
  --color-text-tertiary: #c5bdb3;

  /* Border */
  --color-border: #e8dcc5;

  /* Status */
  --color-success: #2d8b57;
  --color-error: #c44536;
  --color-warning: #f4a325;
  --color-info: #267d88;

  /* Shadows */
  --shadow-lg: 0 10px 15px -3px rgba(123, 79, 42, 0.15);
}
```

### تم تیره (Dark)

```css
[data-theme="dark"] {
  /* Primary Colors */
  --color-primary: #e2981e;
  --color-accent: #cc993c;
  --color-secondary: #1c5f67;

  /* Background */
  --color-bg-default: #0d4c57;
  --color-bg-secondary: #1e4049;
  --color-bg-paper: #1e4049;

  /* Text */
  --color-text-primary: #ffffff;
  --color-text-secondary: #c8c0b5;
  --color-text-tertiary: #8c8578;

  /* Border */
  --color-border: rgba(123, 79, 42, 0.3);

  /* Status */
  --color-success: #3da672;
  --color-error: #e5644f;
  --color-warning: #e2981e;
  --color-info: #1c5f67;

  /* Shadows */
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.6);
}
```

---

## 🔧 پیاده‌سازی در صفحات

### 1. صفحه اصلی (`/`)

```jsx
<ThemeToggle variant="floating" />
```

**موقعیت**: گوشه پایین سمت چپ (Fixed)

### 2. صفحه لاگین کاربران (`/login`)

```jsx
<ThemeToggle variant="floating" />
```

**موقعیت**: گوشه پایین سمت چپ (Fixed)

### 3. صفحه لاگین ادمین (`/admin/login`)

```jsx
<ThemeToggle variant="floating" />
```

**موقعیت**: گوشه پایین سمت چپ (Fixed)

### 4. پنل مدیریت (`/admin/*`)

```jsx
<ThemeToggle variant="small" />
```

**موقعیت**: Sidebar Footer (قبل از پروفایل کاربر)

---

## 🎨 انیمیشن‌ها

### Hover Effect

```css
.toggle:hover {
  background: var(--color-primary);
  color: white;
  transform: rotate(20deg) scale(1.1);
}
```

### Icon Rotation

```css
.toggle:hover .icon {
  transform: rotate(20deg);
}
```

### Active State

```css
.toggle:active {
  transform: rotate(20deg) scale(0.95);
}
```

---

## 💾 ذخیره‌سازی تم

تم انتخاب شده در `localStorage` ذخیره می‌شود:

```javascript
// ذخیره
localStorage.setItem("theme", "dark");

// خواندن
const savedTheme = localStorage.getItem("theme");

// حذف
localStorage.removeItem("theme");
```

### Initial Load

```javascript
// در ThemeContext
useEffect(() => {
  const savedTheme = localStorage.getItem("theme") || "light";
  setTheme(savedTheme);
  document.documentElement.setAttribute("data-theme", savedTheme);
}, []);
```

---

## 🎯 بهترین روش‌ها (Best Practices)

### 1. استفاده از CSS Variables

✅ **درست**

```css
.myComponent {
  background: var(--color-bg-default);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}
```

❌ **نادرست**

```css
.myComponent {
  background: #f5e6c8; /* Hard-coded */
  color: #18333c;
}
```

### 2. Dynamic Styling

✅ **درست**

```jsx
const { colors } = useTheme();

<div
  style={{
    background: colors.primary,
    color: colors.textPrimary,
  }}
>
  Content
</div>;
```

### 3. Conditional Rendering

```jsx
const { theme } = useTheme();

{
  theme === "dark" && <DarkModeOnlyFeature />;
}
{
  theme === "light" && <LightModeOnlyFeature />;
}
```

---

## 🌈 تغییر پالت رنگی

### افزودن رنگ جدید

1. **افزودن به `globals.css`**

```css
:root {
  --color-my-new-color: #123456;
}

[data-theme="dark"] {
  --color-my-new-color: #654321;
}
```

2. **افزودن به `theme.config.js`**

```javascript
export const lightTheme = {
  colors: {
    // ...existing colors
    myNewColor: "#123456",
  },
};

export const darkTheme = {
  colors: {
    // ...existing colors
    myNewColor: "#654321",
  },
};
```

3. **استفاده**

```css
.myElement {
  color: var(--color-my-new-color);
}
```

---

## 🐛 Troubleshooting

### تم تغییر نمی‌کند

```bash
# 1. Clear cache
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# 2. Check localStorage
console.log(localStorage.getItem('theme'));

# 3. Check data-theme attribute
console.log(document.documentElement.getAttribute('data-theme'));
```

### رنگ‌ها درست نمایش داده نمی‌شوند

```css
/* بررسی کنید که از CSS Variables استفاده کرده‌اید */
✅ color: var(--color-text-primary)
❌ color: #18333C
```

### دکمه ThemeToggle کار نمی‌کند

```jsx
// مطمئن شوید ThemeProvider در layout.js وجود دارد
<ThemeProvider>{children}</ThemeProvider>
```

---

## 📊 Accessibility

### ARIA Labels

```jsx
<button
  aria-label={theme === 'light' ? 'تغییر به تم تیره' : 'تغییر به تم روشن'}
  title={theme === 'light' ? 'تغییر به تم تیره' : 'تغییر به تم روشن'}
>
```

### Keyboard Navigation

```css
.toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .toggle,
  .icon {
    transition: none;
    animation: none;
  }
}
```

---

## 🚀 توسعه آینده

- [ ] **Auto Theme**: تشخیص خودکار بر اساس system preference
- [ ] **Custom Themes**: امکان ساخت تم سفارشی
- [ ] **Theme Scheduler**: تنظیم تم بر اساس ساعت
- [ ] **High Contrast Mode**: حالت کنتراست بالا
- [ ] **Color Blindness Modes**: حالت‌های مخصوص رنگ‌کوری

---

**تاریخ آخرین به‌روزرسانی:** 27 اکتبر 2025



