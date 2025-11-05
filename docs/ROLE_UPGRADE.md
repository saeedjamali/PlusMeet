# ⬆️ راهنمای ارتقا خودکار نقش (Role Upgrade)

این مستند نحوه عملکرد سیستم ارتقا خودکار نقش را توضیح می‌دهد.

---

## 🎯 هدف

کاربرانی که ابتدا با نقش `user` ثبت‌نام کرده‌اند، می‌توانند بعداً با انتخاب نقش `event_owner` هنگام ورود، به این نقش ارتقا پیدا کنند.

---

## 📋 سناریوهای مختلف

### سناریو 1: ثبت‌نام اولیه با User

```
روز اول:
  کاربر: علی
  شماره: 09121111111
  انتخاب: 👤 کاربر عادی

  نتیجه:
  ✅ roles: ["user"]
```

### سناریو 2: ارتقا به Event Owner

```
روز دوم (همان کاربر):
  کاربر: علی
  شماره: 09121111111 (همون شماره)
  انتخاب: ⭐ مالک / مدیر رویداد

  نتیجه:
  ✅ roles: ["user", "event_owner"]  👈 ارتقا خودکار!
```

### سناریو 3: ورود مجدد (بدون تغییر)

```
روز سوم:
  کاربر: علی
  شماره: 09121111111
  انتخاب: 👤 کاربر عادی (دوباره user انتخاب کرد)

  نتیجه:
  ✅ roles: ["user", "event_owner"]  👈 نقش حذف نمیشه!
```

---

## 💻 پیاده‌سازی

### Backend Logic

```javascript
// در verify-otp API route

if (!user) {
  // کاربر جدید
  let userRoles = ["user"];
  if (role === "event_owner") {
    userRoles.push("event_owner");
  }
  user = new User({ roles: userRoles, ... });
} else {
  // کاربر قدیمی

  // ✨ ارتقا خودکار
  if (role === "event_owner" && !user.roles.includes("event_owner")) {
    console.log("⬆️ Upgrading user role to event_owner");
    user.roles.push("event_owner");

    // ثبت لاگ
    await logActivity(phoneNumber, "role_upgrade", {
      metadata: {
        newRole: "event_owner",
        allRoles: user.roles,
      },
    });
  }

  user.lastLoginAt = new Date();
  await user.save();
}
```

---

## 🧪 تست کامل

### مرحله 1: ثبت‌نام با User

```bash
1. رفتن به http://localhost:3000/login
2. شماره: 09123456789
3. انتخاب: 👤 کاربر عادی
4. دریافت و تایید OTP
```

**چک کردن:**

```bash
npm run check-user 09123456789
```

**خروجی:**

```
نقش‌ها: [user]
تعداد نقش‌ها: 1
```

---

### مرحله 2: ارتقا به Event Owner

```bash
1. رفتن به http://localhost:3000/login
2. همان شماره: 09123456789
3. انتخاب: ⭐ مالک / مدیر رویداد
4. دریافت و تایید OTP
```

**در Terminal باید ببینید:**

```
⬆️ Upgrading user role to event_owner
✅ User role upgraded: [ 'user', 'event_owner' ]
```

**چک کردن:**

```bash
npm run check-user 09123456789
```

**خروجی:**

```
نقش‌ها: [user, event_owner]  👈 هر دو نقش!
تعداد نقش‌ها: 2

🎭 تحلیل نقش‌ها:
   ✓ User (کاربر عادی): ✅ دارد
   ✓ Event Owner (مالک رویداد): ✅ دارد
```

---

### مرحله 3: ورود مجدد (تست عدم Downgrade)

```bash
1. رفتن به http://localhost:3000/login
2. همان شماره: 09123456789
3. انتخاب: 👤 کاربر عادی (عمداً user انتخاب می‌کنیم)
4. دریافت و تایید OTP
```

**چک کردن:**

```bash
npm run check-user 09123456789
```

**خروجی:**

```
نقش‌ها: [user, event_owner]  👈 هنوز هر دو نقش دارد!
تعداد نقش‌ها: 2
```

✅ **نقش event_owner حذف نشد!** (امنیتی)

---

## 🔒 قوانین امنیتی

### ✅ مجاز:

1. **User → User + Event Owner**

   ```
   ["user"] → ["user", "event_owner"]
   ```

2. **User + Event Owner → User + Event Owner**
   ```
   ["user", "event_owner"] → ["user", "event_owner"]
   (بدون تغییر)
   ```

### ❌ غیرمجاز (خودکار نیست):

1. **User + Event Owner → User**

   ```
   ["user", "event_owner"] ❌→ ["user"]
   (نقش حذف نمیشه)
   ```

2. **User → User + Moderator**

   ```
   ["user"] ❌→ ["user", "moderator"]
   (فقط Admin می‌تونه Moderator بده)
   ```

3. **User → User + Admin**
   ```
   ["user"] ❌→ ["user", "admin"]
   (فقط از طریق Script)
   ```

---

## 📊 بررسی Activity Logs

تمام تغییرات نقش در ActivityLog ثبت می‌شود:

### MongoDB Query:

```javascript
db.activitylogs
  .find({
    action: "role_upgrade",
    userId: "09123456789",
  })
  .sort({ timestamp: -1 });
```

### نتیجه:

```json
{
  "userId": "09123456789",
  "action": "role_upgrade",
  "targetType": "User",
  "metadata": {
    "newRole": "event_owner",
    "allRoles": ["user", "event_owner"]
  },
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

---

## 🎮 استفاده در Frontend

### چک کردن ارتقا

```javascript
import { useAuth } from "@/contexts/AuthContext";

function UserProfile() {
  const { user } = useAuth();

  const isUpgraded =
    user.roles.includes("user") && user.roles.includes("event_owner");

  return (
    <div>
      {isUpgraded && (
        <div className="upgrade-badge">
          🎉 شما به Event Owner ارتقا یافته‌اید!
        </div>
      )}
    </div>
  );
}
```

### نمایش امکانات جدید

```javascript
function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      {/* همه کاربران */}
      <button>مشاهده رویدادها</button>

      {/* فقط Event Owner */}
      {user.roles.includes("event_owner") && (
        <>
          <button>ایجاد رویداد جدید</button>
          <button>مدیریت رویدادهای من</button>
        </>
      )}
    </div>
  );
}
```

---

## ⚙️ تنظیمات و سفارشی‌سازی

### غیرفعال کردن ارتقا خودکار

اگر می‌خواهید ارتقا خودکار غیرفعال باشد، کد زیر را کامنت کنید:

```javascript
// در verify-otp route

// ✨ ارتقا نقش: اگر کاربر event_owner انتخاب کرده و قبلاً نداره، اضافه کن
/*
let roleUpdated = false;
if (role === "event_owner" && !user.roles.includes("event_owner")) {
  console.log("⬆️ Upgrading user role to event_owner");
  user.roles.push("event_owner");
  roleUpdated = true;
}
*/
```

### اضافه کردن شرایط دیگر

```javascript
// فقط کاربران Verified می‌توانند ارتقا پیدا کنند
if (
  role === "event_owner" &&
  !user.roles.includes("event_owner") &&
  user.state === "verified" // 👈 شرط اضافه
) {
  user.roles.push("event_owner");
  roleUpdated = true;
}
```

---

## 🔍 دیباگ و رفع مشکل

### مشکل: ارتقا اتفاق نمی‌افتد

**چک کردن:**

1. **Backend Logs:**

   ```
   ⬆️ Upgrading user role to event_owner  👈 باید ببینید
   ```

2. **Browser Console:**

   ```javascript
   console.log(user.roles);
   // باید ["user", "event_owner"] باشد
   ```

3. **Database:**
   ```bash
   npm run check-user 09123456789
   ```

**علل احتمالی:**

1. کاربر قبلاً event_owner داشته
2. `role` در request ارسال نشده
3. کاربر Admin است (نیازی به ارتقا ندارد)

---

## 📈 آمار ارتقا

### Query تعداد ارتقاها:

```javascript
db.activitylogs.countDocuments({
  action: "role_upgrade",
});
```

### Query کاربران با event_owner:

```javascript
db.users.countDocuments({
  roles: "event_owner",
});
```

---

## 💡 نکات مهم

1. ✅ ارتقا خودکار فقط برای `event_owner` فعال است
2. ✅ نقش‌ها هرگز به صورت خودکار حذف نمی‌شوند
3. ✅ تمام ارتقاها در ActivityLog ثبت می‌شوند
4. ✅ Admin Panel می‌تواند هر نقشی را اضافه/حذف کند
5. ⚠️ Moderator فقط از طریق Admin قابل تخصیص است

---

## 🔗 مستندات مرتبط

- [Testing Roles](./TESTING_ROLES.md)
- [Role Selection](./ROLE_SELECTION.md)
- [User System](./USER_SYSTEM.md)
- [RBAC Guide](./RBAC_GUIDE.md)

---

**آخرین به‌روزرسانی:** 2025-01-27



