/**
 * User Model - MongoDB Schema
 * مدل کاربر برای MongoDB
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * آمار کاربر
 */
const UserStatsSchema = new Schema(
  {
    profileViews: { type: Number, default: 0 },
    profileViewsThisMonth: { type: Number, default: 0 },
    eventsCreated: { type: Number, default: 0 },
    eventsJoined: { type: Number, default: 0 },
    eventsCompleted: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    connectionsCount: { type: Number, default: 0 },
    likesReceived: { type: Number, default: 0 },
    commentsReceived: { type: Number, default: 0 },
    sharesReceived: { type: Number, default: 0 },
    trustScore: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRevenue: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
    successfulPayments: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },
    activeDaysCount: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 }, // دقیقه
  },
  { _id: false }
);

/**
 * تنظیمات کاربر
 */
const UserSettingsSchema = new Schema(
  {
    language: {
      type: String,
      enum: ["fa", "en"],
      default: "fa",
    },
    notifications: { type: Boolean, default: true },
    privacy: {
      showPhone: { type: Boolean, default: false },
      showEmail: { type: Boolean, default: true },
      showBirthDate: { type: Boolean, default: false },
    },
  },
  { _id: false }
);

/**
 * شبکه‌های اجتماعی
 */
const SocialLinksSchema = new Schema(
  {
    instagram: String,
    telegram: String,
    linkedin: String,
    twitter: String,
    facebook: String,
    website: String,
  },
  { _id: false }
);

/**
 * مدارک (برای سازمان‌ها)
 */
const DocumentSchema = new Schema({
  type: {
    type: String,
    enum: [
      "business_license",
      "national_id",
      "tax_id",
      "registration_certificate",
      "other",
    ],
    required: true,
  },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: Number,
  mimeType: String,
  uploadedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  reviewedBy: { type: String }, // شماره موبایل ادمین
  reviewedAt: Date,
  notes: String,
});

/**
 * آدرس (برای سازمان‌ها)
 */
const AddressSchema = new Schema(
  {
    city: String,
    province: String,
    postalCode: String,
    fullAddress: String,
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], index: "2dsphere" }, // [lng, lat]
    },
  },
  { _id: false }
);

/**
 * شخص تماس (برای سازمان‌ها)
 */
const ContactPersonSchema = new Schema(
  {
    name: String,
    phone: String,
    email: String,
    position: String,
  },
  { _id: false }
);

/**
 * اسکیما اصلی کاربر
 */
const UserSchema = new Schema(
  {
    // ========================================
    // احراز هویت و شناسه
    // ========================================
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^09\d{9}$/, // فرمت ایرانی
    },
    password: {
      type: String,
      select: false, // به صورت پیش‌فرض برنگردد
    },

    // ========================================
    // اطلاعات پایه
    // ========================================
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 500,
    },

    // ========================================
    // نقش و وضعیت
    // ========================================
    roles: {
      type: [String],
      default: ["user"],
      // Note: Validation انجام می‌شود در API routes با استفاده از Role.model
      // این اجازه می‌دهد admin نقش‌های دینامیک جدید بسازد
    },
    state: {
      type: String,
      enum: [
        "unregistered",
        "active",
        "pending_verification",
        "verified",
        "suspended",
        "deleted",
      ],
      default: "active",
      index: true,
    },
    userType: {
      type: String,
      enum: [
        "individual",
        "individual_freelancer",
        "organization",
        "organization_team",
        "organization_private",
        "organization_public",
        "organization_ngo",
        "organization_edu",
        "organization_media",
        "government",
      ],
      default: "individual",
      index: true,
    },

    // ========================================
    // اطلاعات شخصی (فقط individual)
    // ========================================
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    nationalId: String,
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },
    city: String,
    personalAddress: String,

    // موقعیت پیش‌فرض برای جستجوی رویدادها
    location: {
      state: String, // استان
      city: String,  // شهر
    },

    // ========================================
    // اطلاعات سازمانی
    // ========================================
    organizationName: String,
    organizationLogo: String,
    registrationNumber: String,
    taxId: String,
    website: String,
    organizationEmail: String,
    description: String,
    address: AddressSchema,
    contactPerson: ContactPersonSchema,
    documents: [DocumentSchema],

    // ========================================
    // شبکه‌های اجتماعی
    // ========================================
    socialLinks: SocialLinksSchema,

    // ========================================
    // آمار و تنظیمات
    // ========================================
    stats: {
      type: UserStatsSchema,
      default: () => ({}),
    },
    settings: {
      type: UserSettingsSchema,
      default: () => ({}),
    },

    // ========================================
    // تاریخ‌ها
    // ========================================
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    lastLoginAt: Date,
    verifiedAt: Date,
    suspendedAt: Date,
    deletedAt: Date,

    // ========================================
    // یادداشت‌های داخلی (فقط admin)
    // ========================================
    internalNotes: {
      type: String,
      select: false,
    },
    suspensionReason: String,
  },
  {
    timestamps: true, // به صورت خودکار createdAt و updatedAt را مدیریت می‌کند
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========================================
// Indexes
// ========================================
UserSchema.index({ displayName: "text", bio: "text" }); // جستجوی متنی
UserSchema.index({ createdAt: -1 });
UserSchema.index({ "stats.trustScore": -1 });
UserSchema.index({ state: 1, userType: 1 });

// ========================================
// Virtuals
// ========================================

// نام کامل
UserSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// آیا verified است؟
UserSchema.virtual("isVerified").get(function () {
  return this.state === "verified";
});

// آیا active است؟
UserSchema.virtual("isActive").get(function () {
  return this.state === "active" || this.state === "verified";
});

// آیا سازمان است؟
UserSchema.virtual("isOrganization").get(function () {
  return (
    this.userType?.startsWith("organization") || this.userType === "government"
  );
});

// ========================================
// Methods
// ========================================

/**
 * چک کردن نقش
 */
UserSchema.methods.hasRole = function (role) {
  return this.roles.includes(role) || this.roles.includes("admin");
};

/**
 * افزودن نقش
 */
UserSchema.methods.addRole = function (role) {
  if (!this.roles.includes(role)) {
    this.roles.push(role);
  }
};

/**
 * حذف نقش
 */
UserSchema.methods.removeRole = function (role) {
  this.roles = this.roles.filter((r) => r !== role);
};

/**
 * به‌روزرسانی آمار بازدید
 */
UserSchema.methods.incrementViews = function () {
  this.stats.profileViews += 1;
  this.stats.profileViewsThisMonth += 1;
};

/**
 * تایید کاربر
 */
UserSchema.methods.verify = function () {
  this.state = "verified";
  this.verifiedAt = new Date();
};

/**
 * مسدود کردن کاربر
 */
UserSchema.methods.suspend = function (reason) {
  this.state = "suspended";
  this.suspendedAt = new Date();
  if (reason) {
    this.suspensionReason = reason;
  }
};

/**
 * فعال کردن مجدد
 */
UserSchema.methods.unsuspend = function () {
  this.state = this.verifiedAt ? "verified" : "active";
  this.suspendedAt = null;
  this.suspensionReason = null;
};

/**
 * حذف نرم
 */
UserSchema.methods.softDelete = function () {
  this.state = "deleted";
  this.deletedAt = new Date();
};

/**
 * فیلد‌های عمومی (برای نمایش به دیگران)
 */
UserSchema.methods.toPublicJSON = async function () {
  // محاسبه isStaff از role های دیتابیس
  let isStaff = false;
  if (this.roles && this.roles.length > 0) {
    const Role = mongoose.model("Role");
    const staffRolesCount = await Role.countDocuments({
      slug: { $in: this.roles },
      isStaff: true,
    });
    isStaff = staffRolesCount > 0;
  }

  return {
    phoneNumber: this.phoneNumber,
    firstName: this.firstName,
    lastName: this.lastName,
    displayName: this.displayName || this.fullName,
    avatar: this.avatar,
    bio: this.bio,
    roles: this.roles, // ✅ اضافه کردن roles
    isStaff, // 👈 اضافه شد: بر اساس role های دیتابیس
    userType: this.userType,
    state: this.state,
    isVerified: this.isVerified,
    organizationName: this.organizationName,
    organizationLogo: this.organizationLogo,
    socialLinks: this.socialLinks,
    stats: this.stats
      ? {
          trustScore: this.stats.trustScore,
          reviewsCount: this.stats.reviewsCount,
          averageRating: this.stats.averageRating,
        }
      : undefined,
    createdAt: this.createdAt,
  };
};

// ========================================
// Statics (متدهای استاتیک)
// ========================================

/**
 * جستجوی کاربران
 */
UserSchema.statics.search = function (query, filters = {}) {
  const searchQuery = { ...filters };

  if (query) {
    searchQuery.$text = { $search: query };
  }

  return this.find(searchQuery).select("-password -internalNotes");
};

/**
 * پیدا کردن با شماره موبایل
 */
UserSchema.statics.findByPhone = function (phoneNumber) {
  return this.findOne({ phoneNumber });
};

/**
 * کاربران verified
 */
UserSchema.statics.findVerified = function () {
  return this.find({ state: "verified" });
};

// ========================================
// Middlewares
// ========================================

// قبل از ذخیره: به‌روزرسانی updatedAt
UserSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // تنظیم displayName اگر خالی باشد
  if (!this.displayName) {
    this.displayName = this.fullName;
  }

  next();
});

// قبل از پیدا کردن: فیلتر deleted
UserSchema.pre(/^find/, function (next) {
  // به صورت پیش‌فرض کاربران deleted را نشان نده
  if (!this.getOptions().includeDeleted) {
    this.where({ state: { $ne: "deleted" } });
  }
  next();
});

// ========================================
// Export Model
// ========================================

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
