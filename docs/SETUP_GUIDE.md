# راهنمای راه‌اندازی کامل PlusMeet

این راهنما برای توسعه‌دهندگانی است که برای اولین بار پروژه را راه‌اندازی می‌کنند.

## 📋 پیش‌نیازها

### 1. نصب Node.js

**Windows:**

1. از [nodejs.org](https://nodejs.org) نسخه LTS را دانلود کنید
2. فایل نصب را اجرا کنید
3. برای تست در CMD بنویسید:
   \`\`\`bash
   node --version
   npm --version
   \`\`\`

**Mac:**
\`\`\`bash
brew install node
\`\`\`

**Linux:**
\`\`\`bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
\`\`\`

### 2. نصب Git

**Windows:**

- از [git-scm.com](https://git-scm.com) دانلود کنید

**Mac:**
\`\`\`bash
brew install git
\`\`\`

**Linux:**
\`\`\`bash
sudo apt-get install git
\`\`\`

### 3. نصب IDE

پیشنهادی:

- **VS Code**: [code.visualstudio.com](https://code.visualstudio.com)
- **WebStorm**: [jetbrains.com/webstorm](https://www.jetbrains.com/webstorm/)

#### Extension های پیشنهادی برای VS Code:

- ES7+ React/Redux/React-Native snippets
- ESLint
- Prettier
- CSS Modules
- Path Intellisense

## 🚀 راه‌اندازی پروژه

### مرحله 1: کلون کردن پروژه

\`\`\`bash

# با HTTPS

git clone https://github.com/your-org/plusmeet.git

# یا با SSH

git clone git@github.com:your-org/plusmeet.git

# ورود به پوشه پروژه

cd plusmeet
\`\`\`

### مرحله 2: نصب Dependencies

\`\`\`bash
npm install
\`\`\`

اگر با خطا مواجه شدید:
\`\`\`bash

# پاک کردن cache

npm cache clean --force

# حذف node_modules

rm -rf node_modules

# نصب مجدد

npm install
\`\`\`

### مرحله 3: تنظیم Environment Variables

\`\`\`bash

# کپی فایل نمونه

cp .env.example .env.local

# ویرایش فایل .env.local

# (با ویرایشگر متن یا IDE)

\`\`\`

محتوای \`.env.local\`:
\`\`\`env
NEXT_PUBLIC_APP_NAME=PlusMeet
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# اگر MongoDB دارید

MONGODB_URI=mongodb://localhost:27017/plusmeet
\`\`\`

### مرحله 4: اجرای پروژه

\`\`\`bash
npm run dev
\`\`\`

پروژه روی [http://localhost:3000](http://localhost:3000) در دسترس است.

اگر پورت 3000 اشغال است:
\`\`\`bash

# پورت دیگری استفاده کنید

PORT=3001 npm run dev
\`\`\`

## 🧪 تست پروژه

### چک کردن Health API

مرورگر را باز کنید و به این آدرس بروید:
\`\`\`
http://localhost:3000/api/health
\`\`\`

باید پاسخ زیر را ببینید:
\`\`\`json
{
"status": "ok",
"message": "PlusMeet API is running",
...
}
\`\`\`

### تست تم روشن/تیره

1. صفحه اصلی را باز کنید
2. روی دکمه "تغییر تم" کلیک کنید
3. رنگ‌ها باید تغییر کنند

### تست Responsive

1. Developer Tools را باز کنید (F12)
2. حالت موبایل را انتخاب کنید
3. سایزهای مختلف را امتحان کنید

## 🐛 رفع مشکلات رایج

### مشکل 1: پورت در حال استفاده است

**خطا:**
\`\`\`
Error: listen EADDRINUSE: address already in use :::3000
\`\`\`

**راه‌حل:**
\`\`\`bash

# Windows

netstat -ano | findstr :3000
taskkill /PID [شماره_پروسه] /F

# Mac/Linux

lsof -ti:3000 | xargs kill -9

# یا استفاده از پورت دیگر

PORT=3001 npm run dev
\`\`\`

### مشکل 2: خطای نصب Dependencies

**خطا:**
\`\`\`
npm ERR! code ERESOLVE
\`\`\`

**راه‌حل:**
\`\`\`bash
npm install --legacy-peer-deps
\`\`\`

### مشکل 3: فونت‌ها نمایش داده نمی‌شوند

**راه‌حل:**

1. اتصال اینترنت را چک کنید (برای Google Fonts)
2. صفحه را Refresh کنید (Ctrl + Shift + R)
3. Cache مرورگر را پاک کنید

### مشکل 4: CSS تغییر نمی‌کند

**راه‌حل:**
\`\`\`bash

# حذف .next folder

rm -rf .next

# اجرای مجدد

npm run dev
\`\`\`

### مشکل 5: Hot Reload کار نمی‌کند

**راه‌حل:**

1. Server را Stop کنید (Ctrl + C)
2. دوباره اجرا کنید: \`npm run dev\`
3. اگر کار نکرد، پوشه \`.next\` را پاک کنید

## 📚 گام‌های بعدی

بعد از راه‌اندازی موفق:

1. **مطالعه مستندات:**

   - [README.md](../README.md) - نمای کلی
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - معماری
   - [THEME_GUIDE.md](./THEME_GUIDE.md) - راهنمای تم

2. **آشنایی با کد:**

   - ساختار پوشه‌ها را بررسی کنید
   - فایل‌های \`src/config/theme.config.js\` را مطالعه کنید
   - کامپوننت \`src/pages/index.js\` را بخوانید

3. **اولین تغییرات:**
   - رنگ Primary را تغییر دهید
   - یک کامپوننت ساده بسازید
   - صفحه جدیدی اضافه کنید

## 💡 نکات مفید

### کلیدهای میانبر در VS Code

- \`Ctrl + P\`: جستجوی فایل
- \`Ctrl + Shift + P\`: Command Palette
- \`Ctrl + \`\`: باز کردن Terminal
- \`Alt + Shift + F\`: فرمت کردن کد

### دستورات NPM مفید

\`\`\`bash
npm run dev # اجرای Development server
npm run build # ساخت Production build
npm run start # اجرای Production server
npm run lint # چک کردن Linting
\`\`\`

### Git Commands پایه

\`\`\`bash
git status # وضعیت فایل‌ها
git add . # اضافه کردن همه تغییرات
git commit -m "msg" # commit کردن
git push # push به remote
git pull # دریافت آخرین تغییرات
\`\`\`

## 🆘 کمک بیشتر

اگر مشکلی دارید:

1. مستندات را بخوانید
2. در Issues جستجو کنید
3. Issue جدید ایجاد کنید
4. در Discussions سوال بپرسید
5. به تیم ایمیل بزنید: dev@plusmeet.ir

---

موفق باشید! 🚀




