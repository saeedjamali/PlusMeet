import mongoose from "mongoose";

/**
 * مدل کد تخفیف
 * برای مدیریت کدهای تخفیف و پیشنهادات ویژه
 */
const DiscountCodeSchema = new mongoose.Schema(
  {
    // ═══════════════════════════════════════════════════════════
    // اطلاعات اصلی
    // ═══════════════════════════════════════════════════════════
    code: {
      type: String,
      required: [true, "کد تخفیف الزامی است"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "عنوان کد تخفیف الزامی است"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // ═══════════════════════════════════════════════════════════
    // نوع و مقدار تخفیف
    // ═══════════════════════════════════════════════════════════
    discount: {
      // نوع: 'percentage' | 'fixed'
      type: {
        type: String,
        enum: ["percentage", "fixed"],
        required: true,
        default: "percentage",
      },
      // مقدار (درصد یا مبلغ ثابت)
      value: {
        type: Number,
        required: true,
        min: 0,
      },
      // حداکثر مبلغ تخفیف (برای درصدی)
      maxAmount: {
        type: Number,
        min: 0,
      },
    },

    // ═══════════════════════════════════════════════════════════
    // نحوه محاسبه کمیسیون
    // ═══════════════════════════════════════════════════════════
    commissionCalculation: {
      type: String,
      enum: ["beforeDiscount", "afterDiscount"],
      default: "beforeDiscount",
      required: true,
      /**
       * beforeDiscount: کمیسیون از قیمت اصلی بلیط محاسبه می‌شود
       * مثال: بلیط 1000 تومان، تخفیف 20%، کمیسیون 10%
       * - کمیسیون: 100 تومان (10% از 1000)
       * - پرداخت کاربر: 800 تومان (1000 - 20%)
       * - دریافتی مالک: 700 تومان (800 - 100)
       *
       * afterDiscount: کمیسیون از قیمت بعد از تخفیف محاسبه می‌شود
       * مثال: بلیط 1000 تومان، تخفیف 20%، کمیسیون 10%
       * - قیمت بعد تخفیف: 800 تومان
       * - کمیسیون: 80 تومان (10% از 800)
       * - پرداخت کاربر: 800 تومان
       * - دریافتی مالک: 720 تومان (800 - 80)
       */
    },

    // ═══════════════════════════════════════════════════════════
    // وضعیت و اعتبار
    // ═══════════════════════════════════════════════════════════
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },

    // ═══════════════════════════════════════════════════════════
    // محدودیت‌های استفاده
    // ═══════════════════════════════════════════════════════════
    usage: {
      // حداکثر تعداد استفاده کل
      maxUsage: {
        type: Number,
        min: 1,
      },
      // تعداد استفاده شده
      usedCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      // حداکثر تعداد استفاده هر کاربر
      maxUsagePerUser: {
        type: Number,
        default: 1,
        min: 1,
      },
    },

    // ═══════════════════════════════════════════════════════════
    // محدودیت‌های مبلغ
    // ═══════════════════════════════════════════════════════════
    conditions: {
      // حداقل مبلغ خرید (تومان)
      minPurchaseAmount: {
        type: Number,
        min: 0,
        default: 0,
      },
      // حداکثر مبلغ خرید (تومان)
      maxPurchaseAmount: {
        type: Number,
        min: 0,
      },
    },

    // ═══════════════════════════════════════════════════════════
    // محدودیت‌های کاربر
    // ═══════════════════════════════════════════════════════════
    userRestrictions: {
      // فقط برای کاربران خاص
      specificUsers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      // فقط برای کاربران جدید
      newUsersOnly: {
        type: Boolean,
        default: false,
      },
      // فقط برای کاربران با نقش خاص
      allowedRoles: [
        {
          type: String,
          enum: ["user", "event_owner", "admin"],
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // محدودیت‌های رویداد
    // ═══════════════════════════════════════════════════════════
    eventRestrictions: {
      // فقط برای رویدادهای خاص
      specificEvents: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Event",
        },
      ],
      // فقط برای دسته‌بندی‌های خاص
      specificCategories: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "TopicCategory",
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // محدودیت‌های درگاه پرداخت
    // ═══════════════════════════════════════════════════════════
    paymentGateways: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PaymentGateway",
      },
    ],

    // ═══════════════════════════════════════════════════════════
    // آمار
    // ═══════════════════════════════════════════════════════════
    stats: {
      totalDiscount: {
        type: Number,
        default: 0,
      },
      totalRevenue: {
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
DiscountCodeSchema.index({ code: 1, isActive: 1 });
DiscountCodeSchema.index({ expiryDate: 1, isActive: 1 });
DiscountCodeSchema.index({ "usage.usedCount": 1, "usage.maxUsage": 1 });

// ═══════════════════════════════════════════════════════════
// Virtual Fields
// ═══════════════════════════════════════════════════════════

/**
 * آیا کد منقضی شده؟
 */
DiscountCodeSchema.virtual("isExpired").get(function () {
  return new Date() > this.expiryDate;
});

/**
 * آیا کد قابل استفاده است؟
 */
DiscountCodeSchema.virtual("isAvailable").get(function () {
  if (!this.isActive || this.isExpired) return false;
  if (this.usage.maxUsage && this.usage.usedCount >= this.usage.maxUsage)
    return false;
  if (new Date() < this.startDate) return false;
  return true;
});

/**
 * درصد استفاده
 */
DiscountCodeSchema.virtual("usagePercentage").get(function () {
  if (!this.usage.maxUsage) return 0;
  return Math.round((this.usage.usedCount / this.usage.maxUsage) * 100);
});

// ═══════════════════════════════════════════════════════════
// Methods
// ═══════════════════════════════════════════════════════════

/**
 * محاسبه مبلغ تخفیف برای یک مبلغ
 */
DiscountCodeSchema.methods.calculateDiscount = function (amount) {
  let discount = 0;

  if (this.discount.type === "percentage") {
    discount = (amount * this.discount.value) / 100;
    if (this.discount.maxAmount && discount > this.discount.maxAmount) {
      discount = this.discount.maxAmount;
    }
  } else if (this.discount.type === "fixed") {
    discount = this.discount.value;
    if (discount > amount) {
      discount = amount; // تخفیف نمی‌تواند بیشتر از مبلغ اصلی باشد
    }
  }

  return Math.round(discount);
};

/**
 * بررسی اینکه آیا کاربر می‌تواند از این کد استفاده کند
 */
DiscountCodeSchema.methods.canUserUse = async function (userId) {
  // چک وضعیت و اعتبار
  if (!this.isAvailable)
    return { valid: false, message: "کد تخفیف معتبر نیست" };

  // چک محدودیت کاربران خاص
  if (this.userRestrictions.specificUsers.length > 0) {
    const hasAccess = this.userRestrictions.specificUsers.some(
      (id) => id.toString() === userId.toString()
    );
    if (!hasAccess) {
      return {
        valid: false,
        message: "این کد تخفیف برای شما قابل استفاده نیست",
      };
    }
  }

  // چک تعداد استفاده هر کاربر
  const DiscountUsage = mongoose.model("DiscountUsage");
  const userUsageCount = await DiscountUsage.countDocuments({
    discountCode: this._id,
    user: userId,
  });

  if (userUsageCount >= this.usage.maxUsagePerUser) {
    return {
      valid: false,
      message: "شما قبلاً از این کد تخفیف استفاده کرده‌اید",
    };
  }

  return { valid: true };
};

/**
 * بررسی اینکه آیا این کد برای یک رویداد معتبر است
 */
DiscountCodeSchema.methods.isValidForEvent = function (eventId, categoryId) {
  // اگر محدودیتی وجود ندارد، برای همه معتبر است
  if (
    this.eventRestrictions.specificEvents.length === 0 &&
    this.eventRestrictions.specificCategories.length === 0
  ) {
    return true;
  }

  // چک رویداد خاص
  if (this.eventRestrictions.specificEvents.length > 0) {
    const hasEvent = this.eventRestrictions.specificEvents.some(
      (id) => id.toString() === eventId.toString()
    );
    if (hasEvent) return true;
  }

  // چک دسته‌بندی
  if (categoryId && this.eventRestrictions.specificCategories.length > 0) {
    const hasCategory = this.eventRestrictions.specificCategories.some(
      (id) => id.toString() === categoryId.toString()
    );
    if (hasCategory) return true;
  }

  return false;
};

/**
 * بررسی اینکه آیا این کد برای یک درگاه پرداخت معتبر است
 */
DiscountCodeSchema.methods.isValidForGateway = function (gatewayId) {
  // اگر محدودیتی وجود ندارد، برای همه معتبر است
  if (this.paymentGateways.length === 0) return true;

  return this.paymentGateways.some(
    (id) => id.toString() === gatewayId.toString()
  );
};

// ═══════════════════════════════════════════════════════════
// Statics
// ═══════════════════════════════════════════════════════════

/**
 * دریافت کدهای فعال
 */
DiscountCodeSchema.statics.getActiveCodes = async function () {
  const now = new Date();
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    expiryDate: { $gt: now },
  }).sort({ createdAt: -1 });
};

/**
 * اعتبارسنجی و دریافت کد تخفیف
 */
DiscountCodeSchema.statics.validateCode = async function (
  code,
  userId,
  eventId,
  amount
) {
  const discountCode = await this.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });

  if (!discountCode) {
    return { valid: false, message: "کد تخفیف معتبر نیست" };
  }

  // چک اعتبار کلی
  if (!discountCode.isAvailable) {
    return { valid: false, message: "کد تخفیف منقضی شده است" };
  }

  // چک محدودیت مبلغ
  if (amount < discountCode.conditions.minPurchaseAmount) {
    return {
      valid: false,
      message: `حداقل مبلغ خرید برای استفاده از این کد ${discountCode.conditions.minPurchaseAmount.toLocaleString(
        "fa-IR"
      )} تومان است`,
    };
  }

  if (
    discountCode.conditions.maxPurchaseAmount &&
    amount > discountCode.conditions.maxPurchaseAmount
  ) {
    return {
      valid: false,
      message: `حداکثر مبلغ خرید برای استفاده از این کد ${discountCode.conditions.maxPurchaseAmount.toLocaleString(
        "fa-IR"
      )} تومان است`,
    };
  }

  // چک کاربر
  if (userId) {
    const canUse = await discountCode.canUserUse(userId);
    if (!canUse.valid) {
      return canUse;
    }
  }

  // محاسبه تخفیف
  const discountAmount = discountCode.calculateDiscount(amount);

  return {
    valid: true,
    discountCode,
    discountAmount,
    finalAmount: amount - discountAmount,
  };
};

// ═══════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════

const DiscountCode =
  mongoose.models.DiscountCode ||
  mongoose.model("DiscountCode", DiscountCodeSchema);

export default DiscountCode;
