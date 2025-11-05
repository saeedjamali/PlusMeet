# 🔐 راهنمای کامل RBAC در PlusMeet

## 🎯 معرفی

RBAC (Role-Based Access Control) یک سیستم کنترل دسترسی است که بر اساس نقش‌های کاربران عمل می‌کند. در PlusMeet، این سیستم به صورت انعطاف‌پذیر و قدرتمند پیاده‌سازی شده است.

---

## 🏗 معماری سیستم

### سه لایه دسترسی:

1. **نقش‌های پایه (Base Roles)**: نقش‌های سیستمی از پیش تعریف شده
2. **مجوزهای نقش (Role Permissions)**: مجوزهای مربوط به هر نقش
3. **مجوزهای سفارشی (Custom Permissions)**: مجوزهای اختصاصی برای کاربران خاص

```
┌─────────────────────────────────────┐
│         User (کاربر)                │
├─────────────────────────────────────┤
│  Roles: ['user', 'event_owner']     │
│  Custom Permissions: ['users.view'] │
└────────────┬────────────────────────┘
             │
             ├──> نقش user: ['events.view', 'events.create', ...]
             │
             ├──> نقش event_owner: ['events.edit.own', ...]
             │
             └──> مجوز سفارشی: 'users.view' (برای این کاربر خاص)
```

---

## 📋 نقش‌های سیستم

### 1. Guest (مهمان)

```javascript
permissions: ["events.view"];
```

- مشاهده رویدادهای عمومی
- بدون نیاز به ورود

### 2. User (کاربر عادی)

```javascript
permissions: [
  "events.view",
  "events.create",
  "events.join",
  "events.leave",
  "profile.view",
  "profile.edit",
  "comments.create",
  "likes.toggle",
  "messages.send",
];
```

- تمام عملیات پایه
- ایجاد و شرکت در رویدادها
- تعاملات اجتماعی

### 3. Event Owner (مالک رویداد)

```javascript
permissions: [
  ...userPermissions,
  "events.edit.own",
  "events.delete.own",
  "events.manage_members",
  "events.manage_requests",
  "payments.view.own",
  "payments.manage",
];
```

- مدیریت کامل رویدادهای خودش
- مدیریت اعضا و درخواست‌ها
- مشاهده و مدیریت پرداخت‌ها

### 4. Moderator (ناظر)

```javascript
permissions: [
  "events.view",
  "events.moderate",
  "content.moderate",
  "content.delete",
  "reports.view",
  "reports.review",
  "users.view",
  "users.warn",
  "analytics.view.basic",
];
```

- نظارت بر محتوا
- بررسی گزارش‌ها
- اخطار به کاربران

### 5. Admin (مدیر)

```javascript
permissions: ["*"];
```

- دسترسی کامل به تمام بخش‌ها
- مدیریت کاربران و سیستم
- تخصیص نقش و مجوز

---

## 🎯 فرمت مجوزها

### قرارداد نام‌گذاری

```
<resource>.<action>[.<scope>]
```

**مثال‌ها:**

```javascript
"events.view"; // مشاهده رویدادها
"events.create"; // ایجاد رویداد
"events.edit.own"; // ویرایش رویدادهای خودش
"users.delete"; // حذف کاربران (فقط admin)
"payments.view.own"; // مشاهده پرداخت‌های خودش
```

### دسته‌بندی مجوزها

#### 🎪 Events (رویدادها)

```javascript
"events.view"; // مشاهده
"events.create"; // ایجاد
"events.edit"; // ویرایش همه
"events.edit.own"; // ویرایش خودی
"events.delete"; // حذف همه
"events.delete.own"; // حذف خودی
"events.moderate"; // بررسی و تایید
"events.manage_members"; // مدیریت اعضا
"events.manage_requests"; // مدیریت درخواست‌ها
"events.join"; // عضویت
"events.leave"; // خروج
```

#### 👥 Users (کاربران)

```javascript
"users.view"; // مشاهده لیست
"users.create"; // ایجاد (ثبت‌نام)
"users.edit"; // ویرایش
"users.delete"; // حذف
"users.verify"; // تایید
"users.suspend"; // مسدود کردن
"users.warn"; // اخطار
```

#### 💬 Content (محتوا)

```javascript
"content.moderate"; // نظارت
"content.delete"; // حذف
"comments.create"; // ایجاد کامنت
"comments.edit.own"; // ویرایش کامنت خودی
"comments.delete"; // حذف همه کامنت‌ها
"comments.delete.own"; // حذف کامنت خودی
"likes.toggle"; // لایک/آنلایک
```

#### 💰 Payments (پرداخت‌ها)

```javascript
"payments.view"; // مشاهده همه
"payments.view.own"; // مشاهده خودی
"payments.manage"; // مدیریت تسویه
"payments.refund"; // بازگشت وجه
"transactions.view"; // مشاهده تراکنش‌ها
```

#### 🚨 Reports (گزارش‌ها)

```javascript
"reports.view"; // مشاهده
"reports.review"; // بررسی
"reports.action"; // اقدام
```

#### ⚙️ Settings (تنظیمات)

```javascript
"settings.view"; // مشاهده
"settings.edit"; // ویرایش
"roles.assign"; // تخصیص نقش
"permissions.manage"; // مدیریت مجوزها
```

#### 📊 Analytics (تحلیل)

```javascript
"analytics.view"; // مشاهده همه
"analytics.view.basic"; // مشاهده پایه
"logs.view"; // مشاهده لاگ‌ها
```

---

## 💻 پیاده‌سازی

### در API Routes

#### مثال 1: بررسی مجوز ساده

```javascript
import { authenticate } from "@/lib/middleware/auth";
import { checkPermission } from "@/lib/middleware/rbac";

export async function DELETE(request, { params }) {
  // احراز هویت + بررسی مجوز
  await authenticate(request);
  await checkPermission("users.delete")(request);

  // حذف کاربر
  const userId = params.id;
  await User.findByIdAndDelete(userId);

  return Response.json({ success: true });
}
```

#### مثال 2: بررسی مالکیت

```javascript
import { authenticate } from "@/lib/middleware/auth";
import { checkPermission, checkOwnership } from "@/lib/middleware/rbac";

export async function PUT(request, { params }) {
  await authenticate(request);

  const eventId = params.id;
  const event = await Event.findById(eventId);

  // چک مالکیت یا مجوز admin
  if (
    request.user.phoneNumber !== event.ownerId &&
    !request.user.hasRole("admin")
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // ویرایش رویداد
  await Event.updateOne({ _id: eventId }, request.body);

  return Response.json({ success: true });
}
```

#### مثال 3: Middleware Chain

```javascript
import { Router } from "express";
import { authenticate, requireRole } from "@/lib/middleware/auth";
import { checkPermission } from "@/lib/middleware/rbac";

const router = Router();

// مسیر ساده - فقط احراز هویت
router.get("/profile", authenticate, getProfileHandler);

// نیاز به نقش خاص
router.get(
  "/moderator/reports",
  authenticate,
  requireRole("moderator"),
  getReportsHandler
);

// نیاز به مجوز خاص
router.delete(
  "/users/:id",
  authenticate,
  checkPermission("users.delete"),
  deleteUserHandler
);

// ترکیب چند middleware
router.patch(
  "/events/:id/feature",
  authenticate,
  requireRole(["admin", "moderator"]),
  checkPermission("events.moderate"),
  featureEventHandler
);
```

---

## 🎛 مدیریت دسترسی‌های سفارشی

### افزودن مجوز سفارشی

```javascript
import { grantPermission } from "@/lib/middleware/rbac";

// دادن دسترسی موقت به کاربر
await grantPermission(
  "09123456789", // userId
  "users.view", // permission
  "09121111111", // grantedBy (admin)
  {
    expiresAt: new Date("2025-12-31"), // تاریخ انقضا
    scope: { city: "Tehran" }, // محدودیت اضافی
    notes: "دسترسی موقت برای بررسی گزارش‌ها",
  }
);
```

### حذف مجوز

```javascript
import { revokePermission } from "@/lib/middleware/rbac";

await revokePermission("09123456789", "users.view");
```

### بررسی مجوز

```javascript
import { hasPermission } from "@/lib/middleware/rbac";

const can = await hasPermission("09123456789", "users.delete");
if (can) {
  // اجازه دارد
}
```

### دریافت تمام مجوزها

```javascript
import { getUserPermissions } from "@/lib/middleware/rbac";

const permissions = await getUserPermissions("09123456789");
// ['events.view', 'events.create', 'users.view', ...]
```

---

## 🎨 در Frontend

### Hook سفارشی برای بررسی دسترسی

```javascript
// hooks/usePermission.js
import { useAuth } from "@/contexts/AuthContext";

export function usePermission(permission) {
  const { user } = useAuth();

  if (!user) return false;

  // ادمین به همه چیز دسترسی دارد
  if (user.roles.includes("admin")) return true;

  // بررسی مجوزهای کاربر
  return user.permissions?.includes(permission) || false;
}

// استفاده
function DeleteButton({ eventId }) {
  const canDelete = usePermission("events.delete");

  if (!canDelete) return null;

  return <button onClick={() => deleteEvent(eventId)}>حذف رویداد</button>;
}
```

### کامپوننت محدودکننده دسترسی

```javascript
// components/PermissionGate.js
export function PermissionGate({ permission, children, fallback = null }) {
  const hasPermission = usePermission(permission);

  if (!hasPermission) return fallback;

  return children;
}

// استفاده
<PermissionGate permission="users.delete">
  <button>حذف کاربر</button>
</PermissionGate>

<PermissionGate
  permission="analytics.view"
  fallback={<div>دسترسی ندارید</div>}
>
  <AnalyticsDashboard />
</PermissionGate>
```

---

## 🔄 سناریوهای واقعی

### سناریو 1: مدیر رویداد

```javascript
// کاربری که رویداد می‌سازد، اتوماتیک event_owner می‌شود
async function createEvent(eventData, userId) {
  const event = await Event.create({
    ...eventData,
    ownerId: userId,
  });

  // افزودن نقش event_owner
  const user = await User.findByPhone(userId);
  user.addRole("event_owner");
  await user.save();

  return event;
}

// بررسی مالکیت برای ویرایش
async function editEvent(eventId, userId) {
  const event = await Event.findById(eventId);

  // فقط مالک یا ادمین می‌تواند ویرایش کند
  if (event.ownerId !== userId) {
    const user = await User.findByPhone(userId);
    if (!user.hasRole("admin")) {
      throw new Error("شما مجاز به ویرایش این رویداد نیستید");
    }
  }

  // ویرایش
  await Event.updateOne({ _id: eventId }, updates);
}
```

### سناریو 2: ناظر محتوا

```javascript
// دادن دسترسی موقت به کاربر برای نظارت
async function assignModerator(userId, adminId) {
  const user = await User.findByPhone(userId);

  // افزودن نقش moderator
  user.addRole("moderator");
  await user.save();

  // ثبت لاگ
  await logActivity(adminId, "role_assign", {
    targetType: "user",
    targetId: userId,
    metadata: { role: "moderator" },
  });
}

// بررسی گزارش توسط ناظر
async function reviewReport(reportId, moderatorId) {
  // چک مجوز
  const hasPerm = await hasPermission(moderatorId, "reports.review");
  if (!hasPerm) {
    throw new Error("دسترسی ندارید");
  }

  // بررسی گزارش
  await Report.updateOne(
    { _id: reportId },
    {
      status: "reviewed",
      reviewedBy: moderatorId,
      reviewedAt: new Date(),
    }
  );
}
```

### سناریو 3: مدیر شهر (دسترسی محدود)

```javascript
// دادن دسترسی فقط برای کاربران شهر خاص
await grantPermission("09123456789", "users.view", "09121111111", {
  scope: { city: "Tehran" },
  notes: "مدیر کاربران تهران",
});

// middleware با scope
function checkPermission(permission, options = {}) {
  return async (req, res, next) => {
    const userPerm = await UserPermission.findOne({
      userId: req.user.phoneNumber,
      permission,
    });

    if (userPerm && userPerm.scope) {
      // چک scope
      if (userPerm.scope.city) {
        // فقط کاربران همان شهر را نشان بده
        req.scopeFilter = { city: userPerm.scope.city };
      }
    }

    next();
  };
}
```

---

## 🎯 Best Practices

### 1. اصل کمترین دسترسی (Least Privilege)

```javascript
// ❌ بد - دادن نقش admin
user.addRole("admin");

// ✅ خوب - دادن مجوز خاص
await grantPermission(userId, "users.view", adminId);
```

### 2. استفاده از نقش‌ها برای دسترسی‌های رایج

```javascript
// ✅ خوب - استفاده از نقش
user.addRole("moderator"); // شامل چندین مجوز

// ❌ بد - دادن تک‌تک مجوزها
await grantPermission(userId, "reports.view", adminId);
await grantPermission(userId, "reports.review", adminId);
await grantPermission(userId, "content.moderate", adminId);
```

### 3. مجوزهای موقت

```javascript
// ✅ خوب - مجوز موقت
await grantPermission(userId, "analytics.view", adminId, {
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 روز
});
```

### 4. لاگ کردن تغییرات دسترسی

```javascript
// همیشه تغییرات را لاگ کنید
await logActivity(adminId, "permission_grant", {
  targetType: "user",
  targetId: userId,
  metadata: { permission: "users.delete" },
});
```

---

## 📊 مثال UI پنل ادمین

```javascript
// صفحه مدیریت دسترسی کاربر
function UserPermissionsPanel({ userId }) {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);

  // دریافت اطلاعات
  useEffect(() => {
    fetchUserPermissions(userId).then(setPermissions);
    fetchUserRoles(userId).then(setRoles);
  }, [userId]);

  const handleAddRole = async (role) => {
    await api.post(`/users/${userId}/roles`, { role });
    setRoles([...roles, role]);
  };

  const handleGrantPermission = async (permission) => {
    await api.post(`/users/${userId}/permissions`, { permission });
    setPermissions([...permissions, permission]);
  };

  return (
    <div>
      <h2>نقش‌های کاربر</h2>
      {roles.map((role) => (
        <Badge key={role}>{role}</Badge>
      ))}
      <Button onClick={() => handleAddRole("moderator")}>افزودن ناظر</Button>

      <h2>مجوزهای سفارشی</h2>
      {permissions.map((perm) => (
        <PermissionItem key={perm.id} permission={perm} />
      ))}
      <Button onClick={() => handleGrantPermission("users.view")}>
        افزودن مجوز
      </Button>
    </div>
  );
}
```

---

## 🔍 عیب‌یابی

### چک کردن دسترسی‌های کاربر

```javascript
// در API route یا script
const userId = "09123456789";
const user = await User.findByPhone(userId);

console.log("Roles:", user.roles);

const permissions = await getUserPermissions(userId);
console.log("All Permissions:", permissions);

const canDelete = await hasPermission(userId, "users.delete");
console.log("Can delete users:", canDelete);
```

### لاگ مجوزهای رد شده

```javascript
// در middleware
if (!hasPermission) {
  await logActivity(userId, "permission_denied", {
    metadata: { permission, resource },
  });

  return res.status(403).json({ error: "Forbidden" });
}
```

---

## 📚 منابع بیشتر

- [سیستم کاربری](./USER_SYSTEM.md)
- [مدل‌های دیتابیس](../src/lib/models/)
- [Middleware ها](../src/lib/middleware/)

---

**آخرین به‌روزرسانی**: 27 اکتبر 2025




