/**
 * Component: PublicNotifications
 * نمایش اعلانات عمومی در صفحه اصلی
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./PublicNotifications.module.css";

export default function PublicNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [closedNotifications, setClosedNotifications] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // بارگذاری اعلانات بسته شده از localStorage
    const closed = JSON.parse(localStorage.getItem("closedNotifications") || "[]");
    setClosedNotifications(closed);
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (notifications.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % notifications.length);
      }, 5000); // تغییر هر 5 ثانیه

      return () => clearInterval(interval);
    }
  }, [notifications.length]);

  const fetchNotifications = async () => {
    try {
      console.log("🔍 Fetching public notifications...");
      const response = await fetch("/api/notifications/public?limit=5");
      const data = await response.json();
      console.log("📦 API Response:", data);
      
      if (data.success) {
        console.log(`✅ Found ${data.data.notifications.length} notifications`);
        const allNotifs = data.data.notifications;
        
        // فیلتر کردن اعلانات بسته نشده
        const closed = JSON.parse(localStorage.getItem("closedNotifications") || "[]");
        const newNotifs = allNotifs.filter(n => !closed.includes(n._id));
        
        setNotifications(newNotifs);
        
        // اگر اعلان جدید وجود دارد، Modal را باز کن
        if (newNotifs.length > 0) {
          setIsOpen(true);
        }
      } else {
        console.error("❌ API returned success=false:", data);
      }
    } catch (error) {
      console.error("💥 Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (notif) => {
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    }
  };

  const handleClose = async () => {
    if (notifications.length > 0) {
      const currentNotif = notifications[currentIndex];
      
      // صدا زدن API عمومی برای افزایش viewCount (بدون نیاز به لاگین)
      try {
        await fetch(`/api/notifications/public/${currentNotif._id}/view`, {
          method: "POST",
        });
        console.log(`✅ Notification ${currentNotif._id} view count incremented`);
      } catch (error) {
        console.error("Error incrementing view count:", error);
      }
      
      const closed = JSON.parse(localStorage.getItem("closedNotifications") || "[]");
      closed.push(currentNotif._id);
      localStorage.setItem("closedNotifications", JSON.stringify(closed));
      setClosedNotifications(closed);
      
      // حذف اعلان فعلی از لیست
      const remaining = notifications.filter((_, idx) => idx !== currentIndex);
      setNotifications(remaining);
      
      // اگر اعلان دیگری نمانده، Modal را ببند
      if (remaining.length === 0) {
        setIsOpen(false);
      } else {
        // به اعلان بعدی برو
        setCurrentIndex(0);
      }
    }
  };

  const handleCloseAll = async () => {
    // صدا زدن API عمومی برای همه اعلانات
    const promises = notifications.map(notif => 
      fetch(`/api/notifications/public/${notif._id}/view`, {
        method: "POST",
      }).catch(err => console.error(`Error incrementing ${notif._id}:`, err))
    );
    
    try {
      await Promise.all(promises);
      console.log(`✅ All ${notifications.length} notifications view count incremented`);
    } catch (error) {
      console.error("Error incrementing view counts:", error);
    }
    
    const allIds = notifications.map(n => n._id);
    const closed = JSON.parse(localStorage.getItem("closedNotifications") || "[]");
    const updated = [...closed, ...allIds];
    localStorage.setItem("closedNotifications", JSON.stringify(updated));
    setClosedNotifications(updated);
    setNotifications([]);
    setIsOpen(false);
  };

  const getTypeIcon = (type) => {
    const icons = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      announcement: "📢",
    };
    return icons[type] || "ℹ️";
  };

  const getTypeClass = (type) => {
    return styles[`type${type.charAt(0).toUpperCase() + type.slice(1)}`] || styles.typeInfo;
  };

  if (loading || !isOpen || notifications.length === 0) {
    return null;
  }

  const currentNotif = notifications[currentIndex];

  return (
    <>
      {/* Overlay */}
      <div className={styles.overlay} onClick={handleCloseAll} />
      
      {/* Modal */}
      <div className={styles.modalContainer}>
        <div className={`${styles.notification} ${getTypeClass(currentNotif.type)}`}>
          {/* Close Buttons */}
          <button 
            className={styles.closeBtn} 
            onClick={handleClose}
            title="بستن این اعلان"
          >
            ×
          </button>
          {notifications.length > 1 && (
            <button 
              className={styles.closeAllBtn} 
              onClick={handleCloseAll}
              title="بستن همه اعلانات"
            >
              بستن همه
            </button>
          )}
          
          <div className={styles.icon}>{getTypeIcon(currentNotif.type)}</div>
          <div className={styles.content}>
          <h3 className={styles.title}>{currentNotif.title}</h3>
          <p className={styles.message}>{currentNotif.message}</p>
          {currentNotif.viewCount > 0 && (
            <div className={styles.viewCountBadge}>
              <span className={styles.viewIcon}>👁️</span>
              <span>{currentNotif.viewCount.toLocaleString("fa-IR")} بازدید</span>
            </div>
          )}
          {currentNotif.actionText && currentNotif.actionUrl && (
            <button className={styles.actionBtn}>
              {currentNotif.actionText} ←
            </button>
          )}
        </div>
        {currentNotif.image && (
          <div className={styles.imageContainer}>
            <img src={currentNotif.image} alt="" className={styles.image} />
          </div>
        )}
        </div>

        {notifications.length > 1 && (
          <div className={styles.dots}>
            {notifications.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${
                  index === currentIndex ? styles.dotActive : ""
                }`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`اعلان ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

