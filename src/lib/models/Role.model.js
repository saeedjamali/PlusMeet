/**
 * Dynamic Role Model
 * مدل نقش‌های پویا با دسترسی‌های قابل تنظیم
 */

import mongoose from "mongoose";

// ==================== Menu Permission Schema ====================
const MenuPermissionSchema = new mongoose.Schema(
  {
    menuId: {
      type: String,
      required: true,
      // می‌تونه به Menu model لینک بشه یا یک identifier ثابت باشه
    },
    access: {
      type: String,
      enum: ["view", "full"],
      default: "view",
      // "view": فقط مشاهده منو
      // "full": دسترسی کامل (مشاهده + عملیات)
    },
  },
  { _id: false }
);

// ==================== API Permission Schema ====================
const ApiPermissionSchema = new mongoose.Schema(
  {
    path: {
      type: String,
      required: true,
      // مثال: "/api/users", "/api/events/:id"
    },
    methods: {
      type: [String],
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      default: [],
      // مثال: ["GET", "POST"]
    },
  },
  { _id: false }
);

// ==================== Role Schema ====================
const RoleSchema = new mongoose.Schema(
  {
    // اطلاعات پایه
    name: {
      type: String,
      required: [true, "نام نقش الزامی است"],
      trim: true,
      // مثال: "مدیر سیستم"
    },
    slug: {
      type: String,
      required: [true, "شناسه نقش الزامی است"],
      unique: true,
      lowercase: true,
      trim: true,
      // مثال: "admin", "event_owner", "custom_role_1"
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // نقش‌های سیستمی (غیرقابل حذف/ویرایش محدود)
    isSystem: {
      type: Boolean,
      default: false,
      // true برای: admin, user, event_owner, moderator
      // false برای نقش‌های custom
    },

    // نقش‌های Staff (کارشناس/مدیر)
    isStaff: {
      type: Boolean,
      default: false,
      // true برای: admin, moderator, support, finance_manager, etc.
      // false برای: user, guest, event_owner
      // این فیلد مشخص می‌کند که آیا این نقش دسترسی‌های مدیریتی دارد
    },

    // دسترسی به منوها
    menuPermissions: {
      type: [MenuPermissionSchema],
      default: [],
      // مثال:
      // [
      //   { menuId: "dashboard", access: "view" },
      //   { menuId: "users", access: "full" },
      //   { menuId: "events", access: "view" }
      // ]
    },

    // دسترسی به API ها
    apiPermissions: {
      type: [ApiPermissionSchema],
      default: [],
      // مثال:
      // [
      //   { path: "/api/users", methods: ["GET", "POST"] },
      //   { path: "/api/users/:id", methods: ["GET", "PUT", "DELETE"] },
      //   { path: "/api/events", methods: ["GET"] }
      // ]
    },

    // تنظیمات اضافی
    color: {
      type: String,
      default: "#6B7280", // gray-500
      // برای UI (badge color)
    },
    icon: {
      type: String,
      default: "👤",
      // آیکون برای نمایش در UI
    },
    priority: {
      type: Number,
      default: 0,
      // برای ترتیب نمایش و سلسله‌مراتب
      // مثلاً: admin = 100, moderator = 50, user = 10
    },

    // آمار و متادیتا
    usersCount: {
      type: Number,
      default: 0,
      // تعداد کاربران با این نقش
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // ایجاد کننده (فقط برای نقش‌های custom)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// ==================== Indexes ====================
RoleSchema.index({ slug: 1 });
RoleSchema.index({ isSystem: 1 });
RoleSchema.index({ isActive: 1 });

// ==================== Instance Methods ====================

/**
 * بررسی دسترسی به یک منو خاص
 */
RoleSchema.methods.hasMenuAccess = function (menuId) {
  const permission = this.menuPermissions.find((p) => p.menuId === menuId);
  return permission ? permission.access : null;
};

/**
 * بررسی دسترسی به یک API endpoint با متد خاص
 */
RoleSchema.methods.hasApiAccess = function (endpoint, method) {
  console.log(`      🔍 [hasApiAccess] Checking: ${method} ${endpoint}`);
  console.log(`      📋 [hasApiAccess] Role: ${this.slug}, API Permissions: ${this.apiPermissions?.length || 0}`);
  
  if (!this.apiPermissions || this.apiPermissions.length === 0) {
    console.log(`      ⚠️ [hasApiAccess] No API permissions defined for role: ${this.slug}`);
    return false;
  }

  const permission = this.apiPermissions.find((p) => {
    // Support برای dynamic routes مثل /api/users/:id و wildcard مثل /api/uploads/*
    let regexPattern = p.path
      .replace(/\*/g, ".*")         // * را به .* تبدیل کن (wildcard - هر چیزی)
      .replace(/:[^/]+/g, "[^/]+"); // :id را به [^/]+ تبدیل کن (یک segment)
    
    const regex = new RegExp(`^${regexPattern}$`);
    const isMatch = regex.test(endpoint);
    
    console.log(`      🔍 [hasApiAccess] Testing: ${p.path} (regex: ^${regexPattern}$) against ${endpoint} = ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    
    if (isMatch) {
      console.log(`      ✅ [hasApiAccess] Path matched: ${p.path} -> ${endpoint}`);
      console.log(`      🔍 [hasApiAccess] Available methods: [${p.methods.join(", ")}]`);
      console.log(`      🔍 [hasApiAccess] Requested method: ${method.toUpperCase()}`);
    }
    
    return isMatch;
  });

  if (!permission) {
    console.log(`      ❌ [hasApiAccess] No matching path found for: ${endpoint}`);
    return false;
  }
  
  const hasMethod = permission.methods.includes(method.toUpperCase());
  
  if (hasMethod) {
    console.log(`      ✅✅ [hasApiAccess] GRANTED: ${method} ${endpoint}`);
  } else {
    console.log(`      ❌ [hasApiAccess] Method not allowed: ${method} (available: [${permission.methods.join(", ")}])`);
  }
  
  return hasMethod;
};

/**
 * تبدیل به JSON برای API response
 */
RoleSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    slug: this.slug,
    description: this.description,
    isSystem: this.isSystem,
    color: this.color,
    icon: this.icon,
    priority: this.priority,
    usersCount: this.usersCount,
    isActive: this.isActive,
    menuPermissions: this.menuPermissions,
    apiPermissions: this.apiPermissions,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// ==================== Static Methods ====================

/**
 * پیدا کردن نقش با slug
 */
RoleSchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug: slug.toLowerCase() });
};

/**
 * گرفتن تمام نقش‌های فعال
 */
RoleSchema.statics.getActiveRoles = function () {
  return this.find({ isActive: true }).sort({ priority: -1 });
};

/**
 * گرفتن نقش‌های سیستمی
 */
RoleSchema.statics.getSystemRoles = function () {
  return this.find({ isSystem: true }).sort({ priority: -1 });
};

/**
 * گرفتن نقش‌های سفارشی
 */
RoleSchema.statics.getCustomRoles = function () {
  return this.find({ isSystem: false, isActive: true }).sort({ createdAt: -1 });
};

// ==================== Hooks ====================

/**
 * قبل از حذف، بررسی کنیم که نقش سیستمی نباشه
 */
RoleSchema.pre("remove", function (next) {
  if (this.isSystem) {
    return next(new Error("نقش‌های سیستمی قابل حذف نیستند"));
  }
  next();
});

// ==================== Export ====================

const Role = mongoose.models.Role || mongoose.model("Role", RoleSchema);

export default Role;

/**
 * مثال استفاده:
 *
 * // ایجاد نقش جدید
 * const role = new Role({
 *   name: "مدیر محتوا",
 *   slug: "content_manager",
 *   description: "مدیریت محتوای سایت",
 *   menuPermissions: [
 *     { menuId: "dashboard", access: "view" },
 *     { menuId: "content", access: "full" },
 *     { menuId: "content.articles", access: "full" },
 *   ],
 *   apiPermissions: [
 *     { path: "/api/articles", methods: ["GET", "POST", "PUT"] },
 *     { path: "/api/articles/:id", methods: ["GET", "PUT"] },
 *   ],
 * });
 *
 * // بررسی دسترسی
 * role.hasMenuAccess("content.articles"); // true
 * role.hasApiAccess("/api/articles", "POST"); // true
 * role.hasApiAccess("/api/articles", "DELETE"); // false
 */
