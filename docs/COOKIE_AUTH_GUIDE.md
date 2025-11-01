# راهنمای کامل Authentication با httpOnly Cookie

راهنمای جامع برای پیاده‌سازی احراز هویت امن با httpOnly Cookies و CSRF Protection

## 📋 فهرست مطالب

- [مقدمه](#مقدمه)
- [چرا httpOnly Cookie؟](#چرا-httponly-cookie)
- [معماری](#معماری)
- [نحوه استفاده](#نحوه-استفاده)
- [API Routes](#api-routes)
- [Frontend Integration](#frontend-integration)
- [RBAC System](#rbac-system)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)

---

## مقدمه

سیستم احراز هویت PlusMeet از **httpOnly Cookies** برای ذخیره توکن‌ها استفاده می‌کند که امنیت بسیار بالاتری نسبت به `localStorage` دارد.

### ✅ مزایا

| ویژگی            | httpOnly Cookie  | localStorage (قدیم)    |
| ---------------- | ---------------- | ---------------------- |
| امنیت XSS        | ✅ ایمن          | ❌ آسیب‌پذیر           |
| امنیت CSRF       | ✅ با CSRF Token | ✅ ایمن                |
| دسترسی JS        | ❌ غیرممکن       | ✅ آسان                |
| ارسال خودکار     | ✅ با هر request | ❌ نیاز به header دستی |
| Production-Ready | ✅ Best Practice | ⚠️ نه برای Production  |

---

## چرا httpOnly Cookie؟

### 🔐 امنیت در برابر XSS

```javascript
// ❌ با localStorage - آسیب‌پذیر
const token = localStorage.getItem("accessToken");
// هر JavaScript inject شده می‌تونه توکن رو بدزده! 😱

// ✅ با httpOnly Cookie - ایمن
document.cookie; // توکن نمایش داده نمی‌شه! 🔒
```

### 🚫 محافظت از CSRF

```javascript
// CSRF Token در header
fetch("/api/user/profile", {
  method: "POST",
  headers: {
    "X-CSRF-Token": csrfToken,
  },
  credentials: "include", // ارسال cookies
});
```

---

## معماری

```
┌─────────────────────────────────────────┐
│           Frontend (Browser)            │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │    AuthContext (NewAuthContext)  │  │
│  │  - checkAuth()                   │  │
│  │  - loginWithOTP()                │  │
│  │  - loginWithPassword()           │  │
│  │  - logout()                      │  │
│  │  - fetchWithAuth() (auto-refresh)│  │
│  └──────────────────────────────────┘  │
│             │                           │
│             ↓                           │
│  ┌──────────────────────────────────┐  │
│  │    usePermission Hook            │  │
│  │  - can('permission')             │  │
│  │  - isAdmin                       │  │
│  │  - canAccessRoute()              │  │
│  └──────────────────────────────────┘  │
│             │                           │
│             ↓                           │
│  ┌──────────────────────────────────┐  │
│  │   ProtectedRoute Component       │  │
│  │  - requireAuth                   │  │
│  │  - requiredRoles                 │  │
│  │  - requiredPermissions           │  │
│  └──────────────────────────────────┘  │
│                                         │
└────────────┬────────────────────────────┘
             │
             │ Cookies: accessToken, refreshToken
             │ Headers: X-CSRF-Token
             ↓
┌─────────────────────────────────────────┐
│          Backend (Next.js API)          │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Authentication Middleware       │  │
│  │  - authenticate() → Cookie       │  │
│  │  - validateCSRFToken()           │  │
│  │  - optionalAuth()                │  │
│  └──────────────────────────────────┘  │
│             │                           │
│             ↓                           │
│  ┌──────────────────────────────────┐  │
│  │     API Routes                   │  │
│  │  /api/auth/verify-otp           │  │
│  │  /api/auth/login                │  │
│  │  /api/auth/refresh               │  │
│  │  /api/auth/logout                │  │
│  │  /api/user/profile               │  │
│  └──────────────────────────────────┘  │
│             │                           │
│             ↓                           │
│        MongoDB (User Model)             │
│                                         │
└─────────────────────────────────────────┘
```

---

## نحوه استفاده

### 1️⃣ Setup در Layout

```javascript
// src/app/layout.js
import { AuthProvider } from "@/contexts/NewAuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2️⃣ استفاده از `useAuth` Hook

```javascript
"use client";

import { useAuth } from "@/contexts/NewAuthContext";

export default function LoginPage() {
  const { loginWithOTP, sendOTP, isAuthenticated, user } = useAuth();

  const handleLogin = async () => {
    // ارسال OTP
    await sendOTP(phoneNumber);

    // تایید OTP
    const result = await loginWithOTP(phoneNumber, otp, role);

    if (result.success) {
      // Cookies خودکار set شدن! ✅
      router.push("/");
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>خوش آمدید {user.displayName}</p>
      ) : (
        <LoginForm onSubmit={handleLogin} />
      )}
    </div>
  );
}
```

### 3️⃣ استفاده از `usePermission` Hook

```javascript
import { usePermission } from "@/hooks/usePermission";

export default function UserManagementPage() {
  const { can, isAdmin, canAccessRoute } = usePermission();

  return (
    <div>
      {can("users.edit") && <button>ویرایش کاربر</button>}

      {isAdmin && <AdminPanel />}

      {canAccessRoute("/admin") && <Link href="/admin">پنل ادمین</Link>}
    </div>
  );
}
```

### 4️⃣ استفاده از `ProtectedRoute`

```javascript
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute
      requireAuth={true}
      requiredRoles={["admin"]}
      redirectTo="/admin/login"
    >
      {children}
    </ProtectedRoute>
  );
}
```

---

## API Routes

### 📍 Login با OTP

**POST** `/api/auth/verify-otp`

```javascript
// Request
{
  "phoneNumber": "09123456789",
  "code": "12345",
  "role": "event_owner" // optional
}

// Response + Cookies
Set-Cookie: accessToken=xxx; HttpOnly; Secure; SameSite=Lax; Max-Age=900
Set-Cookie: refreshToken=yyy; HttpOnly; Secure; SameSite=Lax; Max-Age=604800

{
  "success": true,
  "message": "ورود موفقیت‌آمیز",
  "data": {
    "user": { /* user object */ },
    "isNewUser": false
  }
}
```

### 📍 Login با Password

**POST** `/api/auth/login`

```javascript
// Request
{
  "phoneNumber": "09123456789",
  "password": "mypassword123"
}

// Response + Cookies (مشابه بالا)
```

### 📍 Refresh Token

**POST** `/api/auth/refresh`

```javascript
// Cookies خودکار ارسال می‌شن
// Request: cookies: refreshToken

// Response
{
  "success": true,
  "message": "توکن با موفقیت تمدید شد",
  "data": {
    "user": { /* updated user */ }
  }
}

// + New accessToken cookie
```

### 📍 Logout

**POST** `/api/auth/logout`

```javascript
// Request
// فقط credentials: "include"

// Response
Set-Cookie: accessToken=; Max-Age=0
Set-Cookie: refreshToken=; Max-Age=0

{
  "success": true,
  "message": "خروج موفقیت‌آمیز"
}
```

---

## Frontend Integration

### Auto-Refresh Token

`fetchWithAuth` خودکار توکن رو refresh می‌کنه:

```javascript
const { fetchWithAuth } = useAuth();

const response = await fetchWithAuth("/api/user/profile", {
  method: "PUT",
  body: JSON.stringify({ displayName: "علی محمدی" }),
});

// اگر accessToken منقضی شده باشه:
// 1. خودکار /api/auth/refresh صدا می‌زنه
// 2. accessToken جدید می‌گیره
// 3. درخواست اصلی رو دوباره ارسال می‌کنه
```

### CSRF Protection

```javascript
// CSRF Token خودکار set می‌شه
import { getCSRFToken } from "@/lib/utils/cookies";

const csrfToken = getCSRFToken();

// برای state-changing requests
fetchWithAuth("/api/user/profile", {
  method: "POST",
  // X-CSRF-Token خودکار اضافه می‌شه ✅
});
```

---

## RBAC System

### Permissions Config

```javascript
// src/lib/config/permissions.config.js

export const PERMISSIONS = {
  "users.view": ["admin"],
  "users.edit": ["admin"],
  "events.create": ["event_owner", "admin"],
  "profile.edit": ["user", "event_owner", "moderator", "admin"],
};

export const ROUTE_PERMISSIONS = {
  "/admin": ["admin"],
  "/profile": ["user", "event_owner", "moderator", "admin"],
  "/events/create": ["event_owner", "admin"],
};
```

### Permission Checking

```javascript
import { hasPermission, hasRouteAccess } from "@/lib/config/permissions.config";

// بررسی permission
if (hasPermission(user.roles, "users.edit")) {
  // نمایش دکمه ویرایش
}

// بررسی route
if (!hasRouteAccess(user.roles, "/admin")) {
  router.push("/403");
}
```

---

## Migration Guide

### مهاجرت از localStorage به Cookie

**قبل:**

```javascript
// ❌ قدیمی
import { useAuth } from "@/contexts/AuthContext";

const { accessToken } = useAuth();
fetch("/api/user/profile", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

**بعد:**

```javascript
// ✅ جدید
import { useAuth } from "@/contexts/NewAuthContext";

const { fetchWithAuth } = useAuth();
fetch("/api/user/profile", {
  credentials: "include", // cookies خودکار ارسال می‌شن
});
```

### تغییر در API Routes

```javascript
// قبل
const authHeader = request.headers.get("authorization");
const token = authHeader.substring(7);

// بعد
import { getCookieFromRequest } from "@/lib/utils/cookies";
const token = getCookieFromRequest(request, "accessToken");
```

---

## Best Practices

### ✅ DO's

1. **همیشه `credentials: 'include'` رو بزارید**

```javascript
fetch(url, { credentials: "include" });
```

2. **از `fetchWithAuth` استفاده کنید**

```javascript
const { fetchWithAuth } = useAuth();
await fetchWithAuth("/api/endpoint");
```

3. **Permission-based rendering**

```javascript
{
  can("users.edit") && <EditButton />;
}
```

4. **Protected Routes**

```javascript
<ProtectedRoute requiredRoles={["admin"]}>
  <AdminPanel />
</ProtectedRoute>
```

### ❌ DON'Ts

1. **توکن رو در localStorage ذخیره نکنید**

```javascript
// ❌ هرگز!
localStorage.setItem("accessToken", token);
```

2. **Cookies رو دستی set نکنید**

```javascript
// ❌ Backend خودکار set می‌کنه
document.cookie = `accessToken=${token}`;
```

3. **CSRF token رو ignore نکنید**

```javascript
// ✅ خودکار handle می‌شه با fetchWithAuth
```

---

## مثال‌های کامل

### صفحه Login

```javascript
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/NewAuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const { sendOTP, loginWithOTP } = useAuth();
  const router = useRouter();

  const handleSendOTP = async () => {
    const result = await sendOTP(phoneNumber);
    if (result.success) {
      setOtpSent(true);
    }
  };

  const handleVerifyOTP = async () => {
    const result = await loginWithOTP(phoneNumber, otp);
    if (result.success) {
      router.push("/");
    }
  };

  return (
    <div>
      {!otpSent ? (
        <form onSubmit={handleSendOTP}>
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <button>ارسال کد</button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP}>
          <input value={otp} onChange={(e) => setOtp(e.target.value)} />
          <button>تایید</button>
        </form>
      )}
    </div>
  );
}
```

### صفحه با RBAC

```javascript
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { usePermission } from "@/hooks/usePermission";

export default function UserManagementPage() {
  const { can, isAdmin } = usePermission();

  return (
    <ProtectedRoute requireAuth={true} requiredPermissions={["users.view"]}>
      <div>
        <h1>مدیریت کاربران</h1>

        {can("users.edit") && <button>ویرایش</button>}

        {can("users.delete") && <button>حذف</button>}

        {isAdmin && <button>تنظیمات پیشرفته</button>}
      </div>
    </ProtectedRoute>
  );
}
```

---

## لینک‌های مرتبط

- [API Configuration](./API_CONFIG.md)
- [Permissions Guide](./RBAC_GUIDE.md)
- [User System](./USER_SYSTEM.md)

---

**آخرین به‌روزرسانی:** 28 اکتبر 2025  
**نسخه:** 2.0.0 (Cookie-based)

