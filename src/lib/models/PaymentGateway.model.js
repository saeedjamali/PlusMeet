import mongoose from "mongoose";

/**
 * مدل درگاه پرداخت
 * برای مدیریت درگاه‌های پرداخت و تنظیمات آنها
 */
const PaymentGatewaySchema = new mongoose.Schema(
  {
    // ═══════════════════════════════════════════════════════════
    // اطلاعات اصلی
    // ═══════════════════════════════════════════════════════════
    title: {
      type: String,
      required: [true, "عنوان درگاه الزامی است"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "کد درگاه الزامی است"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
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
    isDefault: {
      type: Boolean,
      default: false,
    },

    // ═══════════════════════════════════════════════════════════
    // تنظیمات کارمزد
    // ═══════════════════════════════════════════════════════════
    commission: {
      // درصد کارمزد (0-100)
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
    // تنظیمات درگاه
    // ═══════════════════════════════════════════════════════════
    gateway: {
      // نوع درگاه: zarinpal, idpay, parsian, mellat, ...
      provider: {
        type: String,
        required: true,
        enum: ["zarinpal", "idpay", "parsian", "mellat", "saman", "pasargad", "other"],
      },
      // کلیدهای API (رمزنگاری شده)
      apiKey: {
        type: String,
        required: true,
      },
      merchantId: {
        type: String,
      },
      // محیط: sandbox | production
      environment: {
        type: String,
        enum: ["sandbox", "production"],
        default: "sandbox",
      },
    },

    // ═══════════════════════════════════════════════════════════
    // محدودیت‌های پرداخت
    // ═══════════════════════════════════════════════════════════
    limits: {
      // حداقل مبلغ قابل پرداخت (تومان)
      minAmount: {
        type: Number,
        min: 0,
        default: 1000,
      },
      // حداکثر مبلغ قابل پرداخت (تومان)
      maxAmount: {
        type: Number,
        min: 0,
        default: 50000000, // 50 میلیون تومان
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
      failedTransactions: {
        type: Number,
        default: 0,
      },
      totalAmount: {
        type: Number,
        default: 0,
      },
    },

    // ═══════════════════════════════════════════════════════════
    // تنظیمات پیشرفته
    // ═══════════════════════════════════════════════════════════
    settings: {
      // URL های بازگشت
      callbackUrl: {
        type: String,
      },
      // تایم‌اوت (ثانیه)
      timeout: {
        type: Number,
        default: 900, // 15 دقیقه
      },
      // فعال‌سازی لاگ تراکنش‌ها
      enableLogging: {
        type: Boolean,
        default: true,
      },
    },

    // ═══════════════════════════════════════════════════════════
    // مدیریت
    // ═══════════════════════════════════════════════════════════
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
PaymentGatewaySchema.index({ isActive: 1, isDefault: 1 });

// ═══════════════════════════════════════════════════════════
// Methods
// ═══════════════════════════════════════════════════════════

/**
 * محاسبه کارمزد برای یک مبلغ
 */
PaymentGatewaySchema.methods.calculateCommission = function (amount) {
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
PaymentGatewaySchema.methods.isAmountValid = function (amount) {
  return amount >= this.limits.minAmount && amount <= this.limits.maxAmount;
};

// ═══════════════════════════════════════════════════════════
// Statics
// ═══════════════════════════════════════════════════════════

/**
 * دریافت درگاه پیش‌فرض
 */
PaymentGatewaySchema.statics.getDefaultGateway = async function () {
  return this.findOne({ isActive: true, isDefault: true });
};

/**
 * دریافت درگاه‌های فعال
 */
PaymentGatewaySchema.statics.getActiveGateways = async function () {
  return this.find({ isActive: true }).sort({ isDefault: -1, title: 1 });
};

// ═══════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════

const PaymentGateway = mongoose.models.PaymentGateway || mongoose.model("PaymentGateway", PaymentGatewaySchema);

export default PaymentGateway;

