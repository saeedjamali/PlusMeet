# 👥 سیستم کاربری PlusMeet

## 🎯 نمای کلی

سیستم کاربری PlusMeet یک سیستم چندنقشه و چندسطحی است که از RBAC (Role-Based Access Control) پشتیبانی می‌کند.

---

## 📋 نقش‌های سیستم (Roles)

| نقش             | شناسه         | توضیح              | سطح دسترسی                                 |
| --------------- | ------------- | ------------------ | ------------------------------------------ |
| **Guest**       | `guest`       | کاربر ناشناس       | فقط مشاهده رویدادهای عمومی                 |
| **User**        | `user`        | کاربر ثبت‌نام‌شده  | تعامل اجتماعی، ایجاد رویداد، درخواست عضویت |
| **Event Owner** | `event_owner` | سازنده/مدیر رویداد | مدیریت اعضا، درخواست‌ها، پرداخت‌های رویداد |
| **Moderator**   | `moderator`   | ناظر محتوا         | بررسی تخلفات، گزارش‌ها، مدیریت محتوا       |
| **Admin**       | `admin`       | مدیر کل            | کنترل کامل سیستم، مدیریت کاربران، RBAC     |

### ویژگی‌های نقش‌ها

- ✅ **چندنقشه**: هر کاربر می‌تواند چندین نقش داشته باشد
- ✅ **سلسله‌مراتبی**: نقش‌ها دارای سطوح دسترسی متفاوت هستند
- ✅ **قابل توسعه**: امکان افزودن نقش‌های جدید

---

## 🔄 وضعیت‌های کاربر (User States)

| وضعیت                    | شناسه                  | توضیح                         | کاربرد در منطق               |
| ------------------------ | ---------------------- | ----------------------------- | ---------------------------- |
| **Unregistered**         | `unregistered`         | هنوز ثبت‌نام نکرده            | بازدیدکننده مهمان            |
| **Active**               | `active`               | ثبت‌نام شده و شماره تایید شده | فعالیت عادی مجاز             |
| **Pending Verification** | `pending_verification` | در انتظار تایید مدارک         | محدودیت جزئی                 |
| **Verified**             | `verified`             | تایید شده رسمی                | نشان اعتماد، اولویت در نتایج |
| **Suspended**            | `suspended`            | موقتاً مسدود                  | ممنوعیت موقت فعالیت          |
| **Deleted**              | `deleted`              | حذف شده                       | غیرفعال دائمی                |

### جریان وضعیت‌ها

```
Unregistered → Active → Pending Verification → Verified
                ↓                                    ↓
            Suspended ←―――――――――――――――――――――――→ Suspended
                ↓                                    ↓
            Deleted                              Deleted
```

---

## 🏷 انواع کاربر (User Types)

### سطح 1 - پایه‌ای (Primary)

| نوع              | شناسه          | توضیح              | مثال                               |
| ---------------- | -------------- | ------------------ | ---------------------------------- |
| **کاربر حقیقی**  | `individual`   | شخص عادی یا مستقل  | کاربران معمولی، برگزارکنندگان شخصی |
| **کاربر حقوقی**  | `organization` | شرکت، برند، گروه   | برگزارکنندگان تجاری، آژانس‌ها      |
| **سازمان دولتی** | `government`   | نهاد رسمی یا عمومی | دانشگاه، شهرداری، اداره فرهنگی     |

### سطح 2 - جزئی‌تر (Subtype)

| نوع              | شناسه                   | توضیح                  | مثال                        |
| ---------------- | ----------------------- | ---------------------- | --------------------------- |
| **فریلنسر**      | `individual_freelancer` | متخصص با خدمات حرفه‌ای | برگزارکننده کارگاه‌ها، مدرس |
| **گروه غیررسمی** | `organization_team`     | جمع دوستان یا تیم      | تیم ورزشی، گروه داوطلبی     |
| **شرکت خصوصی**   | `organization_private`  | کسب‌وکار ثبت‌شده       | شرکت رویداد، موسسه فرهنگی   |
| **نهاد عمومی**   | `organization_public`   | سازمان دولتی           | شهرداری، دانشگاه دولتی      |
| **NGO**          | `organization_ngo`      | سازمان غیرانتفاعی      | بنیاد خیریه، کمپین اجتماعی  |
| **آموزشی**       | `organization_edu`      | نهاد آموزشی            | مدرسه، دانشگاه، مرکز زبان   |
| **رسانه**        | `organization_media`    | برند رسانه‌ای          | خبرگزاری، پلتفرم فرهنگی     |

---

## 🔐 سیستم احراز هویت

### ورود به سیستم

```javascript
// لاگین با شماره موبایل
{
  phoneNumber: "09123456789", // آیدی کاربر
  method: "otp" | "password"
}
```

**روش‌های ورود:**

1. **OTP (پیش‌فرض)**: کد یکبار مصرف به شماره موبایل
2. **رمز ثابت**: رمز عبور تعریف شده توسط کاربر (اختیاری)

### فرآیند ثبت‌نام

```
1. ورود شماره موبایل
2. دریافت و تایید OTP
3. ایجاد حساب → وضعیت: Active
4. تکمیل پروفایل (اختیاری)
5. ارسال مدارک → وضعیت: Pending Verification
6. تایید توسط Admin → وضعیت: Verified
```

---

## 👤 ساختار پروفایل کاربر

### اطلاعات پایه (همه کاربران)

```javascript
{
  // شناسه و احراز هویت
  phoneNumber: "09123456789", // آیدی یکتا و اجباری
  password: "hashed_password", // اختیاری (برای رمز ثابت)

  // اطلاعات اصلی
  firstName: "علی",
  lastName: "احمدی",
  displayName: "علی احمدی", // نام نمایشی
  avatar: "/uploads/avatars/user123.jpg",
  bio: "توضیحات کوتاه درباره کاربر",

  // نقش و وضعیت
  roles: ["user", "event_owner"], // آرایه‌ای از نقش‌ها
  state: "active", // وضعیت کاربر
  userType: "individual", // نوع کاربر

  // تاریخ‌ها
  createdAt: "2025-01-15T10:30:00Z",
  updatedAt: "2025-01-20T14:15:00Z",
  lastLoginAt: "2025-01-27T08:00:00Z",
  verifiedAt: "2025-01-18T12:00:00Z", // null اگر verified نباشد

  // مانیتورینگ و آمار
  stats: {
    profileViews: 150,
    eventsCreated: 5,
    eventsJoined: 12,
    followersCount: 45,
    followingCount: 30
  },

  // تنظیمات
  settings: {
    language: "fa",
    notifications: true,
    privacy: {
      showPhone: false,
      showEmail: true
    }
  }
}
```

### اطلاعات اضافی برای کاربران حقیقی (`individual`)

```javascript
{
  dateOfBirth: "1990-05-15",
  gender: "male" | "female" | "other",
  nationalId: "1234567890", // کد ملی (اختیاری)
  email: "user@example.com",
  city: "تهران",
  address: "آدرس کامل",

  // شبکه‌های اجتماعی
  socialLinks: {
    instagram: "@username",
    telegram: "@username",
    linkedin: "linkedin.com/in/username"
  }
}
```

### اطلاعات اضافی برای سازمان‌ها (`organization`, `government`)

```javascript
{
  organizationName: "شرکت نمونه",
  organizationLogo: "/uploads/logos/org123.jpg",
  registrationNumber: "12345", // شناسه ثبت / شناسه ملی
  taxId: "123456789", // شناسه مالیاتی
  website: "https://example.com",
  email: "info@example.com",
  description: "توضیحات کامل درباره سازمان",

  // آدرس
  address: {
    city: "تهران",
    province: "تهران",
    postalCode: "1234567890",
    fullAddress: "آدرس کامل"
  },

  // اطلاعات تماس
  contactPerson: {
    name: "مدیر سازمان",
    phone: "09121234567",
    email: "manager@example.com"
  },

  // شبکه‌های اجتماعی
  socialLinks: {
    instagram: "@company",
    telegram: "@company",
    linkedin: "linkedin.com/company/name",
    twitter: "@company"
  },

  // مدارک
  documents: [
    {
      type: "business_license", // نوع مدرک
      fileUrl: "/uploads/docs/license.pdf",
      uploadedAt: "2025-01-15T10:00:00Z",
      status: "approved" | "pending" | "rejected",
      reviewedBy: "admin_phone_number",
      reviewedAt: "2025-01-16T09:00:00Z",
      notes: "یادداشت‌های بررسی‌کننده"
    }
  ]
}
```

---

## 📊 سیستم مانیتورینگ

### آمار کاربر (User Stats)

```javascript
{
  // آمار پروفایل
  profileViews: 150, // تعداد بازدید پروفایل
  profileViewsThisMonth: 45,

  // آمار رویدادها
  eventsCreated: 5, // تعداد رویدادهای ایجاد شده
  eventsJoined: 12, // تعداد رویدادهای شرکت‌کرده
  eventsCompleted: 10, // رویدادهای تکمیل شده

  // آمار اجتماعی
  followersCount: 45,
  followingCount: 30,
  connectionsCount: 75,

  // آمار تعامل
  likesReceived: 230,
  commentsReceived: 89,
  sharesReceived: 34,

  // امتیاز و اعتبار
  trustScore: 4.5, // از 5
  reviewsCount: 23,
  averageRating: 4.3,

  // آمار مالی (برای Event Owners)
  totalRevenue: 15000000, // ریال
  totalTransactions: 45,
  successfulPayments: 43,

  // فعالیت
  lastActiveAt: "2025-01-27T08:00:00Z",
  activeDaysCount: 45, // تعداد روزهای فعال
  responseTime: 120 // میانگین زمان پاسخ (دقیقه)
}
```

### لاگ فعالیت‌ها (Activity Logs)

```javascript
{
  userId: "09123456789",
  action: "profile_view" | "event_create" | "event_join" | "login" | "logout",
  timestamp: "2025-01-27T10:30:00Z",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  metadata: {
    // اطلاعات اضافی بسته به نوع فعالیت
  }
}
```

---

## 🎨 UI فرم ثبت‌نام

### مرحله 1: انتخاب نوع حساب

```jsx
<RadioGroup>
  <Radio value="individual">👤 شخصی (فرد حقیقی)</Radio>
  <Radio value="organization">🏢 سازمانی / برند</Radio>
  <Radio value="government">🏛 سازمان دولتی / عمومی</Radio>
</RadioGroup>
```

### مرحله 2: اطلاعات پایه

**برای همه:**

- شماره موبایل (آیدی)
- نام و نام خانوادگی
- تصویر پروفایل (اختیاری)

### مرحله 3: اطلاعات اضافی (بسته به نوع)

**برای سازمان/دولتی:**

- نام سازمان / برند
- لوگو
- شناسه ملی / ثبت
- وب‌سایت / شبکه اجتماعی
- توضیحات

---

## 🔒 سیستم RBAC (Role-Based Access Control)

### ساختار دسترسی‌ها

```javascript
// تعریف مجوزها (Permissions)
const permissions = [
  // مدیریت کاربران
  "users.view", // مشاهده لیست کاربران
  "users.create", // ایجاد کاربر جدید
  "users.edit", // ویرایش کاربران
  "users.delete", // حذف کاربران
  "users.verify", // تایید کاربران
  "users.suspend", // مسدود کردن کاربران

  // مدیریت رویدادها
  "events.view",
  "events.edit",
  "events.delete",
  "events.moderate",

  // مدیریت محتوا
  "content.moderate",
  "content.delete",
  "reports.view",
  "reports.action",

  // مدیریت مالی
  "payments.view",
  "payments.refund",
  "transactions.view",

  // تنظیمات سیستم
  "settings.view",
  "settings.edit",
  "roles.assign",
  "permissions.manage",

  // گزارش‌ها
  "analytics.view",
  "logs.view",
];
```

### نقش‌ها و مجوزها

```javascript
const rolePermissions = {
  guest: ["events.view"],

  user: ["events.view", "events.create", "events.join", "profile.edit"],

  event_owner: [
    "events.view",
    "events.create",
    "events.edit", // فقط رویدادهای خودش
    "events.manage_members",
    "payments.view", // فقط برای رویدادهای خودش
  ],

  moderator: [
    "events.view",
    "events.moderate",
    "content.moderate",
    "content.delete",
    "reports.view",
    "reports.action",
    "users.view",
  ],

  admin: [
    "*", // تمام دسترسی‌ها
  ],
};
```

### مدل دسترسی سفارشی

```javascript
// جدول user_permissions
{
  userId: "09123456789",
  permission: "users.view",
  grantedBy: "09121111111", // admin که دسترسی داده
  grantedAt: "2025-01-20T10:00:00Z",
  expiresAt: null, // null = دائمی
  scope: null // محدودیت اضافی (مثلاً فقط شهر خاص)
}
```

---

## 🖥 پنل ادمین - مدیریت کاربران

### امکانات

1. **لیست کاربران**

   - جستجو و فیلتر (بر اساس نقش، وضعیت، نوع)
   - مرتب‌سازی
   - Export به Excel/CSV

2. **مشاهده جزئیات کاربر**

   - اطلاعات کامل پروفایل
   - آمار و فعالیت‌ها
   - تاریخچه تراکنش‌ها
   - لاگ فعالیت‌ها

3. **ویرایش کاربر**

   - تغییر اطلاعات
   - تغییر وضعیت (Active, Suspended, etc.)
   - افزودن/حذف نقش
   - تایید/رد مدارک

4. **مدیریت دسترسی‌ها (RBAC)**

   - افزودن مجوز سفارشی به کاربر
   - حذف مجوز
   - مشاهده تمام دسترسی‌های کاربر

5. **عملیات گروهی**
   - تغییر وضعیت چند کاربر
   - ارسال پیام/نوتیفیکیشن گروهی

---

## 📡 API Endpoints

### احراز هویت

```
POST   /api/auth/send-otp          ارسال کد OTP
POST   /api/auth/verify-otp        تایید کد OTP و ورود
POST   /api/auth/login             ورود با رمز عبور
POST   /api/auth/logout            خروج
POST   /api/auth/refresh-token     تمدید توکن
```

### مدیریت کاربر

```
GET    /api/users/me               پروفایل کاربر جاری
PUT    /api/users/me               ویرایش پروفایل
GET    /api/users/:id              مشاهده پروفایل کاربر
GET    /api/users                  لیست کاربران (admin)
PUT    /api/users/:id              ویرایش کاربر (admin)
DELETE /api/users/:id              حذف کاربر (admin)
PATCH  /api/users/:id/state        تغییر وضعیت کاربر (admin)
POST   /api/users/:id/verify       تایید کاربر (admin)
```

### نقش‌ها و دسترسی‌ها

```
GET    /api/users/:id/roles        مشاهده نقش‌های کاربر
POST   /api/users/:id/roles        افزودن نقش
DELETE /api/users/:id/roles/:role  حذف نقش
GET    /api/users/:id/permissions  مشاهده دسترسی‌ها
POST   /api/users/:id/permissions  افزودن دسترسی
DELETE /api/users/:id/permissions/:permission حذف دسترسی
```

### آمار و فعالیت

```
GET    /api/users/:id/stats        آمار کاربر
GET    /api/users/:id/activities   لاگ فعالیت‌ها
POST   /api/users/:id/view         ثبت بازدید پروفایل
```

---

## 🔍 نمونه کدها

### چک کردن دسترسی

```javascript
// middleware/checkPermission.js
export function checkPermission(permission) {
  return async (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // چک ادمین
    if (user.roles.includes("admin")) {
      return next();
    }

    // چک مجوزهای نقش
    const hasRolePermission = user.roles.some(
      (role) =>
        rolePermissions[role]?.includes(permission) ||
        rolePermissions[role]?.includes("*")
    );

    // چک مجوزهای سفارشی
    const hasCustomPermission = await db.userPermissions.exists({
      userId: user.phoneNumber,
      permission,
      expiresAt: { $gt: new Date() }, // یا null
    });

    if (hasRolePermission || hasCustomPermission) {
      return next();
    }

    return res.status(403).json({ error: "Forbidden" });
  };
}

// استفاده
router.delete(
  "/users/:id",
  authenticate,
  checkPermission("users.delete"),
  deleteUser
);
```

### ثبت فعالیت

```javascript
// utils/logActivity.js
export async function logActivity(userId, action, metadata = {}) {
  await db.activityLogs.create({
    userId,
    action,
    timestamp: new Date(),
    ipAddress: metadata.ip,
    userAgent: metadata.userAgent,
    metadata,
  });

  // به‌روزرسانی lastActiveAt
  await db.users.updateOne(
    { phoneNumber: userId },
    { $set: { lastActiveAt: new Date() } }
  );
}
```

---

## ✅ چک‌لیست پیاده‌سازی

### Backend

- [ ] مدل User در MongoDB
- [ ] مدل Role و Permission
- [ ] مدل UserPermission (دسترسی‌های سفارشی)
- [ ] مدل ActivityLog
- [ ] سیستم احراز هویت (OTP + Password)
- [ ] Middleware احراز هویت
- [ ] Middleware بررسی دسترسی
- [ ] API های کاربری
- [ ] API های RBAC
- [ ] سیستم مانیتورینگ و آمار

### Frontend

- [ ] صفحه ثبت‌نام
- [ ] صفحه ورود
- [ ] صفحه پروفایل کاربر
- [ ] پنل ادمین - لیست کاربران
- [ ] پنل ادمین - جزئیات و ویرایش کاربر
- [ ] پنل ادمین - مدیریت دسترسی‌ها
- [ ] کامپوننت نمایش آمار
- [ ] سیستم نوتیفیکیشن

---

**آخرین به‌روزرسانی**: 27 اکتبر 2025




