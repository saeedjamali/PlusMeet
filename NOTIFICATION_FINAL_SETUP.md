# 🔔 تکمیل نهایی سیستم اعلانات

## ✅ فایل‌های ایجاد شده:

1. ✅ Models (2 فایل)
2. ✅ APIs (9 endpoint)
3. ✅ صفحه notifManager (کامل با Form, List, CSS)
4. ✅ صفحه notifBox (page.js)

---

## ⏳ فایل‌های باقیمانده:

### 1. CSS برای notifBox
مسیر: `src/app/dashboard/notifBox/notifBox.module.css`

```css
.container {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  font-size: 1.75rem;
}

.header p {
  margin: 0.5rem 0 0 0;
  color: var(--text-secondary, #6b7280);
}

.headerActions {
  display: flex;
  gap: 0.5rem;
}

.markAllBtn {
  padding: 0.625rem 1rem;
  background: white;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.markAllBtn:hover {
  background: var(--bg-secondary, #f9fafb);
}

.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.filters button {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.filterActive {
  background: #3b82f6 !important;
  color: white !important;
  border-color: #3b82f6 !important;
}

.notificationList {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notificationCard {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.notificationCard:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.notificationCard.unread {
  border-left: 4px solid #3b82f6;
  background: #eff6ff;
}

.notifIcon {
  font-size: 2rem;
  flex-shrink: 0;
}

.notifContent {
  flex: 1;
}

.notifHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.notifHeader h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.unreadBadge {
  padding: 0.25rem 0.75rem;
  background: #3b82f6;
  color: white;
  border-radius: 9999px;
  font-size: 0.75rem;
}

.notifMessage {
  color: var(--text-secondary, #6b7280);
  margin: 0.5rem 0;
  line-height: 1.5;
}

.notifImage {
  max-width: 200px;
  border-radius: 8px;
  margin: 0.75rem 0;
}

.actionBtn {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  margin: 0.75rem 0;
}

.notifFooter {
  font-size: 0.75rem;
  color: var(--text-secondary, #9ca3af);
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.loading,
.empty {
  padding: 3rem;
  text-align: center;
  color: var(--text-secondary, #6b7280);
}
```

---

### 2. کامپوننت NotificationBell
مسیر: `src/components/dashboard/NotificationBell.js`

```javascript
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./NotificationBell.module.css";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // هر 30 ثانیه
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications/unread-count", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?limit=5", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      await fetch(`/api/notifications/${notif._id}/read`, {
        method: "POST",
        credentials: "include",
      });
      setIsOpen(false);
      if (notif.actionUrl) {
        router.push(notif.actionUrl);
      }
      fetchUnreadCount();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="اعلانات"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3>اعلانات</h3>
            <button
              className={styles.viewAllBtn}
              onClick={() => {
                router.push("/dashboard/notifBox");
                setIsOpen(false);
              }}
            >
              مشاهده همه
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className={styles.empty}>اعلانی وجود ندارد</div>
          ) : (
            <div className={styles.notifList}>
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`${styles.notifItem} ${!notif.isRead ? styles.unread : ""}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className={styles.notifTitle}>{notif.title}</div>
                  <div className={styles.notifMessage}>{notif.message}</div>
                  <div className={styles.notifTime}>
                    {new Date(notif.createdAt).toLocaleDateString("fa-IR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

CSS: `src/components/dashboard/NotificationBell.module.css`

```css
.container {
  position: relative;
}

.bellButton {
  position: relative;
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-primary, #374151);
  transition: color 0.2s;
}

.bellButton:hover {
  color: #3b82f6;
}

.badge {
  position: absolute;
  top: 0;
  left: 0;
  background: #ef4444;
  color: white;
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-weight: 600;
}

.dropdown {
  position: absolute;
  left: 0;
  top: calc(100% + 0.5rem);
  width: 380px;
  max-width: 90vw;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.dropdownHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.dropdownHeader h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.viewAllBtn {
  padding: 0.25rem 0.75rem;
  background: transparent;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 0.875rem;
}

.notifList {
  max-height: 400px;
  overflow-y: auto;
}

.notifItem {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  cursor: pointer;
  transition: background 0.2s;
}

.notifItem:hover {
  background: var(--bg-secondary, #f9fafb);
}

.notifItem.unread {
  background: #eff6ff;
}

.notifTitle {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.notifMessage {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notifTime {
  font-size: 0.75rem;
  color: var(--text-secondary, #9ca3af);
}

.empty {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary, #6b7280);
}
```

---

### 3. اضافه کردن NotificationBell به Header/Layout
در `src/app/dashboard/layout.js`:

```javascript
import NotificationBell from "@/components/dashboard/NotificationBell";

// در بخش header/mobile header:
<NotificationBell />
```

---

### 4. بروزرسانی RBAC
به `src/app/api/admin/rbac/seed/route.js` اضافه کنید:

```javascript
// در بخش apiEndpoints:
{
  path: "/api/admin/notifications",
  availableMethods: ["GET", "POST"],
  module: "notifications",
  title: "مدیریت اعلانات",
  defaultRoles: ["admin", "moderator"],
},
{
  path: "/api/admin/notifications/:id",
  availableMethods: ["GET", "PUT", "DELETE"],
  module: "notifications",
  title: "عملیات اعلان",
  defaultRoles: ["admin", "moderator"],
},
{
  path: "/api/notifications",
  availableMethods: ["GET"],
  module: "notifications",
  title: "دریافت اعلانات",
  defaultRoles: ["user", "event_owner", "moderator", "admin"],
},
{
  path: "/api/notifications/unread-count",
  availableMethods: ["GET"],
  module: "notifications",
  defaultRoles: ["user", "event_owner", "moderator", "admin"],
},
{
  path: "/api/notifications/:id/read",
  availableMethods: ["POST"],
  module: "notifications",
  defaultRoles: ["user", "event_owner", "moderator", "admin"],
},
{
  path: "/api/notifications/:id/click",
  availableMethods: ["POST"],
  module: "notifications",
  defaultRoles: ["user", "event_owner", "moderator", "admin"],
},
{
  path: "/api/notifications/mark-all-read",
  availableMethods: ["POST"],
  module: "notifications",
  defaultRoles: ["user", "event_owner", "moderator", "admin"],
},

// در بخش menus:
{
  menuId: "notifManager",
  title: "مدیریت اعلانات",
  icon: "🔔",
  path: "/dashboard/notifManager",
  parentId: null,
  order: 50,
  isActive: true,
  defaultRoles: ["admin", "moderator"],
},
{
  menuId: "notifBox",
  title: "صندوق اعلانات",
  icon: "📬",
  path: "/dashboard/notifBox",
  parentId: null,
  order: 51,
  isActive: true,
  defaultRoles: ["user", "event_owner", "moderator", "admin"],
},
```

---

### 5. بروزرسانی ActivityLog
به `src/lib/models/ActivityLog.model.js` اضافه کنید:

```javascript
"notification.create",
"notification.update",
"notification.delete",
"notification.read",
"notification.click",
```

---

## 🚀 مراحل نهایی:

```bash
# 1. Restart سرور
npm run dev

# 2. Seed RBAC
# برو به: http://localhost:3000/api/admin/rbac/seed

# 3. Grant permissions
node scripts/grant-all-roles-permissions.js

# 4. تست
# - /dashboard/notifManager (admin)
# - /dashboard/notifBox (user)
# - NotificationBell در header
```

---

**🎉 سیستم اعلانات کامل شد!**




