/**
 * Mongoose Model: Ticket
 * مدل تیکت‌های پشتیبانی
 */

import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    // شماره یکتای تیکت (به صورت خودکار تولید می‌شود)
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
    },

    // موضوع تیکت
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TicketCategory",
      required: [true, "موضوع تیکت الزامی است"],
    },

    // عنوان تیکت
    subject: {
      type: String,
      required: [true, "عنوان تیکت الزامی است"],
      trim: true,
      maxLength: [200, "عنوان نمی‌تواند بیشتر از 200 کاراکتر باشد"],
    },

    // توضیحات اولیه
    description: {
      type: String,
      required: [true, "توضیحات الزامی است"],
      trim: true,
    },

    // تصاویر پیوست اولیه
    attachments: [
      {
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["image", "file"],
          default: "image",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // وضعیت تیکت
    status: {
      type: String,
      enum: ["open", "in_progress", "pending", "resolved", "closed", "reopened"],
      default: "open",
    },

    // اولویت
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // کاربر سازنده
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // کارشناس فعلی
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // نقش فعلی
    assignedRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    // تاریخچه ارجاعات
    assignmentHistory: [
      {
        fromUser: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        toUser: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        toRole: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Role",
        },
        reason: String,
        assignedAt: {
          type: Date,
          default: Date.now,
        },
        assignedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    // تاریخ بسته شدن
    closedAt: Date,

    // تاریخ حل شدن
    resolvedAt: Date,

    // آخرین زمان پاسخ
    lastResponseAt: Date,

    // تعداد پاسخ‌ها
    replyCount: {
      type: Number,
      default: 0,
    },

    // آیا پاسخ خوانده نشده دارد (برای کاربر)
    hasUnreadUserReply: {
      type: Boolean,
      default: false,
    },

    // تعداد پاسخ‌های خوانده نشده (برای کاربر/سازنده)
    unreadCountForCreator: {
      type: Number,
      default: 0,
    },

    // آیا پاسخ خوانده نشده دارد (برای کارشناس)
    hasUnreadStaffReply: {
      type: Boolean,
      default: true, // در ابتدا true چون تیکت جدید ایجاد شده
    },

    // تعداد پاسخ‌های خوانده نشده (برای کارشناس)
    unreadCountForStaff: {
      type: Number,
      default: 1, // تیکت جدید یک پیام خوانده نشده برای کارشناس است
    },

    // آخرین بار که سازنده تیکت را دید
    lastViewedByCreator: {
      type: Date,
      default: null,
    },

    // آخرین بار که کارشناس تیکت را دید
    lastViewedByStaff: {
      type: Date,
      default: null,
    },

    // نظرسنجی (رضایت کاربر)
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    // نظر کاربر
    feedback: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
ticketSchema.index({ ticketNumber: 1 });
ticketSchema.index({ creator: 1, status: 1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ assignedRole: 1, status: 1 });
ticketSchema.index({ category: 1, status: 1 });
ticketSchema.index({ createdAt: -1 });

// Pre-validate: تولید شماره یکتای تیکت (قبل از validation)
ticketSchema.pre("validate", async function (next) {
  if (!this.ticketNumber) {
    try {
      // فرمت: TKT-YYYYMMDD-XXXX
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
      
      console.log(`🎫 Generating ticket number for date: ${dateStr}`);
      
      // پیدا کردن آخرین تیکت امروز
      const lastTicket = await this.constructor
        .findOne({
          ticketNumber: new RegExp(`^TKT-${dateStr}-`),
        })
        .sort({ ticketNumber: -1 })
        .lean();

      let counter = 1;
      if (lastTicket) {
        const lastNumber = parseInt(lastTicket.ticketNumber.split("-")[2]);
        counter = lastNumber + 1;
        console.log(`🎫 Last ticket found: ${lastTicket.ticketNumber}, new counter: ${counter}`);
      } else {
        console.log(`🎫 No tickets found for today, starting from 1`);
      }

      this.ticketNumber = `TKT-${dateStr}-${counter.toString().padStart(4, "0")}`;
      console.log(`✅ Generated ticket number: ${this.ticketNumber}`);
    } catch (error) {
      console.error("❌ Error generating ticket number:", error);
      return next(error);
    }
  }
  next();
});

// Virtual: پاسخ‌های تیکت
ticketSchema.virtual("replies", {
  ref: "TicketReply",
  localField: "_id",
  foreignField: "ticket",
  options: { sort: { createdAt: 1 } },
});

// متد: بستن تیکت
ticketSchema.methods.close = function () {
  this.status = "closed";
  this.closedAt = new Date();
  return this.save();
};

// متد: حل شده
ticketSchema.methods.resolve = function () {
  this.status = "resolved";
  this.resolvedAt = new Date();
  return this.save();
};

// متد: بازگشایی
ticketSchema.methods.reopen = function () {
  this.status = "reopened";
  this.closedAt = null;
  this.resolvedAt = null;
  return this.save();
};

// متد: ارجاع دادن
ticketSchema.methods.assignTo = async function (toUser, toRole, assignedBy, reason = "") {
  this.assignmentHistory.push({
    fromUser: this.assignedTo,
    toUser,
    toRole,
    reason,
    assignedBy,
    assignedAt: new Date(),
  });
  
  this.assignedTo = toUser;
  this.assignedRole = toRole;
  this.hasUnreadStaffReply = true;
  
  return this.save();
};

// Static: محاسبه تعداد پیام‌های خوانده نشده براساس آخرین پاسخ‌ها
ticketSchema.statics.calculateUnreadCounts = async function (ticketId) {
  const TicketReply = mongoose.model("TicketReply");
  
  // گرفتن تمام پاسخ‌ها به ترتیب زمان
  const replies = await TicketReply.find({ ticket: ticketId })
    .select("replyType createdAt")
    .sort({ createdAt: 1 }) // قدیمی‌ترین اول
    .lean();

  let unreadCountForCreator = 0;
  let unreadCountForStaff = 1; // تیکت اصلی

  if (replies.length > 0) {
    // پیدا کردن آخرین پاسخ
    const lastReply = replies[replies.length - 1];

    // اگر آخرین پاسخ از سازنده است
    if (lastReply.replyType === "creator") {
      // برای کارشناس: تعداد پاسخ‌های متوالی آخر از سازنده
      unreadCountForStaff = 0;
      for (let i = replies.length - 1; i >= 0; i--) {
        if (replies[i].replyType === "creator") {
          unreadCountForStaff++;
        } else {
          break; // اولین پاسخی که از کارشناس است، توقف
        }
      }
      unreadCountForCreator = 0; // سازنده خودش پاسخ داده
    }
    // اگر آخرین پاسخ از کارشناس است
    else if (lastReply.replyType === "assigned") {
      // برای سازنده: تعداد پاسخ‌های متوالی آخر از کارشناس
      unreadCountForCreator = 0;
      for (let i = replies.length - 1; i >= 0; i--) {
        if (replies[i].replyType === "assigned") {
          unreadCountForCreator++;
        } else {
          break; // اولین پاسخی که از سازنده است، توقف
        }
      }
      unreadCountForStaff = 0; // کارشناس خودش پاسخ داده
    }
  }

  return {
    unreadCountForCreator,
    unreadCountForStaff,
    hasUnreadUserReply: unreadCountForCreator > 0,
    hasUnreadStaffReply: unreadCountForStaff > 0,
  };
};

const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);

export default Ticket;

