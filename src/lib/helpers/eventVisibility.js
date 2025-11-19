/**
 * Event Visibility Helper
 *
 * تعریف وضعیت‌های رویدادهایی که قابل نمایش عمومی هستند
 */

/**
 * وضعیت‌های رویدادی که در لیست‌های عمومی (meetwall, meetmap) و صفحه جزئیات نمایش داده می‌شوند
 */
export const VISIBLE_EVENT_STATUSES = {
  APPROVED: "approved", // تایید شده - رویداد فعال
  FINISHED: "finished", // پایان یافته - رویداد به پایان رسیده
  EXPIRED: "expired", // منقضی شده - رویداد منقضی شده
};

/**
 * آرایه وضعیت‌های قابل نمایش برای استفاده در کوئری‌های MongoDB
 */
export const VISIBLE_STATUSES_ARRAY = [
  VISIBLE_EVENT_STATUSES.APPROVED,
  VISIBLE_EVENT_STATUSES.FINISHED,
  VISIBLE_EVENT_STATUSES.EXPIRED,
];

/**
 * بررسی اینکه آیا یک رویداد قابل نمایش عمومی است یا خیر
 * @param {Object} event - آبجکت رویداد
 * @returns {boolean} - true اگر رویداد قابل نمایش باشد
 */
export function isEventVisible(event) {
  if (!event || !event.status) return false;
  return VISIBLE_STATUSES_ARRAY.includes(event.status);
}

/**
 * بررسی اینکه آیا رویداد فعال است (approved)
 * @param {Object} event - آبجکت رویداد
 * @returns {boolean}
 */
export function isEventActive(event) {
  return event?.status === VISIBLE_EVENT_STATUSES.APPROVED;
}

/**
 * بررسی اینکه آیا رویداد به پایان رسیده است
 * @param {Object} event - آبجکت رویداد
 * @returns {boolean}
 */
export function isEventEnded(event) {
  return (
    event?.status === VISIBLE_EVENT_STATUSES.FINISHED ||
    event?.status === VISIBLE_EVENT_STATUSES.EXPIRED
  );
}

/**
 * دریافت لیبل فارسی برای وضعیت رویداد
 * @param {string} status - وضعیت رویداد
 * @returns {string} - لیبل فارسی
 */
export function getEventStatusLabel(status) {
  const labels = {
    [VISIBLE_EVENT_STATUSES.APPROVED]: "فعال",
    [VISIBLE_EVENT_STATUSES.FINISHED]: "پایان یافته",
    [VISIBLE_EVENT_STATUSES.EXPIRED]: "منقضی شده",
  };
  return labels[status] || "نامشخص";
}

/**
 * دریافت رنگ مناسب برای نمایش badge وضعیت رویداد
 * @param {string} status - وضعیت رویداد
 * @returns {Object} - شامل backgroundColor و color
 */
export function getEventStatusColor(status) {
  const colors = {
    [VISIBLE_EVENT_STATUSES.APPROVED]: {
      backgroundColor: "#10b981",
      color: "#ffffff",
    },
    [VISIBLE_EVENT_STATUSES.FINISHED]: {
      backgroundColor: "#6b7280",
      color: "#ffffff",
    },
    [VISIBLE_EVENT_STATUSES.EXPIRED]: {
      backgroundColor: "#ef4444",
      color: "#ffffff",
    },
  };
  return (
    colors[status] || {
      backgroundColor: "#94a3b8",
      color: "#ffffff",
    }
  );
}
