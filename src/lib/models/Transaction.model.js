import mongoose from "mongoose";

/**
 * Transaction Model - تراکنش‌های مالی
 * تمام واریز، برداشت، و تراکنش‌های مالی ثبت می‌شوند
 */
const TransactionSchema = new mongoose.Schema(
  {
    // کاربر
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // کیف پول
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },

    // نوع تراکنش
    type: {
      type: String,
      enum: [
        "deposit", // واریز
        "withdraw", // برداشت
        "payment", // پرداخت (برای خرید چیزی)
        "refund", // بازگشت وجه
        "transfer_in", // انتقال دریافتی
        "transfer_out", // انتقال ارسالی
        "commission", // کمیسیون
        "bonus", // پاداش
        "penalty", // جریمه
        "event_join_reserve", // رزرو برای پیوستن به رویداد
        "event_join_complete", // تکمیل پیوستن به رویداد
        "event_join_refund", // بازگشت وجه پیوستن به رویداد
        "event_leave_refund", // بازگشت وجه ترک رویداد
      ],
      required: true,
      index: true,
    },

    // مقدار (به ریال)
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // مقدار قبل از تراکنش
    balanceBefore: {
      type: Number,
      required: true,
    },

    // مقدار بعد از تراکنش
    balanceAfter: {
      type: Number,
      required: true,
    },

    // ارز
    currency: {
      type: String,
      default: "IRR",
    },

    // وضعیت تراکنش
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      required: true,
      index: true,
    },

    // جهت تراکنش
    direction: {
      type: String,
      enum: ["in", "out"], // in = واریز، out = برداشت
      required: true,
    },

    // روش پرداخت
    paymentMethod: {
      type: String,
      enum: [
        "zarinpal",
        "wallet",
        "card_to_card",
        "bank_transfer",
        "manual",
        "system",
      ],
      default: null,
    },

    // شماره پیگیری درگاه
    gatewayTransactionId: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },

    // Authority (زرین‌پال)
    authority: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },

    // RefID (زرین‌پال - بعد از تایید)
    refId: {
      type: String,
      default: null,
      sparse: true,
    },

    // شماره کارت (4 رقم آخر)
    cardPan: {
      type: String,
      default: null,
    },

    // توضیحات
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    // یادداشت داخلی (فقط برای ادمین)
    internalNote: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    // مربوط به (رویداد، بلیط، و...)
    relatedTo: {
      model: {
        type: String,
        enum: ["Event", "Ticket", "Order", "User", null],
        default: null,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },

    // IP Address
    ipAddress: {
      type: String,
      default: null,
    },

    // User Agent
    userAgent: {
      type: String,
      default: null,
    },

    // تاریخ پردازش
    processedAt: {
      type: Date,
      default: null,
    },

    // تاریخ تکمیل
    completedAt: {
      type: Date,
      default: null,
    },

    // تاریخ شکست
    failedAt: {
      type: Date,
      default: null,
    },

    // دلیل شکست
    failureReason: {
      type: String,
      default: null,
    },

    // متادیتا
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ walletId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ authority: 1 }, { sparse: true });
TransactionSchema.index({ gatewayTransactionId: 1 }, { sparse: true });
TransactionSchema.index({ status: 1, createdAt: -1 });
TransactionSchema.index({ "relatedTo.model": 1, "relatedTo.id": 1 });

// Virtual: آیا تراکنش موفق بوده؟
TransactionSchema.virtual("isSuccessful").get(function () {
  return this.status === "completed";
});

// Virtual: آیا تراکنش در حال پردازش است؟
TransactionSchema.virtual("isPending").get(function () {
  return ["pending", "processing"].includes(this.status);
});

// Static Methods

/**
 * ایجاد تراکنش واریز
 */
TransactionSchema.statics.createDeposit = async function (data) {
  const {
    userId,
    walletId,
    amount,
    paymentMethod,
    description,
    metadata = {},
  } = data;

  const Wallet = mongoose.model("Wallet");
  const wallet = await Wallet.findById(walletId);

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  const transaction = await this.create({
    userId,
    walletId,
    type: "deposit",
    amount,
    balanceBefore: wallet.balance,
    balanceAfter: wallet.balance + amount,
    direction: "in",
    paymentMethod,
    description,
    metadata,
  });

  return transaction;
};

/**
 * ایجاد تراکنش برداشت
 */
TransactionSchema.statics.createWithdraw = async function (data) {
  const {
    userId,
    walletId,
    amount,
    paymentMethod,
    description,
    metadata = {},
  } = data;

  const Wallet = mongoose.model("Wallet");
  const wallet = await Wallet.findById(walletId);

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  if (wallet.availableBalance < amount) {
    throw new Error("Insufficient balance");
  }

  const transaction = await this.create({
    userId,
    walletId,
    type: "withdraw",
    amount,
    balanceBefore: wallet.balance,
    balanceAfter: wallet.balance - amount,
    direction: "out",
    paymentMethod,
    description,
    metadata,
  });

  return transaction;
};

/**
 * تکمیل تراکنش
 */
TransactionSchema.methods.complete = async function (additionalData = {}) {
  this.status = "completed";
  this.completedAt = new Date();

  Object.assign(this, additionalData);

  await this.save();
  return this;
};

/**
 * شکست تراکنش
 */
TransactionSchema.methods.fail = async function (reason) {
  this.status = "failed";
  this.failedAt = new Date();
  this.failureReason = reason;

  await this.save();
  return this;
};

/**
 * لغو تراکنش
 */
TransactionSchema.methods.cancel = async function (reason) {
  if (this.status === "completed") {
    throw new Error("Cannot cancel completed transaction");
  }

  this.status = "cancelled";
  this.failureReason = reason;

  await this.save();
  return this;
};

/**
 * بازگشت وجه
 */
TransactionSchema.methods.refund = async function () {
  if (this.status !== "completed") {
    throw new Error("Can only refund completed transactions");
  }

  if (this.type === "refund") {
    throw new Error("Cannot refund a refund transaction");
  }

  this.status = "refunded";
  await this.save();

  // ایجاد تراکنش بازگشت وجه
  const refundTransaction = await this.constructor.create({
    userId: this.userId,
    walletId: this.walletId,
    type: "refund",
    amount: this.amount,
    balanceBefore: this.balanceAfter,
    balanceAfter: this.balanceBefore,
    direction: this.direction === "in" ? "out" : "in",
    paymentMethod: this.paymentMethod,
    description: `بازگشت وجه تراکنش ${this._id}`,
    status: "completed",
    completedAt: new Date(),
    relatedTo: {
      model: "Transaction",
      id: this._id,
    },
  });

  return refundTransaction;
};

/**
 * دریافت اطلاعات عمومی تراکنش
 */
TransactionSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    type: this.type,
    amount: this.amount,
    currency: this.currency,
    status: this.status,
    direction: this.direction,
    description: this.description,
    paymentMethod: this.paymentMethod,
    refId: this.refId,
    cardPan: this.cardPan,
    createdAt: this.createdAt,
    completedAt: this.completedAt,
  };
};

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);

export default Transaction;
