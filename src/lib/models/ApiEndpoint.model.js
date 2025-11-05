/**
 * API Endpoint Model
 * مدل endpoints برای مدیریت دسترسی‌ها
 */

import mongoose from "mongoose";

// ==================== API Endpoint Schema ====================
const ApiEndpointSchema = new mongoose.Schema(
  {
    // مسیر endpoint
    path: {
      type: String,
      required: [true, "مسیر endpoint الزامی است"],
      unique: true,
      trim: true,
      // مثال: "/api/users", "/api/users/:id", "/api/events/:id/register"
    },

    // متدهای HTTP موجود
    availableMethods: {
      type: [String],
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      default: ["GET"],
      // متدهایی که این endpoint پشتیبانی می‌کنه
    },

    // دسته‌بندی
    module: {
      type: String,
      required: [true, "ماژول الزامی است"],
      trim: true,
      // مثال: "users", "events", "auth", "admin"
    },
    category: {
      type: String,
      trim: true,
      // مثال: "management", "public", "reporting"
    },

    // اطلاعات توضیحی
    title: {
      type: String,
      required: [true, "عنوان الزامی است"],
      trim: true,
      // مثال: "دریافت لیست کاربران", "ایجاد رویداد جدید"
    },
    description: {
      type: String,
      maxlength: 500,
      // توضیحات کامل درباره endpoint
    },

    // متادیتا برای documentation
    requestBody: {
      type: mongoose.Schema.Types.Mixed,
      // JSON Schema برای request body
    },
    responseExample: {
      type: mongoose.Schema.Types.Mixed,
      // مثال response
    },
    queryParams: {
      type: [String],
      default: [],
      // مثال: ["page", "limit", "search"]
    },
    pathParams: {
      type: [String],
      default: [],
      // مثال: ["id", "userId"]
    },

    // دسترسی پیش‌فرض
    defaultRoles: {
      type: [String],
      default: [],
      // نقش‌هایی که به صورت پیش‌فرض دسترسی دارن
      // مثال: ["admin"] برای endpoints مدیریتی
    },
    isPublic: {
      type: Boolean,
      default: false,
      // آیا این endpoint عمومی هست؟ (بدون نیاز به auth)
    },

    // وضعیت
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeprecated: {
      type: Boolean,
      default: false,
      // برای endpoints قدیمی که قرار نیست استفاده بشن
    },
    deprecationMessage: {
      type: String,
    },

    // Rate limiting (اختیاری)
    rateLimit: {
      requests: {
        type: Number,
        default: 100,
        // تعداد درخواست
      },
      windowMs: {
        type: Number,
        default: 60000,
        // بازه زمانی (ms) - پیش‌فرض: 1 دقیقه
      },
    },

    // آمار
    callCount: {
      type: Number,
      default: 0,
      // تعداد دفعات صدا زدن
    },
    lastCalledAt: {
      type: Date,
    },

    // Version
    version: {
      type: String,
      default: "1.0",
      // مثال: "1.0", "2.0", "beta"
    },

    // Tags برای گروه‌بندی
    tags: {
      type: [String],
      default: [],
      // مثال: ["crud", "user-management", "critical"]
    },
  },
  {
    timestamps: true,
  }
);

// ==================== Indexes ====================
ApiEndpointSchema.index({ path: 1 });
ApiEndpointSchema.index({ module: 1 });
ApiEndpointSchema.index({ isActive: 1 });
ApiEndpointSchema.index({ isPublic: 1 });
ApiEndpointSchema.index({ tags: 1 });

// ==================== Instance Methods ====================

/**
 * بررسی اینکه آیا یک متد خاص موجود هست یا نه
 */
ApiEndpointSchema.methods.supportsMethod = function (method) {
  return this.availableMethods.includes(method.toUpperCase());
};

/**
 * تبدیل به JSON
 */
ApiEndpointSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    path: this.path,
    availableMethods: this.availableMethods,
    module: this.module,
    category: this.category,
    title: this.title,
    description: this.description,
    queryParams: this.queryParams,
    pathParams: this.pathParams,
    defaultRoles: this.defaultRoles,
    isPublic: this.isPublic,
    isActive: this.isActive,
    isDeprecated: this.isDeprecated,
    deprecationMessage: this.deprecationMessage,
    rateLimit: this.rateLimit,
    version: this.version,
    tags: this.tags,
  };
};

// ==================== Static Methods ====================

/**
 * گرفتن endpoints بر اساس ماژول
 */
ApiEndpointSchema.statics.getByModule = function (module) {
  return this.find({ module, isActive: true }).sort({ path: 1 });
};

/**
 * گرفتن endpoints عمومی
 */
ApiEndpointSchema.statics.getPublicEndpoints = function () {
  return this.find({ isPublic: true, isActive: true }).sort({
    module: 1,
    path: 1,
  });
};

/**
 * گرافت تمام endpoints گروه‌بندی شده بر اساس ماژول
 */
ApiEndpointSchema.statics.getAllGroupedByModule = async function () {
  const endpoints = await this.find({ isActive: true }).sort({
    module: 1,
    path: 1,
  });

  const grouped = {};

  endpoints.forEach((endpoint) => {
    if (!grouped[endpoint.module]) {
      grouped[endpoint.module] = [];
    }
    grouped[endpoint.module].push(endpoint);
  });

  return grouped;
};

/**
 * جستجو در endpoints
 */
ApiEndpointSchema.statics.search = function (query) {
  const regex = new RegExp(query, "i");
  return this.find({
    $or: [
      { path: regex },
      { title: regex },
      { description: regex },
      { module: regex },
      { tags: regex },
    ],
    isActive: true,
  });
};

/**
 * Auto-discovery endpoints از فایل‌های route
 * (این رو بعداً پیاده‌سازی می‌کنیم)
 */
ApiEndpointSchema.statics.discoverEndpoints = async function () {
  // TODO: اسکن کردن فایل‌های src/app/api و استخراج خودکار endpoints
  console.log("Auto-discovery will be implemented");
};

// ==================== Hooks ====================

/**
 * قبل از ذخیره، path رو normalize کن
 */
ApiEndpointSchema.pre("save", function (next) {
  // اطمینان حاصل کن که path با / شروع می‌شه
  if (!this.path.startsWith("/")) {
    this.path = `/${this.path}`;
  }

  // حذف / آخر (اگر وجود داشته باشه)
  if (this.path.length > 1 && this.path.endsWith("/")) {
    this.path = this.path.slice(0, -1);
  }

  next();
});

// ==================== Export ====================

const ApiEndpoint =
  mongoose.models.ApiEndpoint ||
  mongoose.model("ApiEndpoint", ApiEndpointSchema);

export default ApiEndpoint;

/**
 * مثال داده‌های اولیه:
 *
 * [
 *   {
 *     path: "/api/users",
 *     availableMethods: ["GET", "POST"],
 *     module: "users",
 *     category: "management",
 *     title: "مدیریت کاربران",
 *     description: "دریافت لیست کاربران یا ایجاد کاربر جدید",
 *     queryParams: ["page", "limit", "search", "role"],
 *     defaultRoles: ["admin"],
 *     tags: ["crud", "user-management"],
 *   },
 *   {
 *     path: "/api/users/:id",
 *     availableMethods: ["GET", "PUT", "DELETE"],
 *     module: "users",
 *     title: "عملیات روی کاربر خاص",
 *     pathParams: ["id"],
 *     defaultRoles: ["admin"],
 *     tags: ["crud", "user-management"],
 *   },
 *   {
 *     path: "/api/events",
 *     availableMethods: ["GET", "POST"],
 *     module: "events",
 *     title: "مدیریت رویدادها",
 *     defaultRoles: ["event_owner", "admin"],
 *     tags: ["crud", "events"],
 *   },
 *   {
 *     path: "/api/auth/login",
 *     availableMethods: ["POST"],
 *     module: "auth",
 *     title: "ورود به سیستم",
 *     isPublic: true,
 *     tags: ["auth", "public"],
 *   },
 * ]
 */


