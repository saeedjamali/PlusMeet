import mongoose from "mongoose";

/**
 * مدل کد پرداخت
 * برای دسته‌بندی و مدیریت انواع پرداخت‌ها در سیستم
 * مثال: پیوستن به رویداد، خرید بلیط، ثبت‌نام دوره و...
 */
const PaymentCodeSchema = new mongoose.Schema(
  {
    // ═══════════════════════════════════════════════════════════
    // اطلاعات اصلی
    // ═══════════════════════════════════════════════════════════
    code: {
      type: String,
      required: [true, "کد پرداخت الزامی است"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "عنوان کد پرداخت الزامی است"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // ═══════════════════════════════════════════════════════════
    // وضعیت
    // ═══════════════════════════════════════════════════════════
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ═══════════════════════════════════════════════════════════
    // کارمزد سایت
    // ═══════════════════════════════════════════════════════════
    commission: {
      // درصد کارمزد سایت (0-100)
      percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0,
      },
      // مبلغ ثابت کارمزد (تومان)
      fixedAmount: {
        type: Number,
        min: 0,
        default: 0,
      },
      // نوع محاسبه: 'percentage' | 'fixed' | 'both'
      type: {
        type: String,
        enum: ["percentage", "fixed", "both"],
        default: "percentage",
      },
    },

    // ═══════════════════════════════════════════════════════════
    // کدهای تخفیف مرتبط
    // ═══════════════════════════════════════════════════════════
    discountCodes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DiscountCode",
      },
    ],

    // ═══════════════════════════════════════════════════════════
    // درگاه‌های پرداخت مجاز
    // ═══════════════════════════════════════════════════════════
    allowedGateways: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PaymentGateway",
      },
    ],

    // ═══════════════════════════════════════════════════════════
    // تنظیمات اضافی
    // ═══════════════════════════════════════════════════════════
    settings: {
      // آیا قابل استفاده در پیوستن به رویداد است؟
      allowEventJoin: {
        type: Boolean,
        default: true,
      },
      // آیا قابل استفاده در خرید بلیط است؟
      allowTicketPurchase: {
        type: Boolean,
        default: false,
      },
      // آیا قابل استفاده در ثبت‌نام دوره است؟
      allowCourseEnrollment: {
        type: Boolean,
        default: false,
      },
      // حداقل مبلغ
      minAmount: {
        type: Number,
        min: 0,
        default: 0,
      },
      // حداکثر مبلغ
      maxAmount: {
        type: Number,
        min: 0,
      },
    },

    // ═══════════════════════════════════════════════════════════
    // آمار
    // ═══════════════════════════════════════════════════════════
    stats: {
      totalTransactions: {
        type: Number,
        default: 0,
      },
      successfulTransactions: {
        type: Number,
        default: 0,
      },
      totalAmount: {
        type: Number,
        default: 0,
      },
      totalCommission: {
        type: Number,
        default: 0,
      },
    },

    // ═══════════════════════════════════════════════════════════
    // مدیریت
    // ═══════════════════════════════════════════════════════════
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// ═══════════════════════════════════════════════════════════
// Indexes
// ═══════════════════════════════════════════════════════════
PaymentCodeSchema.index({ code: 1, isActive: 1 });

// ═══════════════════════════════════════════════════════════
// Methods
// ═══════════════════════════════════════════════════════════

/**
 * محاسبه کارمزد برای یک مبلغ
 */
PaymentCodeSchema.methods.calculateCommission = function (amount) {
  let commission = 0;

  if (this.commission.type === "percentage" || this.commission.type === "both") {
    commission += (amount * this.commission.percentage) / 100;
  }

  if (this.commission.type === "fixed" || this.commission.type === "both") {
    commission += this.commission.fixedAmount;
  }

  return Math.round(commission);
};

/**
 * بررسی اینکه آیا مبلغ در محدوده مجاز است
 */
PaymentCodeSchema.methods.isAmountValid = function (amount) {
  if (this.settings.minAmount && amount < this.settings.minAmount) {
    return false;
  }
  if (this.settings.maxAmount && amount > this.settings.maxAmount) {
    return false;
  }
  return true;
};

/**
 * بررسی اینکه آیا درگاه پرداخت مجاز است
 */
PaymentCodeSchema.methods.isGatewayAllowed = function (gatewayId) {
  // اگر لیست خالی باشد، همه درگاه‌ها مجاز هستند
  if (this.allowedGateways.length === 0) return true;

  return this.allowedGateways.some((id) => id.toString() === gatewayId.toString());
};

// ═══════════════════════════════════════════════════════════
// Statics
// ═══════════════════════════════════════════════════════════

/**
 * دریافت کدهای پرداخت فعال
 */
PaymentCodeSchema.statics.getActiveCodes = async function () {
  return this.find({ isActive: true }).sort({ code: 1 });
};

/**
 * دریافت کد پرداخت برای پیوستن به رویداد
 */
PaymentCodeSchema.statics.getEventJoinCode = async function () {
  return this.findOne({
    isActive: true,
    "settings.allowEventJoin": true,
  });
};

// ═══════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════

const PaymentCode = mongoose.models.PaymentCode || mongoose.model("PaymentCode", PaymentCodeSchema);

export default PaymentCode;

