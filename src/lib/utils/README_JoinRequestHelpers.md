# 📚 راهنمای استفاده از `joinRequestHelpers`

این فایل شامل توابع کمکی برای مدیریت وضعیت‌های درخواست پیوستن به رویداد (`JoinRequest`) است.

---

## 🎯 توابع تشخیص وضعیت شرکت در رویداد

### 1️⃣ `isActiveParticipant(status)` - **شرکت‌کننده فعال**

آیا کاربر در حال حاضر **در رویداد است**؟

**شامل وضعیت‌های:**
- `APPROVED` - تایید شده
- `PAYMENT_PENDING` - در حال پرداخت
- `PAID` - پرداخت شده
- `CONFIRMED` - تایید نهایی
- `CHECKED_IN` - حضور ثبت شده
- `ATTENDED` - شرکت کرده

**مثال:**
```javascript
import { isActiveParticipant } from '@/lib/utils/joinRequestHelpers';

// در API یا Component
const userJoinRequest = await JoinRequest.findOne({ 
  event: eventId, 
  user: userId 
});

if (isActiveParticipant(userJoinRequest.status)) {
  // کاربر در رویداد است - می‌تواند کامنت بگذارد، لایک کند، ...
  console.log('شما در این رویداد هستید');
} else {
  // کاربر در رویداد نیست
  console.log('شما در این رویداد نیستید');
}
```

---

### 2️⃣ `canAccessEventContent(status)` - **دسترسی به محتوا**

آیا کاربر می‌تواند به **محتوای رویداد** (فایل‌ها، ویدئوها، لینک‌ها) دسترسی داشته باشد؟

**شامل وضعیت‌های:**
- `CONFIRMED` - تایید نهایی
- `CHECKED_IN` - حضور ثبت شده
- `ATTENDED` - شرکت کرده
- `COMPLETED` - تکمیل شده

**مثال:**
```javascript
if (canAccessEventContent(userJoinRequest.status)) {
  // نمایش دکمه دانلود مواد آموزشی
  return <DownloadButton />;
}
```

---

### 3️⃣ `hasAttended(status)` - **شرکت واقعی**

آیا کاربر **واقعاً در رویداد شرکت کرده** است؟

**شامل وضعیت‌های:**
- `ATTENDED` - شرکت کرده
- `COMPLETED` - تکمیل شده

**مثال:**
```javascript
if (hasAttended(userJoinRequest.status)) {
  // می‌تواند نظر بگذارد، گواهی‌نامه دریافت کند
  return <ReviewForm />;
}
```

---

### 4️⃣ `canLeaveReview(status)` - **نظر دادن**

آیا کاربر می‌تواند **نظر** بگذارد؟

**مثال:**
```javascript
if (canLeaveReview(userJoinRequest.status)) {
  return <button>ثبت نظر و امتیاز</button>;
}
```

---

### 5️⃣ `canParticipateInCommunity(status)` - **شرکت در جامعه**

آیا کاربر می‌تواند در **گروه‌ها و چت‌های رویداد** شرکت کند؟

**شامل وضعیت‌های:**
- `CONFIRMED` - تایید نهایی
- `CHECKED_IN` - حضور ثبت شده
- `ATTENDED` - شرکت کرده
- `COMPLETED` - تکمیل شده

**مثال:**
```javascript
if (canParticipateInCommunity(userJoinRequest.status)) {
  return <ChatRoom eventId={eventId} />;
}
```

---

### 6️⃣ `canReceiveCertificate(status)` - **دریافت گواهی‌نامه**

آیا کاربر می‌تواند **گواهی‌نامه** دریافت کند؟

**مثال:**
```javascript
if (canReceiveCertificate(userJoinRequest.status)) {
  return <button>دانلود گواهی‌نامه</button>;
}
```

---

### 7️⃣ `isPending(status)` - **در انتظار**

آیا کاربر **در انتظار** است؟ (تایید یا پرداخت)

**شامل وضعیت‌های:**
- `PENDING` - در انتظار تایید
- `PAYMENT_PENDING` - در انتظار پرداخت
- `WAITLISTED` - لیست انتظار

**مثال:**
```javascript
if (isPending(userJoinRequest.status)) {
  return <div className="badge-warning">در انتظار تایید</div>;
}
```

---

### 8️⃣ `needsPayment(status)` - **نیاز به پرداخت**

آیا کاربر هنوز **باید پرداخت** کند؟

**شامل وضعیت‌های:**
- `PAYMENT_PENDING` - در انتظار پرداخت
- `PAYMENT_FAILED` - پرداخت ناموفق

**مثال:**
```javascript
if (needsPayment(userJoinRequest.status)) {
  return <PaymentButton />;
}
```

---

### 9️⃣ `getAccessLevel(status)` - **سطح دسترسی**

تعیین **سطح دسترسی** کاربر به رویداد.

**خروجی:**
- `'none'` - هیچ دسترسی ندارد
- `'pending'` - در انتظار
- `'basic'` - دسترسی پایه
- `'full'` - دسترسی کامل
- `'completed'` - تکمیل شده

**مثال:**
```javascript
const accessLevel = getAccessLevel(userJoinRequest.status);

switch(accessLevel) {
  case 'full':
    return <EventDashboard />;
  case 'basic':
    return <EventPreview />;
  case 'pending':
    return <PendingMessage />;
  default:
    return <JoinButton />;
}
```

---

## 🔧 نمونه کاربرد کامل

### مثال 1: محدود کردن کامنت‌ها به شرکت‌کنندگان فعال

```javascript
// در API: POST /api/events/[id]/comments
import { isActiveParticipant } from '@/lib/utils/joinRequestHelpers';

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  const { id: eventId } = params;
  const { content } = await request.json();

  // پیدا کردن درخواست پیوستن کاربر
  const joinRequest = await JoinRequest.findOne({
    event: eventId,
    user: session.user.id,
  });

  // چک کردن اینکه آیا کاربر در رویداد است
  if (!joinRequest || !isActiveParticipant(joinRequest.status)) {
    return NextResponse.json(
      { error: 'فقط شرکت‌کنندگان رویداد می‌توانند کامنت بگذارند' },
      { status: 403 }
    );
  }

  // ثبت کامنت
  const comment = await Comment.create({
    event: eventId,
    user: session.user.id,
    content,
  });

  return NextResponse.json(comment);
}
```

---

### مثال 2: نمایش دکمه‌های مختلف بر اساس وضعیت

```javascript
// در Component: EventActionButtons.jsx
import {
  isActiveParticipant,
  canAccessEventContent,
  canLeaveReview,
  needsPayment,
} from '@/lib/utils/joinRequestHelpers';

export default function EventActionButtons({ joinRequest }) {
  const status = joinRequest?.status;

  if (!joinRequest) {
    return <button>درخواست شرکت</button>;
  }

  return (
    <div className="action-buttons">
      {needsPayment(status) && (
        <button className="btn-primary">پرداخت</button>
      )}

      {canAccessEventContent(status) && (
        <>
          <button className="btn-secondary">دانلود مواد</button>
          <button className="btn-secondary">ورود به گروه</button>
        </>
      )}

      {canLeaveReview(status) && (
        <button className="btn-outline">ثبت نظر و امتیاز</button>
      )}

      {isActiveParticipant(status) && (
        <div className="badge-success">✅ شما در این رویداد هستید</div>
      )}
    </div>
  );
}
```

---

### مثال 3: فیلتر کردن شرکت‌کنندگان فعال

```javascript
// در API: GET /api/events/[id]/active-participants
import { getActiveParticipantStatuses } from '@/lib/utils/joinRequestHelpers';

export async function GET(request, { params }) {
  const { id: eventId } = params;

  // دریافت فقط شرکت‌کنندگان فعال
  const activeParticipants = await JoinRequest.find({
    event: eventId,
    status: { $in: getActiveParticipantStatuses() },
  }).populate('user', 'firstName lastName avatar');

  return NextResponse.json({
    count: activeParticipants.length,
    participants: activeParticipants,
  });
}
```

---

### مثال 4: محدودیت دسترسی به صفحه رویداد

```javascript
// در Page: /events/[id]/dashboard/page.jsx
import { canAccessEventContent } from '@/lib/utils/joinRequestHelpers';

export default async function EventDashboard({ params }) {
  const session = await getServerSession(authOptions);
  const { id: eventId } = params;

  const joinRequest = await JoinRequest.findOne({
    event: eventId,
    user: session.user.id,
  });

  // اگر کاربر دسترسی نداشت
  if (!joinRequest || !canAccessEventContent(joinRequest.status)) {
    return (
      <div className="access-denied">
        <h2>دسترسی محدود</h2>
        <p>
          برای دسترسی به این صفحه، ابتدا باید در رویداد ثبت‌نام کنید و پرداخت را تکمیل نمایید.
        </p>
        <Link href={`/events/${eventId}`}>
          <button>بازگشت به صفحه رویداد</button>
        </Link>
      </div>
    );
  }

  // نمایش داشبورد رویداد
  return <EventDashboardContent event={event} joinRequest={joinRequest} />;
}
```

---

## 📊 جدول خلاصه وضعیت‌ها

| تابع | `PENDING` | `APPROVED` | `CONFIRMED` | `ATTENDED` | `REJECTED` | `CANCELED` |
|------|-----------|-----------|-------------|-----------|-----------|-----------|
| `isActiveParticipant` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `canAccessEventContent` | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `hasAttended` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `canLeaveReview` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `canParticipateInCommunity` | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `isPending` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `needsPayment` | ❌ | ❌ (رایگان) | ❌ | ❌ | ❌ | ❌ |

---

## 🎓 نکات مهم

1. **همیشه `JoinRequest` را چک کنید**: قبل از استفاده از هر تابع، ابتدا مطمئن شوید که `JoinRequest` وجود دارد.

2. **رویدادهای رایگان**: برای رویدادهای رایگان، کاربر بعد از `APPROVED` می‌تواند وارد شود (بدون نیاز به `PAID`).

3. **دسترسی‌های چندسطحی**: از تابع `getAccessLevel()` برای مدیریت دسترسی‌های چندسطحی استفاده کنید.

4. **کش کردن**: می‌توانید وضعیت `JoinRequest` را در session یا cookie کش کنید تا از query‌های اضافی جلوگیری شود.

---

✅ **آماده استفاده است!** 🚀



