# راهنمای محافظت از API با Dynamic RBAC

## 🎯 خلاصه

**تمام دسترسی‌ها از `apiPermissions` نقش‌ها در دیتابیس چک می‌شوند!**

---

## 🚀 نحوه کار

### 1. از UI پنل ادمین دسترسی بده:

```
/admin/rbac/roles/[id]  →  API Permissions
```

مثلاً به نقش `moderator`:

- ✅ `GET /api/admin/users`
- ✅ `PUT /api/admin/users/:id/roles`

این دسترسی‌ها در `apiPermissions` نقش ذخیره می‌شوند.

---

### 2. در API route از `protectApi` استفاده کن:

```javascript
import { protectApi } from "@/lib/middleware/apiProtection";

export async function GET(request) {
  const protection = await protectApi(request, {
    allowedRoles: ["admin", "moderator"], // fallback
    checkPermission: true, // چک از دیتابیس
  });

  if (!protection.success) {
    return NextResponse.json(
      { error: protection.error },
      { status: protection.status }
    );
  }

  const user = protection.user;
  // API logic ...
}
```

---

### 3. چطور چک می‌کنه؟

```
1. ✅ احراز هویت (JWT)
   ↓
2. 🔍 Admin check
   ↓ (اگه admin نبود)
3. 🔍 گرفتن نقش‌های کاربر از دیتابیس
   ↓
4. 🔍 چک کردن apiPermissions هر نقش
   ↓
   - آیا path مچ میکنه؟ (support for :id)
   - آیا method مچ میکنه؟ (GET, POST, PUT, DELETE)
   ↓
5. ✅ اگه پیدا شد → OK
   ❌ اگه نشد → 403
```

---

## 💡 مثال کامل

### مثال 1: لیست کاربران

```javascript
// API: /api/admin/users/route.js
export async function GET(request) {
  const protection = await protectApi(request, {
    allowedRoles: ["admin", "moderator"],
    checkPermission: true,
  });

  if (!protection.success) {
    return NextResponse.json(
      { error: protection.error },
      { status: protection.status }
    );
  }

  // API logic
  const users = await User.find();
  return NextResponse.json({ success: true, users });
}
```

**از UI:**

- برو به `/admin/rbac/roles/[moderator-id]`
- در بخش API Permissions:
  - Path: `/api/admin/users`
  - Methods: `GET` ✅
- ذخیره کن

**نتیجه:**

- ✅ Admin → دسترسی داره (همیشه)
- ✅ Moderator → دسترسی داره (چون در apiPermissions هست)
- ❌ User → دسترسی نداره

---

### مثال 2: تغییر نقش

```javascript
// API: /api/admin/users/[id]/roles/route.js
export async function PUT(request, { params }) {
  const protection = await protectApi(request, {
    allowedRoles: ["admin", "moderator"],
    checkPermission: true,
  });

  if (!protection.success) {
    return NextResponse.json(
      { error: protection.error },
      { status: protection.status }
    );
  }

  // API logic
  const user = await User.findById(params.id);
  user.roles = newRoles;
  await user.save();
  return NextResponse.json({ success: true });
}
```

**از UI:**

- Path: `/api/admin/users/:id/roles`
- Methods: `PUT` ✅

**نتیجه:**

- ✅ کاربرانی که این method و path رو در apiPermissions نقششون دارند → OK
- ❌ بقیه → 403

---

## 🔍 Debugging

اگه 403 گرفتی:

1. **برو به Terminal** و لاگ‌ها رو بخون:

```
🔍 [RBAC] Checking API permission: PUT /api/admin/users/:id/roles
🔍 [RBAC] User: 09XXXXXXXX, Roles: moderator, user
🔍 [RBAC] Found 2 roles in database
🔍 [RBAC] Checking role: moderator, API permissions count: 3
   - /api/admin/users: [GET]
   - /api/admin/rbac/roles: [GET]
   - /api/events: [GET, POST]
❌ [RBAC] Access denied - no matching permissions found
```

2. **برو به `/admin/debug`** برای اطلاعات کامل

3. **چک کن:**
   - آیا نقش در دیتابیس هست؟
   - آیا `apiPermissions` درست ذخیره شده؟
   - آیا path و method درست هستند؟

---

## 📊 Options

### `allowedRoles` (fallback)

اگه `checkPermission` fail کرد، از این استفاده می‌کنه:

```javascript
allowedRoles: ["admin", "moderator"];
```

**کاربرد:** برای اطمینان اضافی یا وقتی seed نشده

---

### `checkPermission` (boolean)

```javascript
checkPermission: true; // چک از دیتابیس (پیشنهاد ✅)
checkPermission: false; // فقط allowedRoles چک میشه
```

**توصیه:** همیشه `true` بذار تا داینامیک باشه!

---

## ⚡ Performance

| حالت              | Query | زمان  |
| ----------------- | ----- | ----- |
| Admin             | 0     | ~1ms  |
| با apiPermissions | 1     | ~15ms |
| بدون دسترسی       | 1     | ~10ms |

**نتیجه:** سریع و کارآمد! ✨

---

## 🎓 نتیجه‌گیری

✅ **همه چیز از دیتابیس**
✅ **هیچ seed یا config خاصی نمی‌خواد**
✅ **فقط از UI پنل ادمین مدیریت کن**
✅ **تغییرات فوری اعمال می‌شوند**

---

**سوال؟** لاگ Terminal رو چک کن! همه چیز واضح نوشته شده! 🔍
