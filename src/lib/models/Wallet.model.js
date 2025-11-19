import mongoose from "mongoose";

/**
 * Wallet Model - مدل کیف پول کاربران
 */

const WalletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    availableBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    frozenBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    reservedBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      default: "IRR",
    },

    transactions: [
      {
        type: {
          type: String,
          enum: [
            "deposit",
            "withdraw",
            "payment",
            "refund",
            "freeze",
            "unfreeze",
            "reserve",
            "release_reserve",
            "deduct_reserve",
            "commission",
            "event_join_reserve",
            "event_join_complete",
            "event_join_refund",
            "event_leave_refund",
          ],
        },
        amount: Number,
        balanceBefore: Number,
        balanceAfter: Number,
        description: String,
        relatedTo: {
          model: String,
          id: mongoose.Schema.Types.ObjectId,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    status: {
      type: String,
      enum: ["active", "suspended", "closed"],
      default: "active",
    },

    lastTransactionAt: Date,
    internalNotes: String,
  },
  {
    timestamps: true,
  }
);

// Static Method
WalletSchema.statics.findOrCreateForUser = async function (userId) {
  let wallet = await this.findOne({ userId });

  if (!wallet) {
    wallet = await this.create({
      userId,
      balance: 0,
      availableBalance: 0,
      frozenBalance: 0,
      reservedBalance: 0,
      status: "active",
    });
  }

  return wallet;
};

// Instance Methods
WalletSchema.methods.deductAmount = async function (amount, metadata = {}) {
  if (amount <= 0) throw new Error("مبلغ باید بزرگتر از صفر باشد");
  if (this.availableBalance < amount) throw new Error("موجودی کافی نیست");

  const balanceBefore = this.balance;
  this.balance -= amount;
  this.availableBalance -= amount;
  this.lastTransactionAt = new Date();

  const description =
    typeof metadata === "string"
      ? metadata
      : metadata.description || "کسر از موجودی";
  const relatedTo = metadata.eventId
    ? { model: "Event", id: metadata.eventId }
    : null;

  this.transactions.push({
    type: "payment",
    amount,
    balanceBefore,
    balanceAfter: this.balance,
    description,
    relatedTo,
    createdAt: new Date(),
  });

  await this.save();
  return {
    success: true,
    balance: this.balance,
    availableBalance: this.availableBalance,
  };
};

WalletSchema.methods.addAmount = async function (amount, metadata = {}) {
  if (amount <= 0) throw new Error("مبلغ باید بزرگتر از صفر باشد");

  const balanceBefore = this.balance;
  this.balance += amount;
  this.availableBalance += amount;
  this.lastTransactionAt = new Date();

  const description =
    typeof metadata === "string"
      ? metadata
      : metadata.description || "افزودن به موجودی";
  const relatedTo = metadata.eventId
    ? { model: "Event", id: metadata.eventId }
    : null;

  this.transactions.push({
    type: "deposit",
    amount,
    balanceBefore,
    balanceAfter: this.balance,
    description,
    relatedTo,
    createdAt: new Date(),
  });

  await this.save();
  return {
    success: true,
    balance: this.balance,
    availableBalance: this.availableBalance,
  };
};

WalletSchema.methods.reserveAmount = async function (amount, metadata = {}) {
  if (amount <= 0) throw new Error("مبلغ باید بزرگتر از صفر باشد");
  if (this.availableBalance < amount) throw new Error("موجودی کافی نیست");

  const balanceBefore = this.balance;
  this.reservedBalance += amount;
  this.availableBalance -= amount;
  this.lastTransactionAt = new Date();

  const description =
    typeof metadata === "string"
      ? metadata
      : metadata.description || "رزرو موجودی";
  const relatedTo = metadata.eventId
    ? { model: "Event", id: metadata.eventId }
    : null;

  this.transactions.push({
    type: "reserve",
    amount,
    balanceBefore,
    balanceAfter: this.balance,
    description,
    relatedTo,
    createdAt: new Date(),
  });

  await this.save();
  return {
    success: true,
    reservedBalance: this.reservedBalance,
    availableBalance: this.availableBalance,
  };
};

WalletSchema.methods.releaseReservedAmount = async function (
  amount,
  metadata = {}
) {
  if (amount <= 0) throw new Error("مبلغ باید بزرگتر از صفر باشد");
  if (this.reservedBalance < amount)
    throw new Error("موجودی رزرو شده کافی نیست");

  const balanceBefore = this.balance;
  this.reservedBalance -= amount;
  this.availableBalance += amount;
  this.lastTransactionAt = new Date();

  const description =
    typeof metadata === "string"
      ? metadata
      : metadata.description || "آزادسازی رزرو";
  const relatedTo = metadata.eventId
    ? { model: "Event", id: metadata.eventId }
    : null;

  this.transactions.push({
    type: "release_reserve",
    amount,
    balanceBefore,
    balanceAfter: this.balance,
    description,
    relatedTo,
    createdAt: new Date(),
  });

  await this.save();
  return {
    success: true,
    reservedBalance: this.reservedBalance,
    availableBalance: this.availableBalance,
  };
};

WalletSchema.methods.deductReservedAmount = async function (
  amount,
  metadata = {}
) {
  if (amount <= 0) throw new Error("مبلغ باید بزرگتر از صفر باشد");
  if (this.reservedBalance < amount)
    throw new Error("موجودی رزرو شده کافی نیست");

  const balanceBefore = this.balance;
  this.reservedBalance -= amount;
  this.balance -= amount;
  this.lastTransactionAt = new Date();

  const description =
    typeof metadata === "string"
      ? metadata
      : metadata.description || "کسر از رزرو";
  const relatedTo = metadata.eventId
    ? { model: "Event", id: metadata.eventId }
    : null;

  this.transactions.push({
    type: "deduct_reserve",
    amount,
    balanceBefore,
    balanceAfter: this.balance,
    description,
    relatedTo,
    createdAt: new Date(),
  });

  await this.save();
  return {
    success: true,
    balance: this.balance,
    reservedBalance: this.reservedBalance,
    availableBalance: this.availableBalance,
  };
};

WalletSchema.methods.refund = async function (amount, metadata = {}) {
  if (amount <= 0) throw new Error("مبلغ باید بزرگتر از صفر باشد");

  const balanceBefore = this.balance;
  this.balance += amount;
  this.availableBalance += amount;
  this.lastTransactionAt = new Date();

  const description =
    typeof metadata === "string"
      ? metadata
      : metadata.description || "بازگشت وجه";
  const relatedTo = metadata.eventId
    ? { model: "Event", id: metadata.eventId }
    : null;

  this.transactions.push({
    type: "refund",
    amount,
    balanceBefore,
    balanceAfter: this.balance,
    description,
    relatedTo,
    createdAt: new Date(),
  });

  await this.save();
  return {
    success: true,
    balance: this.balance,
    availableBalance: this.availableBalance,
  };
};

/**
 * فریز کردن مبلغ (انتقال از availableBalance به frozenBalance)
 * برای زمانی که مالک رویداد درآمد دارد ولی هنوز قطعی نشده
 */
WalletSchema.methods.freezeAmount = async function (amount, metadata = {}) {
  if (amount <= 0) throw new Error("مبلغ باید بزرگتر از صفر باشد");
  if (this.availableBalance < amount) throw new Error("موجودی کافی نیست");

  const balanceBefore = this.balance;
  this.frozenBalance += amount;
  this.availableBalance -= amount;
  this.lastTransactionAt = new Date();

  const description =
    typeof metadata === "string"
      ? metadata
      : metadata.description || "فریز موجودی";
  const relatedTo = metadata.eventId
    ? { model: "Event", id: metadata.eventId }
    : null;

  this.transactions.push({
    type: "freeze",
    amount,
    balanceBefore,
    balanceAfter: this.balance,
    description,
    relatedTo,
    createdAt: new Date(),
  });

  await this.save();
  return {
    success: true,
    frozenBalance: this.frozenBalance,
    availableBalance: this.availableBalance,
  };
};

/**
 * آنفریز کردن مبلغ (انتقال از frozenBalance به availableBalance)
 * برای زمانی که رویداد پایان یافته و درآمد قطعی شده
 */
WalletSchema.methods.unfreezeAmount = async function (amount, metadata = {}) {
  if (amount <= 0) throw new Error("مبلغ باید بزرگتر از صفر باشد");
  if (this.frozenBalance < amount) throw new Error("موجودی فریز شده کافی نیست");

  const balanceBefore = this.balance;
  this.frozenBalance -= amount;
  this.availableBalance += amount;
  this.lastTransactionAt = new Date();

  const description =
    typeof metadata === "string"
      ? metadata
      : metadata.description || "آزادسازی موجودی فریز شده";
  const relatedTo = metadata.eventId
    ? { model: "Event", id: metadata.eventId }
    : null;

  this.transactions.push({
    type: "unfreeze",
    amount,
    balanceBefore,
    balanceAfter: this.balance,
    description,
    relatedTo,
    createdAt: new Date(),
  });

  await this.save();
  return {
    success: true,
    frozenBalance: this.frozenBalance,
    availableBalance: this.availableBalance,
  };
};

/**
 * کسر مبلغ از موجودی فریز شده
 * برای بازپرداخت از frozenBalance مالک
 */
WalletSchema.methods.deductFromFrozen = async function (amount, metadata = {}) {
  if (amount <= 0) throw new Error("مبلغ باید بزرگتر از صفر باشد");
  if (this.frozenBalance < amount) throw new Error("موجودی فریز شده کافی نیست");

  const balanceBefore = this.balance;
  this.frozenBalance -= amount;
  this.balance -= amount;
  this.lastTransactionAt = new Date();

  const description =
    typeof metadata === "string"
      ? metadata
      : metadata.description || "کسر از موجودی فریز شده";
  const relatedTo = metadata.eventId
    ? { model: "Event", id: metadata.eventId }
    : null;

  this.transactions.push({
    type: "withdraw",
    amount: -amount,
    balanceBefore,
    balanceAfter: this.balance,
    description,
    relatedTo,
    createdAt: new Date(),
  });

  await this.save();
  return {
    success: true,
    balance: this.balance,
    frozenBalance: this.frozenBalance,
  };
};

/**
 * تبدیل به فرمت عمومی برای نمایش
 */
WalletSchema.methods.toPublicJSON = function () {
  return {
    balance: this.balance || 0,
    availableBalance: this.availableBalance || 0,
    frozenBalance: this.frozenBalance || 0,
    reservedBalance: this.reservedBalance || 0,
    currency: this.currency || "IRR",
    status: this.status || "active",
    lastTransactionAt: this.lastTransactionAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Wallet = mongoose.models.Wallet || mongoose.model("Wallet", WalletSchema);

export default Wallet;
