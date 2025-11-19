/**
 * RBAC Middleware
 * میدلور بررسی دسترسی‌ها (Role-Based Access Control)
 */

import { Role, UserPermission } from "@/lib/models/Permission.model";

/**
 * تعریف مجوزهای هر نقش
 */
export const rolePermissions = {
  guest: [
    "events.view", // مشاهده رویدادهای عمومی
  ],

  user: [
    "events.view",
    "events.create",
    "events.join",
    "events.leave",
    "profile.view",
    "profile.edit",
    "comments.create",
    "comments.edit.own",
    "comments.delete.own",
    "likes.toggle",
    "messages.send",
    "messages.view.own",
  ],

  event_owner: [
    // همه مجوزهای user
    ...[
      "events.view",
      "events.create",
      "events.join",
      "events.leave",
      "profile.view",
      "profile.edit",
      "comments.create",
      "likes.toggle",
      "messages.send",
      "messages.view.own",
    ],

    // مجوزهای اضافی
    "events.edit.own", // فقط رویدادهای خودش
    "events.delete.own",
    "events.manage_members", // مدیریت اعضای رویداد
    "events.manage_requests", // مدیریت درخواست‌های عضویت
    "payments.view.own", // مشاهده پرداخت‌های رویدادهای خودش
    "payments.manage", // مدیریت تسویه‌حساب
  ],

  moderator: [
    "events.view",
    "events.moderate", // بررسی و تایید رویدادها
    "content.moderate", // بررسی محتوا
    "content.delete", // حذف محتوای نامناسب
    "comments.delete", // حذف کامنت‌های نامناسب
    "reports.view", // مشاهده گزارش‌ها
    "reports.review", // بررسی گزارش‌ها
    "reports.action", // اقدام روی گزارش‌ها
    "users.view", // مشاهده لیست کاربران
    "users.warn", // اخطار به کاربران
    "analytics.view.basic", // مشاهده آمار ساده
  ],

  admin: [
    "*", // دسترسی به همه چیز
  ],
};

/**
 * Middleware برای چک کردن مجوز خاص
 * @param {string} permission - نام مجوز (مثل: "users.delete")
 * @param {object} options - تنظیمات اضافی
 */
export function checkPermission(permission, options = {}) {
  return async (req, res, next) => {
    try {
      // چک احراز هویت
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "لطفاً وارد سیستم شوید",
        });
      }

      const user = req.user;

      // ادمین به همه جا دسترسی دارد
      if (user.roles.includes("admin")) {
        return next();
      }

      // چک مجوزهای نقش‌ها
      const hasRolePermission = user.roles.some((role) => {
        const permissions = rolePermissions[role] || [];
        return permissions.includes(permission) || permissions.includes("*");
      });

      if (hasRolePermission) {
        return next();
      }

      // چک مجوزهای سفارشی (custom permissions)
      const customPermission = await UserPermission.findOne({
        userId: user.phoneNumber,
        permission,
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      });

      if (customPermission) {
        // چک scope (اگر تعریف شده)
        if (options.checkScope && customPermission.scope) {
          const scopeValid = await options.checkScope(
            req,
            customPermission.scope
          );
          if (!scopeValid) {
            return res.status(403).json({
              success: false,
              error: "ScopeForbidden",
              message: "دسترسی در این محدوده مجاز نیست",
            });
          }
        }

        return next();
      }

      // دسترسی ندارد
      return res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "شما دسترسی لازم را ندارید",
        data: {
          requiredPermission: permission,
          userRoles: user.roles,
        },
      });
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({
        success: false,
        error: "ServerError",
        message: "خطای سرور",
      });
    }
  };
}

/**
 * Middleware برای چک مجوزهای "own" (فقط آیتم‌های خودش)
 * مثال: "events.edit.own" - فقط رویدادهای خودش را ویرایش کند
 */
export function checkOwnership(resourceType, getOwnerId) {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      // ادمین به همه چیز دسترسی دارد
      if (user.roles.includes("admin")) {
        return next();
      }

      // دریافت owner از تابع یا مستقیم
      let ownerId;
      if (typeof getOwnerId === "function") {
        ownerId = await getOwnerId(req);
      } else {
        ownerId = getOwnerId;
      }

      if (user.phoneNumber === ownerId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: "NotOwner",
        message: "شما فقط می‌توانید آیتم‌های خودتان را مدیریت کنید",
      });
    } catch (error) {
      console.error("Ownership check error:", error);
      return res.status(500).json({
        success: false,
        error: "ServerError",
      });
    }
  };
}

/**
 * Helper: دریافت تمام مجوزهای یک کاربر
 */
export async function getUserPermissions(
  userId,
  includeRolePermissions = true
) {
  const permissions = new Set();

  // مجوزهای سفارشی
  const customPermissions = await UserPermission.find({
    userId,
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });

  customPermissions.forEach((p) => permissions.add(p.permission));

  // مجوزهای نقش (اختیاری)
  if (includeRolePermissions) {
    const User = (await import("@/lib/models/User.model")).default;
    const user = await User.findByPhone(userId);

    if (user) {
      user.roles.forEach((role) => {
        const rolePerms = rolePermissions[role] || [];
        rolePerms.forEach((p) => permissions.add(p));
      });
    }
  }

  return Array.from(permissions);
}

/**
 * Helper: چک کردن اینکه کاربر مجوز خاصی دارد یا نه
 */
export async function hasPermission(userId, permission) {
  const User = (await import("@/lib/models/User.model")).default;
  const user = await User.findByPhone(userId);

  if (!user) return false;

  // ادمین همه دسترسی‌ها را دارد
  if (user.roles.includes("admin")) return true;

  // چک مجوزهای نقش
  const hasRolePermission = user.roles.some((role) => {
    const permissions = rolePermissions[role] || [];
    return permissions.includes(permission) || permissions.includes("*");
  });

  if (hasRolePermission) return true;

  // چک مجوزهای سفارشی
  const customPermission = await UserPermission.exists({
    userId,
    permission,
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });

  return !!customPermission;
}

/**
 * Helper: افزودن مجوز سفارشی به کاربر
 */
export async function grantPermission(
  userId,
  permission,
  grantedBy,
  options = {}
) {
  const { expiresAt = null, scope = null, notes = "" } = options;

  const userPermission = new UserPermission({
    userId,
    permission,
    grantedBy,
    expiresAt,
    scope,
    notes,
  });

  await userPermission.save();
  return userPermission;
}

/**
 * Helper: حذف مجوز سفارشی
 */
export async function revokePermission(userId, permission) {
  await UserPermission.updateMany(
    { userId, permission },
    { $set: { isActive: false } }
  );
}

/**
 * Helper: چک کردن چند مجوز با OR logic
 * (اگر یکی از مجوزها را داشته باشد کافی است)
 */
export function checkAnyPermission(permissions) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // ادمین
    if (req.user.roles.includes("admin")) {
      return next();
    }

    // چک هر یک از مجوزها
    for (const permission of permissions) {
      const has = await hasPermission(req.user.phoneNumber, permission);
      if (has) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "شما دسترسی لازم را ندارید",
    });
  };
}

/**
 * Helper: چک کردن چند مجوز با AND logic
 * (باید همه مجوزها را داشته باشد)
 */
export function checkAllPermissions(permissions) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // ادمین
    if (req.user.roles.includes("admin")) {
      return next();
    }

    // چک همه مجوزها
    for (const permission of permissions) {
      const has = await hasPermission(req.user.phoneNumber, permission);
      if (!has) {
        return res.status(403).json({
          success: false,
          error: "Forbidden",
          message: `شما مجوز ${permission} را ندارید`,
        });
      }
    }

    next();
  };
}







