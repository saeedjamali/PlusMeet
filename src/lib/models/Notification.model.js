/**
 * Notification Model
 * مدل اعلانات سیستم
 */

import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    // عنوان اعلان
    title: {
      type: String,
      required: [true, "عنوان اعلان الزامی است"],
      trim: true,
      maxlength: [200, "عنوان نمی‌تواند بیشتر از 200 کاراکتر باشد"],
    },

    // متن اعلان
    message: {
      type: String,
      required: [true, "متن اعلان الزامی است"],
      trim: true,
    },

    // تصویر اعلان (اختیاری)
    image: {
      type: String,
      default: null,
    },

    // نوع اعلان
    type: {
      type: String,
      enum: ["info", "success", "warning", "error", "announcement"],
      default: "info",
    },

    // اولویت
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // نقش‌های هدف (اگر خالی باشد، برای همه)
    targetRoles: {
      type: [String],
      default: [],
    },

    // کاربران هدف مشخص (اختیاری - برای ارسال به کاربران خاص)
    targetUsers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },

    // لینک عملیات (اختیاری)
    actionUrl: {
      type: String,
      default: null,
    },

    // متن دکمه عملیات
    actionText: {
      type: String,
      default: null,
    },

    // زمان‌بندی
    scheduledAt: {
      type: Date,
      default: null,
    },

    // تاریخ انقضا
    expiresAt: {
      type: Date,
      default: null,
    },

    // وضعیت
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "expired", "cancelled"],
      default: "draft",
    },

    // آیا باید در صفحه اول نمایش داده شود؟
    pinned: {
      type: Boolean,
      default: false,
    },

    // نمایش در صفحه اصلی (اعلان عمومی)
    showOnHomepage: {
      type: Boolean,
      default: false,
    },

    // تعداد کاربرانی که دیده‌اند
    viewCount: {
      type: Number,
      default: 0,
    },

    // تعداد کاربرانی که کلیک کرده‌اند
    clickCount: {
      type: Number,
      default: 0,
    },

    // ایجادکننده
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // آخرین ویرایش‌کننده
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // متادیتا (داده‌های اضافی)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
NotificationSchema.index({ status: 1, scheduledAt: 1 });
NotificationSchema.index({ targetRoles: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 });

// Virtual: آیا منقضی شده؟
NotificationSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual: آیا باید منتشر شود؟
NotificationSchema.virtual("shouldPublish").get(function () {
  if (this.status !== "scheduled") return false;
  if (!this.scheduledAt) return true;
  return new Date() >= this.scheduledAt;
});

// Method: بررسی اینکه آیا برای یک کاربر خاص قابل نمایش است
NotificationSchema.methods.isVisibleForUser = function (user) {
  // چک کردن انقضا
  if (this.isExpired) return false;

  // چک کردن وضعیت
  if (this.status !== "published") return false;

  // چک کردن زمان‌بندی
  if (this.scheduledAt && new Date() < this.scheduledAt) return false;

  // اگر کاربران خاص تعیین شده
  if (this.targetUsers && this.targetUsers.length > 0) {
    return this.targetUsers.some(
      (userId) => userId.toString() === user._id.toString()
    );
  }

  // اگر نقش‌های خاص تعیین شده
  if (this.targetRoles && this.targetRoles.length > 0) {
    return user.roles.some((role) => this.targetRoles.includes(role));
  }

  // اگر هیچ محدودیتی نیست، برای همه نمایش داده می‌شود
  return true;
};

// Method: افزایش تعداد بازدید
NotificationSchema.methods.incrementView = async function () {
  this.viewCount += 1;
  await this.save();
};

// Method: افزایش تعداد کلیک
NotificationSchema.methods.incrementClick = async function () {
  this.clickCount += 1;
  await this.save();
};

// Static method: دریافت اعلانات یک کاربر
NotificationSchema.statics.getForUser = async function (user, options = {}) {
  const { limit = 20, skip = 0, unreadOnly = false } = options;

  const query = {
    status: "published",
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
    $and: [
      {
        $or: [
          { scheduledAt: { $exists: false } },
          { scheduledAt: { $lte: new Date() } },
        ],
      },
    ],
  };

  // فیلتر بر اساس نقش یا کاربر خاص
  const roleFilter = {
    $or: [
      { targetRoles: { $size: 0 } }, // هیچ نقشی انتخاب نشده (برای همه)
      { targetRoles: { $in: user.roles } }, // نقش کاربر در لیست است
      { targetUsers: user._id }, // کاربر مستقیماً در لیست است
    ],
  };

  query.$and.push(roleFilter);

  const notifications = await this.find(query)
    .sort({ pinned: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("createdBy", "firstName lastName displayName")
    .lean();

  return notifications;
};

// Static method: شمارش اعلانات خوانده نشده
NotificationSchema.statics.countUnreadForUser = async function (
  user,
  readNotificationIds = []
) {
  const query = {
    status: "published",
    _id: { $nin: readNotificationIds },
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
    $and: [
      {
        $or: [
          { scheduledAt: { $exists: false } },
          { scheduledAt: { $lte: new Date() } },
        ],
      },
      {
        $or: [
          { targetRoles: { $size: 0 } },
          { targetRoles: { $in: user.roles } },
          { targetUsers: user._id },
        ],
      },
    ],
  };

  return await this.countDocuments(query);
};

// Static method: انتشار خودکار اعلانات زمان‌بندی شده
NotificationSchema.statics.publishScheduled = async function () {
  const now = new Date();

  const result = await this.updateMany(
    {
      status: "scheduled",
      scheduledAt: { $lte: now },
    },
    {
      $set: { status: "published" },
    }
  );

  return result;
};

// Static method: منقضی کردن اعلانات
NotificationSchema.statics.expireOld = async function () {
  const now = new Date();

  const result = await this.updateMany(
    {
      status: "published",
      expiresAt: { $lte: now },
    },
    {
      $set: { status: "expired" },
    }
  );

  return result;
};

// Pre-save hook: تنظیم وضعیت
NotificationSchema.pre("save", function (next) {
  // اگر زمان‌بندی شده و زمان آن رسیده، منتشر شود
  if (
    this.status === "scheduled" &&
    this.scheduledAt &&
    new Date() >= this.scheduledAt
  ) {
    this.status = "published";
  }

  // اگر منقضی شده
  if (this.expiresAt && new Date() > this.expiresAt) {
    this.status = "expired";
  }

  next();
});

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);

export default Notification;

