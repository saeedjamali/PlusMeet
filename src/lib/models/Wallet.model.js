import mongoose from 'mongoose';

/**
 * Wallet Model - کیف پول کاربران
 * هر کاربر (غیر از مهمان) یک کیف پول دارد
 */
const WalletSchema = new mongoose.Schema(
  {
    // کاربر مالک کیف پول
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // موجودی فعلی (به ریال)
    balance: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },

    // موجودی قابل برداشت (ممکنه بخشی از موجودی مسدود باشه)
    availableBalance: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },

    // موجودی مسدود شده (در حال پردازش، ضمانت، و...)
    frozenBalance: {
      type: Number,
      default: 0,
      min: 0,
      default: 0,
    },

    // ارز پیش‌فرض
    currency: {
      type: String,
      default: 'IRR',
      enum: ['IRR', 'USD', 'EUR'],
    },

    // وضعیت کیف پول
    status: {
      type: String,
      enum: ['active', 'suspended', 'closed'],
      default: 'active',
      index: true,
    },

    // تاریخ آخرین تراکنش
    lastTransactionAt: {
      type: Date,
      default: null,
    },

    // آمار کیف پول
    stats: {
      // کل واریزی‌ها
      totalDeposits: {
        type: Number,
        default: 0,
      },
      // تعداد واریزی‌ها
      depositCount: {
        type: Number,
        default: 0,
      },
      // کل برداشت‌ها
      totalWithdrawals: {
        type: Number,
        default: 0,
      },
      // تعداد برداشت‌ها
      withdrawalCount: {
        type: Number,
        default: 0,
      },
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
WalletSchema.index({ userId: 1 });
WalletSchema.index({ status: 1 });
WalletSchema.index({ balance: -1 });
WalletSchema.index({ createdAt: -1 });

// Virtual: محاسبه درصد موجودی مسدود
WalletSchema.virtual('frozenPercentage').get(function () {
  if (this.balance === 0) return 0;
  return Math.round((this.frozenBalance / this.balance) * 100);
});

// Pre-save: اعتبارسنجی
WalletSchema.pre('save', function (next) {
  // موجودی قابل برداشت = موجودی کل - موجودی مسدود
  this.availableBalance = this.balance - this.frozenBalance;

  // موجودی مسدود نباید بیشتر از موجودی کل باشه
  if (this.frozenBalance > this.balance) {
    return next(new Error('Frozen balance cannot exceed total balance'));
  }

  // موجودی نمی‌تونه منفی باشه
  if (this.balance < 0) {
    return next(new Error('Balance cannot be negative'));
  }

  next();
});

// Static Methods

/**
 * پیدا کردن یا ایجاد کیف پول برای کاربر
 */
WalletSchema.statics.findOrCreateForUser = async function (userId) {
  let wallet = await this.findOne({ userId });

  if (!wallet) {
    wallet = await this.create({
      userId,
      balance: 0,
      availableBalance: 0,
      frozenBalance: 0,
    });
  }

  return wallet;
};

/**
 * افزایش موجودی
 */
WalletSchema.methods.deposit = async function (amount, metadata = {}) {
  if (amount <= 0) {
    throw new Error('Deposit amount must be positive');
  }

  this.balance += amount;
  this.stats.totalDeposits += amount;
  this.stats.depositCount += 1;
  this.lastTransactionAt = new Date();

  await this.save();
  return this;
};

/**
 * کاهش موجودی
 */
WalletSchema.methods.withdraw = async function (amount, metadata = {}) {
  if (amount <= 0) {
    throw new Error('Withdrawal amount must be positive');
  }

  if (this.availableBalance < amount) {
    throw new Error('Insufficient available balance');
  }

  this.balance -= amount;
  this.stats.totalWithdrawals += amount;
  this.stats.withdrawalCount += 1;
  this.lastTransactionAt = new Date();

  await this.save();
  return this;
};

/**
 * مسدود کردن موجودی
 */
WalletSchema.methods.freeze = async function (amount) {
  if (amount <= 0) {
    throw new Error('Freeze amount must be positive');
  }

  if (this.availableBalance < amount) {
    throw new Error('Insufficient available balance to freeze');
  }

  this.frozenBalance += amount;
  await this.save();
  return this;
};

/**
 * آزادسازی موجودی مسدود
 */
WalletSchema.methods.unfreeze = async function (amount) {
  if (amount <= 0) {
    throw new Error('Unfreeze amount must be positive');
  }

  if (this.frozenBalance < amount) {
    throw new Error('Insufficient frozen balance to unfreeze');
  }

  this.frozenBalance -= amount;
  await this.save();
  return this;
};

/**
 * تعلیق کیف پول
 */
WalletSchema.methods.suspend = async function () {
  this.status = 'suspended';
  await this.save();
  return this;
};

/**
 * فعال‌سازی کیف پول
 */
WalletSchema.methods.activate = async function () {
  this.status = 'active';
  await this.save();
  return this;
};

/**
 * بستن کیف پول (غیرقابل بازگشت)
 */
WalletSchema.methods.close = async function () {
  if (this.balance > 0) {
    throw new Error('Cannot close wallet with positive balance');
  }

  this.status = 'closed';
  await this.save();
  return this;
};

/**
 * دریافت اطلاعات عمومی کیف پول
 */
WalletSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    balance: this.balance,
    availableBalance: this.availableBalance,
    frozenBalance: this.frozenBalance,
    currency: this.currency,
    status: this.status,
    stats: this.stats,
    lastTransactionAt: this.lastTransactionAt,
    createdAt: this.createdAt,
  };
};

const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);

export default Wallet;

