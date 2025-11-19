// ═══════════════════════════════════════════════════════════
// وضعیت‌های درخواست پیوستن به رویداد
// ═══════════════════════════════════════════════════════════

export const JOIN_REQUEST_STATUS = {
  // ═══════════════════════════════════════════════════════════
  // Phase 1: ثبت‌نام و بررسی
  // ═══════════════════════════════════════════════════════════
  PENDING: "pending", // درخواست اولیه
  PAYMENT_RESERVED: "payment_reserved", // مبلغ رزرو شد (48 ساعت)
  APPROVED: "approved", // مالک تایید کرد
  REJECTED: "rejected", // مالک رد کرد
  WAITLISTED: "waitlisted", // لیست انتظار

  // ═══════════════════════════════════════════════════════════
  // Phase 2: پرداخت (رویدادهای پولی بدون تایید)
  // ═══════════════════════════════════════════════════════════
  PAYMENT_PENDING: "payment_pending", // در انتظار پرداخت مستقیم
  PAID: "paid", // پرداخت شده / مبلغ کسر شد
  PAYMENT_FAILED: "payment_failed", // خطا در پرداخت

  // ═══════════════════════════════════════════════════════════
  // Phase 3: تایید نهایی
  // ═══════════════════════════════════════════════════════════
  CONFIRMED: "confirmed", // ثبت‌نام کامل

  // ═══════════════════════════════════════════════════════════
  // Phase 4: روز رویداد
  // ═══════════════════════════════════════════════════════════
  CHECKED_IN: "checked_in", // حضور ثبت شد
  ATTENDED: "attended", // شرکت کرد
  NO_SHOW: "no_show", // حضور نداشت

  // ═══════════════════════════════════════════════════════════
  // Phase 5: پایان
  // ═══════════════════════════════════════════════════════════
  COMPLETED: "completed", // رویداد تمام شد

  // ═══════════════════════════════════════════════════════════
  // States خاص (لغو / بازپرداخت)
  // ═══════════════════════════════════════════════════════════
  CANCELED: "canceled", // کاربر لغو کرد
  REVOKED: "revoked", // مالک لغو کرد
  REFUNDED: "refunded", // بازپرداخت شد
  EXPIRED: "expired", // 48 ساعت گذشت
};

// ═══════════════════════════════════════════════════════════
// برچسب‌های فارسی
// ═══════════════════════════════════════════════════════════

export const JOIN_REQUEST_STATUS_LABELS = {
  // مراحل اصلی
  [JOIN_REQUEST_STATUS.PENDING]: "در انتظار بررسی",
  [JOIN_REQUEST_STATUS.PAYMENT_RESERVED]: "مبلغ رزرو شده",
  [JOIN_REQUEST_STATUS.APPROVED]: "تایید شده",
  [JOIN_REQUEST_STATUS.REJECTED]: "رد شده",
  [JOIN_REQUEST_STATUS.WAITLISTED]: "لیست انتظار",

  // پرداخت
  [JOIN_REQUEST_STATUS.PAYMENT_PENDING]: "در انتظار پرداخت",
  [JOIN_REQUEST_STATUS.PAID]: "پرداخت شده",
  [JOIN_REQUEST_STATUS.PAYMENT_FAILED]: "خطا در پرداخت",

  // تایید نهایی
  [JOIN_REQUEST_STATUS.CONFIRMED]: "ثبت‌نام کامل",

  // روز رویداد
  [JOIN_REQUEST_STATUS.CHECKED_IN]: "حضور ثبت شده",
  [JOIN_REQUEST_STATUS.ATTENDED]: "شرکت کرده",
  [JOIN_REQUEST_STATUS.NO_SHOW]: "حضور نداشت",

  // پایان
  [JOIN_REQUEST_STATUS.COMPLETED]: "تکمیل شده",

  // خاص
  [JOIN_REQUEST_STATUS.CANCELED]: "لغو شده",
  [JOIN_REQUEST_STATUS.REVOKED]: "لغو توسط مالک",
  [JOIN_REQUEST_STATUS.REFUNDED]: "بازپرداخت شده",
  [JOIN_REQUEST_STATUS.EXPIRED]: "منقضی شده",
};

// ═══════════════════════════════════════════════════════════
// رنگ‌بندی وضعیت‌ها
// ═══════════════════════════════════════════════════════════

export const JOIN_REQUEST_STATUS_COLORS = {
  // مراحل اصلی
  [JOIN_REQUEST_STATUS.PENDING]: {
    bg: "#dbeafe",
    text: "#1e40af",
    border: "#3b82f6",
  },
  [JOIN_REQUEST_STATUS.PAYMENT_RESERVED]: {
    bg: "#fef3c7",
    text: "#92400e",
    border: "#f59e0b",
  },
  [JOIN_REQUEST_STATUS.APPROVED]: {
    bg: "#d1fae5",
    text: "#065f46",
    border: "#10b981",
  },
  [JOIN_REQUEST_STATUS.REJECTED]: {
    bg: "#fee2e2",
    text: "#991b1b",
    border: "#ef4444",
  },
  [JOIN_REQUEST_STATUS.WAITLISTED]: {
    bg: "#fed7aa",
    text: "#9a3412",
    border: "#fb923c",
  },

  // پرداخت
  [JOIN_REQUEST_STATUS.PAYMENT_PENDING]: {
    bg: "#fef3c7",
    text: "#92400e",
    border: "#fbbf24",
  },
  [JOIN_REQUEST_STATUS.PAID]: {
    bg: "#d1fae5",
    text: "#065f46",
    border: "#10b981",
  },
  [JOIN_REQUEST_STATUS.PAYMENT_FAILED]: {
    bg: "#fee2e2",
    text: "#991b1b",
    border: "#ef4444",
  },

  // تایید نهایی
  [JOIN_REQUEST_STATUS.CONFIRMED]: {
    bg: "#dbeafe",
    text: "#1e40af",
    border: "#3b82f6",
  },

  // روز رویداد
  [JOIN_REQUEST_STATUS.CHECKED_IN]: {
    bg: "#e9d5ff",
    text: "#6b21a8",
    border: "#a855f7",
  },
  [JOIN_REQUEST_STATUS.ATTENDED]: {
    bg: "#d1fae5",
    text: "#065f46",
    border: "#059669",
  },
  [JOIN_REQUEST_STATUS.NO_SHOW]: {
    bg: "#e5e7eb",
    text: "#374151",
    border: "#6b7280",
  },

  // پایان
  [JOIN_REQUEST_STATUS.COMPLETED]: {
    bg: "#d1fae5",
    text: "#064e3b",
    border: "#047857",
  },

  // خاص
  [JOIN_REQUEST_STATUS.CANCELED]: {
    bg: "#f3f4f6",
    text: "#4b5563",
    border: "#9ca3af",
  },
  [JOIN_REQUEST_STATUS.REVOKED]: {
    bg: "#fee2e2",
    text: "#7f1d1d",
    border: "#dc2626",
  },
  [JOIN_REQUEST_STATUS.REFUNDED]: {
    bg: "#dbeafe",
    text: "#1e3a8a",
    border: "#60a5fa",
  },
  [JOIN_REQUEST_STATUS.EXPIRED]: {
    bg: "#e5e7eb",
    text: "#1f2937",
    border: "#4b5563",
  },
};

// ═══════════════════════════════════════════════════════════
// آیکون‌ها (Emoji)
// ═══════════════════════════════════════════════════════════

export const JOIN_REQUEST_STATUS_ICONS = {
  // مراحل اصلی
  [JOIN_REQUEST_STATUS.PENDING]: "⏳",
  [JOIN_REQUEST_STATUS.PAYMENT_RESERVED]: "🔒",
  [JOIN_REQUEST_STATUS.APPROVED]: "✅",
  [JOIN_REQUEST_STATUS.REJECTED]: "❌",
  [JOIN_REQUEST_STATUS.WAITLISTED]: "⏰",

  // پرداخت
  [JOIN_REQUEST_STATUS.PAYMENT_PENDING]: "💰",
  [JOIN_REQUEST_STATUS.PAID]: "💳",
  [JOIN_REQUEST_STATUS.PAYMENT_FAILED]: "⚠️",

  // تایید نهایی
  [JOIN_REQUEST_STATUS.CONFIRMED]: "🎉",

  // روز رویداد
  [JOIN_REQUEST_STATUS.CHECKED_IN]: "📍",
  [JOIN_REQUEST_STATUS.ATTENDED]: "👤",
  [JOIN_REQUEST_STATUS.NO_SHOW]: "👻",

  // پایان
  [JOIN_REQUEST_STATUS.COMPLETED]: "🏆",

  // خاص
  [JOIN_REQUEST_STATUS.CANCELED]: "🚫",
  [JOIN_REQUEST_STATUS.REVOKED]: "🔴",
  [JOIN_REQUEST_STATUS.REFUNDED]: "↩️",
  [JOIN_REQUEST_STATUS.EXPIRED]: "⌛",
};

// ═══════════════════════════════════════════════════════════
// دسته‌بندی وضعیت‌ها
// ═══════════════════════════════════════════════════════════

/**
 * وضعیت‌هایی که کاربر می‌تواند لغو کند
 * فقط تا قبل از APPROVED امکان لغو وجود دارد
 */
export const CANCELABLE_STATUSES = [
  JOIN_REQUEST_STATUS.PENDING,
  JOIN_REQUEST_STATUS.PAYMENT_RESERVED,
  JOIN_REQUEST_STATUS.PAYMENT_PENDING,
  JOIN_REQUEST_STATUS.WAITLISTED,
];

/**
 * وضعیت‌هایی که قابل بازپرداخت هستند
 * فقط وضعیت‌هایی که مبلغ کسر شده است
 */
export const REFUNDABLE_STATUSES = [
  JOIN_REQUEST_STATUS.PAID,
  JOIN_REQUEST_STATUS.CONFIRMED,
  JOIN_REQUEST_STATUS.REVOKED,
];

/**
 * وضعیت‌های نهایی (غیرقابل تغییر)
 */
export const FINAL_STATUSES = [
  JOIN_REQUEST_STATUS.COMPLETED,
  JOIN_REQUEST_STATUS.REJECTED,
  JOIN_REQUEST_STATUS.CANCELED,
  JOIN_REQUEST_STATUS.EXPIRED,
  JOIN_REQUEST_STATUS.REFUNDED,
  JOIN_REQUEST_STATUS.NO_SHOW,
];

/**
 * وضعیت‌هایی که مبلغ قفل است (رزرو شده اما کسر نشده)
 */
export const LOCKED_PAYMENT_STATUSES = [
  JOIN_REQUEST_STATUS.PAYMENT_RESERVED,
  JOIN_REQUEST_STATUS.APPROVED,
];

/**
 * وضعیت‌هایی که مبلغ کسر شده است
 */
export const DEDUCTED_PAYMENT_STATUSES = [
  JOIN_REQUEST_STATUS.PAID,
  JOIN_REQUEST_STATUS.CONFIRMED,
  JOIN_REQUEST_STATUS.CHECKED_IN,
  JOIN_REQUEST_STATUS.ATTENDED,
  JOIN_REQUEST_STATUS.COMPLETED,
];

/**
 * وضعیت‌های فعال (در رویداد هستند)
 */
export const ACTIVE_STATUSES = [
  JOIN_REQUEST_STATUS.APPROVED,
  JOIN_REQUEST_STATUS.PAID,
  JOIN_REQUEST_STATUS.CONFIRMED,
  JOIN_REQUEST_STATUS.CHECKED_IN,
  JOIN_REQUEST_STATUS.ATTENDED,
];

/**
 * وضعیت‌های سیستمی (فقط توسط سیستم قابل تغییر)
 * این وضعیت‌ها توسط کاربر یا مالک قابل تغییر نیستند
 */
export const SYSTEM_ONLY_STATUSES = [
  JOIN_REQUEST_STATUS.PAYMENT_RESERVED, // رزرو خودکار بعد از تایید
  JOIN_REQUEST_STATUS.PAYMENT_PENDING, // در انتظار پرداخت
  JOIN_REQUEST_STATUS.PAID, // پرداخت موفق
  JOIN_REQUEST_STATUS.PAYMENT_FAILED, // پرداخت ناموفق
  JOIN_REQUEST_STATUS.EXPIRED, // منقضی شده (48 ساعت)
];

/**
 * وضعیت‌هایی که توسط کاربر قابل تغییر هستند
 */
export const USER_CHANGEABLE_STATUSES = [
  JOIN_REQUEST_STATUS.CANCELED, // کاربر می‌تواند درخواست خود را لغو کند
];

/**
 * وضعیت‌هایی که توسط مالک رویداد قابل تغییر هستند
 */
export const OWNER_CHANGEABLE_STATUSES = [
  JOIN_REQUEST_STATUS.APPROVED, // تایید درخواست
  JOIN_REQUEST_STATUS.REJECTED, // رد درخواست
  JOIN_REQUEST_STATUS.CONFIRMED, // تایید نهایی
  JOIN_REQUEST_STATUS.WAITLISTED, // انتقال به لیست انتظار
  JOIN_REQUEST_STATUS.REVOKED, // لغو توسط مالک
  JOIN_REQUEST_STATUS.REFUNDED, // بازپرداخت
  JOIN_REQUEST_STATUS.CHECKED_IN, // ثبت حضور
  JOIN_REQUEST_STATUS.ATTENDED, // شرکت کرده
  JOIN_REQUEST_STATUS.NO_SHOW, // غیبت
  JOIN_REQUEST_STATUS.COMPLETED, // تکمیل شده
];

// ═══════════════════════════════════════════════════════════
// تنظیمات زمان‌بندی
// ═══════════════════════════════════════════════════════════

/**
 * مهلت تایید مالک (به میلی‌ثانیه)
 * 48 ساعت = 48 * 60 * 60 * 1000
 */
export const OWNER_APPROVAL_TIMEOUT = 48 * 60 * 60 * 1000;

/**
 * مهلت پرداخت (برای رویدادهای بدون تایید)
 * 30 دقیقه = 30 * 60 * 1000
 */
export const PAYMENT_TIMEOUT = 30 * 60 * 1000;

// ═══════════════════════════════════════════════════════════
// توابع کمکی
// ═══════════════════════════════════════════════════════════

/**
 * دریافت برچسب فارسی وضعیت
 */
export function getStatusLabel(status) {
  return JOIN_REQUEST_STATUS_LABELS[status] || status;
}

/**
 * دریافت رنگ وضعیت
 */
export function getStatusColor(status) {
  const colors = JOIN_REQUEST_STATUS_COLORS[status];
  if (!colors) {
    return "#f3f4f6"; // رنگ پیش‌فرض
  }
  return colors.bg;
}

/**
 * دریافت آیکون وضعیت
 */
export function getStatusIcon(status) {
  return JOIN_REQUEST_STATUS_ICONS[status] || "📝";
}

/**
 * دریافت اطلاعات کامل وضعیت
 */
export function getStatusInfo(status) {
  return {
    label: getStatusLabel(status),
    color: JOIN_REQUEST_STATUS_COLORS[status],
    icon: getStatusIcon(status),
  };
}

// ═══════════════════════════════════════════════════════════
// Export پیش‌فرض
// ═══════════════════════════════════════════════════════════

export default JOIN_REQUEST_STATUS;
