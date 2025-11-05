# راهنمای نصب سیستم آپلود فایل

## 🚀 مراحل نصب

### 1️⃣ نصب Dependencies

```bash
npm install uuid
```

یا اگر از yarn استفاده می‌کنید:

```bash
yarn add uuid
```

---

### 2️⃣ ایجاد پوشه‌ها (اختیاری)

پوشه‌ها به صورت خودکار در اولین آپلود ایجاد می‌شوند، اما می‌توانید دستی ایجاد کنید:

```bash
mkdir -p uploads/{avatars,logos,temp}
```

---

### 3️⃣ تنظیم مجوزها (Production)

```bash
# مجوز خواندن/نوشتن برای پوشه uploads
chmod -R 755 uploads

# اختصاص مالکیت به وب سرور (مثلاً nginx)
sudo chown -R www-data:www-data uploads
```

---

### 4️⃣ بررسی فایل‌های ایجاد شده

✅ بررسی کنید که این فایل‌ها وجود دارند:

```
✅ src/lib/utils/fileUpload.js
✅ src/app/api/uploads/[...path]/route.js
✅ src/app/api/user/upload-avatar/route.js (بروز شده)
✅ uploads/.gitignore
✅ uploads/README.md
✅ uploads/avatars/.gitkeep
✅ uploads/logos/.gitkeep
✅ uploads/temp/.gitkeep
✅ docs/FILE_UPLOAD_SYSTEM.md
```

---

### 5️⃣ راه‌اندازی سرور Development

```bash
npm run dev
```

---

### 6️⃣ تست آپلود

1. ورود به سیستم
2. رفتن به `/profile`
3. کلیک روی "📷 تغییر تصویر"
4. انتخاب یک تصویر
5. بررسی console برای URL جدید:
   ```
   ✅ avatar uploaded successfully for: 09123456789
      URL: /api/uploads/avatars/uuid.png
   ```

---

### 7️⃣ بررسی فایل در پوشه

```bash
ls -la uploads/avatars/
# باید فایل با نام UUID ببینید:
# a1b2c3d4-e5f6-7890-abcd-ef1234567890.png
```

---

### 8️⃣ تست دریافت فایل

مرورگر را باز کنید و برای تست:

```
http://localhost:3000/api/uploads/avatars/[UUID-FROM-STEP-6].png
```

باید تصویر را ببینید.

---

## 🔧 عیب‌یابی

### مشکل 1: خطای "Cannot find module 'uuid'"

**راه‌حل:**

```bash
npm install uuid
npm run dev
```

---

### مشکل 2: خطای "ENOENT: no such file or directory, open 'uploads/...'"

**راه‌حل:**

پوشه‌ها به صورت خودکار ایجاد می‌شوند، اما اگر مشکل داشتید:

```bash
mkdir -p uploads/{avatars,logos,temp}
chmod -R 755 uploads
```

---

### مشکل 3: تصویر نمایش داده نمی‌شود

**بررسی:**

1. آیا فایل در `uploads/avatars/` وجود دارد؟
   ```bash
   ls -la uploads/avatars/
   ```
2. آیا API Route کار می‌کند؟
   ```bash
   curl http://localhost:3000/api/uploads/avatars/[filename]
   ```
3. بررسی console سرور برای خطاها

---

### مشکل 4: در Production فایل‌ها نمایش داده نمی‌شوند

**راه‌حل:**

1. بررسی مجوزهای پوشه:
   ```bash
   ls -la uploads/
   # باید: drwxr-xr-x
   ```

2. بررسی مالکیت:
   ```bash
   ls -la uploads/
   # باید: www-data یا nginx یا apache
   ```

3. پیکربندی Nginx/Apache برای محافظت از `/uploads`:
   ```nginx
   location /uploads {
       deny all;
       return 404;
   }
   ```

---

## 📊 بررسی عملکرد

### قبل (با base64):

```javascript
// حجم در DB
user.avatar = "data:image/png;base64,iVBORw0KGgo..." // ~100KB در DB

// سرعت لود
🐌 کند (هر بار از DB خوانده می‌شود)
```

### بعد (با File System):

```javascript
// حجم در DB
user.avatar = "/api/uploads/avatars/uuid.png" // ~50 bytes در DB

// سرعت لود
🚀 سریع (cache می‌شود توسط مرورگر)
```

---

## 🎯 بهترین شیوه‌ها (Best Practices)

### 1️⃣ Backup

```bash
# Backup روزانه
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# یا استفاده از rsync
rsync -av uploads/ /backup/uploads/
```

### 2️⃣ Monitoring

```javascript
// اضافه کردن logging
console.log(`📁 File uploaded: ${fileName}`);
console.log(`💾 Size: ${fileSize} bytes`);
console.log(`👤 User: ${user.phoneNumber}`);
```

### 3️⃣ Cleanup

```javascript
// حذف فایل‌های موقت قدیمی (بیش از 7 روز)
import { readdir, stat, unlink } from "fs/promises";

async function cleanupOldTempFiles() {
  const tempDir = path.join(UPLOADS_DIR, "temp");
  const files = await readdir(tempDir);

  for (const file of files) {
    const filePath = path.join(tempDir, file);
    const stats = await stat(filePath);
    const age = Date.now() - stats.mtime.getTime();

    // اگر بیش از 7 روز قدیمی است
    if (age > 7 * 24 * 60 * 60 * 1000) {
      await unlink(filePath);
      console.log(`🗑️ Deleted old temp file: ${file}`);
    }
  }
}
```

### 4️⃣ Rate Limiting

```javascript
// محدود کردن تعداد آپلود در ساعت
const uploadCounts = new Map();

function checkRateLimit(userId) {
  const count = uploadCounts.get(userId) || 0;

  if (count >= 10) {
    // بیشتر از 10 آپلود در ساعت
    throw new Error("تعداد آپلود بیش از حد مجاز است");
  }

  uploadCounts.set(userId, count + 1);

  // پاک کردن بعد از 1 ساعت
  setTimeout(() => {
    uploadCounts.delete(userId);
  }, 60 * 60 * 1000);
}
```

---

## ✅ چک‌لیست نهایی

قبل از deploy:

- [ ] `npm install uuid` اجرا شده
- [ ] پوشه `uploads/` ایجاد شده
- [ ] مجوزهای پوشه تنظیم شده (`755`)
- [ ] `.gitignore` برای uploads فعال است
- [ ] تست آپلود در local موفق بوده
- [ ] تست دریافت فایل در local موفق بوده
- [ ] Backup strategy تعیین شده
- [ ] Rate limiting (اختیاری) اضافه شده
- [ ] Monitoring/Logging فعال است

---

## 🆘 پشتیبانی

اگر مشکلی داشتید:

1. بررسی `console` سرور برای خطاها
2. بررسی `network tab` مرورگر
3. بررسی مجوزهای پوشه `uploads/`
4. مطالعه [FILE_UPLOAD_SYSTEM.md](./docs/FILE_UPLOAD_SYSTEM.md)

---

## 🎉 تبریک!

سیستم آپلود فایل شما آماده است! 🚀

اکنون می‌توانید:

- ✅ تصاویر پروفایل آپلود کنید
- ✅ لوگوهای سازمانی آپلود کنید
- ✅ از عملکرد بهتر لذت ببرید
- ✅ حجم دیتابیس را کاهش دهید

