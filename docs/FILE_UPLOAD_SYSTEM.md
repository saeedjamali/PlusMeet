# سیستم آپلود فایل (File Upload System)

یک سیستم کامل و امن برای آپلود و مدیریت فایل‌های کاربران.

## 📁 ساختار پوشه‌ها

```
project/
├── uploads/                    ← پوشه اصلی (خارج از src)
│   ├── avatars/               ← تصاویر پروفایل
│   ├── logos/                 ← لوگوهای سازمان‌ها
│   ├── temp/                  ← فایل‌های موقت
│   ├── .gitignore            ← فایل‌ها در git track نمی‌شوند
│   └── README.md
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── uploads/
│   │       │   └── [...path]/route.js    ← سرو فایل‌ها
│   │       └── user/
│   │           └── upload-avatar/route.js ← آپلود avatar
│   └── lib/
│       └── utils/
│           └── fileUpload.js              ← توابع کمکی
└── package.json
```

---

## 🚀 نحوه استفاده

### 1️⃣ آپلود تصویر پروفایل

**Frontend:**

```javascript
const handleAvatarUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // تبدیل به base64
  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64 = reader.result;

    const response = await fetchWithAuth("/api/user/upload-avatar", {
      method: "POST",
      body: JSON.stringify({
        image: base64,
        type: "avatar", // یا "logo" برای سازمان‌ها
      }),
    });

    const data = await response.json();
    if (data.success) {
      console.log("✅ URL:", data.data.avatar);
      // مثال: /api/uploads/avatars/uuid-v4.png
    }
  };

  reader.readAsDataURL(file);
};
```

**Backend Response:**

```json
{
  "success": true,
  "message": "آواتار با موفقیت آپلود شد",
  "data": {
    "avatar": "/api/uploads/avatars/a1b2c3d4-e5f6-7890-abcd-ef1234567890.png"
  }
}
```

---

### 2️⃣ نمایش تصویر

**در React Component:**

```jsx
<img
  src={user.avatar}
  alt="Avatar"
  // مثال: /api/uploads/avatars/uuid.png
/>
```

**URL Pattern:**

```
/api/uploads/{folder}/{filename}

مثال‌ها:
- /api/uploads/avatars/uuid.png
- /api/uploads/logos/uuid.jpg
```

---

## 📦 توابع کمکی (`fileUpload.js`)

### `ensureUploadDirectories()`

تضمین وجود پوشه‌های مورد نیاز.

```javascript
import { ensureUploadDirectories } from "@/lib/utils/fileUpload";

ensureUploadDirectories();
// ✅ پوشه‌های uploads/, avatars/, logos/, temp/ ایجاد می‌شوند
```

---

### `saveBase64Image(base64, folder)`

ذخیره تصویر base64 به عنوان فایل.

```javascript
import { saveBase64Image } from "@/lib/utils/fileUpload";

const imageUrl = await saveBase64Image(base64String, "avatars");
// برمی‌گرداند: /api/uploads/avatars/uuid.png
```

**پارامترها:**

- `base64String`: تصویر در فرمت base64 (`data:image/png;base64,...`)
- `folder`: نام پوشه (`avatars`, `logos`, `temp`)

---

### `deleteOldFile(fileUrl)`

حذف فایل قدیمی.

```javascript
import { deleteOldFile } from "@/lib/utils/fileUpload";

await deleteOldFile("/api/uploads/avatars/old-uuid.png");
// ✅ فایل قدیمی حذف می‌شود
```

---

### `validateImageFile(base64, maxSizeMB)`

اعتبارسنجی تصویر.

```javascript
import { validateImageFile } from "@/lib/utils/fileUpload";

try {
  validateImageFile(base64String, 2); // max 2MB
  console.log("✅ فایل معتبر است");
} catch (error) {
  console.error("❌", error.message);
}
```

**بررسی‌ها:**

- فرمت تصویر (باید `data:image/...` باشد)
- حجم فایل (پیش‌فرض: 2MB)

---

### `fileExists(relativePath)`

بررسی وجود فایل.

```javascript
import { fileExists } from "@/lib/utils/fileUpload";

const exists = fileExists("avatars/uuid.png");
console.log(exists); // true یا false
```

---

### `readFile(relativePath)`

خواندن فایل.

```javascript
import { readFile } from "@/lib/utils/fileUpload";

const buffer = readFile("avatars/uuid.png");
// Buffer
```

---

### `getMimeType(filename)`

دریافت MIME type.

```javascript
import { getMimeType } from "@/lib/utils/fileUpload";

const mimeType = getMimeType("photo.jpg");
console.log(mimeType); // "image/jpeg"
```

**پشتیبانی از:**

- `.jpg`, `.jpeg` → `image/jpeg`
- `.png` → `image/png`
- `.gif` → `image/gif`
- `.webp` → `image/webp`
- `.svg` → `image/svg+xml`

---

## 🔐 امنیت

### 1️⃣ اعتبارسنجی فایل

```javascript
// بررسی فرمت
if (!image.startsWith("data:image/")) {
  throw new Error("فقط فایل‌های تصویری مجاز هستند");
}

// بررسی حجم (2MB)
validateImageFile(image, 2);
```

### 2️⃣ نام فایل یونیک

```javascript
import { v4 as uuidv4 } from "uuid";

const fileName = `${uuidv4()}.${imageType}`;
// مثال: a1b2c3d4-e5f6-7890-abcd-ef1234567890.png
```

### 3️⃣ Authentication

```javascript
// در API route
const authResult = await authenticate(request);
if (!authResult.success) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### 4️⃣ حذف فایل قدیمی

```javascript
// قبل از آپلود فایل جدید، فایل قدیمی حذف می‌شود
await deleteOldFile(user.avatar);
```

---

## 🛠️ API Routes

### `POST /api/user/upload-avatar`

آپلود تصویر پروفایل یا لوگو.

**Request:**

```json
{
  "image": "data:image/png;base64,...",
  "type": "avatar" // یا "logo"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "آواتار با موفقیت آپلود شد",
  "data": {
    "avatar": "/api/uploads/avatars/uuid.png"
  }
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": "ValidationError",
  "message": "حجم تصویر نباید بیشتر از 2 مگابایت باشد"
}
```

---

### `GET /api/uploads/[...path]`

دریافت فایل آپلود شده.

**مثال:**

```
GET /api/uploads/avatars/uuid.png
```

**Response:**

- Status: `200 OK`
- Content-Type: `image/png`
- Cache-Control: `public, max-age=31536000, immutable`
- Body: Binary data (تصویر)

**Error (404):**

```json
{
  "success": false,
  "error": "فایل یافت نشد"
}
```

---

## 📝 محدودیت‌ها

| مورد                 | مقدار                                      |
| -------------------- | ------------------------------------------ |
| حداکثر حجم فایل      | 2 مگابایت                                  |
| فرمت‌های مجاز        | JPG, PNG, GIF, WebP, SVG                   |
| نام‌گذاری فایل       | UUID v4                                    |
| پوشه‌های مجاز        | `avatars`, `logos`, `temp`                 |
| Authentication       | الزامی (JWT Token)                         |
| Cache                | 1 سال (immutable)                          |
| دسترسی به فایل‌های قدیمی | فقط از طریق API Route (`/api/uploads/...`) |

---

## 🔄 مهاجرت از Base64 به File System

اگر قبلاً از base64 استفاده می‌کردید، این تغییرات به صورت خودکار اعمال می‌شود:

1. ✅ آپلودهای جدید در پوشه `uploads` ذخیره می‌شوند
2. ✅ URL‌های قدیمی (base64) همچنان کار می‌کنند
3. ✅ هنگام آپلود جدید، فایل قدیمی (اگر URL باشد) حذف می‌شود

---

## ⚙️ پیکربندی Production

### 1️⃣ مجوزهای پوشه

```bash
chmod -R 755 uploads
chown -R www-data:www-data uploads
```

### 2️⃣ Nginx Configuration

```nginx
# محافظت از دسترسی مستقیم
location /uploads {
    deny all;
    return 404;
}

# اجازه دسترسی فقط از طریق API
location /api/uploads {
    proxy_pass http://localhost:3000;
}
```

### 3️⃣ Environment Variables

```env
# در .env
UPLOADS_DIR=/var/www/plusmeet/uploads
MAX_FILE_SIZE_MB=2
```

---

## 🧪 تست

### آپلود فایل

```bash
curl -X POST http://localhost:3000/api/user/upload-avatar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "type": "avatar"
  }'
```

### دریافت فایل

```bash
curl http://localhost:3000/api/uploads/avatars/uuid.png \
  --output downloaded.png
```

---

## 📌 نکات مهم

### ✅ مزایا

1. **عملکرد بهتر**: فایل‌های واقعی سریع‌تر از base64 هستند
2. **کاهش حجم دیتابیس**: URL به جای base64 ذخیره می‌شود
3. **قابلیت کش**: فایل‌ها توسط مرورگر کش می‌شوند
4. **مدیریت آسان**: فایل‌ها در فایل سیستم قابل دسترسی هستند
5. **حذف خودکار**: فایل‌های قدیمی به صورت خودکار حذف می‌شوند

### ⚠️ توجه

1. پوشه `uploads` باید در `.gitignore` باشد
2. در production، از CDN استفاده کنید (S3, Cloudinary)
3. Backup منظم از پوشه `uploads`
4. محدودیت rate limit برای آپلود
5. اعتبارسنجی کامل فایل‌های آپلودی

---

## 🚀 آینده (Roadmap)

- [ ] پشتیبانی از آپلود مستقیم (بدون base64)
- [ ] تولید thumbnail خودکار
- [ ] فشرده‌سازی تصاویر
- [ ] آپلود به S3/Cloudinary
- [ ] پردازش تصاویر (resize, crop)
- [ ] واترمارک خودکار
- [ ] دسته‌بندی پیشرفته‌تر فایل‌ها
- [ ] سیستم quota برای هر کاربر

---

## 📚 مراجع

- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Node.js File System](https://nodejs.org/api/fs.html)
- [UUID Package](https://www.npmjs.com/package/uuid)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)

