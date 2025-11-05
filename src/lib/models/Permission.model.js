/**
 * Permission Model - MongoDB Schema
 * مدل مجوزها و دسترسی‌ها
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * مدل مجوز (Permission)
 * برای تعریف مجوزهای سیستم
 */
const PermissionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // مثال: "users.view", "events.delete"
    },
    displayName: {
      type: String,
      required: true,
      // مثال: "مشاهده کاربران"
    },
    description: {
      type: String,
      // توضیحات کامل مجوز
    },
    category: {
      type: String,
      enum: [
        "users",
        "events",
        "content",
        "payments",
        "settings",
        "analytics",
        "reports",
        "system",
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

PermissionSchema.index({ name: 1 });
PermissionSchema.index({ category: 1 });

/**
 * مدل نقش (Role)
 * برای تعریف نقش‌ها و مجوزهای آن‌ها
 */
const RoleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ["guest", "user", "event_owner", "moderator", "admin"],
    },
    displayName: {
      type: String,
      required: true,
    },
    description: String,
    permissions: [
      {
        type: String,
        ref: "Permission",
      },
    ],
    isSystem: {
      type: Boolean,
      default: false, // نقش‌های سیستمی قابل حذف نیستند
    },
    priority: {
      type: Number,
      default: 0, // برای ترتیب نمایش
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

RoleSchema.index({ name: 1 });

/**
 * مدل دسترسی سفارشی کاربر (UserPermission)
 * برای دادن دسترسی‌های خاص به کاربران
 */
const UserPermissionSchema = new Schema(
  {
    userId: {
      type: String, // شماره موبایل
      required: true,
      index: true,
    },
    permission: {
      type: String,
      required: true,
      ref: "Permission",
    },
    grantedBy: {
      type: String, // شماره موبایل admin
      required: true,
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null, // null = دائمی
    },
    scope: {
      type: Schema.Types.Mixed,
      // برای محدودیت‌های اضافی
      // مثال: { city: "Tehran" }
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

UserPermissionSchema.index({ userId: 1, permission: 1 });
UserPermissionSchema.index({ expiresAt: 1 });
UserPermissionSchema.index({ isActive: 1 });

/**
 * چک کردن اینکه مجوز منقضی نشده
 */
UserPermissionSchema.methods.isValid = function () {
  if (!this.isActive) return false;
  if (!this.expiresAt) return true;
  return new Date() < this.expiresAt;
};

/**
 * لغو مجوز
 */
UserPermissionSchema.methods.revoke = function () {
  this.isActive = false;
};

// ========================================
// Export Models
// ========================================

export const Permission =
  mongoose.models.Permission || mongoose.model("Permission", PermissionSchema);
export const Role = mongoose.models.Role || mongoose.model("Role", RoleSchema);
export const UserPermission =
  mongoose.models.UserPermission ||
  mongoose.model("UserPermission", UserPermissionSchema);




