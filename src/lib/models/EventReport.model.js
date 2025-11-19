import mongoose from "mongoose";

const eventReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "inappropriate_content", // محتوای نامناسب
        "spam", // هرزنامه
        "misleading", // گمراه‌کننده
        "copyright", // نقض حق نسخه‌برداری
        "violence", // خشونت
        "harassment", // آزار و اذیت
        "scam", // کلاهبرداری
        "other", // سایر
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    images: [
      {
        url: String,
        alt: String,
      },
    ],
    status: {
      type: String,
      enum: [
        "pending", // در انتظار بررسی
        "reviewing", // در حال بررسی
        "resolved", // حل شده
        "rejected", // رد شده
        "closed", // بسته شده
      ],
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    adminResponse: {
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      respondedAt: Date,
      message: String,
      action: {
        type: String,
        enum: [
          "no_action", // بدون اقدام
          "warning_to_creator", // اخطار به سازنده
          "event_suspended", // تعلیق رویداد
          "event_deleted", // حذف رویداد
          "user_warned", // اخطار به کاربر
          "user_suspended", // تعلیق کاربر
          "other", // سایر
        ],
      },
    },
    notes: [
      {
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        text: String,
      },
    ],
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

// ایندکس برای جستجو
eventReportSchema.index({ status: 1, priority: -1, createdAt: -1 });

const EventReport =
  mongoose.models.EventReport ||
  mongoose.model("EventReport", eventReportSchema);

export default EventReport;

/**
 * Helper functions برای گزارشات
 * توجه: این توابع به @/lib/utils/reportHelpers.js منتقل شده‌اند
 * برای استفاده در client-side components، از آن فایل import کنید
 */
export {
  getReportCategoryLabel,
  getReportStatusLabel,
  getReportPriorityLabel,
} from "@/lib/utils/reportHelpers";

