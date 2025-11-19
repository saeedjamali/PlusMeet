# 🔒 محافظت از API Routes با RBAC دینامیک

این سند نحوه محافظت از API routes با استفاده از سیستم RBAC دینامیک را توضیح می‌دهد.

---

## 📋 خلاصه

در PlusMeet، تمام API routes محافظت می‌شوند با:

1. ✅ **احراز هویت (Authentication)**: بررسی توکن معتبر
2. ✅ **بررسی نقش (Role Check)**: چک کردن نقش‌های مجاز (اختیاری)
3. ✅ **بررسی مجوز (Permission Check)**: چک کردن دسترسی از دیتابیس (RBAC دینامیک)

**مزیت اصلی:** تغییرات مجوزات از پنل ادمین بدون تغییر کد یا restart اعمال می‌شوند!

---

## 🛡️ Middleware: `protectApi`

### Import

```javascript
import { protectApi } from "@/lib/middleware/apiProtection";
```

### Syntax

```javascript
const protection = await protectApi(request, options);
```

### Parameters

- **`request`** (required): شیء Next.js Request
- **`options`** (optional):
  - `allowedRoles`: آرایه نقش‌های مجاز (fallback اگر در دیتابیس نباشد)
  - `checkPermission`: بررسی مجوز از دیتابیس (پیش‌فرض: `true`)

### Return Value

```javascript
{
  success: boolean,
  user?: object,      // اگر موفق باشد
  error?: string,     // اگر ناموفق باشد
  status?: number     // HTTP status code
}
```

---

## 🎯 مثال‌های استفاده

### مثال 1: محافظت ساده (فقط Authentication)

```javascript
import { NextResponse } from "next/server";
import { protectApi } from "@/lib/middleware/apiProtection";

export async function GET(request) {
  // فقط بررسی احراز هویت (بدون چک مجوز)
  const protection = await protectApi(request, {
    checkPermission: false,
  });

  if (!protection.success) {
    return NextResponse.json(
      { error: protection.error },
      { status: protection.status }
    );
  }

  const user = protection.user;

  // کد اصلی API...
  return NextResponse.json({
    success: true,
    message: `سلام ${user.displayName}!`,
  });
}
```

---

### مثال 2: محافظت با نقش‌های خاص

```javascript
export async function POST(request) {
  // فقط admin و moderator می‌توانند دسترسی داشته باشند
  const protection = await protectApi(request, {
    allowedRoles: ["admin", "moderator"],
    checkPermission: false, // فقط بررسی نقش (بدون RBAC)
  });

  if (!protection.success) {
    return NextResponse.json(
      { error: protection.error },
      { status: protection.status }
    );
  }

  // کد اصلی...
  return NextResponse.json({ success: true });
}
```

---

### مثال 3: محافظت کامل با RBAC دینامیک (توصیه می‌شود) ⭐

```javascript
export async function PUT(request) {
  // بررسی کامل: احراز هویت + نقش + مجوز از دیتابیس
  const protection = await protectApi(request, {
    allowedRoles: ["admin", "moderator"], // fallback
    checkPermission: true, // ← بررسی مجوز از دیتابیس
  });

  if (!protection.success) {
    return NextResponse.json(
      { error: protection.error },
      { status: protection.status }
    );
  }

  const user = protection.user;

  // کد اصلی...
  return NextResponse.json({ success: true });
}
```

**نکته:** اگر در دیتابیس مجوز برای این endpoint تعریف نشده باشد، به `allowedRoles` رجوع می‌کند.

---

### مثال 4: محافظت با RBAC خالص (بدون fallback)

```javascript
export async function DELETE(request) {
  // فقط بررسی مجوز از دیتابیس (بدون fallback نقش)
  const protection = await protectApi(request, {
    checkPermission: true,
  });

  if (!protection.success) {
    return NextResponse.json(
      { error: protection.error },
      { status: protection.status }
    );
  }

  // کد اصلی...
  return NextResponse.json({ success: true });
}
```

---

## 🔄 نحوه کار `protectApi`

```
┌─────────────────────┐
│   API Request       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 1. احراز هویت      │
│ authenticate()      │
│                     │
│ بررسی accessToken   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. بررسی نقش (*)   │
│ requireRole()       │
│                     │
│ فقط اگر             │
│ allowedRoles        │
│ مشخص شده باشد       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. بررسی مجوز (*)  │
│ checkApiPermission()│
│                     │
│ فقط اگر             │
│ checkPermission:true│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Query در DB:       │
│                     │
│ 1. ApiEndpoint      │
│    (isPublic?)      │
│                     │
│ 2. Role.find()      │
│    (apiPermissions) │
│                     │
│ 3. hasApiAccess()   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ✅ موفق یا ❌ رد   │
└─────────────────────┘
```

---

## 🎨 تنظیم مجوزات از پنل ادمین

### گام 1: تعریف API Endpoint

1. به `/admin/rbac/seed` بروید
2. "🚀 اجرای Seed" را کلیک کنید (اگر هنوز seed نکردید)
3. یا به `/admin/rbac/apis` بروید و دستی اضافه کنید

### گام 2: ویرایش نقش

1. به `/admin/rbac/roles` بروید
2. نقش مورد نظر را انتخاب کنید (مثلاً `moderator`)
3. تب **"دسترسی API"** را باز کنید
4. endpoint مورد نظر را پیدا کنید (مثلاً `/api/admin/users`)
5. متدهای مجاز را انتخاب کنید:
   - ✅ GET
   - ✅ POST
   - ❌ PUT
   - ❌ DELETE
6. **ذخیره** کنید

### گام 3: تست

بدون restart سرور، تغییرات اعمال می‌شوند!

```bash
# با postman یا curl:
curl -X GET http://localhost:3000/api/admin/users \
  -H "Cookie: accessToken=MODERATOR_TOKEN"

# نتیجه: 200 OK ✅

curl -X DELETE http://localhost:3000/api/admin/users/123 \
  -H "Cookie: accessToken=MODERATOR_TOKEN"

# نتیجه: 403 Forbidden ❌
```

---

## 📊 مدیریت Endpoints عمومی (Public)

برخی endpoints نیاز به authentication ندارند:

### در Seed:

```javascript
{
  path: "/api/auth/send-otp",
  availableMethods: ["POST"],
  module: "auth",
  title: "ارسال OTP",
  isPublic: true,  // ← عمومی
  tags: ["auth", "public"],
}
```

### نحوه عملکرد:

```javascript
// در checkApiPermission:
if (endpoint && endpoint.isPublic) {
  return { success: true }; // ✅ اجازه دسترسی بدون احراز هویت
}
```

---

## 🔍 Debugging

### فعال کردن Logging

در `protectApi`:

```javascript
console.log(
  `🔍 Checking API permission: ${method} ${path} for user:`,
  user.phoneNumber
);
```

### لاگ‌های مفید:

```
🔍 Checking API permission: GET /api/admin/users for user: 09151208032
✅ API permission granted

🔍 Checking API permission: DELETE /api/admin/users/123 for user: 09XXXXXXXX
❌ API permission denied: Access denied
```

### چک کردن دسترسی‌ها

```bash
# در MongoDB Compass:
db.roles.find({ slug: "moderator" })

# چک کردن apiPermissions:
{
  "apiPermissions": [
    { "path": "/api/admin/users", "methods": ["GET"] },
    { "path": "/api/events", "methods": ["GET", "POST", "PUT", "DELETE"] }
  ]
}
```

---

## ⚠️ نکات امنیتی

### 1. Admin همیشه دسترسی کامل دارد

```javascript
// در checkApiPermission:
if (user.roles && user.roles.includes("admin")) {
  return { success: true }; // ✅ بدون بررسی بیشتر
}
```

### 2. Deny by Default

اگر endpoint در دیتابیس تعریف نشده:

```javascript
if (!endpoint) {
  console.warn(`⚠️ Endpoint not found in database: ${path}`);
  return { success: false, error: "Endpoint not configured" };
}
```

### 3. Fallback به allowedRoles

اگر `checkPermission: false` باشد یا endpoint در DB نباشد، به `allowedRoles` رجوع می‌کند:

```javascript
const protection = await protectApi(request, {
  allowedRoles: ["admin"], // ← فقط admin
  checkPermission: false,
});
```

---

## 🚀 Migration: آپدیت API Routes موجود

### قبل (استفاده از auth middleware قدیمی):

```javascript
import { authenticate, requireRole } from "@/lib/middleware/auth";

export async function GET(request) {
  const authResult = await authenticate(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const roleCheck = await requireRole(authResult.user, ["admin"]);
  if (!roleCheck.success) {
    return NextResponse.json({ error: roleCheck.error }, { status: 403 });
  }

  const user = authResult.user;
  // ...
}
```

### بعد (استفاده از protectApi):

```javascript
import { protectApi } from "@/lib/middleware/apiProtection";

export async function GET(request) {
  const protection = await protectApi(request, {
    allowedRoles: ["admin"],
    checkPermission: true, // ← RBAC دینامیک
  });

  if (!protection.success) {
    return NextResponse.json(
      { error: protection.error },
      { status: protection.status }
    );
  }

  const user = protection.user;
  // ...
}
```

**مزایا:**

- ✅ کد کمتر (3 خط به جای 10 خط)
- ✅ RBAC دینامیک از دیتابیس
- ✅ Logging خودکار
- ✅ Error handling بهتر

---

## 📚 منابع مرتبط

- [RBAC_GUIDE.md](./RBAC_GUIDE.md) - راهنمای کامل RBAC
- [MENU_PERMISSIONS.md](./MENU_PERMISSIONS.md) - مدیریت دسترسی منوها
- [DEFAULT_ROLES.md](./DEFAULT_ROLES.md) - نقش‌های پیش‌فرض و دسترسی‌ها
- [SEEDING.md](./SEEDING.md) - راهنمای Seed کردن داده‌ها

---

**تاریخ به‌روزرسانی:** 29 اکتبر 2025  
**نسخه:** 1.0.0





