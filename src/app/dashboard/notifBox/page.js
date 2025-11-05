"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/NewAuthContext";
import { useRouter } from "next/navigation";
import styles from "./notifBox.module.css";

export default function NotifBoxPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread
  const [allNotifications, setAllNotifications] = useState([]); // ذخیره همه برای شمارش

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // دریافت اعلانات بر اساس filter
      const params = new URLSearchParams({
        limit: "50",
        ...(filter === "unread" && { unreadOnly: "true" }),
      });

      const response = await fetch(`/api/notifications?${params}`, {
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.notifications);
      }

      // دریافت همه اعلانات برای شمارش
      if (filter === "unread" || allNotifications.length === 0) {
        const allParams = new URLSearchParams({ limit: "50" });
        const allResponse = await fetch(`/api/notifications?${allParams}`, {
          credentials: "include",
        });
        const allData = await allResponse.json();
        if (allData.success) {
          setAllNotifications(allData.data.notifications);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    console.log(`🔵 markAsRead called with ID: ${id}`);
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      });
      
      console.log(`🔵 Response status: ${response.status}`);
      const data = await response.json();
      console.log(`🔵 Response data:`, data);
      
      if (data.success) {
        console.log(`✅ Notification ${id} marked as read successfully`);
        // بروزرسانی لیست اعلانات
        await fetchNotifications();
      } else {
        console.error("❌ Error:", data.error);
        alert(data.error || "خطا در علامت‌گذاری");
      }
    } catch (error) {
      console.error("💥 Error marking as read:", error);
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleClick = async (notif) => {
    await markAsRead(notif._id);
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      
      if (data.success) {
        // بروزرسانی همه اعلانات
        await fetchNotifications();
        alert(`${data.data.markedCount} اعلان به عنوان خوانده شده علامت‌گذاری شد`);
      } else {
        alert(data.error || "خطا در علامت‌گذاری");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("خطا در ارتباط با سرور");
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      announcement: "📢",
    };
    return icons[type] || icons.info;
  };

  if (!user) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitleSection}>
          <h1 className={styles.title}>📬 صندوق اعلانات</h1>
          <p className={styles.subtitle}>اعلانات و پیام‌های سیستم</p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={markAllAsRead} className={styles.markAllBtn}>
            ✓ علامت همه خوانده شده
          </button>
        </div>
      </div>

      <div className={styles.filtersWrapper}>
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${
              filter === "all" ? styles.filterActive : ""
            }`}
            onClick={() => setFilter("all")}
          >
            همه (
            {filter === "all"
              ? notifications.length
              : allNotifications.length}
            )
          </button>
          <button
            className={`${styles.filterBtn} ${
              filter === "unread" ? styles.filterActive : ""
            }`}
            onClick={() => setFilter("unread")}
          >
            خوانده نشده (
            {allNotifications.filter((n) => !n.isRead).length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>در حال بارگذاری...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📭</div>
          <h3 className={styles.emptyTitle}>
            {filter === "unread" ? "همه اعلانات خوانده شده!" : "اعلانی یافت نشد"}
          </h3>
          <p className={styles.emptyText}>
            {filter === "unread"
              ? "تبریک! شما همه اعلانات خود را مشاهده کرده‌اید"
              : "هنوز اعلانی برای شما ارسال نشده است"}
          </p>
        </div>
      ) : (
        <div className={styles.notificationList}>
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`${styles.notificationCard} ${
                !notif.isRead ? styles.unread : ""
              }`}
              onClick={() => handleClick(notif)}
            >
              {notif.image && (
                <div className={styles.notifImageContainer}>
                  <img src={notif.image} alt="" className={styles.notifImage} />
                </div>
              )}
              <div className={styles.notifBody}>
                <div className={styles.notifTop}>
                  <div className={styles.notifIcon}>{getTypeIcon(notif.type)}</div>
                  <div className={styles.notifContent}>
                    <div className={styles.notifHeader}>
                      <h3 className={styles.notifTitle}>{notif.title}</h3>
                      {!notif.isRead && (
                        <span className={styles.unreadBadge}>جدید</span>
                      )}
                    </div>
                    <p className={styles.notifMessage}>{notif.message}</p>
                  </div>
                </div>
                <div className={styles.notifFooter}>
                  <div className={styles.notifFooterLeft}>
                    <span className={styles.notifDate}>
                      {new Date(notif.createdAt).toLocaleDateString("fa-IR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className={`${styles.readStatus} ${notif.isRead ? styles.read : styles.unreadStatus}`}>
                      {notif.isRead ? "✓ خوانده شده" : "● خوانده نشده"}
                    </span>
                  </div>
                  <div className={styles.notifFooterRight}>
                    {!notif.isRead && (
                      <button
                        className={styles.markReadBtn}
                        onClick={(e) => {
                          console.log(`🔘 Button clicked for notification: ${notif._id}`);
                          e.stopPropagation();
                          markAsRead(notif._id);
                        }}
                        title="علامت به عنوان خوانده شده"
                      >
                        ✓ خواندم
                      </button>
                    )}
                    {notif.actionText && notif.actionUrl && (
                      <button
                        className={styles.actionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClick(notif);
                        }}
                      >
                        {notif.actionText} ←
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

