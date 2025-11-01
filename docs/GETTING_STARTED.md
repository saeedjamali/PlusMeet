# 🚀 راهنمای شروع کار با PlusMeet

## 📋 پیش‌نیازها

قبل از شروع، مطمئن شوید که موارد زیر را نصب کرده‌اید:

- **Node.js** (نسخه 18 یا بالاتر)
- **npm** (نسخه 9 یا بالاتر) یا **yarn**
- **MongoDB** (نسخه 6 یا بالاتر)
- **Git**

---

## 🛠 نصب و راه‌اندازی

### مرحله 1: کلون کردن پروژه

```bash
git clone <repository-url>
cd pm
```

### مرحله 2: نصب Dependencies

```bash
npm install
# یا
yarn install
```

### مرحله 3: راه‌اندازی MongoDB

#### الف) نصب Local

```bash
# macOS
brew tap mongodb/brew
brew install mongodb-community

# Ubuntu/Debian
sudo apt-get install -y mongodb-org

# شروع سرویس
sudo systemctl start mongod
```

#### ب) استفاده از MongoDB Atlas (Cloud)

1. به [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) بروید
2. حساب کاربری بسازید
3. یک Cluster رایگان ایجاد کنید
4. Connection String را کپی کنید

### مرحله 4: پیکربندی Environment Variables

فایل `.env` را در ریشه پروژه ایجاد کنید:

```bash
cp .env.example .env
```

سپس محتوای آن را ویرایش کنید:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/plusmeet
# یا برای Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/plusmeet

# JWT
JWT_SECRET=your-very-secure-secret-key-minimum-32-characters-here

# SMS.ir
SMS_IR_API_KEY=your-api-key-from-sms-ir
SMS_IR_LINE_NUMBER=your-line-number
SMS_IR_TEMPLATE_ID=your-template-id

# App
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### مرحله 5: راه‌اندازی SMS.ir

برای ارسال OTP، باید در [SMS.ir](https://sms.ir) ثبت‌نام کنید:

1. ثبت‌نام و دریافت API Key
2. ایجاد الگوی OTP (Template):

```
کد تایید PlusMeet:
{{CODE}}

این کد تا 2 دقیقه اعتبار دارد.
```

3. کپی کردن Template ID

مستندات کامل: [SMS_SETUP.md](./SMS_SETUP.md)

### مرحله 6: اجرای پروژه

```bash
npm run dev
```

پروژه در آدرس http://localhost:3000 در دسترس خواهد بود.

---

## 🔐 ایجاد کاربر ادمین اولیه

### روش 1: از طریق MongoDB Shell

```bash
mongosh plusmeet

db.users.insertOne({
  phoneNumber: "09123456789",
  firstName: "Admin",
  lastName: "User",
  displayName: "Admin User",
  roles: ["admin", "user"],
  state: "active",
  userType: "individual",
  createdAt: new Date(),
  updatedAt: new Date(),
  stats: {
    profileViews: 0,
    eventsCreated: 0,
    eventsJoined: 0
  },
  settings: {
    language: "fa",
    notifications: true,
    privacy: {
      showPhone: false,
      showEmail: true
    }
  }
})
```

### روش 2: از طریق Script

```bash
node scripts/create-admin.js
```

حالا می‌توانید با شماره `09123456789` وارد شوید.

---

## 📂 ساختار پروژه

```
pm/
├── src/
│   ├── app/              # App Router
│   │   ├── api/          # API Routes
│   │   ├── admin/        # پنل ادمین
│   │   ├── login/        # صفحه ورود
│   │   └── layout.js     # Root Layout
│   ├── components/       # کامپوننت‌های React
│   │   └── ui/           # کامپوننت‌های UI
│   ├── contexts/         # React Contexts
│   ├── lib/              # کتابخانه‌ها و Utilities
│   │   ├── models/       # مدل‌های MongoDB
│   │   ├── middleware/   # Middleware ها
│   │   └── services/     # سرویس‌ها (SMS, etc.)
│   ├── styles/           # استایل‌ها
│   └── config/           # تنظیمات
├── docs/                 # مستندات
└── public/               # فایل‌های استاتیک
```

---

## 🧪 تست پروژه

### 1. بررسی Connection به MongoDB

```bash
# در ترمینال
mongosh plusmeet

# اگر وصل شد، MongoDB کار می‌کند
```

### 2. تست ارسال OTP

در محیط development، کد OTP در console نمایش داده می‌شود:

```
🔐 OTP Code for 09123456789: 12345
```

### 3. ورود به پنل

1. به `http://localhost:3000/login` بروید
2. شماره ادمین را وارد کنید
3. دکمه "دریافت کد" را بزنید
4. کد را از console کپی کنید
5. وارد کنید

---

## 📱 دسترسی به پنل ادمین

بعد از ورود، به آدرس زیر بروید:

```
http://localhost:3000/admin
```

بخش‌های پنل:

- **داشبورد**: آمار و نمودارها
- **کاربران**: مدیریت کاربران
- **رویدادها**: مدیریت رویدادها
- **گزارش‌ها**: بررسی گزارش‌ها
- **تنظیمات**: تنظیمات سیستم

---

## 🎨 تغییر تم

پنل ادمین از سیستم تم پشتیبانی می‌کند:

1. روی آیکون خورشید/ماه کلیک کنید
2. تم بین روشن و تیره تغییر می‌کند
3. تنظیمات در localStorage ذخیره می‌شود

---

## 🔒 نقش‌ها و دسترسی‌ها

### نقش‌ها

| نقش             | دسترسی              |
| --------------- | ------------------- |
| **guest**       | مشاهده عمومی        |
| **user**        | ایجاد رویداد، تعامل |
| **event_owner** | مدیریت رویداد       |
| **moderator**   | نظارت محتوا         |
| **admin**       | کنترل کامل          |

مستندات کامل: [RBAC_GUIDE.md](./RBAC_GUIDE.md)

---

## 🐛 عیب‌یابی

### خطا: Cannot connect to MongoDB

```bash
# چک کردن وضعیت MongoDB
sudo systemctl status mongod

# شروع مجدد
sudo systemctl restart mongod
```

### خطا: JWT Secret not defined

```bash
# مطمئن شوید .env دارید
ls -la .env

# و JWT_SECRET تعریف شده
cat .env | grep JWT_SECRET
```

### خطا: SMS not sending

- API Key را بررسی کنید
- موجودی حساب SMS.ir را چک کنید
- در development، کد در console نمایش داده می‌شود

### خطا: Login not working

- MongoDB را چک کنید
- کاربر ادمین را بررسی کنید
- لاگ‌های console را ببینید

---

## 📚 مستندات مرتبط

- [USER_SYSTEM.md](./USER_SYSTEM.md) - سیستم کاربری
- [RBAC_GUIDE.md](./RBAC_GUIDE.md) - راهنمای RBAC
- [SMS_SETUP.md](./SMS_SETUP.md) - راه‌اندازی SMS
- [COLOR_PALETTE.md](./COLOR_PALETTE.md) - پالت رنگی
- [TYPOGRAPHY.md](./TYPOGRAPHY.md) - تایپوگرافی
- [APP_ROUTER_GUIDE.md](./APP_ROUTER_GUIDE.md) - راهنمای App Router

---

## 🤝 مشارکت

برای مشارکت در پروژه:

1. Fork کنید
2. Branch جدید بسازید
3. تغییرات را Commit کنید
4. Push کنید
5. Pull Request ایجاد کنید

---

## 📞 پشتیبانی

در صورت بروز مشکل:

1. [مستندات](../docs/) را بررسی کنید
2. [Issues](../../issues) را چک کنید
3. Issue جدید ایجاد کنید

---

## 🎉 آماده‌اید!

حالا می‌توانید شروع به توسعه کنید. موفق باشید! 🚀

**نکته**: همیشه قبل از شروع، `git pull` کنید تا آخرین تغییرات را داشته باشید.

---

**آخرین به‌روزرسانی**: 27 اکتبر 2025



