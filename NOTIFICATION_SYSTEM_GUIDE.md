# 🔔 راهنمای کامل سیستم اعلانات PlusMeet

سیستم اعلانات کامل با قابلیت‌های زیر:

## ✅ قابلیت‌های پیاده‌سازی شده:

### 1️⃣ Backend (Models & APIs):
- ✅ `Notification.model.js` - مدل اصلی اعلانات
- ✅ `UserNotification.model.js` - ردیابی خوانده/نخوانده
- ✅ `/api/admin/notifications` - CRUD مدیریت
- ✅ `/api/admin/notifications/:id` - عملیات تک اعلان
- ✅ `/api/notifications` - دریافت اعلانات کاربر
- ✅ `/api/notifications/unread-count` - شمارش خوانده نشده
- ✅ `/api/notifications/:id/read` - علامت‌گذاری خوانده شده
- ✅ `/api/notifications/:id/click` - علامت‌گذاری کلیک
- ✅ `/api/notifications/mark-all-read` - خواندن همه

### 2️⃣ Frontend (Pages):
- ✅ `/dashboard/notifManager` - صفحه مدیریت (admin/moderator)
- ⏳ `/dashboard/notifBox` - صندوق اعلانات کاربر
- ⏳ کامپوننت NotificationBell در Header

---

## 📝 فایل‌های باقیمانده که باید ایجاد شوند:

### 1. NotificationForm.js
### 2. notifManager.module.css
### 3. صفحه notifBox  
### 4. کامپوننت NotificationBell
### 5. بروزرسانی RBAC

---

## 🚀 مراحل تکمیل:

به دلیل محدودیت طول، فایل‌های باقیمانده را در پیام‌های بعدی ارسال می‌کنم.

### فایل‌هایی که نیاز است:

```
1. src/app/dashboard/notifManager/NotificationForm.js
2. src/app/dashboard/notifManager/notifManager.module.css
3. src/app/dashboard/notifBox/page.js
4. src/app/dashboard/notifBox/notifBox.module.css
5. src/components/dashboard/NotificationBell.js
6. src/components/dashboard/NotificationBell.module.css
7. بروزرسانی seed-rbac.js
8. بروزرسانی ActivityLog.model.js
```

---

## 📊 ساختار دیتابیس:

### Notification Schema:
```javascript
{
  title: String (required),
  message: String (required),
  image: String,
  type: "info" | "success" | "warning" | "error" | "announcement",
  priority: "low" | "medium" | "high" | "urgent",
  targetRoles: [String],  // ["admin", "user"] یا [] برای همه
  targetUsers: [ObjectId], // کاربران مشخص
  actionUrl: String,
  actionText: String,
  scheduledAt: Date,
  expiresAt: Date,
  status: "draft" | "scheduled" | "published" | "expired" | "cancelled",
  pinned: Boolean,
  viewCount: Number,
  clickCount: Number,
  createdBy: ObjectId,
  updatedBy: ObjectId
}
```

### UserNotification Schema:
```javascript
{
  user: ObjectId (required),
  notification: ObjectId (required),
  isRead: Boolean,
  readAt: Date,
  isClicked: Boolean,
  clickedAt: Date,
  isDeleted: Boolean,
  deletedAt: Date
}
```

---

## 🎯 API Endpoints:

### Admin APIs:
- `GET /api/admin/notifications` - لیست اعلانات
- `POST /api/admin/notifications` - ایجاد اعلان
- `GET /api/admin/notifications/:id` - جزئیات
- `PUT /api/admin/notifications/:id` - ویرایش
- `DELETE /api/admin/notifications/:id` - حذف

### User APIs:
- `GET /api/notifications` - دریافت اعلانات
- `GET /api/notifications/unread-count` - تعداد خوانده نشده
- `POST /api/notifications/:id/read` - خواندن
- `POST /api/notifications/:id/click` - کلیک
- `POST /api/notifications/mark-all-read` - خواندن همه

---

## 🎨 UI Components:

### 1. NotificationManager (Admin):
- لیست اعلانات با فیلتر
- فرم ایجاد/ویرایش
- بارگذاری تصویر
- انتخاب نقش‌های هدف
- زمان‌بندی

### 2. NotificationBox (User):
- لیست اعلانات دریافتی
- فیلتر خوانده/نخوانده
- علامت‌گذاری به عنوان خوانده شده

### 3. NotificationBell (Header):
- آیکن زنگ با badge
- Dropdown اعلانات
- بروزرسانی real-time

---

## 💡 نکات مهم:

1. **دسترسی**: فقط admin و moderator می‌توانند اعلان ایجاد کنند
2. **نقش‌های هدف**: اگر خالی باشد، برای همه نمایش داده می‌شود
3. **زمان‌بندی**: اعلانات می‌توانند برای آینده زمان‌بندی شوند
4. **انقضا**: اعلانات می‌توانند تاریخ انقضا داشته باشند
5. **Pin**: اعلانات مهم می‌توانند در بالا نمایش داده شوند

---

**ادامه دارد...**




