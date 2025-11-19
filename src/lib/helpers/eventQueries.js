/**
 * Helper functions for querying events with proper access control
 * استفاده مجدد در APIها و صفحات مختلف
 */

const { parsePersianDate } = require("@/lib/utils/dateConverter");
const { VISIBLE_STATUSES_ARRAY } = require("./eventVisibility");

/**
 * ساخت query برای رویدادهای عمومی (public)
 * رویدادهایی که status در لیست وضعیت‌های قابل نمایش (approved, finished, expired) و visibility.level=public هستند
 *
 * @param {Object} additionalFilters - فیلترهای اضافی (دسته‌بندی، شهر، ...)
 * @returns {Object} MongoDB query object
 */
export function buildPublicEventsQuery(additionalFilters = {}) {
  const query = {
    status: { $in: VISIBLE_STATUSES_ARRAY }, // approved, finished, expired
    "visibility.level": "public",
    ...additionalFilters,
  };

  return query;
}

/**
 * اعمال فیلترها به query براساس searchParams
 *
 * @param {URLSearchParams} searchParams - پارامترهای جستجو از URL
 * @returns {Object} فیلترهای پردازش شده
 */
export function parseEventFilters(searchParams) {
  const filters = {};

  // جستجوی متنی (در عنوان و توضیحات)
  const search = searchParams.get("search");
  if (search) {
    filters.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // دسته‌بندی اصلی (چند انتخابی)
  const categories = searchParams.get("categories");
  if (categories) {
    const categoryArray = categories.split(",").filter(Boolean);
    if (categoryArray.length > 0) {
      filters.topicCategory = { $in: categoryArray };
    }
  }

  // زیردسته (چند انتخابی)
  const subCategories = searchParams.get("subCategories");
  if (subCategories) {
    const subCategoryArray = subCategories.split(",").filter(Boolean);
    if (subCategoryArray.length > 0) {
      filters.topicSubcategory = { $in: subCategoryArray };
    }
  }

  // نوع برگزاری (چند انتخابی)
  const formatModes = searchParams.get("formatModes");
  if (formatModes) {
    const formatModeArray = formatModes.split(",").filter(Boolean);
    if (formatModeArray.length > 0) {
      filters.formatMode = { $in: formatModeArray };
    }
  }

  // نوع مشارکت (چند انتخابی)
  const participationTypes = searchParams.get("participationTypes");
  if (participationTypes) {
    const participationTypeArray = participationTypes
      .split(",")
      .filter(Boolean);
    if (participationTypeArray.length > 0) {
      filters.participationType = { $in: participationTypeArray };
    }
  }

  // نوع بلیط (چند انتخابی)
  const ticketTypes = searchParams.get("ticketTypes");
  if (ticketTypes) {
    const ticketTypeArray = ticketTypes.split(",").filter(Boolean);
    if (ticketTypeArray.length > 0) {
      // ticketTypes: ["free", "paid", "mixed"]
      filters["ticket.type"] = { $in: ticketTypeArray };
    }
  }

  // شهر (چند انتخابی)
  const cities = searchParams.get("cities");
  if (cities) {
    const cityArray = cities.split(",").filter(Boolean);
    if (cityArray.length > 0) {
      filters["location.city"] = { $in: cityArray };
    }
  }

  // استان (چند انتخابی)
  const provinces = searchParams.get("provinces");
  if (provinces) {
    const provinceArray = provinces.split(",").filter(Boolean);
    if (provinceArray.length > 0) {
      filters["location.province"] = { $in: provinceArray };
    }
  }

  // فیلتر تاریخ (از تاریخ)
  const dateFrom = searchParams.get("dateFrom");
  if (dateFrom) {
    try {
      // تبدیل تاریخ فارسی به Gregorian
      // فرمت ورودی: YYYY-MM-DD (Persian)
      const dateObj = parsePersianDate(dateFrom);
      if (dateObj && !isNaN(dateObj.getTime())) {
        // تنظیم ساعت به 00:00:00
        dateObj.setHours(0, 0, 0, 0);
        filters["schedule.startDate"] = {
          ...filters["schedule.startDate"],
          $gte: dateObj,
        };
      }
    } catch (err) {
      console.error("Error parsing dateFrom:", err);
    }
  }

  // فیلتر تاریخ (تا تاریخ)
  const dateTo = searchParams.get("dateTo");
  if (dateTo) {
    try {
      // تبدیل تاریخ فارسی به Gregorian
      // فرمت ورودی: YYYY-MM-DD (Persian)
      const dateObj = parsePersianDate(dateTo);
      if (dateObj && !isNaN(dateObj.getTime())) {
        // اضافه کردن 23:59:59 به تاریخ پایان
        dateObj.setHours(23, 59, 59, 999);
        filters["schedule.startDate"] = {
          ...filters["schedule.startDate"],
          $lte: dateObj,
        };
      }
    } catch (err) {
      console.error("Error parsing dateTo:", err);
    }
  }

  return filters;
}

/**
 * پارامترهای پیش‌فرض برای populate
 */
export const defaultEventPopulate = [
  { path: "creator", select: "firstName lastName displayName avatar" },
  { path: "topicCategory", select: "title code icon" },
  { path: "topicSubcategory", select: "title code icon" },
  { path: "formatMode", select: "title code icon" },
  { path: "participationType", select: "title code icon" },
];

/**
 * فیلدهایی که باید در response برای لیست عمومی نمایش داده شوند
 */
export const publicEventFields = [
  "title",
  "slug",
  "description",
  "coverImage",
  "images",
  "topicCategory",
  "topicSubcategory",
  "formatMode",
  "participationType",
  "location",
  "schedule",
  "pricing",
  "ticket",
  "capacity",
  "status",
  "visibility",
  "creator",
  "createdAt",
  "updatedAt",
  "startDate",
  "endDate",
  "rating",
  "reviewCount",
].join(" ");
