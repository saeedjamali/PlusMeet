/**
 * Component: NotificationList
 * لیست اعلانات
 */

"use client";

import styles from "./notifManager.module.css";

export default function NotificationList({
  notifications,
  loading,
  onEdit,
  onDelete,
  pagination,
  onPageChange,
}) {
  if (loading) {
    return <div className={styles.loading}>در حال بارگذاری...</div>;
  }

  if (notifications.length === 0) {
    return (
      <div className={styles.empty}>
        <p>هیچ اعلانی یافت نشد</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const badges = {
      draft: { label: "پیش‌نویس", class: "badgeDraft" },
      scheduled: { label: "زمان‌بندی شده", class: "badgeScheduled" },
      published: { label: "منتشر شده", class: "badgePublished" },
      expired: { label: "منقضی شده", class: "badgeExpired" },
      cancelled: { label: "لغو شده", class: "badgeCancelled" },
    };
    const badge = badges[status] || badges.draft;
    return <span className={`${styles.badge} ${styles[badge.class]}`}>{badge.label}</span>;
  };

  const getTypeBadge = (type) => {
    const types = {
      info: { label: "ℹ️ اطلاعیه", class: "typeInfo" },
      success: { label: "✅ موفقیت", class: "typeSuccess" },
      warning: { label: "⚠️ هشدار", class: "typeWarning" },
      error: { label: "❌ خطا", class: "typeError" },
      announcement: { label: "📢 اعلامیه", class: "typeAnnouncement" },
    };
    const typeBadge = types[type] || types.info;
    return <span className={`${styles.typeBadge} ${styles[typeBadge.class]}`}>{typeBadge.label}</span>;
  };

  return (
    <div className={styles.listContainer}>
      <div className={styles.table}>
        <div className={styles.thead}>
          <div className={styles.tr}>
            <div className={styles.th}>عنوان</div>
            <div className={styles.th}>نوع</div>
            <div className={styles.th}>وضعیت</div>
            <div className={styles.th}>نقش‌های هدف</div>
            <div className={styles.th}>بازدید</div>
            <div className={styles.th}>عملیات</div>
          </div>
        </div>
        <div className={styles.tbody}>
          {notifications.map((notif) => (
            <div key={notif._id} className={styles.tr}>
              <div className={styles.td}>
                <div className={styles.notifTitle}>
                  {notif.pinned && <span className={styles.pinnedIcon}>📌</span>}
                  {notif.title}
                </div>
                <div className={styles.notifMeta}>
                  {new Date(notif.createdAt).toLocaleDateString("fa-IR")}
                </div>
              </div>
              <div className={styles.td}>{getTypeBadge(notif.type)}</div>
              <div className={styles.td}>{getStatusBadge(notif.status)}</div>
              <div className={styles.td}>
                {notif.targetRoles?.length > 0
                  ? notif.targetRoles.join(", ")
                  : "همه"}
              </div>
              <div className={styles.td}>
                <span className={styles.viewCount}>
                  👁️ {notif.viewCount || 0}
                </span>
              </div>
              <div className={styles.td}>
                <div className={styles.actions}>
                  <button
                    className={styles.editBtn}
                    onClick={() => onEdit(notif)}
                    title="ویرایش"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => onDelete(notif._id)}
                    title="حذف"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={pagination.page === 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className={styles.pageBtn}
          >
            قبلی
          </button>
          <span className={styles.pageInfo}>
            صفحه {pagination.page} از {pagination.pages}
          </span>
          <button
            disabled={pagination.page === pagination.pages}
            onClick={() => onPageChange(pagination.page + 1)}
            className={styles.pageBtn}
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}




