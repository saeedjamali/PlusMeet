/**
 * ActivityLog Model - MongoDB Schema
 * مدل لاگ فعالیت‌های کاربران
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

const ActivityLogSchema = new Schema(
  {
    // کاربر
    userId: {
      type: String, // شماره موبایل
      required: true,
      index: true,
    },

    // نوع فعالیت
    action: {
      type: String,
      required: true,
      enum: [
        // احراز هویت
        "login",
        "logout",
        "register",
        "password_change",
        "otp_request",

        // پروفایل
        "profile_view",
        "profile_edit",
        "profile_update",
        "avatar_upload",

        // رویدادها
        "event_create",
        "event_edit",
        "event_delete",
        "event_view",
        "event_join",
        "event_leave",
        "event_cancel",

        // تعاملات اجتماعی
        "like",
        "unlike",
        "comment",
        "comment_delete",
        "share",
        "follow",
        "unfollow",

        // پرداخت
        "payment_initiate",
        "payment_success",
        "payment_failed",
        "refund_request",

        // گزارش و مدیریت
        "report_submit",
        "report_review",
        "user_suspend",
        "user_unsuspend",
        "user_verify",
        "user_delete",
        "user_update",
        "user_state_change",

        // سیستم
        "settings_change",
        "permission_grant",
        "permission_revoke",
        "role_assign",
        "role_remove",
        "role_update",
        "role_upgrade",

        // مدیریت کاربران (Admin)
        "users.list",
        "users.view",
        "users.search",
        "users.export",
        "users.roles.update",
        "users.permissions.grant",
        "users.permissions.revoke",
        "user.view",
        "user.create",
        "user.delete",

        // دسترسی API (RBAC)
        "api_access_granted",
        "api_access_denied",

        // مدیریت منوها (Settings)
        "settings.menus.list",
        "menu.create",
        "menu.update",
        "menu.delete",

        // مدیریت اعلانات (Notifications)
        "notification.create",
        "notification.update",
        "notification.delete",
        "notification.read",
        "notification.click",
        "notification.mark_all_read",

        // نظرات و بررسی‌ها (Reviews)
        "review.create",
        "review.update",
        "review.delete",
        "review.moderate",
        "review.approve",
        "review.reject",
        "review.reply",
        "review.reply.moderate",
        "review.reply.approve",
        "review.reply.reject",
      ],
      index: true,
    },

    // جزئیات
    targetType: {
      type: String,
      enum: [
        "User",
        "user",
        "Event",
        "event",
        "comment",
        "post",
        "payment",
        "report",
        "Role",
        "Permission",
        "ApiEndpoint",
        "Menu",
        "Review",
        "review",
        null,
      ],
    },
    targetId: {
      type: String, // آیدی هدف
    },

    // اطلاعات تکنیکال
    ipAddress: String,
    userAgent: String,
    deviceType: {
      type: String,
      enum: ["mobile", "tablet", "desktop", "unknown"],
    },
    browser: String,
    os: String,

    // موقعیت جغرافیایی (اختیاری)
    location: {
      country: String,
      city: String,
      coordinates: {
        type: [Number], // [lng, lat]
        index: "2dsphere",
      },
    },

    // متادیتا (اطلاعات اضافی)
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // وضعیت
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success",
    },

    // خطا (در صورت وجود)
    error: String,

    // زمان
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // چون خودمون timestamp داریم
  }
);

// ========================================
// Indexes
// ========================================
ActivityLogSchema.index({ userId: 1, timestamp: -1 });
ActivityLogSchema.index({ action: 1, timestamp: -1 });
ActivityLogSchema.index({ timestamp: -1 });

// Index برای query های پیچیده
ActivityLogSchema.index({
  userId: 1,
  action: 1,
  timestamp: -1,
});

// TTL Index - حذف خودکار لاگ‌های قدیمی بعد از 90 روز
ActivityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// ========================================
// Statics
// ========================================

/**
 * دریافت فعالیت‌های کاربر
 */
ActivityLogSchema.statics.getUserActivities = function (userId, options = {}) {
  const { action, limit = 50, skip = 0, startDate, endDate } = options;

  const query = { userId };

  if (action) {
    query.action = action;
  }

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  return this.find(query).sort({ timestamp: -1 }).limit(limit).skip(skip);
};

/**
 * آمار فعالیت‌های کاربر
 */
ActivityLogSchema.statics.getUserStats = async function (userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        userId,
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$action",
        count: { $sum: 1 },
      },
    },
  ]);

  return stats.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});
};

/**
 * تعداد بازدید پروفایل
 */
ActivityLogSchema.statics.getProfileViews = function (userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.countDocuments({
    targetType: "user",
    targetId: userId,
    action: "profile_view",
    timestamp: { $gte: startDate },
  });
};

// ========================================
// Methods
// ========================================

/**
 * جزئیات خواناتر لاگ
 */
ActivityLogSchema.methods.toReadable = function () {
  const actionTexts = {
    login: "ورود به سیستم",
    logout: "خروج از سیستم",
    register: "ثبت‌نام",
    profile_edit: "ویرایش پروفایل",
    event_create: "ایجاد رویداد",
    event_join: "عضویت در رویداد",
    // ... بقیه
  };

  return {
    action: actionTexts[this.action] || this.action,
    time: this.timestamp,
    device: this.deviceType,
    status: this.status,
  };
};

// ========================================
// Helper Function برای ثبت لاگ
// ========================================

/**
 * ثبت فعالیت
 * @param {string} userId - شماره موبایل کاربر
 * @param {string} action - نوع فعالیت
 * @param {object} data - اطلاعات اضافی
 */
export async function logActivity(userId, action, data = {}) {
  const {
    targetType = null,
    targetId = null,
    ipAddress = null,
    userAgent = null,
    metadata = {},
    status = "success",
    error = null,
  } = data;

  // تشخیص نوع دستگاه و مرورگر از userAgent
  let deviceType = "unknown";
  let browser = "unknown";
  let os = "unknown";

  if (userAgent) {
    // ساده‌سازی شده - می‌توان از کتابخانه ua-parser-js استفاده کرد
    if (/mobile/i.test(userAgent)) deviceType = "mobile";
    else if (/tablet/i.test(userAgent)) deviceType = "tablet";
    else deviceType = "desktop";

    if (/chrome/i.test(userAgent)) browser = "Chrome";
    else if (/firefox/i.test(userAgent)) browser = "Firefox";
    else if (/safari/i.test(userAgent)) browser = "Safari";

    if (/windows/i.test(userAgent)) os = "Windows";
    else if (/mac/i.test(userAgent)) os = "macOS";
    else if (/android/i.test(userAgent)) os = "Android";
    else if (/ios/i.test(userAgent)) os = "iOS";
  }

  const ActivityLog =
    mongoose.models.ActivityLog ||
    mongoose.model("ActivityLog", ActivityLogSchema);

  try {
    await ActivityLog.create({
      userId,
      action,
      targetType,
      targetId,
      ipAddress,
      userAgent,
      deviceType,
      browser,
      os,
      metadata,
      status,
      error,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("Error logging activity:", err);
    // در صورت خطا، لاگ را ثبت نکن تا سیستم اصلی مختل نشود
  }
}

// ========================================
// Export
// ========================================

const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", ActivityLogSchema);

export default ActivityLog;
