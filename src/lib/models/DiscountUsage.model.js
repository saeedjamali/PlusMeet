import mongoose from "mongoose";

/**
 * مدل استفاده از کد تخفیف
 * برای ثبت تاریخچه استفاده کاربران از کدهای تخفیف
 */
const DiscountUsageSchema = new mongoose.Schema(
  {
    // کد تخفیف
    discountCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiscountCode",
      required: true,
      index: true,
    },

    // کاربر
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // رویداد (اختیاری)
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      index: true,
    },

    // مبلغ اصلی
    originalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // مبلغ تخفیف
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // مبلغ نهایی
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // تراکنش پرداخت
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },

    // تاریخ استفاده
    usedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ═══════════════════════════════════════════════════════════
// Indexes
// ═══════════════════════════════════════════════════════════
DiscountUsageSchema.index({ discountCode: 1, user: 1 });
DiscountUsageSchema.index({ event: 1, usedAt: -1 });

const DiscountUsage = mongoose.models.DiscountUsage || mongoose.model("DiscountUsage", DiscountUsageSchema);

export default DiscountUsage;

