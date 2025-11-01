# 🎭 سیستم انتخاب نقش در ثبت‌نام

این مستند توضیحات کاملی درباره سیستم انتخاب نقش در زمان ثبت‌نام ارائه می‌دهد.

---

## 📋 نقش‌های قابل انتخاب

کاربران در زمان ثبت‌نام می‌توانند یکی از دو نوع حساب را انتخاب کنند:

### 1️⃣ کاربر عادی (User)

**نقش:** `["user"]`

**امکانات:**

- شرکت در رویدادها
- ارتباط با دیگر کاربران
- پیوستن به تیم‌ها
- مشاهده و جستجوی رویدادها
- مدیریت پروفایل شخصی

**مناسب برای:**

- افرادی که می‌خواهند در رویدادها شرکت کنند
- کسانی که به دنبال همراه برای فعالیت‌ها هستند
- اعضای تیم‌ها و گروه‌ها

---

### 2️⃣ مالک / مدیر رویداد (Event Owner)

**نقش:** `["user", "event_owner"]`

**امکانات:**

- تمام امکانات کاربر عادی
- ✨ **ایجاد رویداد**
- ✨ **تشکیل تیم**
- ✨ **مدیریت اعضا**
- ✨ **مدیریت مالی رویداد**
- ✨ **درخواست‌های عضویت**
- ✨ **تنظیمات رویداد**

**مناسب برای:**

- سازماندهندگان رویدادها
- برگزارکنندگان کارگاه‌ها و دوره‌ها
- مدیران تیم‌های ورزشی
- افراد یا سازمان‌های برگزارکننده

---

## 🚫 نقش‌های غیرقابل انتخاب

### Moderator (ناظر محتوا)

**نقش:** `["user", "moderator"]`

**محدودیت:** فقط توسط **Admin** قابل تخصیص است.

**امکانات:**

- بررسی تخلفات
- مدیریت گزارش‌ها
- تایید یا رد محتوا
- مسدود کردن محتوای نامناسب

**چرا قابل انتخاب نیست؟**
این نقش نیازمند اعتماد و اختیارات خاص است و باید توسط مدیر سیستم تخصیص داده شود.

---

### Admin (مدیر سیستم)

**نقش:** `["user", "admin"]`

**محدودیت:** فقط از طریق **اسکریپت** یا **مدیر قبلی** قابل ایجاد است.

**امکانات:**

- کنترل کامل سیستم
- مدیریت کاربران
- تخصیص نقش‌ها
- تنظیمات سیستم
- دسترسی به Admin Panel

---

## 💻 پیاده‌سازی

### Frontend

#### UI Components

در صفحه لاگین **قبل از ارسال OTP**، برای همه کاربران:

```jsx
{
  /* انتخاب نوع حساب به صورت دکمه */
}
<div className={styles.inputGroup}>
  <label className={styles.label}>نوع حساب کاربری</label>
  <div className={styles.roleButtons}>
    <button
      type="button"
      className={`${styles.roleButton} ${
        selectedRole === "user" ? styles.roleButtonActive : ""
      }`}
      onClick={() => setSelectedRole("user")}
    >
      <span className={styles.roleIcon}>👤</span>
      <span className={styles.roleTitle}>کاربر عادی</span>
      <span className={styles.roleDesc}>شرکت در رویدادها</span>
    </button>
    <button
      type="button"
      className={`${styles.roleButton} ${
        selectedRole === "event_owner" ? styles.roleButtonActive : ""
      }`}
      onClick={() => setSelectedRole("event_owner")}
    >
      <span className={styles.roleIcon}>⭐</span>
      <span className={styles.roleTitle}>مالک / مدیر رویداد</span>
      <span className={styles.roleDesc}>ایجاد و مدیریت رویداد</span>
    </button>
  </div>
</div>;
```

**نکات مهم:**

1. انتخاب نقش به صورت **دکمه** (نه dropdown) برای UX بهتر
2. نمایش ایموجی، عنوان و توضیحات در هر دکمه
3. حالت Active با رنگ و سایه متفاوت
4. Responsive: در موبایل دکمه‌ها به صورت عمودی
5. انتخاب در مرحله اول (قبل از ارسال OTP)

#### AuthContext

```javascript
const loginWithOTP = async (phoneNumber, code, role) => {
  const body = { phoneNumber, code };
  if (role) {
    body.role = role;
  }

  const response = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // ...
};
```

**تغییر در فلو:**

1. کاربر شماره موبایل و نوع حساب را انتخاب می‌کند
2. دکمه "دریافت کد تایید" را می‌زند
3. OTP دریافت می‌شود
4. کد را وارد می‌کند
5. در backend، اگر کاربر جدید باشد، نقش انتخاب‌شده اعمال می‌شود
6. اگر کاربر قدیمی باشد، نقش تغییری نمی‌کند

---

### Backend

#### API Route: `/api/auth/verify-otp`

```javascript
const { phoneNumber, code, role } = await request.json();

// ...

if (!user) {
  // ثبت‌نام کاربر جدید
  isNewUser = true;

  // تعیین نقش‌ها بر اساس انتخاب کاربر
  let userRoles = ["user"]; // پیش‌فرض
  if (role === "event_owner") {
    userRoles.push("event_owner");
  }

  user = new User({
    phoneNumber,
    firstName: "کاربر",
    lastName: phoneNumber.substring(7),
    displayName: `کاربر ${phoneNumber.substring(7)}`,
    roles: userRoles,
    state: "active",
    userType: "individual",
    lastLoginAt: new Date(),
  });

  await user.save();
}
```

---

## 🎨 طراحی UI

### استایل دکمه‌ها

```css
.roleButtons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.roleButton {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-bg-primary);
  transition: all 0.3s ease;
}

.roleButton:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.roleButtonActive {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  box-shadow: 0 4px 12px rgba(244, 163, 37, 0.2);
}

.roleIcon {
  font-size: 2rem;
}

.roleTitle {
  font-weight: 600;
  font-size: 0.95rem;
}

.roleDesc {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}
```

### Responsive

- **Desktop:** دو دکمه در کنار هم (grid 2 columns)
- **Mobile:** دکمه‌ها به صورت عمودی (grid 1 column)
- **Hover Effect:** تغییر رنگ border و انیمیشن translateY
- **Active State:** پس‌زمینه رنگی و سایه

---

## 🔒 امنیت

### اعتبارسنجی Backend

```javascript
// فقط role های مجاز
const allowedRoles = ["user", "event_owner"];
if (role && !allowedRoles.includes(role)) {
  return NextResponse.json({ error: "Invalid role" }, { status: 400 });
}
```

### محدودیت‌ها

1. ❌ کاربر نمی‌تواند `moderator` یا `admin` انتخاب کند
2. ❌ نقش‌های اضافی باید توسط Admin تخصیص داده شوند
3. ✅ فقط در زمان ثبت‌نام قابل انتخاب است
4. ✅ بعد از ثبت‌نام، تغییر نقش فقط از طریق Admin Panel

---

## 🧪 تست

### تست 1: کاربر عادی

```bash
POST /api/auth/verify-otp
{
  "phoneNumber": "09123456789",
  "code": "12345",
  "role": "user"
}

# Expected Response:
{
  "success": true,
  "data": {
    "user": {
      "phoneNumber": "09123456789",
      "roles": ["user"]
    }
  }
}
```

### تست 2: Event Owner

```bash
POST /api/auth/verify-otp
{
  "phoneNumber": "09123456790",
  "code": "12345",
  "role": "event_owner"
}

# Expected Response:
{
  "success": true,
  "data": {
    "user": {
      "phoneNumber": "09123456790",
      "roles": ["user", "event_owner"]
    }
  }
}
```

### تست 3: بدون انتخاب (پیش‌فرض)

```bash
POST /api/auth/verify-otp
{
  "phoneNumber": "09123456791",
  "code": "12345"
}

# Expected Response:
{
  "success": true,
  "data": {
    "user": {
      "phoneNumber": "09123456791",
      "roles": ["user"]  # نقش پیش‌فرض
    }
  }
}
```

---

## 🔄 تغییر نقش بعد از ثبت‌نام

### توسط کاربر

❌ **غیرممکن** - کاربر نمی‌تواند خودش نقشش را تغییر دهد.

### توسط Admin

✅ **ممکن** - از طریق Admin Panel:

1. رفتن به صفحه User Management
2. انتخاب کاربر
3. کلیک روی "Manage Roles"
4. اضافه/حذف نقش‌ها

```
/admin/users → Select User → Manage Roles → Update
```

---

## 📊 آمار و گزارش‌ها

### تعداد کاربران بر اساس نقش

```javascript
// در Admin Dashboard
const userStats = {
  totalUsers: await User.countDocuments(),
  regularUsers: await User.countDocuments({ roles: ["user"] }),
  eventOwners: await User.countDocuments({ roles: { $in: ["event_owner"] } }),
  moderators: await User.countDocuments({ roles: { $in: ["moderator"] } }),
  admins: await User.countDocuments({ roles: { $in: ["admin"] } }),
};
```

---

## 💡 نکات مهم

### برای کاربران

1. نقش را با دقت انتخاب کنید
2. می‌توانید بعداً از طریق Admin نقش اضافه کنید
3. Event Owner می‌تواند در رویدادها شرکت کند (هر دو نقش را دارد)

### برای توسعه‌دهندگان

1. همیشه `user` را در array نقش‌ها نگه دارید
2. از middleware برای چک کردن نقش‌ها استفاده کنید
3. Log کردن تغییرات نقش‌ها در ActivityLog

### برای Admins

1. نقش Moderator را فقط به افراد مورد اعتماد بدهید
2. Admin را فقط از طریق اسکریپت ایجاد کنید
3. تغییرات نقش‌ها در ActivityLog ثبت می‌شود

---

## 🔗 مستندات مرتبط

- [User System](./USER_SYSTEM.md)
- [RBAC Guide](./RBAC_GUIDE.md)
- [Admin Panel](./ADMIN_PANEL.md)
- [Authentication](./AUTH_DEBUGGING.md)

---

**آخرین به‌روزرسانی:** 2025-01-27
