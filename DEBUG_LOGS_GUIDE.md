# 🔍 راهنمای تفسیر لاگ‌های Debug

این فایل راهنمای خواندن و تفسیر لاگ‌های جامعی است که به سیستم احراز هویت و RBAC اضافه شده‌اند.

---

## 📋 ساختار لاگ‌ها

لاگ‌ها به 4 بخش تقسیم می‌شوند:

### 1️⃣ **API Protection** (خط اول دفاع)
```
================================================================================
🛡️ [API PROTECTION] GET /api/wallet/transactions
================================================================================
```
این بخش نشان می‌دهد که کدام API endpoint در حال بررسی است.

---

### 2️⃣ **Authentication** (احراز هویت)
```
🔐 [AUTHENTICATE] Starting authentication...
   Method: GET | State-changing: false
   🍪 Checking for accessToken cookie...
   ✅ Access token found: eyJhbGciOiJIUzI1NI...
   🔍 Verifying JWT token...
   ✅ JWT token verified
   📋 Decoded token: { phoneNumber: '09123456789', exp: '2024-01-15T...' }
   🔍 Finding user: 09123456789...
   ✅ User found: 09123456789
   📋 User roles: [admin]
   📋 User state: active
```

**نکات مهم:**
- ❌ **اگر `No accessToken cookie found` دیدید** → کوکی پاک شده یا expire شده
- ❌ **اگر `Token expired` دیدید** → توکن منقضی شده، نیاز به refresh
- ❌ **اگر `User not found` دیدید** → کاربر از DB حذف شده
- ✅ **اگر همه ✅ بود** → احراز هویت موفق، ادامه به بررسی دسترسی

---

### 3️⃣ **RBAC Check** (بررسی دسترسی)
```
🔐 Step 1: Authentication check...
✅ User authenticated: 09123456789 | Roles: [admin]

🔍 Step 2: Checking API permission from database...
   User ID: 6789abc...
   User Roles: admin
   Permission Check Result: ✅ GRANTED
✅ API permission granted via RBAC from database
```

**چک‌لیست:**
1. **کاربر admin است؟**
   - ✅ Admin همیشه دسترسی کامل دارد
   - مستقیم `return { success: true }`

2. **کاربر نقش دارد؟**
   - اگر `No roles assigned` → کاربر هیچ نقشی ندارد

3. **نقش در دیتابیس است؟**
   - اگر `No valid roles found in database` → نقش‌ها در DB تعریف نشده

4. **نقش دارای apiPermissions است؟**
   - اگر `API permissions count: 0` → نقش هیچ دسترسی API ندارد

---

### 4️⃣ **hasApiAccess** (بررسی دقیق دسترسی)
```
🔍 [RBAC] Checking role: admin, API permissions count: 49
      🔍 [hasApiAccess] Checking: GET /api/wallet/transactions
      📋 [hasApiAccess] Role: admin, API Permissions: 49
      ✅ [hasApiAccess] Path matched: /api/wallet/transactions -> /api/wallet/transactions
      🔍 [hasApiAccess] Available methods: [GET]
      🔍 [hasApiAccess] Requested method: GET
      ✅✅ [hasApiAccess] GRANTED: GET /api/wallet/transactions
✅ [RBAC] Access granted via role: admin
```

**نکات:**
- ✅ **Path matched** → API در لیست دسترسی‌های نقش وجود دارد
- ❌ **No matching path found** → API در لیست نیست
- ❌ **Method not allowed** → Path وجود دارد اما متد (GET/POST/PUT/DELETE) مجاز نیست

---

## 🔴 خطاهای رایج و راه‌حل

### خطا 1: کوکی پیدا نمی‌شود
```
❌ No accessToken cookie found
💡 All cookies: [empty]
```

**علل احتمالی:**
1. کاربر logout کرده
2. توکن expire شده
3. کوکی در domain/path اشتباه set شده
4. مرورگر کوکی‌ها را block کرده

**راه‌حل:**
- دوباره login کنید
- بررسی کنید domain/path کوکی درست است
- بررسی کنید httpOnly cookie در مرورگر فعال است

---

### خطا 2: توکن منقضی شده
```
❌ Token expired: 2024-01-15T10:30:00.000Z
```

**راه‌حل:**
- استفاده از refresh token برای دریافت access token جدید
- یا دوباره login کنید

---

### خطا 3: نقش بدون دسترسی
```
⚠️ [hasApiAccess] No API permissions defined for role: user
```

**راه‌حل:**
1. به پنل ادمین بروید: `/dashboard/rbac/roles`
2. نقش مورد نظر را ویرایش کنید
3. API های مورد نیاز را اضافه کنید
4. Save کنید

یا از اسکریپت استفاده کنید:
```bash
node scripts/grant-admin-full-access.js
```

---

### خطا 4: Path پیدا نشد
```
❌ [hasApiAccess] No matching path found for: /api/wallet/transactions
❌ [RBAC] Solution: Add this permission to one of your roles:
   Path: /api/wallet/transactions
   Methods: [GET]
```

**راه‌حل:**
به دیتابیس بروید و این permission را به نقش کاربر اضافه کنید:

```javascript
db.roles.updateOne(
  { slug: "admin" },
  { 
    $push: { 
      apiPermissions: { 
        path: "/api/wallet/transactions", 
        methods: ["GET"] 
      } 
    } 
  }
);
```

---

### خطا 5: متد مجاز نیست
```
❌ [hasApiAccess] Method not allowed: POST (available: [GET])
```

**راه‌حل:**
باید متد `POST` را به دسترسی‌های API اضافه کنید:

```javascript
db.roles.updateOne(
  { 
    slug: "admin",
    "apiPermissions.path": "/api/wallet/transactions"
  },
  { 
    $addToSet: { 
      "apiPermissions.$.methods": "POST" 
    } 
  }
);
```

---

## ✅ نمونه لاگ موفق (کامل)

```
================================================================================
🛡️ [API PROTECTION] GET /api/wallet/transactions
================================================================================
🔐 [AUTHENTICATE] Starting authentication...
   Method: GET | State-changing: false
   🍪 Checking for accessToken cookie...
   ✅ Access token found: eyJhbGciOiJIUzI1NI...
   🔍 Verifying JWT token...
   ✅ JWT token verified
   📋 Decoded token: { phoneNumber: '09123456789', exp: '2024-01-15T12:00:00.000Z' }
   🔍 Finding user: 09123456789...
   ✅ User found: 09123456789
   📋 User roles: [admin]
   📋 User state: active
🔐 Step 1: Authentication check...
✅ User authenticated: 09123456789 | Roles: [admin]
🔍 Step 2: Checking API permission from database...
   User ID: 6789abc123def456
   User Roles: admin
   Permission Check Result: ✅ GRANTED
✅ API permission granted via RBAC from database
================================================================================
```

---

## 🛠️ ابزارهای Debug

### 1. بررسی دسترسی‌های Admin
```bash
node scripts/check-admin-permissions.js
```

### 2. اعطای دسترسی کامل به Admin
```bash
node scripts/grant-admin-full-access.js
```

### 3. بررسی نقش‌ها در MongoDB
```javascript
db.roles.find({ slug: "admin" }, { name: 1, slug: 1, apiPermissions: 1 })
```

### 4. بررسی کاربر
```javascript
db.users.findOne({ phoneNumber: "09123456789" }, { roles: 1, state: 1 })
```

---

## 📞 در صورت مشکل

اگر بعد از بررسی تمام موارد بالا همچنان مشکل دارید:

1. ✅ مطمئن شوید MongoDB در حال اجرا است
2. ✅ مطمئن شوید سرور Next.js را restart کرده‌اید
3. ✅ مطمئن شوید Cache مرورگر را پاک کرده‌اید
4. ✅ مطمئن شوید در حالت Incognito/Private تست می‌کنید
5. ✅ لاگ‌های کامل سرور را بررسی کنید

---

**موفق باشید! 🚀**

