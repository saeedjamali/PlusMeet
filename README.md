# PlusMeet 🎉

> **با هم، بهتر** | Better Together

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-UNLICENSED-red?style=for-the-badge)]()

**پلتفرم هوشمند اشتراک‌گذاری رویدادها و همکاری اجتماعی**

[مستندات](docs/) • [شروع سریع](#-شروع-سریع) • [ویژگی‌ها](#-ویژگی‌های-کلیدی) • [پنل مدیریت](docs/ADMIN_PANEL.md)

</div>

---

## 📖 درباره پروژه

**PlusMeet** یک سامانه هوشمند برای **اشتراک‌گذاری رویدادها** و **یافتن همراهان فعالیت‌های اجتماعی** است. این پلتفرم به کاربران اجازه می‌دهد:

✅ رویدادهایی از نوع‌های مختلف (ورزشی، آموزشی، تفریحی، فرهنگی) ایجاد کنند  
✅ به رویدادهای دیگران بپیوندند  
✅ همراه برای فعالیت‌های مختلف پیدا کنند  
✅ هزینه‌ها را به‌صورت شفاف تقسیم کنند

---

## 🎯 ویژگی‌های کلیدی

### 🎨 طراحی مدرن

- رابط کاربری زیبا و مینیمال
- تم روشن و تیره (Light/Dark Mode)
- طراحی Responsive (موبایل، تبلت، دسکتاپ)
- انیمیشن‌های ملایم و حرفه‌ای

### 🔐 احراز هویت قوی

- ورود با OTP (SMS.ir)
- ورود با رمز عبور
- ثبت‌نام خودکار کاربران جدید
- مدیریت توکن JWT + Refresh Token

### 👥 سیستم کاربری پیشرفته

- نقش‌های چندگانه (Admin, Moderator, User, Event Owner)
- وضعیت‌های کاربر (Active, Verified, Suspended)
- انواع کاربر (Individual, Organization, Government)
- سیستم RBAC کامل

### 📊 پنل مدیریت

- داشبورد با آمار و نمودار
- مدیریت کاربران و رویدادها
- گزارش‌های تحلیلی
- لاگ فعالیت‌ها (Activity Log)

### 🌍 چندزبانه

- فارسی (پیش‌فرض)
- انگلیسی
- آماده برای افزودن زبان‌های بیشتر

---

## 🚀 شروع سریع

### پیش‌نیازها

```bash
Node.js >= 18.0.0
npm >= 9.0.0
MongoDB >= 6.0
```

### نصب

```bash
# 1. کلون کردن پروژه
git clone https://github.com/your-username/plusmeet.git
cd plusmeet

# 2. نصب وابستگی‌ها
npm install

# 3. تنظیم متغیرهای محیطی
cp .env.example .env
# سپس .env را ویرایش کنید

# 4. اجرای MongoDB (اگر به‌صورت local)
mongod

# 5. اجرای پروژه
npm run dev
```

پروژه روی `http://localhost:3000` اجرا می‌شود.

---

## 📁 ساختار پروژه

```
plusmeet/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # پنل مدیریت
│   │   │   ├── login/          # صفحه لاگین ادمین
│   │   │   ├── layout.js       # Layout ادمین
│   │   │   └── page.js         # داشبورد
│   │   ├── api/                # API Routes
│   │   │   └── auth/           # احراز هویت
│   │   ├── layout.js           # Root Layout
│   │   └── page.js             # صفحه اصلی
│   ├── components/             # کامپوننت‌های React
│   │   └── ui/                 # UI Components
│   ├── contexts/               # React Contexts
│   │   ├── AuthContext.js      # مدیریت احراز هویت
│   │   └── ThemeContext.js     # مدیریت تم
│   ├── lib/                    # Utilities & Configs
│   │   ├── models/             # Mongoose Models
│   │   ├── middleware/         # Express Middleware
│   │   ├── services/           # Business Logic
│   │   └── db/                 # Database Connection
│   ├── styles/                 # Global Styles
│   └── config/                 # Configuration Files
├── docs/                       # مستندات
├── scripts/                    # Scripts (e.g. create-admin)
├── public/                     # Static Files
└── .env.example                # نمونه متغیرهای محیطی
```

---

## 🎨 تکنولوژی‌ها

| دسته‌بندی            | تکنولوژی                                       |
| -------------------- | ---------------------------------------------- |
| **Frontend**         | Next.js 14 (App Router), React 18, CSS Modules |
| **Backend**          | Next.js API Routes, Node.js                    |
| **Database**         | MongoDB, Mongoose                              |
| **Authentication**   | JWT, bcryptjs, SMS.ir (OTP)                    |
| **State Management** | React Context API                              |
| **Styling**          | CSS Variables, CSS Modules                     |
| **Fonts**            | Vazirmatn, Yekan, Inter, Poppins               |

---

## 📚 مستندات

| مستند                                                   | توضیح                                         |
| ------------------------------------------------------- | --------------------------------------------- |
| [شروع به کار](docs/GETTING_STARTED.md)                  | راهنمای نصب و راه‌اندازی                      |
| [پنل مدیریت](docs/ADMIN_PANEL.md)                       | راهنمای استفاده از پنل ادمین                  |
| [صفحات ورود](docs/LOGIN_PAGES.md)                       | راهنمای صفحات Login                           |
| [سیستم تم](docs/THEME_SYSTEM.md)                        | مستندات ThemeToggle و تم‌ها                   |
| [سیستم کاربری](docs/USER_SYSTEM.md)                     | نقش‌ها، وضعیت‌ها و انواع کاربر                |
| [مدیریت کاربران](docs/USER_MANAGEMENT.md)               | راهنمای صفحه مدیریت کاربران                   |
| [مدیریت نقش‌ها (Admin)](docs/ADMIN_ROLES_MANAGEMENT.md) | تغییر نقش کاربران در پنل ادمین                |
| [پروفایل کاربر](docs/USER_PROFILE.md)                   | راهنمای صفحه پروفایل و ویرایش اطلاعات         |
| [Navigation](docs/NAVIGATION.md)                        | راهنمای دسترسی به صفحات و منوها               |
| [Cookie Authentication](docs/COOKIE_AUTH_GUIDE.md)      | 🔐 راهنمای جامع احراز هویت با httpOnly Cookie |
| [RBAC](docs/RBAC_GUIDE.md)                              | کنترل دسترسی مبتنی بر نقش                     |
| [انتخاب نقش](docs/ROLE_SELECTION.md)                    | راهنمای ثبت‌نام با نقش                        |
| [ارتقا نقش](docs/ROLE_UPGRADE.md)                       | ارتقا خودکار نقش کاربران                      |
| [تست نقش‌ها](docs/TESTING_ROLES.md)                     | راهنمای تست و دیباگ نقش‌ها                    |
| [تنظیم SMS](docs/SMS_SETUP.md)                          | پیکربندی SMS.ir                               |
| [پالت رنگی](docs/COLOR_PALETTE.md)                      | رنگ‌ها و تم                                   |
| [تایپوگرافی](docs/TYPOGRAPHY.md)                        | فونت‌ها و سبک‌ها                              |
| [طراحی مجدد Frontend](docs/FRONTEND_REDESIGN.md)        | خلاصه تغییرات طراحی                           |

---

## 🔑 دسترسی اولیه

برای ایجاد کاربر Admin اولیه:

```bash
node scripts/create-admin.js
```

**اطلاعات پیش‌فرض:**

- شماره: `09123456789`
- رمز: `admin123`

سپس به آدرس زیر بروید:

```
http://localhost:3000/admin/login
```

---

## 🌐 صفحات

| مسیر              | توضیح                   |
| ----------------- | ----------------------- |
| `/`               | صفحه اصلی               |
| `/login`          | ورود کاربران عادی       |
| `/admin/login`    | ورود به پنل مدیریت      |
| `/admin`          | داشبورد ادمین           |
| `/admin/users`    | مدیریت کاربران          |
| `/admin/events`   | مدیریت رویدادها         |
| `/admin/reports`  | گزارش‌ها                |
| `/admin/settings` | تنظیمات                 |
| `/dashboard`      | داشبورد کاربران (آینده) |

---

## 🔧 متغیرهای محیطی

فایل `.env` را ایجاد کنید:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/plusmeet

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-token-secret-here

# SMS.ir
SMS_IR_API_KEY=your-sms-ir-api-key
SMS_IR_LINE_NUMBER=your-sms-line-number
SMS_IR_TEMPLATE_ID=your-otp-template-id

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🎨 تم و رنگ‌بندی

پروژه از **پالت "Cozy Harmony"** استفاده می‌کند:

### تم روشن

```css
--color-primary: #F4A325       /* Amber Gold */
--color-accent: #FFC15E        /* Golden Glow */
--color-secondary: #267D88     /* Ocean Mist */
--color-bg-default: #F5E6C8    /* Soft Cream */
```

### تم تیره

```css
--color-primary: #E2981E
--color-bg-default: #0D4C57    /* Deep Teal */
--color-bg-secondary: #1E4049  /* Shadow Blue */
```

---

## 🤝 مشارکت

مشارکت شما در توسعه PlusMeet خوشایند است!

1. Fork کنید
2. Branch جدید بسازید (`git checkout -b feature/amazing-feature`)
3. تغییرات را Commit کنید (`git commit -m 'Add amazing feature'`)
4. Push کنید (`git push origin feature/amazing-feature`)
5. Pull Request باز کنید

---

## 📝 لایسنس

این پروژه تحت لایسنس **UNLICENSED** است. برای استفاده تجاری با توسعه‌دهندگان تماس بگیرید.

---

## 📞 پشتیبانی

مشکل یا سوالی دارید؟

- 📧 Email: support@plusmeet.ir
- 🐛 [گزارش باگ](https://github.com/your-username/plusmeet/issues)
- 💬 [بحث و گفتگو](https://github.com/your-username/plusmeet/discussions)

---

## 🙏 تشکر

از تمامی کسانی که در توسعه این پروژه مشارکت داشته‌اند، سپاسگزاریم!

<div align="center">

**با هم، بهتر** 🎉

Made with ❤️ by PlusMeet Team

</div>
