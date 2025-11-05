# 🔧 راهنمای رفع مشکلات (Troubleshooting)

این سند راهنمای رفع مشکلات رایج در پروژه PlusMeet است.

---

## 🚫 خطای 403 در صفحه مدیریت کاربران

### علت:

کاربر admin نقش (role) لازم برای دسترسی به صفحه مدیریت کاربران را ندارد.

### راه‌حل:

#### 1️⃣ چک کردن کاربر Admin

```bash
npm run check-admin
```

این دستور:

- وضعیت کاربر admin را بررسی می‌کند
- در صورت نیاز نقش `admin` را اضافه می‌کند
- وضعیت کاربر را به `active` تغییر می‌دهد

#### 2️⃣ Login مجدد

بعد از اجرای دستور بالا:

1. از حساب کاربری خارج شوید (Logout)
2. مجدداً وارد شوید با:
   - شماره: `09123456789`
   - رمز: `Admin@123`

#### 3️⃣ پاک کردن Cache مرورگر

گاهی اطلاعات قدیمی در localStorage ذخیره می‌ماند:

**Chrome/Edge:**

- F12 → Application → Local Storage → Clear

**Firefox:**

- F12 → Storage → Local Storage → Clear

یا از Developer Console:

```javascript
localStorage.clear();
location.reload();
```

---

## 🔐 خطای Authentication

### علت:

Token منقضی شده یا نامعتبر است.

### راه‌حل:

1. **Logout و Login مجدد**
2. **چک کردن .env**:
   ```env
   JWT_SECRET=your-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret-key
   ```
3. **بررسی MongoDB Connection**:
   ```bash
   # در terminal
   node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected')).catch(e => console.error('❌', e))"
   ```

---

## 🗄️ خطای MongoDB Connection

### علت:

اتصال به MongoDB برقرار نیست.

### راه‌حل:

#### اگر از MongoDB Local استفاده می‌کنید:

```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

#### اگر از MongoDB Atlas استفاده می‌کنید:

1. بررسی IP Whitelist در Atlas
2. بررسی Connection String در `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/plusmeet?retryWrites=true&w=majority
   ```

---

## 📱 خطای SMS.ir

### علت:

خطا در ارسال پیامک OTP.

### علائم:

- "خطا در ارسال پیامک"
- کد OTP دریافت نمی‌شود

### راه‌حل:

#### 1️⃣ چک کردن API Key

```env
SMS_IR_API_KEY=your-api-key
SMS_IR_LINE_NUMBER=your-line-number
SMS_IR_TEMPLATE_ID=your-template-id
```

#### 2️⃣ چک کردن اعتبار پنل SMS.ir

- وارد پنل SMS.ir شوید
- موجودی حساب را بررسی کنید
- وضعیت خط را چک کنید

#### 3️⃣ حالت Development

برای تست بدون ارسال واقعی پیامک:

```env
NODE_ENV=development
```

در این حالت، کد OTP در Console نمایش داده می‌شود.

---

## 🎨 مشکلات UI/Theme

### تم تیره/روشن کار نمی‌کند

**راه‌حل:**

1. پاک کردن localStorage
2. Refresh صفحه (F5)
3. Hard Refresh (Ctrl+Shift+R)

### فونت‌ها به درستی نمایش داده نمی‌شوند

**راه‌حل:**

1. بررسی اتصال به اینترنت (فونت‌های فارسی از CDN بارگذاری می‌شوند)
2. پاک کردن Cache مرورگر
3. بررسی Console برای خطاهای Network

---

## 🔄 مشکلات Build/Deploy

### خطای Build در Production

```bash
# پاک کردن cache و build مجدد
rm -rf .next
npm run build
```

### خطای Module Not Found

```bash
# نصب مجدد dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 🧪 بررسی سلامت سیستم

### چک کردن API Routes

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Test health endpoint
curl http://localhost:3000/api/health
```

خروجی مورد انتظار:

```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

### چک کردن Authentication

```bash
# ارسال OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "09123456789"}'
```

---

## 🐛 دیباگ در Developer Mode

### فعال کردن Logging

در `.env.local`:

```env
DEBUG=true
NODE_ENV=development
```

### بررسی Console Logs

**Browser Console:**

- F12 → Console
- بررسی خطاها و warnings

**Server Logs:**

- Terminal window که `npm run dev` در آن اجرا شده
- بررسی خطاهای MongoDB, API, و Authentication

---

## 📞 دریافت کمک بیشتر

اگر مشکل شما حل نشد:

1. **لاگ‌ها را بررسی کنید**:

   - Browser Console (F12)
   - Server Terminal Logs

2. **اطلاعات زیر را جمع‌آوری کنید**:

   - پیام خطا کامل
   - مراحل تکرار مشکل
   - نسخه Node.js: `node -v`
   - نسخه npm: `npm -v`

3. **Issue ایجاد کنید** با تمام جزئیات بالا

---

## ✅ چک‌لیست سلامت سیستم

قبل از شروع کار، این موارد را بررسی کنید:

- [ ] MongoDB در حال اجرا است
- [ ] فایل `.env` موجود و کامل است
- [ ] `npm install` اجرا شده
- [ ] کاربر admin ایجاد شده (`npm run check-admin`)
- [ ] Port 3000 آزاد است
- [ ] Node.js نسخه >= 18.0.0
- [ ] اتصال به اینترنت برقرار است (برای CDN fonts)

---

**آخرین به‌روزرسانی:** 2025-01-27



