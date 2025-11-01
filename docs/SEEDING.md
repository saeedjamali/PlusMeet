# 🌱 راهنمای Seeding داده‌های اولیه RBAC

این سند راهنمای کامل برای ایجاد داده‌های اولیه (Seeding) سیستم RBAC است.

---

## 📂 فایل‌های Seed موجود

در این پروژه **دو روش** برای seed کردن داده‌ها وجود دارد:

### 1️⃣ **Script (Terminal)**: `scripts/seed-rbac.mjs`

**استفاده:**

```bash
npm run seed-rbac
```

**مزایا:**

- ✅ سریع‌تر (مستقیم به دیتابیس وصل می‌شه)
- ✅ مناسب برای Development
- ✅ می‌تونه از Terminal اجرا بشه
- ✅ لاگ‌های دقیق‌تر

**نیاز:**

- فایل `.env` با `MONGODB_URI`
- Node.js و npm

---

### 2️⃣ **API Route (پنل ادمین)**: `/api/admin/rbac/seed`

**استفاده:**

1. به `/admin/rbac/seed` برید
2. روی دکمه **"🚀 اجرای Seed"** کلیک کنید

**مزایا:**

- ✅ راحت‌تر (کلیک یک دکمه)
- ✅ نیاز به Terminal نداره
- ✅ Authentication دارد (فقط Admin می‌تونه seed کنه)
- ✅ مناسب برای Production

**نیاز:**

- باید به عنوان Admin لاگین کرده باشید
- دسترسی به پنل ادمین

---

## 📊 داده‌هایی که Seed می‌شوند

### 1. **Menus** (12 آیتم)

```javascript
- dashboard (داشبورد)
- users (کاربران)
  └─ users.list (لیست کاربران)
  └─ users.create (ایجاد کاربر)
- events (رویدادها)
  └─ events.list (لیست رویدادها)
  └─ events.create (ایجاد رویداد)
- rbac (مدیریت دسترسی)
  └─ rbac.roles (نقش‌ها)
  └─ rbac.menus (منوها)
  └─ rbac.apis (API Endpoints)
- settings (تنظیمات)
```

### 2. **API Endpoints** (12 آیتم)

```javascript
Auth:
- /api/auth/send-otp
- /api/auth/verify-otp
- /api/auth/login
- /api/auth/logout
- /api/auth/refresh

User:
- /api/user/profile

Admin:
- /api/admin/users
- /api/admin/users/:id

RBAC:
- /api/admin/rbac/roles
- /api/admin/rbac/roles/:id
- /api/admin/rbac/menus
- /api/admin/rbac/apis
```

### 3. **Roles** (5 نقش)

```javascript
1. admin (مدیر سیستم) 👑
   - Priority: 100
   - دسترسی: کامل به همه چیز

2. moderator (مدیر محتوا) 🛡️
   - Priority: 60
   - دسترسی: مدیریت رویدادها + مشاهده کاربران

3. event_owner (مالک رویداد) 📅
   - Priority: 50
   - دسترسی: ایجاد و مدیریت رویدادهای خود

4. user (کاربر عادی) 👤
   - Priority: 10
   - دسترسی: مشاهده رویدادها + پروفایل

5. guest (میهمان) 👁️
   - Priority: 1
   - دسترسی: فقط مشاهده رویدادهای عمومی
```

---

## ⚠️ نکات مهم

### 🔴 Seed کردن داده‌های قبلی را پاک می‌کند!

```javascript
await Role.deleteMany({}); // پاک کردن تمام نقش‌ها
await Menu.deleteMany({}); // پاک کردن تمام منوها
await ApiEndpoint.deleteMany({}); // پاک کردن تمام API endpoints
```

**پس قبل از seed:**

1. ✅ مطمئن شوید backup دارید (اگر داده مهمی دارید)
2. ✅ در محیط Development/Test seed کنید، نه Production!

### 🟢 کاربران پاک نمی‌شوند

- Seed فقط `Role`, `Menu`, و `ApiEndpoint` را پاک می‌کند
- کاربران (`User` model) دست نخورده باقی می‌مانند

### 🟡 فرمت Schema

هر دو فایل seed باید از **یک فرمت** استفاده کنند:

**✅ فرمت صحیح:**

```javascript
menuPermissions: [
  { menuId: "dashboard", access: "view" }, // یا "full"
];

apiPermissions: [{ path: "/api/users", methods: ["GET", "POST"] }];
```

**❌ فرمت قدیمی (اشتباه):**

```javascript
menuPermissions: [
  { menuId: "dashboard", canView: true }, // ❌ قدیمی
];

apiPermissions: [
  { endpoint: "/api/users", methods: ["GET"] }, // ❌ قدیمی
];
```

---

## 🚀 مراحل Seed کردن

### روش 1: از Terminal (سریع‌تر)

```bash
# گام 1: مطمئن شوید .env را ساخته‌اید
cat .env
# باید ببینید: MONGODB_URI=mongodb://...

# گام 2: اجرای seed
npm run seed-rbac

# خروجی موفق:
# ✅ Connected to MongoDB
# ✅ Inserted 12 menus
# ✅ Inserted 12 API endpoints
# ✅ Inserted 5 roles
# ✅ RBAC Seeding completed successfully!
```

### روش 2: از پنل ادمین (راحت‌تر)

```bash
# گام 1: وارد پنل ادمین شوید
http://localhost:3000/admin/login

# گام 2: به صفحه seed بروید
http://localhost:3000/admin/rbac/seed

# گام 3: روی دکمه "🚀 اجرای Seed" کلیک کنید

# گام 4: منتظر پیام موفقیت بمانید:
# ✅ Seed موفقیت‌آمیز بود!
# Roles: 5, Menus: 12, APIs: 12
```

---

## 🐛 عیب‌یابی (Troubleshooting)

### خطا: `Role validation failed: apiPermissions.0.path: Path 'path' is required`

**علت:** فرمت `apiPermissions` در یکی از فایل‌های seed اشتباه است.

**راه‌حل:**

1. باز کردن فایلی که خطا می‌دهد (`seed-rbac.mjs` یا `seed/route.js`)
2. چک کردن که همه `apiPermissions` دارای `path` هستند (نه `endpoint`)
3. چک کردن که همه `menuPermissions` دارای `access` هستند (نه `canView`)

**مثال صحیح:**

```javascript
apiPermissions: [
  { path: "/api/events", methods: ["GET"] }, // ✅
];
```

**مثال اشتباه:**

```javascript
apiPermissions: [
  { endpoint: "/api/events", methods: ["GET"] }, // ❌
];
```

---

### خطا: `connectDB is not a function`

**علت:** Import اشتباه `connectDB` در API route.

**راه‌حل:**

```javascript
// ❌ اشتباه:
import { connectDB } from "@/lib/db/mongodb";

// ✅ صحیح:
import connectDB from "@/lib/db/mongodb";
```

---

### خطا: `401 Unauthorized` (هنگام seed از پنل)

**علت:** کاربر Admin نیست یا لاگین نیست.

**راه‌حل:**

1. مطمئن شوید لاگین کرده‌اید
2. چک کنید که نقش `admin` دارید:

```bash
npm run check-user -- 09XXXXXXXXX
```

3. اگر ندارید، با این دستور admin بسازید:

```bash
npm run create-admin
```

---

### خطا: `Duplicate key error` (slug یا menuId)

**علت:** داده تکراری در دیتابیس.

**راه‌حل:**

1. Seed دوباره seed می‌کند (همه چیز رو پاک می‌کنه)
2. اگر همچنان خطا دارید، دستی پاک کنید:

```bash
# از MongoDB Compass یا mongosh:
db.roles.deleteMany({})
db.menus.deleteMany({})
db.apiendpoints.deleteMany({})
```

---

### خطا: `User validation failed: roles.0: 'test' is not a valid enum value`

**علت:** `User.model.js` هنوز از enum ثابت استفاده می‌کند.

**راه‌حل:**

این مشکل در نسخه‌های قدیمی‌تر بود. مطمئن شوید که `src/lib/models/User.model.js` به‌روز است:

```javascript
// ✅ صحیح (جدید):
roles: {
  type: [String],
  default: ["user"],
  // Validation در API routes انجام می‌شود
}

// ❌ اشتباه (قدیمی):
roles: {
  type: [String],
  enum: ["guest", "user", "event_owner", "moderator", "admin"],  // ← حذف کنید!
  default: ["user"],
}
```

اگر این خطا را می‌بینید:

1. `src/lib/models/User.model.js` را باز کنید
2. خط `enum` را از `roles` حذف کنید
3. سرور را restart کنید (`Ctrl+C` و `npm run dev`)
4. دوباره امتحان کنید

---

## 💡 نقش‌های دینامیک (Dynamic Roles)

### چرا نقش‌ها در User Model دیگر Enum ندارند؟

در نسخه‌های قبلی، فیلد `roles` در `User.model.js` یک enum ثابت داشت:

```javascript
// ❌ قدیمی (Removed):
roles: {
  type: [String],
  enum: ["guest", "user", "event_owner", "moderator", "admin"],
  default: ["user"],
}
```

**مشکل:**

- Admin نمی‌توانست نقش‌های جدید بسازد
- هر نقش جدید باید در کد hard-code می‌شد
- پروژه را deploy و restart کنید تا نقش جدید کار کند

### راه‌حل: Validation دینامیک

حالا `roles` در User Model فقط یک Array است:

```javascript
// ✅ جدید:
roles: {
  type: [String],
  default: ["user"],
  // Validation در API routes با Role.model انجام می‌شود
}
```

**Validation در چه جایی انجام می‌شود؟**

در `src/app/api/admin/users/[id]/roles/route.js`:

```javascript
// دریافت نقش‌های معتبر از دیتابیس
const dbRoles = await Role.find({ isActive: true }).select("slug").lean();
let validRoles = dbRoles.map((r) => r.slug);

// چک کردن نقش‌های ارسال شده
const invalidRoles = roles.filter((role) => !validRoles.includes(role));

if (invalidRoles.length > 0) {
  return NextResponse.json(
    { error: `نقش‌های نامعتبر: ${invalidRoles.join(", ")}` },
    { status: 400 }
  );
}
```

**مزایا:**

- ✅ Admin می‌تواند نقش‌های جدید بسازد بدون تغییر کد
- ✅ نقش‌ها از دیتابیس خوانده می‌شوند (dynamic)
- ✅ هیچ نیازی به restart سرور نیست
- ✅ تمام validation ها همچنان کار می‌کنند

---

## 📚 منابع مرتبط

- [DEFAULT_ROLES.md](./DEFAULT_ROLES.md) - توضیحات تمام نقش‌های پیش‌فرض
- [RBAC_GUIDE.md](./RBAC_GUIDE.md) - راهنمای کامل سیستم RBAC
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - عیب‌یابی عمومی

---

## 🔄 بروزرسانی Seed Data

اگر می‌خواهید داده‌های Seed را تغییر دهید:

1. **تغییر در `scripts/seed-rbac.mjs`** (برای Terminal)
2. **تغییر در `src/app/api/admin/rbac/seed/route.js`** (برای پنل ادمین)
3. ⚠️ **مهم:** هر دو فایل را همزمان آپدیت کنید تا همیشه sync باشند!

**چک‌لیست:**

- [ ] فرمت `menuPermissions` صحیح است؟ (`access: "view"` یا `"full"`)
- [ ] فرمت `apiPermissions` صحیح است؟ (`path`, نه `endpoint`)
- [ ] همه نقش‌های `isSystem: true` را اضافه کردید؟
- [ ] تمام منوهای ضروری را اضافه کردید؟
- [ ] تمام API endpoints مهم را اضافه کردید؟

---

**تاریخ به‌روزرسانی:** 29 اکتبر 2025  
**نسخه:** 1.0.0
