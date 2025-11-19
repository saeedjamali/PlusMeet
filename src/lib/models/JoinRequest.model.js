import mongoose from "mongoose";
import { JOIN_REQUEST_STATUS } from "@/lib/helpers/joinRequestStatus";

const JoinRequestSchema = new mongoose.Schema(
  {
    // ═══════════════════════════════════════════════════════════
    // اطلاعات اصلی
    // ═══════════════════════════════════════════════════════════
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "رویداد الزامی است"],
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "کاربر الزامی است"],
      index: true,
    },

    // ═══════════════════════════════════════════════════════════
    // وضعیت
    // ═══════════════════════════════════════════════════════════
    status: {
      type: String,
      enum: Object.values(JOIN_REQUEST_STATUS),
      default: JOIN_REQUEST_STATUS.PENDING,
      index: true,
    },

    // ═══════════════════════════════════════════════════════════
    // تاریخ‌های مهم
    // ═══════════════════════════════════════════════════════════
    requestedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    paidAt: {
      type: Date,
      default: null,
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    checkedInAt: {
      type: Date,
      default: null,
    },

    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    attendedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    canceledAt: {
      type: Date,
      default: null,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    expiredAt: {
      type: Date,
      default: null,
    },

    // ═══════════════════════════════════════════════════════════
    // اطلاعات پرداخت
    // ═══════════════════════════════════════════════════════════
    payment: {
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
      originalAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      discountAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      discountCode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DiscountCode",
        default: null,
      },
      reservedAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      paidAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      commission: {
        type: Number,
        default: 0,
        min: 0,
      },
      ownerAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // فیلدهای قدیمی (برای سازگاری با کدهای قبلی)
    paymentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentCurrency: {
      type: String,
      default: "IRR",
      enum: ["IRR", "USD", "EUR"],
    },

    paymentTransactionId: {
      type: String,
      default: null,
    },

    paymentMethod: {
      type: String,
      enum: ["online", "cash", "card", "transfer", "other"],
      default: null,
    },

    paymentGateway: {
      type: String,
      default: null,
    },

    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    refundTransactionId: {
      type: String,
      default: null,
    },

    refundReason: {
      type: String,
      trim: true,
    },

    // ═══════════════════════════════════════════════════════════
    // کد تایید و QR
    // ═══════════════════════════════════════════════════════════
    confirmationCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    qrCode: {
      type: String,
      default: null,
    },

    // ═══════════════════════════════════════════════════════════
    // یادداشت‌ها و دلایل
    // ═══════════════════════════════════════════════════════════
    userNote: {
      type: String,
      trim: true,
      maxlength: [500, "یادداشت نباید بیشتر از 500 کاراکتر باشد"],
    },

    organizerNote: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "یادداشت سازمان‌دهنده نباید بیشتر از 1000 کاراکتر باشد",
      ],
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    cancellationReason: {
      type: String,
      trim: true,
    },

    revocationReason: {
      type: String,
      trim: true,
    },

    // ═══════════════════════════════════════════════════════════
    // اطلاعات تماس اضطراری (اختیاری)
    // ═══════════════════════════════════════════════════════════
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },

    // ═══════════════════════════════════════════════════════════
    // فیلدهای اضافی رویداد
    // ═══════════════════════════════════════════════════════════
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ═══════════════════════════════════════════════════════════
    // تاریخچه تغییرات
    // ═══════════════════════════════════════════════════════════
    statusHistory: [
      {
        status: {
          type: String,
          enum: Object.values(JOIN_REQUEST_STATUS),
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        note: String,
        metadata: mongoose.Schema.Types.Mixed,
      },
    ],

    // ═══════════════════════════════════════════════════════════
    // متادیتا
    // ═══════════════════════════════════════════════════════════
    metadata: {
      ipAddress: String,
      userAgent: String,
      source: String, // 'web', 'mobile', 'api'
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ═══════════════════════════════════════════════════════════
// Indexes
// ═══════════════════════════════════════════════════════════
JoinRequestSchema.index({ event: 1, user: 1 }, { unique: true });
JoinRequestSchema.index({ event: 1, status: 1 });
JoinRequestSchema.index({ user: 1, status: 1 });
JoinRequestSchema.index({ status: 1, requestedAt: -1 });
JoinRequestSchema.index({ confirmationCode: 1 });

// ═══════════════════════════════════════════════════════════
// Virtuals
// ═══════════════════════════════════════════════════════════
JoinRequestSchema.virtual("isPending").get(function () {
  return this.status === JOIN_REQUEST_STATUS.PENDING;
});

JoinRequestSchema.virtual("isApproved").get(function () {
  return this.status === JOIN_REQUEST_STATUS.APPROVED;
});

JoinRequestSchema.virtual("isConfirmed").get(function () {
  return this.status === JOIN_REQUEST_STATUS.CONFIRMED;
});

JoinRequestSchema.virtual("isPaid").get(function () {
  return this.status === JOIN_REQUEST_STATUS.PAID;
});

JoinRequestSchema.virtual("isCanceled").get(function () {
  return [
    JOIN_REQUEST_STATUS.CANCELED,
    JOIN_REQUEST_STATUS.REVOKED,
    JOIN_REQUEST_STATUS.EXPIRED,
  ].includes(this.status);
});

JoinRequestSchema.virtual("canCancel").get(function () {
  return [
    JOIN_REQUEST_STATUS.PENDING,
    JOIN_REQUEST_STATUS.APPROVED,
    JOIN_REQUEST_STATUS.PAYMENT_PENDING,
    JOIN_REQUEST_STATUS.CONFIRMED,
  ].includes(this.status);
});

JoinRequestSchema.virtual("needsPayment").get(function () {
  return [
    JOIN_REQUEST_STATUS.APPROVED,
    JOIN_REQUEST_STATUS.PAYMENT_PENDING,
  ].includes(this.status);
});

// ═══════════════════════════════════════════════════════════
// Methods
// ═══════════════════════════════════════════════════════════

// تغییر وضعیت با ثبت تاریخچه
JoinRequestSchema.methods.changeStatus = function (
  newStatus,
  by,
  note = "",
  metadata = {}
) {
  const oldStatus = this.status;
  this.status = newStatus;

  // ثبت در تاریخچه
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    by,
    note,
    metadata,
  });

  // به‌روزرسانی تاریخ مربوطه
  const now = new Date();
  switch (newStatus) {
    case JOIN_REQUEST_STATUS.APPROVED:
      this.approvedAt = now;
      this.approvedBy = by;
      break;
    case JOIN_REQUEST_STATUS.REJECTED:
      this.rejectedAt = now;
      this.rejectedBy = by;
      break;
    case JOIN_REQUEST_STATUS.PAID:
      this.paidAt = now;
      break;
    case JOIN_REQUEST_STATUS.CONFIRMED:
      this.confirmedAt = now;
      break;
    case JOIN_REQUEST_STATUS.CHECKED_IN:
      this.checkedInAt = now;
      this.checkedInBy = by;
      break;
    case JOIN_REQUEST_STATUS.ATTENDED:
      this.attendedAt = now;
      break;
    case JOIN_REQUEST_STATUS.COMPLETED:
      this.completedAt = now;
      break;
    case JOIN_REQUEST_STATUS.CANCELED:
      this.canceledAt = now;
      break;
    case JOIN_REQUEST_STATUS.REVOKED:
      this.revokedAt = now;
      this.revokedBy = by;
      break;
    case JOIN_REQUEST_STATUS.REFUNDED:
      this.refundedAt = now;
      break;
    case JOIN_REQUEST_STATUS.EXPIRED:
      this.expiredAt = now;
      break;
  }

  return this.save();
};

// تایید درخواست
JoinRequestSchema.methods.approve = function (by, note = "") {
  return this.changeStatus(JOIN_REQUEST_STATUS.APPROVED, by, note);
};

// رد درخواست
JoinRequestSchema.methods.reject = function (by, reason = "") {
  this.rejectionReason = reason;
  return this.changeStatus(JOIN_REQUEST_STATUS.REJECTED, by, reason);
};

// تایید پرداخت
JoinRequestSchema.methods.confirmPayment = function (
  transactionId,
  method,
  gateway
) {
  this.paymentTransactionId = transactionId;
  this.paymentMethod = method;
  this.paymentGateway = gateway;
  return this.changeStatus(JOIN_REQUEST_STATUS.PAID, null, "پرداخت موفق");
};

// تایید نهایی
JoinRequestSchema.methods.confirm = function () {
  // تولید کد تایید اگر وجود نداشت
  if (!this.confirmationCode) {
    this.confirmationCode = this.generateConfirmationCode();
  }
  return this.changeStatus(JOIN_REQUEST_STATUS.CONFIRMED, null, "تایید نهایی");
};

// لغو توسط کاربر
JoinRequestSchema.methods.cancel = function (reason = "") {
  this.cancellationReason = reason;
  return this.changeStatus(JOIN_REQUEST_STATUS.CANCELED, this.user, reason);
};

// لغو توسط مالک
JoinRequestSchema.methods.revoke = function (by, reason = "") {
  this.revocationReason = reason;
  return this.changeStatus(JOIN_REQUEST_STATUS.REVOKED, by, reason);
};

// بازپرداخت
JoinRequestSchema.methods.refund = function (
  amount,
  transactionId,
  reason = ""
) {
  this.refundAmount = amount;
  this.refundTransactionId = transactionId;
  this.refundReason = reason;
  return this.changeStatus(JOIN_REQUEST_STATUS.REFUNDED, null, reason);
};

// ثبت حضور
JoinRequestSchema.methods.checkIn = function (by) {
  return this.changeStatus(JOIN_REQUEST_STATUS.CHECKED_IN, by, "ثبت حضور");
};

// تولید کد تایید
JoinRequestSchema.methods.generateConfirmationCode = function () {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// ═══════════════════════════════════════════════════════════
// Statics
// ═══════════════════════════════════════════════════════════

// پیدا کردن درخواست‌های یک رویداد
JoinRequestSchema.statics.findByEvent = function (eventId, status = null) {
  const query = { event: eventId };
  if (status) query.status = status;
  return this.find(query)
    .populate("user", "firstName lastName displayName email avatar")
    .sort({ requestedAt: -1 });
};

// پیدا کردن درخواست‌های یک کاربر
JoinRequestSchema.statics.findByUser = function (userId, status = null) {
  const query = { user: userId };
  if (status) query.status = status;
  return this.find(query)
    .populate("event", "title slug startDate endDate location coverImage")
    .sort({ requestedAt: -1 });
};

// چک کردن وجود درخواست
JoinRequestSchema.statics.exists = async function (eventId, userId) {
  const count = await this.countDocuments({ event: eventId, user: userId });
  return count > 0;
};

// شمارش درخواست‌ها بر اساس وضعیت
JoinRequestSchema.statics.countByStatus = function (eventId, status) {
  return this.countDocuments({ event: eventId, status });
};

// ═══════════════════════════════════════════════════════════
// Pre-save hooks
// ═══════════════════════════════════════════════════════════
JoinRequestSchema.pre("save", function (next) {
  // اولین بار که ذخیره می‌شه، تاریخچه رو مقداردهی کن
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.status,
      timestamp: this.requestedAt || new Date(),
      by: this.user,
      note: "ایجاد درخواست",
    });
  }

  next();
});

const JoinRequest =
  mongoose.models.JoinRequest ||
  mongoose.model("JoinRequest", JoinRequestSchema);

export default JoinRequest;
