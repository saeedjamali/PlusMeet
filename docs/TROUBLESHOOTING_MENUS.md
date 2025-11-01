# 🔧 عیب‌یابی منوها (Menu Troubleshooting)

> راهنمای حل مشکلات رایج در سیستم منوی PlusMeet

## 🐛 مشکلات رایج

### 1️⃣ منوها در Sidebar نمایش داده نمی‌شوند

#### علائم:

- Sidebar خالی است
- فقط لوگو و دکمه logout نمایش داده می‌شود
- Console error نشان می‌دهد

#### راه‌حل‌ها:

**الف) بررسی دسترسی**:

```bash
# 1. Console browser را باز کنید (F12)
# 2. به تب Network بروید
# 3. Request به /api/user/menus را پیدا کنید
# 4. پاسخ را بررسی کنید
```

اگر `success: false` بود:

```javascript
// Response:
{
  "success": false,
  "error": "No permission"
}
```

✅ **راه‌حل**: نقش کاربر را در Admin Panel بررسی کنید (`/admin/users`)

**ب) بررسی seed**:

```bash
# منوها در دیتابیس وجود دارند؟
npm run seed-rbac
```

**ج) بررسی دیتابیس**:

```javascript
// MongoDB Compass:
// Collection: menus
// Filter: { isActive: true }
// اگر خالی بود، seed را اجرا کنید
```

---

### 2️⃣ Infinite Loop: API هیچ‌وقت Response نمی‌دهد

#### علائم:

- Request به `/api/user/menus` هیچ‌وقت تمام نمی‌شود
- Server hang می‌کند
- Console logs تکرار می‌شوند:
  ```
  🔍 [Depth 0] Looking for missing parents: ['users']
  ✅ [Depth 0] Added missing parents: 0
  🔍 [Depth 1] Looking for missing parents: ['users']
  ✅ [Depth 1] Added missing parents: 0
  ...
  ```

#### دلایل:

- منویی با `parentId` وجود دارد اما parent در دیتابیس نیست
- داده‌های corrupt در دیتابیس

#### راه‌حل‌ها:

**الف) پیدا کردن منوهای orphan**:

```javascript
// MongoDB:
db.menus.find({
  parentId: { $ne: null },
  $expr: {
    $not: {
      $in: [
        "$parentId",
        { $map: { input: "$$ROOT", as: "m", in: "$$m.menuId" } },
      ],
    },
  },
});
```

**ب) حذف یا اصلاح منوهای orphan**:

```javascript
// Option 1: حذف
db.menus.deleteMany({
  menuId: "problematic-menu-id",
});

// Option 2: اصلاح parentId
db.menus.updateOne(
  { menuId: "problematic-menu-id" },
  { $set: { parentId: null } }
);
```

**ج) اجرای مجدد seed**:

```bash
# پاک کردن همه منوها و seed مجدد
npm run seed-rbac
```

**د) بررسی maxDepth**:

```javascript
// در src/app/api/user/menus/route.js:
const addMissingParents = async (currentMenus, depth = 0, maxDepth = 10) => {
  if (depth >= maxDepth) {
    console.warn("⚠️ Max depth reached");
    return currentMenus;
  }
  // ...
};
```

اگر `maxDepth = 10` کافی نیست، به این معنی است که مشکل دیگری در داده‌ها وجود دارد.

---

### 3️⃣ منوها Flat هستند (چند سطحی نیستند)

#### علائم:

- همه منوها در یک سطح نمایش داده می‌شوند
- دکمه ▼/◀ نمایش داده نمی‌شود
- زیرمنوها indent ندارند

#### راه‌حل‌ها:

**الف) بررسی Response API**:

```javascript
// Console:
fetch("/api/user/menus")
  .then((r) => r.json())
  .then((data) => console.log(JSON.stringify(data, null, 2)));
```

اگر `children` خالی است:

```javascript
{
  "success": true,
  "menus": [
    {
      "menuId": "users",
      "title": "کاربران",
      "children": []  // ← باید داخلش زیرمنوها باشند!
    }
  ]
}
```

✅ **راه‌حل**: مشکل در تابع `buildTree` است

**ب) بررسی parentId در دیتابیس**:

```javascript
// MongoDB:
db.menus.find({ parentId: "users" });
```

اگر نتیجه‌ای نیست، `parentId` اشتباه است.

**ج) Debug page**:

```
http://localhost:3000/admin/debug-menus
```

این صفحه ساختار کامل منوها را نشان می‌دهد.

---

### 4️⃣ دکمه باز/بسته (▼/◀) کار نمی‌کند

#### علائم:

- کلیک روی منو هیچ اتفاقی نمی‌افتد
- زیرمنوها باز/بسته نمی‌شوند

#### راه‌حل‌ها:

**الف) بررسی Console Errors**:

```javascript
// F12 → Console
// اگر error بود، آن را حل کنید
```

**ب) بررسی hasChildren**:

```javascript
// در src/app/admin/layout.js:
console.log("Menu item:", item.menuId, "hasChildren:", item.hasChildren);
```

اگر `hasChildren: false` است اما منو دارای children است، مشکل در `formatMenuTree` است.

**ج) بررسی expandedMenus state**:

```javascript
// در src/app/admin/layout.js:
const toggleMenu = (menuId) => {
  console.log("Toggle menu:", menuId);
  console.log("Current expanded:", [...expandedMenus]);
  // ...
};
```

---

### 5️⃣ منوی parent نمایش داده نمی‌شود

#### علائم:

- فقط زیرمنوها نمایش داده می‌شوند
- منوی والد (مثل "کاربران") وجود ندارد

#### دلایل:

- کاربر فقط به زیرمنوها دسترسی دارد
- منوی والد `isActive: false` است
- منوی والد به `allowedMenuIds` اضافه نشده

#### راه‌حل‌ها:

**الف) بررسی RBAC**:

```javascript
// در seed-rbac.mjs:
{
  name: "کاربر عادی",
  slug: "user",
  menuPermissions: [
    { menuId: "users", access: "view" },        // ← والد
    { menuId: "users.list", access: "view" },   // ← فرزند
  ]
}
```

هر دو باید در `menuPermissions` باشند!

**ب) Automatic parent addition**:
کد فعلی به صورت خودکار parent ها را اضافه می‌کند:

```javascript
// در src/app/api/user/menus/route.js:
menus = await addMissingParents(menus);
```

اگر کار نمی‌کند، Console logs را بررسی کنید:

```
✅ Found menus: 5
🔍 [Depth 0] Looking for missing parents: ['users']
✅ [Depth 0] Added missing parents: 1
```

---

## 🔍 ابزارهای Debug

### 1️⃣ Debug Page

```
http://localhost:3000/admin/debug-menus
```

**نمایش می‌دهد**:

- ساختار درختی منوها
- parent/child relationships
- JSON خام
- تعداد منوهای root

### 2️⃣ Console Logs

در `src/app/api/user/menus/route.js`:

```javascript
console.log("✅ Found menus:", menus.length);
console.log("🔍 [Depth N] Looking for missing parents:", missingParentIds);
console.log("✅ [Depth N] Added missing parents:", parentMenus.length);
console.log("🌳 Tree menus:", JSON.stringify(treeMenus, null, 2));
```

### 3️⃣ MongoDB Queries

**تمام منوها**:

```javascript
db.menus.find({ isActive: true }).sort({ order: 1 });
```

**منوهای orphan**:

```javascript
db.menus.aggregate([
  {
    $match: {
      parentId: { $ne: null },
      isActive: true,
    },
  },
  {
    $lookup: {
      from: "menus",
      localField: "parentId",
      foreignField: "menuId",
      as: "parent",
    },
  },
  {
    $match: {
      parent: { $size: 0 },
    },
  },
]);
```

**ساختار درختی**:

```javascript
db.menus.aggregate([
  { $match: { isActive: true, parentId: null } },
  {
    $graphLookup: {
      from: "menus",
      startWith: "$menuId",
      connectFromField: "menuId",
      connectToField: "parentId",
      as: "descendants",
    },
  },
]);
```

---

## 🚨 خطاهای رایج و راه‌حل

### Error: "Max depth reached"

```
⚠️ Max depth reached, stopping recursion
```

**دلیل**: بیش از 10 سطح منو دارید یا loop در داده‌ها وجود دارد.

**راه‌حل**:

1. منوهای orphan را پیدا و حذف کنید
2. ساختار منوها را ساده‌تر کنید (حداکثر 5 سطح توصیه می‌شود)

### Error: "Some parent menus not found"

```
⚠️ Some parent menus not found in database: ['users', 'settings']
```

**دلیل**: منوهایی با `parentId` اشتباه در دیتابیس وجود دارند.

**راه‌حل**:

```bash
# Option 1: حذف منوهای orphan
db.menus.deleteMany({ menuId: { $in: ['problematic-ids'] } })

# Option 2: اصلاح parentId
db.menus.updateMany(
  { parentId: 'non-existent-parent' },
  { $set: { parentId: null } }
)

# Option 3: seed مجدد
npm run seed-rbac
```

---

## ✅ چک‌لیست عیب‌یابی

- [ ] seed اجرا شده؟ (`npm run seed-rbac`)
- [ ] منوها در دیتابیس وجود دارند؟ (MongoDB Compass)
- [ ] `isActive: true` است؟
- [ ] کاربر نقش مناسب دارد؟
- [ ] parentId ها صحیح هستند؟
- [ ] منوهای orphan وجود ندارند؟
- [ ] Console errors نیست؟
- [ ] `/api/user/menus` response درست است؟
- [ ] Debug page را بررسی کردید؟

---

**نسخه**: 1.0.0  
**آخرین به‌روزرسانی**: 2025-10-29  
**نویسنده**: PlusMeet Team

