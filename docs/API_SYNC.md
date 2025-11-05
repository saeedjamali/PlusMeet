# راهنمای همگام‌سازی خودکار API Endpoints

## 🎯 هدف

این ابزار به صورت **اتوماتیک** تمام API route های پروژه رو پیدا می‌کنه و به دیتابیس اضافه می‌کنه تا بتونی از UI پنل ادمین دسترسی‌ها رو مدیریت کنی.

---

## 🚀 روش‌های استفاده

### 1️⃣ از UI پنل ادمین (توصیه ✅)

```
http://localhost:3000/admin/sync-apis
```

1. وارد شو و روی **"شروع همگام‌سازی"** کلیک کن
2. منتظر بمون تا کامل بشه
3. لیست endpoint ها رو بررسی کن
4. برو به `/admin/rbac/roles` و دسترسی‌ها رو تنظیم کن

---

### 2️⃣ از Terminal (npm script)

```bash
npm run sync-apis
```

این اسکریپت:

- ✅ تمام فایل‌های `route.js` رو پیدا می‌کنه
- ✅ متدهای HTTP رو تشخیص میده
- ✅ به دیتابیس اضافه/آپدیت می‌کنه
- ✅ یه فایل JSON برای بررسی می‌سازه (`scripts/api-endpoints.json`)

---

### 3️⃣ از API مستقیم

```bash
curl -X POST http://localhost:3000/api/admin/sync-apis \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

---

## 📊 چه چیزی اسکن می‌کنه؟

### مسیر اسکن:

```
src/app/api/**/*.route.js
```

### متدهای HTTP شناسایی شده:

- `GET`
- `POST`
- `PUT`
- `PATCH`
- `DELETE`

### مثال:

```javascript
// src/app/api/admin/users/route.js
export async function GET(request) {
  // ✅ تشخیص داده می‌شه
}

export async function POST(request) {
  // ✅ تشخیص داده می‌شه
}
```

---

## 🔍 چطور کار می‌کنه؟

### مرحله 1: اسکن فایل‌ها

```javascript
// پیدا کردن تمام route.js ها
findRouteFiles("src/app/api");
```

### مرحله 2: استخراج اطلاعات

```javascript
{
  path: "/api/admin/users/:id/roles",
  availableMethods: ["PUT"],
  module: "admin",
  category: "users",
  title: "مدیریت نقش کاربر",
  defaultRoles: ["admin", "moderator"],
  isPublic: false,
  isActive: true
}
```

### مرحله 3: همگام‌سازی با دیتابیس

```javascript
// اگه وجود نداشت → اضافه می‌کنه
// اگه methods تغییر کرده → آپدیت می‌کنه
// اگه تغییری نکرده → skip می‌کنه
```

---

## 📝 تعیین خودکار `defaultRoles`

سیستم براساس مسیر API، `defaultRoles` رو خودکار تعیین می‌کنه:

| مسیر API            | Default Roles                                   |
| ------------------- | ----------------------------------------------- |
| `/api/auth/*`       | `[]` (عمومی)                                    |
| `/api/admin/rbac/*` | `["admin"]`                                     |
| `/api/admin/*`      | `["admin", "moderator"]`                        |
| `/api/user/*`       | `["user", "event_owner", "moderator", "admin"]` |
| سایر                | `["user"]`                                      |

### مثال:

```javascript
"/api/auth/login"           → defaultRoles: []
"/api/admin/users"          → defaultRoles: ["admin", "moderator"]
"/api/admin/rbac/roles"     → defaultRoles: ["admin"]
"/api/user/profile"         → defaultRoles: ["user", "event_owner", ...]
```

---

## 🎨 تعیین خودکار Module و Category

```javascript
"/api/admin/users"          → module: "admin", category: "users"
"/api/auth/login"           → module: "auth", category: "authentication"
"/api/user/profile"         → module: "user", category: "profile"
"/api/events/create"        → module: "events", category: "events"
```

---

## 🔄 Dynamic Routes

سیستم از dynamic routes پشتیبانی می‌کنه:

```
[id]         → :id
[slug]       → :slug
[...slug]    → :slug
```

### مثال:

```
src/app/api/admin/users/[id]/roles/route.js
↓
/api/admin/users/:id/roles
```

---

## 📋 نتیجه همگام‌سازی

```json
{
  "success": true,
  "message": "همگام‌سازی با موفقیت انجام شد",
  "stats": {
    "total": 25,
    "added": 3,
    "updated": 2,
    "skipped": 20
  },
  "endpoints": [
    {
      "path": "/api/admin/users/:id/roles",
      "methods": ["PUT"]
    },
    ...
  ]
}
```

---

## 💡 بهترین روش استفاده

### 1. بعد از اضافه کردن API جدید:

```bash
npm run sync-apis
```

### 2. دسترسی‌ها رو تنظیم کن:

```
/admin/rbac/roles → انتخاب نقش → API Permissions
```

### 3. تست کن:

```
/admin/debug-permissions
```

---

## 🔒 امنیت

### محدودیت‌های دسترسی:

- ✅ فقط **admin** می‌تونه sync کنه
- ✅ نیاز به authentication داره
- ✅ فقط به collection `ApiEndpoint` دسترسی داره
- ✅ نقش‌های موجود رو تغییر **نمی‌ده**

### توصیه‌های امنیتی:

1. ✅ همیشه قبل از sync، backup بگیر
2. ✅ بعد از sync، دسترسی‌ها رو بررسی کن
3. ✅ `defaultRoles` رو دستی چک کن
4. ✅ endpoint های حساس رو دستی تنظیم کن

---

## 🐛 عیب‌یابی

### API پیدا نشد؟

```bash
# چک کن که فایل route.js درست نام‌گذاری شده
src/app/api/your-api/route.js  ✅
src/app/api/your-api/api.js    ❌
```

### متد تشخیص نشد؟

```javascript
// ✅ درست:
export async function GET(request) {}
export function POST(request) {}

// ❌ اشتباه:
async function GET(request) {} // بدون export
const GET = async (request) => {}; // arrow function
```

### دسترسی 403؟

```bash
# مطمئن شو که admin هستی
/admin/debug-permissions
```

---

## 📊 خروجی اسکریپت Terminal

```bash
$ npm run sync-apis

==================================================
🚀 اسکریپت همگام‌سازی API Endpoints
==================================================

🔍 شروع اسکن API route ها...

📂 25 فایل route پیدا شد:

✅ /api/auth/send-otp
   Methods: POST
   Module: auth | Category: authentication
   Default Roles: Public

✅ /api/admin/users/:id/roles
   Methods: PUT
   Module: admin | Category: users
   Default Roles: admin, moderator

...

📊 کل: 25 endpoint پیدا شد

🔄 در حال همگام‌سازی با دیتابیس...

✅ اتصال به دیتابیس برقرار شد

✨ اضافه شد: /api/admin/sync-apis
🔄 آپدیت شد: /api/admin/users/:id/roles
⏭️  وجود دارد: /api/auth/login

==================================================
📊 خلاصه:
   ✨ اضافه شده: 3
   🔄 آپدیت شده: 2
   ⏭️  بدون تغییر: 20
==================================================

✅ همگام‌سازی با موفقیت انجام شد!

💾 ذخیره شد در: scripts/api-endpoints.json

✅ تمام!
```

---

## 🎓 نتیجه‌گیری

این ابزار به صورت کامل **اتوماتیک** است و:

✅ **نیازی به کد نوشتن نیست**
✅ **همه API ها رو پیدا می‌کنه**
✅ **دسترسی‌های پیشنهادی میده**
✅ **از UI قابل مدیریت**

---

**هر بار که API جدید اضافه کردی، sync کن!** 🚀✨


