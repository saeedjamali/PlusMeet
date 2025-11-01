# 🔐 راهنمای دیباگ Authentication

این راهنما برای رفع مشکلات مربوط به Authentication Context و Auth Provider است.

---

## ❌ خطای رایج: "useAuth باید داخل AuthProvider استفاده شود"

### علت:

این خطا زمانی رخ می‌دهد که:

1. Component خارج از `<AuthProvider>` سعی در استفاده از `useAuth()` دارد
2. `AuthContext` به درستی initialize نشده است
3. مشکل در Hydration بین Server و Client

---

## ✅ راه‌حل‌ها

### 1️⃣ بررسی Root Layout

مطمئن شوید که `AuthProvider` در `src/app/layout.js` وجود دارد:

```javascript
// src/app/layout.js
export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <ThemeProvider>
          <AuthProvider>
            {" "}
            {/* ✅ باید اینجا باشد */}
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2️⃣ استفاده صحیح از useAuth

همیشه `useAuth` را فقط در Client Components استفاده کنید:

```javascript
// ✅ درست
"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function MyComponent() {
  const { user, isAuthenticated } = useAuth();
  // ...
}
```

```javascript
// ❌ غلط - در Server Component
import { useAuth } from "@/contexts/AuthContext";

export default function MyComponent() {
  const { user } = useAuth(); // ❌ خطا!
  // ...
}
```

### 3️⃣ چک کردن Context Value

در `AuthContext.js` مطمئن شوید:

```javascript
// ✅ درست
const AuthContext = createContext(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth باید داخل AuthProvider استفاده شود");
  }
  return context;
}
```

### 4️⃣ استفاده از Loading State

در layout های nested، از `loading` state استفاده کنید:

```javascript
const { isAuthenticated, loading } = useAuth();

if (loading) {
  return <div>در حال بارگذاری...</div>;
}

if (!isAuthenticated) {
  router.push("/login");
  return null;
}
```

---

## 🧪 تست کردن Auth Context

### تست 1: بررسی Root Layout

```javascript
// در Developer Console (F12)
console.log(document.querySelector("body").children);
// باید AuthProvider را ببینید
```

### تست 2: بررسی localStorage

```javascript
// در Developer Console
console.log({
  accessToken: localStorage.getItem("accessToken"),
  user: JSON.parse(localStorage.getItem("user")),
  refreshToken: localStorage.getItem("refreshToken"),
});
```

### تست 3: بررسی Context Provider

```javascript
// در component خود
const { user, loading, isAuthenticated } = useAuth();

console.log({
  user,
  loading,
  isAuthenticated,
  hasToken: !!localStorage.getItem("accessToken"),
});
```

---

## 🔄 مراحل رفع مشکل

### مرحله 1: پاک کردن Cache

```bash
# پاک کردن cache Next.js
rm -rf .next

# نصب مجدد dependencies
npm install

# اجرای سرور
npm run dev
```

### مرحله 2: پاک کردن localStorage

```javascript
// در Developer Console (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### مرحله 3: بررسی Hydration

در `src/app/layout.js` مطمئن شوید `suppressHydrationWarning` فعال است:

```javascript
<html lang="fa" dir="rtl" suppressHydrationWarning>
```

### مرحله 4: Hard Refresh

- **Windows/Linux:** Ctrl + Shift + R
- **Mac:** Cmd + Shift + R
- یا از Developer Tools: Right Click → Empty Cache and Hard Reload

---

## 🐛 دیباگ پیشرفته

### فعال کردن Detailed Logging

در `src/contexts/AuthContext.js`:

```javascript
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🔐 AuthProvider: Initializing...");

    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("accessToken");

    console.log("🔐 Stored User:", storedUser);
    console.log("🔐 Stored Token:", storedToken ? "✅ Exists" : "❌ Missing");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedToken);
      console.log("🔐 User loaded from localStorage");
    } else {
      console.log("🔐 No stored user/token");
    }

    setLoading(false);
    console.log("🔐 AuthProvider: Ready");
  }, []);

  // ...
}
```

### بررسی Component Tree

در React DevTools:

1. باز کردن React DevTools (F12 → React)
2. جستجوی `AuthProvider`
3. بررسی Props و State
4. مطمئن شدن که children به درستی render شده‌اند

---

## 📋 چک‌لیست رفع مشکل

- [ ] `AuthProvider` در root layout موجود است
- [ ] Component شما `"use client"` دارد
- [ ] `useAuth()` در داخل component function صدا زده شده (نه در top-level)
- [ ] Cache مرورگر پاک شده
- [ ] localStorage پاک شده
- [ ] `.next` folder حذف و rebuild شده
- [ ] Hard refresh انجام شده
- [ ] Console errors بررسی شده

---

## 🔍 خطاهای مرتبط

### "Cannot read properties of undefined"

**علت:** Context value undefined است

**راه‌حل:**

```javascript
const AuthContext = createContext(undefined); // ✅ نه null
```

### "Rendered more hooks than during the previous render"

**علت:** استفاده شرطی از hooks

**راه‌حل:**

```javascript
// ❌ غلط
if (isAuthenticated) {
  const { user } = useAuth();
}

// ✅ درست
const { user, isAuthenticated } = useAuth();
if (isAuthenticated) {
  // استفاده از user
}
```

---

## 💡 نکات مهم

### نکته 1: "use client" directive

همیشه در ابتدای فایل قرار دهید:

```javascript
"use client"; // ✅ خط اول

import { useAuth } from "@/contexts/AuthContext";
```

### نکته 2: Async Initialization

localStorage فقط در client-side در دسترس است:

```javascript
useEffect(() => {
  // ✅ فقط در client اجرا می‌شود
  const token = localStorage.getItem("accessToken");
}, []);
```

### نکته 3: Nested Layouts

Layout های تو در تو باید منتظر initialization باشند:

```javascript
const { loading } = useAuth();

if (loading) {
  return <LoadingSpinner />;
}
```

---

## 📞 دریافت کمک

اگر همچنان مشکل دارید:

1. **Console Logs را بررسی کنید:**

   - Browser Console (F12)
   - Terminal logs

2. **اطلاعات زیر را جمع‌آوری کنید:**

   - پیام خطای کامل
   - Component Tree (React DevTools)
   - localStorage state
   - مسیر صفحه فعلی

3. **Issue ایجاد کنید** با تمام اطلاعات بالا

---

**آخرین به‌روزرسانی:** 2025-01-27


