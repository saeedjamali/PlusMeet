# 📚 دایرکتوری lib

این پوشه شامل کتابخانه‌ها، ماژول‌ها و کدهای کمکی پروژه است.

## 📁 ساختار

```
lib/
├── models/          # مدل‌های MongoDB (Mongoose Schemas)
│   ├── User.model.js
│   ├── Permission.model.js
│   └── ActivityLog.model.js
│
├── middleware/      # Middleware های Express/Next.js
│   ├── auth.js      # احراز هویت
│   └── rbac.js      # کنترل دسترسی
│
├── utils/           # توابع کمکی عمومی
│   └── README.md
│
└── api/             # توابع API و درخواست‌ها
    └── README.md
```

## 🗄 Models

### User.model.js

مدل کاربر با ویژگی‌های زیر:

- احراز هویت با شماره موبایل
- نقش‌های چندگانه (Multi-role)
- وضعیت‌های مختلف کاربر
- انواع مختلف کاربر (فرد، سازمان، دولتی)
- سیستم آمارگیری و مانیتورینگ

### Permission.model.js

مدل‌های مربوط به RBAC:

- **Permission**: تعریف مجوزها
- **Role**: تعریف نقش‌ها و مجوزهای آن‌ها
- **UserPermission**: مجوزهای سفارشی کاربران

### ActivityLog.model.js

لاگ فعالیت‌های کاربران:

- ثبت تمام اکشن‌های مهم
- اطلاعات تکنیکال (IP, UserAgent, Device)
- TTL Index برای حذف خودکار لاگ‌های قدیمی

## 🔐 Middleware

### auth.js

- `authenticate`: چک کردن احراز هویت
- `optionalAuth`: احراز هویت اختیاری
- `requireRole`: نیاز به نقش خاص
- `requireVerified`: نیاز به verified بودن
- توابع کمکی: `generateToken`, `hashPassword`, etc.

### rbac.js

- `checkPermission`: بررسی مجوز خاص
- `checkOwnership`: بررسی مالکیت
- `getUserPermissions`: دریافت تمام مجوزهای کاربر
- `hasPermission`: چک کردن یک مجوز
- `grantPermission`: دادن مجوز
- `revokePermission`: حذف مجوز

## 📖 استفاده

### مثال 1: استفاده از User Model

\`\`\`javascript
import User from '@/lib/models/User.model';

// پیدا کردن کاربر
const user = await User.findByPhone('09123456789');

// ایجاد کاربر جدید
const newUser = new User({
phoneNumber: '09123456789',
firstName: 'علی',
lastName: 'احمدی',
userType: 'individual'
});
await newUser.save();

// چک کردن نقش
if (user.hasRole('admin')) {
// ...
}
\`\`\`

### مثال 2: استفاده از Auth Middleware

\`\`\`javascript
import { authenticate, requireRole } from '@/lib/middleware/auth';

// API route
export async function GET(request) {
// درون handler خود middleware را اجرا کنید
}

// یا در Express/API Routes
router.get('/admin/users',
authenticate,
requireRole('admin'),
getUsersHandler
);
\`\`\`

### مثال 3: استفاده از RBAC

\`\`\`javascript
import { checkPermission } from '@/lib/middleware/rbac';

router.delete('/users/:id',
authenticate,
checkPermission('users.delete'),
deleteUserHandler
);
\`\`\`

### مثال 4: ثبت فعالیت

\`\`\`javascript
import { logActivity } from '@/lib/models/ActivityLog.model';

await logActivity(userId, 'event_create', {
targetType: 'event',
targetId: eventId,
ipAddress: req.ip,
userAgent: req.headers['user-agent'],
metadata: {
eventName: event.name
}
});
\`\`\`

## 🔧 تنظیمات

برای استفاده از این ماژول‌ها، متغیرهای زیر را در `.env` تنظیم کنید:

```env
# JWT
JWT_SECRET=your-very-secret-key-here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/plusmeet

# OTP (برای احراز هویت)
OTP_SERVICE=kavenegar
OTP_API_KEY=your-api-key
```

## 📚 مستندات بیشتر

- [سیستم کاربری](../../docs/USER_SYSTEM.md)
- [راهنمای RBAC](../../docs/RBAC_GUIDE.md)

---

**نکته**: این ماژول‌ها برای استفاده در سمت سرور طراحی شده‌اند و نباید در کد client-side استفاده شوند.



