# راهنمای Navigation و دسترسی به صفحات

راهنمای کامل navigation و دسترسی به صفحات مختلف در PlusMeet

## 📋 فهرست مطالب

- [صفحه اصلی](#صفحه-اصلی)
- [پنل ادمین](#پنل-ادمین)
- [صفحه پروفایل](#صفحه-پروفایل)
- [دسترسی سریع](#دسترسی-سریع)

---

## صفحه اصلی

### Navigation بالای صفحه

در صفحه اصلی (`/`) یک navigation ثابت در بالای صفحه وجود دارد:

```
┌───────────────────────────────────────────────┐
│ PM  پلاس میت    👤 پروفایل  ⚙️ پنل  خروج │
└───────────────────────────────────────────────┘
```

### برای کاربران لاگین شده

- **👤 پروفایل** - انتقال به صفحه پروفایل کاربری
- **⚙️ پنل مدیریت** - نمایش داده می‌شود فقط برای Admin
- **خروج** - خروج از حساب کاربری

### برای مهمان‌ها (غیر لاگین)

- **ورود** - انتقال به صفحه ورود
- **ثبت‌نام** - انتقال به صفحه ثبت‌نام (همان ورود)

### ویژگی‌ها

- ✅ **Fixed Position** - همیشه در بالای صفحه قابل مشاهده است
- ✅ **Backdrop Blur** - افکت blur در پس‌زمینه
- ✅ **Responsive** - سازگار با موبایل (متن لوگو در موبایل پنهان می‌شود)
- ✅ **تم تیره/روشن** - رنگ‌ها با تم تطبیق پیدا می‌کنند

---

## پنل ادمین

### Sidebar Navigation

در پنل ادمین (`/admin`) یک sidebar کامل وجود دارد:

```
┌─────────────────┐
│ PM  PlusMeet    │
├─────────────────┤
│ 🏠 داشبورد      │
│ 👥 کاربران      │
│ 📅 رویدادها     │
│ 📊 گزارش‌ها     │
│ ⚙️ تنظیمات      │
├─────────────────┤
│ [Theme Toggle]  │
│                 │
│ [علی محمدی 👤]  │ ← کلیک کنید
│ مدیر            │
│                 │
│ [خروج]          │
└─────────────────┘
```

### کلیک روی نام کاربری

**کاربر می‌تواند با کلیک روی نام خود به صفحه پروفایل منتقل شود.**

**ویژگی‌ها:**

- ✅ آیکون 👤 در کنار نام کاربری
- ✅ Tooltip: "کلیک کنید برای مشاهده پروفایل 👤"
- ✅ Hover Effect:
  - Background: رنگ primary با شفافیت
  - Border: primary color
  - Shadow: سایه زرد رنگ
  - Transform: انیمیشن translateY(-2px)
- ✅ Active State: برگشت به حالت اولیه

### نحوه استفاده

1. وارد پنل ادمین شوید
2. در sidebar پایین، نام کاربری خود را ببینید
3. موس را روی آن ببرید (Hover Effect)
4. کلیک کنید → انتقال به صفحه پروفایل

---

## صفحه پروفایل

### دسترسی به پروفایل

صفحه پروفایل در مسیر `/profile` قرار دارد.

**راه‌های دسترسی:**

1. **از صفحه اصلی (`/`):**

   - کلیک روی **"👤 پروفایل"** در navigation بالا

2. **از پنل ادمین (`/admin`):**

   - کلیک روی **نام کاربری خود** در sidebar

3. **URL مستقیم:**
   ```
   http://localhost:3000/profile
   ```

### شرایط دسترسی

- ⚠️ کاربر باید **لاگین** باشد
- اگر لاگین نباشید، به صفحه `/login` هدایت می‌شوید

### Header پروفایل

```
┌─────────────────────────────────────────┐
│ ← بازگشت    پروفایل کاربری              │
│              09123456789                 │
└─────────────────────────────────────────┘
```

**دکمه بازگشت:**

- کلیک کنید → برگشت به صفحه اصلی (`/`)

---

## دسترسی سریع

### نقشه راه‌های Navigation

```
صفحه اصلی (/)
├── [لوگو کلیک] → بازگشت به صفحه اصلی
├── [👤 پروفایل] → /profile
├── [⚙️ پنل] → /admin (فقط Admin)
└── [خروج] → Logout + /login

پنل ادمین (/admin)
├── [نام کاربری] → /profile
├── [داشبورد] → /admin
├── [کاربران] → /admin/users
├── [رویدادها] → /admin/events
├── [گزارش‌ها] → /admin/reports
├── [تنظیمات] → /admin/settings
└── [خروج] → Logout + /login

صفحه پروفایل (/profile)
├── [← بازگشت] → /
├── [⭐ فعال‌سازی نقش] → ارتقا به Event Owner
└── [🔒 تغییر رمز] → Modal تغییر رمز
```

---

## نکات مهم

### امنیت

- ✅ تمام صفحات محافظت شده با Authentication Guard
- ✅ پنل ادمین فقط برای کاربران با نقش `admin` قابل دسترسی
- ✅ صفحه پروفایل فقط برای کاربران لاگین شده

### UX

- ✅ Hover Effects در تمام لینک‌ها
- ✅ Tooltips توضیحی
- ✅ انیمیشن‌های نرم
- ✅ رنگ‌های consistent با تم

### Responsive

- ✅ Navigation موبایل: فقط لوگو + دکمه‌های ضروری
- ✅ Sidebar ادمین: قابل بستن (Toggle)
- ✅ پروفایل: Grid Layout → Stack در موبایل

---

## مثال‌های کد

### Navigation در صفحه اصلی

```javascript
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav>
      {isAuthenticated ? (
        <>
          <button onClick={() => router.push("/profile")}>👤 پروفایل</button>
          {user?.roles?.includes("admin") && (
            <button onClick={() => router.push("/admin")}>⚙️ پنل مدیریت</button>
          )}
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            خروج
          </button>
        </>
      ) : (
        <>
          <button onClick={() => router.push("/login")}>ورود</button>
          <button onClick={() => router.push("/login")}>ثبت‌نام</button>
        </>
      )}
    </nav>
  );
}
```

### Clickable User Info در Admin Layout

```javascript
<div
  className={styles.userInfo}
  onClick={() => router.push("/profile")}
  title="کلیک کنید برای مشاهده پروفایل 👤"
>
  <div className={styles.userAvatar}>{user?.displayName?.[0] || "U"}</div>
  <div className={styles.userDetails}>
    <div className={styles.userName}>{user?.displayName || "کاربر"} 👤</div>
    <div className={styles.userRole}>
      {user?.roles?.includes("admin") ? "مدیر" : "کاربر"}
    </div>
  </div>
</div>
```

### CSS Hover Effect

```css
.userInfo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-bg-default);
  border-radius: 10px;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.userInfo:hover {
  background: var(--color-primary-bg);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 163, 37, 0.2);
}

.userInfo:active {
  transform: translateY(0);
}
```

---

## مشکلات رایج

### 1. "نمی‌توانم به پروفایل دسترسی پیدا کنم"

**دلیل:** لاگین نیستید  
**راه حل:** ابتدا Login کنید

### 2. "لینک پنل مدیریت نمایش داده نمی‌شود"

**دلیل:** نقش Admin ندارید  
**راه حل:** فقط برای کاربران Admin قابل مشاهده است

### 3. "کلیک روی نام کاربری کار نمی‌کند"

**دلیل:** JavaScript خطا دارد  
**راه حل:** Console browser را چک کنید

---

## لینک‌های مرتبط

- [مستندات پروفایل](./USER_PROFILE.md)
- [مستندات پنل ادمین](./ADMIN_PANEL.md)
- [مستندات احراز هویت](./AUTH_DEBUGGING.md)

---

**آخرین به‌روزرسانی:** 28 اکتبر 2025  
**نسخه:** 1.0.0






