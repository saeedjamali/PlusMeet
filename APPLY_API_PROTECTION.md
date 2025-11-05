# راهنمای اعمال API Protection

## فایل‌های نیازمند اصلاح:

### ✅ کامل شده:
1. Auth APIs (7) - ✅
2. User APIs (5) - ✅
3. Admin Users (5) - ✅
4. Upload APIs (2) - ✅
5. Wallet APIs (3) - ✅ (wallet, transactions, withdraw)

### 🔄 در حال انجام:
6. Payment APIs (2)
7. Finance APIs (5)
8. RBAC APIs (4)
9. Categories APIs (7)
10. Misc APIs (4)

## الگوی اعمال:

### 1. Import ها:
```javascript
import { protectAPI } from '@/lib/middleware/apiProtection';
import { logActivity } from '@/lib/models/ActivityLog.model'; // فقط برای POST/PUT/DELETE
```

### 2. ابتدای هر endpoint:
```javascript
export async function GET/POST/PUT/DELETE(request, { params }) {
  try {
    // API Protection
    const protection = await protectAPI(request);
    if (!protection.allowed) {
      return NextResponse.json(
        { error: protection.reason },
        { status: protection.status }
      );
    }
    
    // بقیه کد...
  }
}
```

### 3. برای POST/PUT/DELETE - اضافه کردن logActivity:
```javascript
// بعد از عملیات اصلی
try {
  await logActivity(user.phoneNumber, 'action_name', {
    targetType: 'ModelName',
    targetId: id.toString(),
    metadata: { ... },
  });
} catch (logError) {
  console.error('Error logging activity:', logError);
}
```

## Action Names برای logActivity:
- create: `model_create`
- update: `model_update`
- delete: `model_delete`
- مثال: `category_create`, `transaction_update`, `role_delete`

