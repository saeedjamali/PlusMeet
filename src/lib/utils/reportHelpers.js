/**
 * Helper functions برای گزارشات تخلف
 * این توابع در سمت client قابل استفاده هستند
 */

/**
 * دریافت label فارسی دسته‌بندی گزارش
 */
export const getReportCategoryLabel = (category) => {
  const labels = {
    inappropriate_content: "محتوای نامناسب",
    spam: "هرزنامه",
    misleading: "گمراه‌کننده",
    copyright: "نقض حق نسخه‌برداری",
    violence: "خشونت",
    harassment: "آزار و اذیت",
    scam: "کلاهبرداری",
    other: "سایر",
  };
  return labels[category] || category;
};

/**
 * دریافت label فارسی وضعیت گزارش
 */
export const getReportStatusLabel = (status) => {
  const labels = {
    pending: "در انتظار بررسی",
    reviewing: "در حال بررسی",
    resolved: "حل شده",
    rejected: "رد شده",
    closed: "بسته شده",
  };
  return labels[status] || status;
};

/**
 * دریافت label فارسی اولویت گزارش
 */
export const getReportPriorityLabel = (priority) => {
  const labels = {
    low: "کم",
    medium: "متوسط",
    high: "زیاد",
    urgent: "فوری",
  };
  return labels[priority] || priority;
};


