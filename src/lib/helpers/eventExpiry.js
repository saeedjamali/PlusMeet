import dbConnect from "@/lib/db/mongodb";
import Event from "@/lib/models/Event.model";

/**
 * Helper برای مدیریت انقضای خودکار رویدادها
 * رویدادهایی که 72 ساعت از تاریخ پایانشان گذشته، به صورت خودکار expired می‌شوند
 */

/**
 * تبدیل رویدادهای منقضی شده به وضعیت expired
 * این متد باید در یک cron job یا scheduler اجرا شود
 *
 * @returns {Promise<{success: boolean, expiredCount: number, events: Array}>}
 */
export async function expireOldEvents() {
  try {
    await dbConnect();

    // محاسبه زمان 72 ساعت قبل
    const expiryThreshold = new Date();
    expiryThreshold.setHours(expiryThreshold.getHours() - 72);

    console.log("🕐 Checking for events to expire...");
    console.log("📅 Expiry threshold (72 hours ago):", expiryThreshold);

    // یافتن رویدادهایی که:
    // 1. وضعیتشان approved است
    // 2. تاریخ پایانشان بیش از 72 ساعت قبل بوده
    // 3. هنوز به finished یا expired تبدیل نشده‌اند
    const eventsToExpire = await Event.find({
      status: "approved",
      endDate: { $lte: expiryThreshold },
    }).select("_id title endDate status");

    if (!eventsToExpire || eventsToExpire.length === 0) {
      console.log("✅ No events to expire");
      return {
        success: true,
        expiredCount: 0,
        events: [],
      };
    }

    console.log(`📋 Found ${eventsToExpire.length} events to expire`);

    // تبدیل وضعیت به expired
    const updateResult = await Event.updateMany(
      {
        _id: { $in: eventsToExpire.map((e) => e._id) },
      },
      {
        $set: {
          status: "expired",
          expiredAt: new Date(),
        },
      }
    );

    console.log(`✅ Successfully expired ${updateResult.modifiedCount} events`);

    return {
      success: true,
      expiredCount: updateResult.modifiedCount,
      events: eventsToExpire.map((e) => ({
        id: e._id,
        title: e.title,
        endDate: e.endDate,
        previousStatus: e.status,
      })),
    };
  } catch (error) {
    console.error("❌ Error expiring events:", error);
    return {
      success: false,
      error: error.message,
      expiredCount: 0,
      events: [],
    };
  }
}

/**
 * بررسی اینکه آیا یک رویداد می‌تواند به finished تبدیل شود
 * رویداد باید تاریخ پایانش گذشته باشد
 *
 * @param {Object} event - رویداد مورد نظر
 * @returns {{canFinish: boolean, reason?: string}}
 */
export function canFinishEvent(event) {
  if (!event) {
    return {
      canFinish: false,
      reason: "رویداد یافت نشد",
    };
  }

  // چک کردن وضعیت
  if (event.status !== "approved") {
    return {
      canFinish: false,
      reason: "فقط رویدادهای تایید شده قابل پایان هستند",
    };
  }

  // چک کردن تاریخ پایان
  if (!event.endDate) {
    return {
      canFinish: false,
      reason: "تاریخ پایان رویداد تعیین نشده است",
    };
  }

  const now = new Date();
  const endDate = new Date(event.endDate);

  if (endDate > now) {
    const remainingHours = Math.ceil((endDate - now) / (1000 * 60 * 60));
    return {
      canFinish: false,
      reason: `رویداد هنوز پایان نیافته است. ${remainingHours} ساعت تا پایان رویداد باقی مانده است`,
      remainingHours,
    };
  }

  return {
    canFinish: true,
  };
}

/**
 * بررسی اینکه آیا یک رویداد قابل ویرایش است
 * رویدادهای finished و expired قابل ویرایش نیستند
 *
 * @param {Object} event - رویداد مورد نظر
 * @returns {{canEdit: boolean, reason?: string}}
 */
export function canEditEvent(event) {
  if (!event) {
    return {
      canEdit: false,
      reason: "رویداد یافت نشد",
    };
  }

  const nonEditableStatuses = ["finished", "expired", "deleted"];

  if (nonEditableStatuses.includes(event.status)) {
    return {
      canEdit: false,
      reason: `رویدادهای با وضعیت "${getStatusLabel(
        event.status
      )}" قابل ویرایش نیستند`,
    };
  }

  return {
    canEdit: true,
  };
}

/**
 * دریافت لیبل فارسی وضعیت رویداد
 *
 * @param {string} status - وضعیت رویداد
 * @returns {string}
 */
export function getStatusLabel(status) {
  const statusLabels = {
    draft: "پیش‌نویس",
    pending: "در انتظار تایید",
    approved: "تایید شده",
    rejected: "رد شده",
    suspended: "تعلیق شده",
    deleted: "حذف شده",
    finished: "خاتمه یافته",
    expired: "منقضی شده",
  };

  return statusLabels[status] || status;
}

/**
 * دریافت رنگ مناسب برای وضعیت رویداد
 *
 * @param {string} status - وضعیت رویداد
 * @returns {string}
 */
export function getStatusColor(status) {
  const statusColors = {
    draft: "#95a5a6", // خاکستری
    pending: "#f39c12", // نارنجی
    approved: "#27ae60", // سبز
    rejected: "#e74c3c", // قرمز
    suspended: "#e67e22", // نارنجی تیره
    deleted: "#7f8c8d", // خاکستری تیره
    finished: "#3498db", // آبی
    expired: "#95a5a6", // خاکستری
  };

  return statusColors[status] || "#95a5a6";
}

export default {
  expireOldEvents,
  canFinishEvent,
  canEditEvent,
  getStatusLabel,
  getStatusColor,
};
