# 💬 سیستم چت گروهی رویدادها

## 📋 خلاصه

سیستم کامل چت گروهی برای رویدادها که به صورت خودکار با ساخت هر رویداد، یک گروه چت ایجاد می‌کند.

---

## 🏗️ معماری سیستم

### 📦 مدل‌های پایگاه داده

#### 1. **GroupChat** (`src/lib/models/GroupChat.model.js`)
مدل اصلی گروه چت:
- ✅ ارتباط یک‌به‌یک با رویداد
- ✅ مدیریت visibility (public/private)
- ✅ وضعیت فعال/بسته (isClosed)
- ✅ مدیران و مالک
- ✅ آمار (اعضا، پیام‌ها)
- ✅ تنظیمات پیشرفته (slow mode, file sharing, ...)

**Methods کلیدی:**
```javascript
- isAdmin(userId)               // چک مدیر بودن
- canSendMessage(userId)        // چک امکان ارسال پیام
- canView(userId, status)       // چک امکان مشاهده
- addMember(userId)             // افزودن عضو
- removeMember(userId)          // حذف عضو
- banMember(userId, reason)     // مسدود کردن
- unbanMember(userId)           // رفع مسدودیت
```

**Static Methods:**
```javascript
- createForEvent(eventId, ownerId, creatorId)  // ساخت گروه برای رویداد
```

---

#### 2. **GroupChatMember** (`src/lib/models/GroupChatMember.model.js`)
عضویت کاربران در گروه:
- ✅ وضعیت‌های مختلف (active, banned, left, ...)
- ✅ نقش (member, moderator, admin)
- ✅ مدیریت unread counter
- ✅ تنظیمات نوتیفیکیشن شخصی
- ✅ آمار فردی (پیام‌های ارسالی، ...)

**Methods کلیدی:**
```javascript
- isActive()               // چک فعال بودن
- canSendMessage()         // چک امکان ارسال
- mute(duration)           // خاموش کردن نوتیفیکیشن
- unmute()                 // روشن کردن
- markAsRead()             // علامت‌گذاری خوانده شده
- incrementUnread()        // افزایش unread
```

**Static Methods:**
```javascript
- getActiveMembers(groupChatId)       // دریافت اعضای فعال
- isMember(groupChatId, userId)       // چک عضویت
- getUserGroups(userId)               // گروه‌های کاربر
```

---

#### 3. **GroupChatMessage** (`src/lib/models/GroupChatMessage.model.js`)
پیام‌های گروه:
- ✅ انواع پیام (text, image, file, system, announcement)
- ✅ پاسخ به پیام (replyTo)
- ✅ منشن کاربران (mentions)
- ✅ ری‌اکشن‌ها (reactions)
- ✅ پین کردن (isPinned)
- ✅ ویرایش و حذف
- ✅ آمار خوانده شدن (readBy, readCount)

**Methods کلیدی:**
```javascript
- edit(newContent)          // ویرایش پیام
- softDelete(deletedBy)     // حذف نرم
- pin(pinnedBy)             // پین کردن
- unpin()                   // آنپین
- addReaction(emoji, userId) // افزودن ری‌اکشن
- markAsRead(userId)        // علامت خوانده شده
```

**Static Methods:**
```javascript
- createSystemMessage(groupId, action, data)  // پیام سیستمی
- getPinnedMessages(groupId)                  // پیام‌های پین شده
- searchMessages(groupId, query)              // جستجو
```

---

## 🚀 Hook خودکار

در `Event.model.js` یک **post-save hook** اضافه شده که با ساخت هر رویداد جدید، گروه چت را خودکار می‌سازد:

```javascript
EventSchema.post('save', async function (doc) {
  if (this.isNew && this.status === 'pending') {
    await GroupChat.createForEvent(
      this._id,
      this.createdBy,
      this.createdBy
    );
  }
});
```

---

## 🔌 API Routes

### 1. **لیست گروه‌ها**
```
GET /api/groupchats?type={all|public|my|managed}&page=1&limit=20
```
- `all`: همه گروه‌ها
- `public`: گروه‌های عمومی
- `my`: گروه‌هایی که کاربر عضو است
- `managed`: گروه‌هایی که کاربر مدیر است

---

### 2. **جزئیات گروه**
```
GET    /api/groupchats/[id]
PUT    /api/groupchats/[id]      (تنظیمات - فقط مدیر)
DELETE /api/groupchats/[id]      (حذف - فقط مالک)
```

**امکان به‌روزرسانی:**
- name, description, avatar
- visibility (public/private)
- isClosed (بستن/باز کردن)
- settings (تنظیمات پیشرفته)

---

### 3. **پیام‌ها**
```
GET  /api/groupchats/[id]/messages?page=1&limit=50&before=2024-01-01
POST /api/groupchats/[id]/messages
```

**ارسال پیام:**
```json
{
  "content": "متن پیام",
  "messageType": "text",
  "attachments": [],
  "replyTo": "messageId",
  "mentions": ["userId1", "userId2"]
}
```

**Validations:**
- ✅ چک slow mode
- ✅ محدودیت طول پیام
- ✅ چک بسته بودن گروه
- ✅ چک مسدودیت کاربر

---

### 4. **اقدامات پیام**

#### ویرایش:
```
PATCH /api/groupchats/[id]/messages/[messageId]
```

#### حذف:
```
DELETE /api/groupchats/[id]/messages/[messageId]
```

#### پین:
```
POST   /api/groupchats/[id]/messages/[messageId]/pin
DELETE /api/groupchats/[id]/messages/[messageId]/pin
```

#### ری‌اکشن:
```
POST /api/groupchats/[id]/messages/[messageId]/reaction
{
  "emoji": "👍"
}
```

---

### 5. **مدیریت اعضا**
```
GET    /api/groupchats/[id]/members?status=active&page=1&limit=50
POST   /api/groupchats/[id]/members          (افزودن - فقط مدیر)
DELETE /api/groupchats/[id]/members?userId=X&action=ban&reason=...
PATCH  /api/groupchats/[id]/members          (رفع مسدودیت - فقط مدیر)
```

---

## 🎨 صفحات Frontend

### 1. **مدیریت گروه‌ها** (`/dashboard/groupchatmanagment`)
برای مدیران گروه:
- ✅ لیست گروه‌های مدیریت شده
- ✅ تغییر visibility (عمومی/خصوصی)
- ✅ بستن/باز کردن گروه
- ✅ مشاهده آمار
- ✅ دسترسی به تنظیمات

**Features:**
- Tabs: همه | عمومی | خصوصی | بسته
- Action buttons: مشاهده چت | مدیریت اعضا | تغییر visibility | بستن/باز کردن | تنظیمات

---

### 2. **گفتگوهای من** (`/dashboard/myGroupChat`)
برای کاربران عادی:
- ✅ لیست گروه‌های عضو
- ✅ لیست گروه‌های عمومی (برای پیوستن)
- ✅ نمایش unread counter
- ✅ پیش‌نمایش آخرین پیام
- ✅ زمان آخرین پیام

**Features:**
- Tabs: گفتگوهای من | گفتگوهای عمومی
- Badge: تعداد پیام‌های خوانده نشده
- Preview: آخرین پیام + فرستنده

---

### 3. **رابط چت** (`/dashboard/groupchat/[id]`)
رابط کاربری اصلی چت:
- ✅ Header: نام گروه | تعداد اعضا | دکمه تنظیمات
- ✅ لیست پیام‌ها: نمایش پیام‌ها با ری‌اکشن
- ✅ Quick Reactions: 👍 ❤️ 😂 🎉
- ✅ ورودی پیام: با محدودیت طول
- ✅ پشتیبانی از Scroll to bottom
- ✅ نمایش پیام‌های سیستمی
- ✅ بهینه‌سازی برای موبایل

**Features:**
- ✅ Real-time message display
- ✅ Quick emoji reactions
- ✅ Empty state
- ✅ Loading state
- ✅ Disabled state (گروه بسته)

---

## 🔐 کنترل دسترسی

### گروه عمومی (Public):
- ✅ همه کاربران `active` و `verified` می‌توانند ببینند
- ✅ همه کاربران می‌توانند پیام بفرستند
- ✅ اعضا خودکار وقتی وارد می‌شوند، اضافه می‌شوند

### گروه خصوصی (Private):
- ✅ فقط `isActiveParticipant` می‌توانند ببینند
- ✅ فقط اعضا می‌توانند پیام بفرستند
- ✅ از `joinRequestHelpers.js` برای چک کردن استفاده می‌شود

### مدیران:
- ✅ همیشه دسترسی کامل دارند (حتی اگر گروه خصوصی باشد)
- ✅ می‌توانند گروه را ببندند/باز کنند
- ✅ می‌توانند visibility را تغییر دهند
- ✅ می‌توانند اعضا را مسدود/حذف کنند
- ✅ می‌توانند پیام‌ها را پین/حذف کنند

---

## ⚙️ تنظیمات پیشرفته

### Slow Mode:
```javascript
settings: {
  slowMode: {
    enabled: true,
    interval: 30  // ثانیه
  }
}
```
کاربران باید 30 ثانیه صبر کنند تا پیام بعدی را بفرستند.

### محدودیت‌ها:
```javascript
settings: {
  allowFileSharing: true,
  allowImageSharing: true,
  allowLinkSharing: true,
  maxMessageLength: 2000
}
```

### دعوت اعضا:
```javascript
settings: {
  allowMemberInvite: false,    // آیا اعضا می‌توانند دیگران را دعوت کنند؟
  requireApproval: false        // آیا پیوستن نیاز به تایید دارد؟
}
```

---

## 📊 آمار و گزارش

### آمار گروه:
```javascript
stats: {
  totalMembers: 150,
  activeMembers: 120,
  totalMessages: 5432
}
```

### آمار عضو:
```javascript
stats: {
  messagesSent: 45,
  unreadCount: 12
}
```

### آمار پیام:
```javascript
stats: {
  readBy: [
    { user: userId, readAt: Date }
  ],
  readCount: 89
}
```

---

## 🎯 مثال‌های کاربردی

### 1. تشخیص دسترسی کاربر به گروه:
```javascript
const groupChat = await GroupChat.findById(groupId);
const canView = await groupChat.canView(userId, joinRequestStatus);

if (!canView && !groupChat.isAdmin(userId)) {
  return { error: 'Access denied' };
}
```

### 2. ارسال پیام سیستمی:
```javascript
await GroupChatMessage.createSystemMessage(
  groupId,
  'member_joined',
  { userId, addedBy }
);
```

### 3. افزودن ری‌اکشن:
```javascript
const message = await GroupChatMessage.findById(messageId);
await message.addReaction('👍', userId);
```

### 4. چک Slow Mode:
```javascript
if (groupChat.settings.slowMode?.enabled) {
  const lastMessage = await GroupChatMessage.findOne({
    groupChat: id,
    sender: userId,
  }).sort({ createdAt: -1 });

  const timeSince = Date.now() - new Date(lastMessage.createdAt);
  const interval = groupChat.settings.slowMode.interval * 1000;

  if (timeSince < interval) {
    return { error: `Wait ${Math.ceil((interval - timeSince) / 1000)}s` };
  }
}
```

---

## 🚦 وضعیت‌های سیستمی

پیام‌های سیستمی خودکار برای رویدادهای زیر:
- ✅ `member_joined` - عضو جدید پیوست
- ✅ `member_left` - عضو خارج شد
- ✅ `member_removed` - عضو حذف شد
- ✅ `member_banned` - عضو مسدود شد
- ✅ `member_unbanned` - رفع مسدودیت
- ✅ `group_created` - ساخته شد
- ✅ `group_updated` - به‌روز شد
- ✅ `visibility_changed` - تغییر visibility
- ✅ `group_closed` - بسته شد
- ✅ `group_opened` - باز شد

---

## 📝 TODO برای آینده

1. ⏳ **Real-time با WebSocket/Socket.io**
   - پیام‌های لحظه‌ای بدون refresh

2. ⏳ **اعلان‌ها (Notifications)**
   - پوش نوتیفیکیشن برای پیام‌های جدید
   - ایمیل برای منشن‌ها

3. ⏳ **آپلود فایل و تصویر**
   - مدیریت آپلود
   - پیش‌نمایش تصاویر
   - دانلود فایل‌ها

4. ⏳ **جستجوی پیشرفته**
   - جستجو در محتوای پیام‌ها
   - فیلتر بر اساس فرستنده/تاریخ

5. ⏳ **Voice Messages**
   - ضبط و ارسال پیام صوتی

6. ⏳ **پاسخ Thread**
   - پاسخ به پیام‌ها در Thread جداگانه

7. ⏳ **مدیریت پیام‌های پین شده**
   - نمایش لیست پیام‌های پین شده
   - محدودیت تعداد

8. ⏳ **گزارش‌گیری**
   - آمار فعالیت اعضا
   - نمودارها و Chart‌ها

---

## 🎉 خلاصه

سیستم چت کامل با:
- ✅ 3 مدل پایگاه داده
- ✅ 1 Hook خودکار
- ✅ 10+ API Endpoint
- ✅ 3 صفحه Frontend
- ✅ کنترل دسترسی پیشرفته
- ✅ ری‌اکشن، پین، ویرایش، حذف
- ✅ Slow Mode
- ✅ آمار و گزارش
- ✅ پیام‌های سیستمی

**آماده برای استفاده!** 🚀



