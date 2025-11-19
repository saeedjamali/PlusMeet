# 🎯 فرایند پیوستن به رویداد (Join Request Flow)

این سند فرایند کامل پیوستن کاربران به رویدادها را شرح می‌دهد.

---

## 📋 فهرست مطالب

1. [نوع‌های رویداد](#-نوعهای-رویداد)
2. [وضعیت‌های درخواست](#-وضعیتهای-درخواست)
3. [وضعیت‌های مجاز هر نوع رویداد](#-وضعیتهای-مجاز-هر-نوع-رویداد)
4. [فلوچارت فرایندها](#-فلوچارت-فرایندها)
5. [توابع کمکی](#-توابع-کمکی)
6. [مثال‌های کاربردی](#-مثالهای-کاربردی)

---

## 🎪 نوع‌های رویداد

سیستم از **5 نوع رویداد** پشتیبانی می‌کند:

| نوع | کد | توضیح |
|-----|-----|-------|
| 1️⃣ آزاد | `OPEN` | همه می‌توانند بدون تایید شرکت کنند |
| 2️⃣ نیازمند تایید | `APPROVAL_REQUIRED` | نیاز به تایید مالک رویداد |
| 3️⃣ بلیط محور | `TICKETED` | نیاز به خرید بلیط |
| 4️⃣ ترکیبی | `APPROVAL_TICKETED` | نیاز به تایید **و** خرید بلیط |
| 5️⃣ دعوتی | `INVITE_ONLY` | فقط با کد دعوت |

---

## 📊 وضعیت‌های درخواست

سیستم از **17 وضعیت** برای مدیریت چرخه حیات درخواست استفاده می‌کند:

### Phase 1️⃣: ثبت‌نام و بررسی
```
┌─────────────────────────────────────────────┐
│  1. PENDING          در انتظار بررسی       │ (اولیه)
├─────────────────────────────────────────────┤
│  2. APPROVED         تایید اولیه           │ (مالک تایید کرد)
│  3. REJECTED         رد شده                │ (مالک رد کرد)
├─────────────────────────────────────────────┤
│  9. WAITLISTED       لیست انتظار           │ (ظرفیت پر)
└─────────────────────────────────────────────┘
```

### Phase 2️⃣: پرداخت
```
┌─────────────────────────────────────────────┐
│  4. PAYMENT_PENDING  منتظر پرداخت          │ (پولی)
│  5. PAYMENT_RESERVED مبلغ رزرو شده         │ (پولی)
│  6. PAID             پرداخت شده            │ (پرداخت موفق)
│  7. PAYMENT_FAILED   پرداخت ناموفق         │ (خطا)
└─────────────────────────────────────────────┘
```

### Phase 3️⃣: تایید نهایی
```
┌─────────────────────────────────────────────┐
│  8. CONFIRMED        تایید نهایی           │ (آماده شرکت)
└─────────────────────────────────────────────┘
```

### Phase 4️⃣: روز رویداد
```
┌─────────────────────────────────────────────┐
│  10. CHECKED_IN      حضور ثبت شده          │ (check-in)
│  11. ATTENDED        شرکت کرده             │ (حضور داشته)
│  12. NO_SHOW         غیبت کرده             │ (نیومده)
└─────────────────────────────────────────────┘
```

### Phase 5️⃣: پایان
```
┌─────────────────────────────────────────────┐
│  13. COMPLETED       کامل شده              │ (رویداد تمام)
└─────────────────────────────────────────────┘
```

### States خاص
```
┌─────────────────────────────────────────────┐
│  14. CANCELED        لغو شده               │ (توسط کاربر)
│  15. REVOKED         لغو شده               │ (توسط مالک)
│  16. REFUNDED        بازپرداخت شده         │ (پول برگشت)
│  17. EXPIRED         منقضی شده             │ (deadline گذشت)
└─────────────────────────────────────────────┘
```

---

## ✅ وضعیت‌های مجاز هر نوع رویداد

### 1️⃣ آزاد (OPEN)
```
✓ PENDING          (اولیه)
✓ APPROVED         
✓ REJECTED         
✓ WAITLISTED       
✓ CONFIRMED        
✓ CHECKED_IN       
✓ ATTENDED         
✓ NO_SHOW          
✓ COMPLETED        
✓ CANCELED         
✓ REVOKED          
✓ EXPIRED          
```

### 2️⃣ نیازمند تایید (APPROVAL_REQUIRED)
```
✓ PENDING          
✓ APPROVED         
✓ REJECTED         
✓ WAITLISTED       
✓ CONFIRMED        
✓ CHECKED_IN       
✓ ATTENDED         
✓ NO_SHOW          
✓ COMPLETED        
✓ CANCELED         
✓ REVOKED          
✓ EXPIRED          
```

### 3️⃣ بلیط محور (TICKETED)
```
✓ PENDING          
✓ APPROVED         
✓ REJECTED         
✓ WAITLISTED       
✓ PAYMENT_RESERVED ⭐ (جدید)
✓ PAYMENT_PENDING  ⭐ (جدید)
✓ PAID             ⭐ (جدید)
✓ PAYMENT_FAILED   ⭐ (جدید)
✓ CONFIRMED        
✓ CHECKED_IN       
✓ ATTENDED         
✓ NO_SHOW          
✓ COMPLETED        
✓ CANCELED         
✓ REVOKED          
✓ REFUNDED         ⭐ (جدید)
✓ EXPIRED          
```

### 4️⃣ ترکیبی (APPROVAL_TICKETED)
```
✓ PENDING          
✓ APPROVED         
✓ REJECTED         
✓ WAITLISTED       
✓ PAYMENT_RESERVED ⭐
✓ PAYMENT_PENDING  ⭐
✓ PAID             ⭐
✓ PAYMENT_FAILED   ⭐
✓ CONFIRMED        
✓ CHECKED_IN       
✓ ATTENDED         
✓ NO_SHOW          
✓ COMPLETED        
✓ CANCELED         
✓ REVOKED          
✓ REFUNDED         ⭐
✓ EXPIRED          
```

### 5️⃣ دعوتی (INVITE_ONLY)
```
✓ PENDING          
✓ APPROVED         
✓ REJECTED         
✓ WAITLISTED       
✓ CONFIRMED        
✓ CHECKED_IN       
✓ ATTENDED         
✓ NO_SHOW          
✓ COMPLETED        
✓ CANCELED         
✓ REVOKED          
✓ EXPIRED          
```

---

## 🔄 فلوچارت فرایندها

### 1️⃣ رویداد آزاد (OPEN) - رایگان

```
کاربر درخواست می‌دهد
         ↓
    [PENDING]
         ↓
    ظرفیت دارد؟
    /          \
  بله          خیر
   ↓            ↓
[CONFIRMED]  [WAITLISTED]
   ↓            ↓
روز رویداد    صبر کن
   ↓
[CHECKED_IN] → [ATTENDED] → [COMPLETED]
              ↘
               [NO_SHOW] → [COMPLETED]
```

### 2️⃣ رویداد آزاد (OPEN) - پولی

```
کاربر درخواست می‌دهد
         ↓
[PAYMENT_PENDING]
         ↓
   پرداخت موفق؟
    /          \
  بله          خیر
   ↓            ↓
 [PAID]    [PAYMENT_FAILED]
   ↓            ↓
[CONFIRMED]   دوباره تلاش
   ↓
روز رویداد
   ↓
[CHECKED_IN] → [ATTENDED] → [COMPLETED]
```

### 3️⃣ نیازمند تایید (APPROVAL_REQUIRED) - رایگان

```
کاربر درخواست می‌دهد
         ↓
    [PENDING]
         ↓
   مالک بررسی می‌کند
    /          \
  تایید        رد
   ↓            ↓
[APPROVED]   [REJECTED]
   ↓
[CONFIRMED]
   ↓
روز رویداد
   ↓
[CHECKED_IN] → [ATTENDED] → [COMPLETED]
```

### 4️⃣ بلیط محور (TICKETED)

```
کاربر درخواست می‌دهد
         ↓
[PAYMENT_PENDING]
         ↓
   پرداخت موفق؟
    /          \
  بله          خیر
   ↓            ↓
 [PAID]    [PAYMENT_FAILED]
   ↓
[CONFIRMED]
   ↓
روز رویداد
   ↓
[CHECKED_IN] → [ATTENDED] → [COMPLETED]
```

### 5️⃣ ترکیبی (APPROVAL_TICKETED)

```
کاربر درخواست می‌دهد
         ↓
    [PENDING]
         ↓
   مالک بررسی می‌کند
    /          \
  تایید        رد
   ↓            ↓
[APPROVED]   [REJECTED]
   ↓
[PAYMENT_RESERVED] (مبلغ رزرو - 48 ساعت)
   ↓
[PAYMENT_PENDING]
         ↓
   پرداخت موفق؟
    /          \
  بله          خیر
   ↓            ↓
 [PAID]    [PAYMENT_FAILED]
   ↓            یا
[CONFIRMED]   [EXPIRED]
   ↓
روز رویداد
   ↓
[CHECKED_IN] → [ATTENDED] → [COMPLETED]
```

### 6️⃣ دعوتی (INVITE_ONLY)

```
کاربر با کد دعوت درخواست می‌دهد
         ↓
    کد معتبر؟
    /          \
  بله          خیر
   ↓            ↓
[PENDING]    [REJECTED]
   ↓
[CONFIRMED]
   ↓
روز رویداد
   ↓
[CHECKED_IN] → [ATTENDED] → [COMPLETED]
```

---

## 🛠️ توابع کمکی

### تعیین وضعیت اولیه

```javascript
import { determineInitialStatus } from '@/lib/utils/joinRequestHelpers';

const initialStatus = determineInitialStatus(event, hasInviteCode);
```

### بررسی وضعیت‌های مجاز

```javascript
import { isStatusAllowedForType } from '@/lib/utils/joinRequestHelpers';

const isAllowed = isStatusAllowedForType('TICKETED', 'PAID'); // true
const isNotAllowed = isStatusAllowedForType('OPEN', 'PAYMENT_RESERVED'); // false
```

### اعتبارسنجی تغییر وضعیت

```javascript
import { validateStatusTransition } from '@/lib/utils/joinRequestHelpers';

const result = validateStatusTransition('APPROVAL_TICKETED', 'PENDING', 'APPROVED');
// { valid: true, reason: null }

const invalidResult = validateStatusTransition('OPEN', 'PENDING', 'PAYMENT_RESERVED');
// { valid: false, reason: 'وضعیت "payment_reserved" برای نوع رویداد "OPEN" مجاز نیست' }
```

### بررسی امکان انتقال

```javascript
import { canTransitionStatus } from '@/lib/utils/joinRequestHelpers';

const canTransition = canTransitionStatus('TICKETED', 'PAYMENT_PENDING', 'PAID'); // true
```

### دریافت وضعیت‌های بعدی

```javascript
import { getNextAllowedStatuses } from '@/lib/utils/joinRequestHelpers';

const nextStatuses = getNextAllowedStatuses('APPROVAL_TICKETED', 'APPROVED');
// ['payment_reserved', 'payment_pending', 'revoked']
```

---

## 💡 مثال‌های کاربردی

### مثال 1: رویداد آزاد رایگان

```javascript
const event = {
  participationType: { code: 'OPEN' },
  ticket: { type: 'free', price: 0 },
  capacity: 100,
  registeredCount: 50
};

const status = determineInitialStatus(event);
// Result: 'confirmed'
```

### مثال 2: رویداد بلیط محور

```javascript
const event = {
  participationType: { code: 'TICKETED' },
  ticket: { type: 'paid', price: 50000 },
  capacity: 50,
  registeredCount: 30
};

const status = determineInitialStatus(event);
// Result: 'payment_pending'
```

### مثال 3: رویداد ترکیبی (تایید + پرداخت)

```javascript
const event = {
  participationType: { code: 'APPROVAL_TICKETED' },
  ticket: { type: 'paid', price: 100000 },
  capacity: 30,
  registeredCount: 20
};

const status = determineInitialStatus(event);
// Result: 'pending' (ابتدا باید تایید شود)

// بعد از تایید مالک:
const nextStatuses = getNextAllowedStatuses('APPROVAL_TICKETED', 'approved');
// Result: ['payment_reserved', 'payment_pending', 'revoked']
```

### مثال 4: رویداد دعوتی با کد

```javascript
const event = {
  participationType: { code: 'INVITE_ONLY' },
  ticket: { type: 'free', price: 0 },
  capacity: 20,
  registeredCount: 10
};

// کاربر کد دعوت دارد
const status1 = determineInitialStatus(event, true);
// Result: 'confirmed'

// کاربر کد دعوت ندارد
const status2 = determineInitialStatus(event, false);
// Result: 'rejected'
```

---

## 📌 نکات مهم

### 1. ظرفیت رویداد
اگر ظرفیت رویداد پر باشد، **همه** درخواست‌ها به `WAITLISTED` می‌روند.

### 2. وضعیت‌های نهایی
از این وضعیت‌ها نمی‌توان تغییر کرد:
- `COMPLETED`
- `REJECTED` (در اکثر موارد)

### 3. رزرو موقت (48 ساعت)
در رویدادهای ترکیبی (`APPROVAL_TICKETED`)، بعد از تایید مالک، مبلغ برای 48 ساعت رزرو می‌شود (`PAYMENT_RESERVED`). اگر در این مدت پرداخت نشود، به `EXPIRED` تبدیل می‌شود.

### 4. بازپرداخت
فقط در رویدادهای پولی (`TICKETED` و `APPROVAL_TICKETED`) امکان بازپرداخت (`REFUNDED`) وجود دارد.

### 5. لغو توسط کاربر/مالک
- کاربر: `CANCELED`
- مالک: `REVOKED`

---

## 📚 فایل‌های مرتبط

- **وضعیت‌ها**: `src/lib/helpers/joinRequestStatus.js`
- **توابع کمکی**: `src/lib/utils/joinRequestHelpers.js`
- **مدل**: `src/lib/models/JoinRequest.model.js`
- **API**: `src/app/api/events/[id]/join/route.js`

---

## 🔗 منابع

- [مستندات API](./API_DOCUMENTATION.md)
- [مدل JoinRequest](../src/lib/models/JoinRequest.model.js)
- [تست‌های یکپارچگی](../tests/integration/joinRequest.test.js)

---

**آخرین به‌روزرسانی**: نوامبر 2024
**نسخه**: 2.0.0

