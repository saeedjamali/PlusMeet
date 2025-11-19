# 16 API باقیمانده برای تکمیل

## ✅ کامل شده تا اینجا: 32/48 (67%)

### Category APIs (7):
1. `/api/dashboard/cat_topic` - route.js
2. `/api/dashboard/cat_topic/[id]` - route.js  
3. `/api/dashboard/cat_topic/upload-excel` - route.js
4. `/api/dashboard/cat_topic/reorder` - route.js
5. `/api/dashboard/cat_topic/migrate-codes` - route.js
6. `/api/dashboard/format_mode` - route.js
7. `/api/dashboard/format_mode/[id]` - route.js

### Misc Admin APIs (9):
8. `/api/admin/permissions` - route.js
9. `/api/admin/roles` - route.js
10. `/api/admin/sync-apis` - route.js
11. `/api/admin/settings/menus` - route.js
12. `/api/admin/settings/menus/[id]` - route.js
13. `/api/admin/users/[id]/state` - route.js
14. `/api/debug/permissions` - route.js
15. `/api/debug/user-permissions` - route.js
16. `/api/health` - ✅ OK (public endpoint, نیازی نیست)

## الگوی کلی برای همه:

```javascript
// 1. Import:
import { protectAPI } from '@/lib/middleware/apiProtection';
import { logActivity } from '@/lib/models/ActivityLog.model'; // POST/PUT/DELETE

// 2. در ابتدای هر function:
const protection = await protectAPI(request);
if (!protection.allowed) {
  return NextResponse.json(
    { error: protection.reason },
    { status: protection.status }
  );
}

// 3. برای POST/PUT/DELETE - بعد از عملیات:
try {
  await logActivity(user.phoneNumber, 'action_name', {
    targetType: 'ModelName',
    targetId: id,
    metadata: { ... },
  });
} catch (logError) {
  console.error('Error logging activity:', logError);
}
```

## وضعیت امنیتی:
- ✅ 32 API کامل (protectAPI + logActivity)
- 🔄 16 API نیازمند تکمیل
- ⏱️ زمان تخمینی: 45-60 دقیقه




