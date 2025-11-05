/**
 * Permissions Configuration
 * تعریف دسترسی‌ها و نقش‌ها
 */

// ==================== Roles ====================
export const ROLES = {
  GUEST: "guest",
  USER: "user",
  EVENT_OWNER: "event_owner",
  MODERATOR: "moderator",
  ADMIN: "admin",
};

// ==================== Permissions ====================
export const PERMISSIONS = {
  // ---------- Profile ----------
  "profile.view": [ROLES.USER, ROLES.EVENT_OWNER, ROLES.MODERATOR, ROLES.ADMIN],
  "profile.edit": [ROLES.USER, ROLES.EVENT_OWNER, ROLES.MODERATOR, ROLES.ADMIN],
  "profile.avatar.upload": [
    ROLES.USER,
    ROLES.EVENT_OWNER,
    ROLES.MODERATOR,
    ROLES.ADMIN,
  ],
  "profile.password.change": [
    ROLES.USER,
    ROLES.EVENT_OWNER,
    ROLES.MODERATOR,
    ROLES.ADMIN,
  ],
  "profile.role.upgrade": [ROLES.USER], // فقط user می‌تونه به event_owner ارتقا پیدا کنه

  // ---------- Users Management ----------
  "users.view": [ROLES.ADMIN],
  "users.list": [ROLES.ADMIN],
  "users.detail": [ROLES.ADMIN],
  "users.edit": [ROLES.ADMIN],
  "users.delete": [ROLES.ADMIN],
  "users.roles.update": [ROLES.ADMIN],
  "users.permissions.grant": [ROLES.ADMIN],
  "users.permissions.revoke": [ROLES.ADMIN],
  "users.password.reset": [ROLES.ADMIN],

  // ---------- Events ----------
  "events.view": [
    ROLES.GUEST,
    ROLES.USER,
    ROLES.EVENT_OWNER,
    ROLES.MODERATOR,
    ROLES.ADMIN,
  ],
  "events.create": [ROLES.EVENT_OWNER, ROLES.ADMIN],
  "events.edit.own": [ROLES.EVENT_OWNER, ROLES.ADMIN],
  "events.edit.any": [ROLES.ADMIN],
  "events.delete.own": [ROLES.EVENT_OWNER, ROLES.ADMIN],
  "events.delete.any": [ROLES.ADMIN],

  // ---------- Reports & Moderation ----------
  "reports.view": [ROLES.MODERATOR, ROLES.ADMIN],
  "reports.resolve": [ROLES.MODERATOR, ROLES.ADMIN],
  "content.moderate": [ROLES.MODERATOR, ROLES.ADMIN],
  "content.delete": [ROLES.MODERATOR, ROLES.ADMIN],

  // ---------- Admin Panel ----------
  "admin.access": [ROLES.ADMIN],
  "admin.dashboard": [ROLES.ADMIN],
  "admin.settings": [ROLES.ADMIN],
};

// ==================== Route Permissions ====================
export const ROUTE_PERMISSIONS = {
  // Public routes (no authentication required)
  "/": null, // همه می‌تونن ببینن
  "/login": null,
  "/forgot-password": null,

  // User routes (authentication required)
  "/profile": [ROLES.USER, ROLES.EVENT_OWNER, ROLES.MODERATOR, ROLES.ADMIN],

  // Admin routes
  "/admin": [ROLES.ADMIN],
  "/admin/users": [ROLES.ADMIN],
  "/admin/events": [ROLES.ADMIN],
  "/admin/reports": [ROLES.ADMIN],
  "/admin/settings": [ROLES.ADMIN],

  // Event Owner routes
  "/events/create": [ROLES.EVENT_OWNER, ROLES.ADMIN],
  "/events/manage": [ROLES.EVENT_OWNER, ROLES.ADMIN],

  // Moderator routes
  "/moderate": [ROLES.MODERATOR, ROLES.ADMIN],
};

// ==================== Helper Functions ====================

/**
 * بررسی اینکه آیا کاربر دسترسی به یک permission خاص داره یا نه
 * @param {string[]} userRoles - نقش‌های کاربر
 * @param {string} permission - permission مورد نظر
 * @returns {boolean}
 */
export function hasPermission(userRoles, permission) {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  const allowedRoles = PERMISSIONS[permission];

  if (!allowedRoles) {
    console.warn(`Permission "${permission}" is not defined`);
    return false;
  }

  // بررسی اینکه آیا حداقل یکی از نقش‌های کاربر در لیست مجاز هست یا نه
  return userRoles.some((role) => allowedRoles.includes(role));
}

/**
 * بررسی دسترسی به یک route خاص
 * @param {string[]} userRoles - نقش‌های کاربر
 * @param {string} route - مسیر مورد نظر
 * @returns {boolean}
 */
export function hasRouteAccess(userRoles, route) {
  const allowedRoles = ROUTE_PERMISSIONS[route];

  // اگر route عمومی باشه (null)
  if (allowedRoles === null) {
    return true;
  }

  // اگر route تعریف نشده باشه (محافظه‌کارانه: false برمی‌گردونه)
  if (!allowedRoles) {
    console.warn(`Route "${route}" is not defined in ROUTE_PERMISSIONS`);
    return false;
  }

  // بررسی نقش‌ها
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  return userRoles.some((role) => allowedRoles.includes(role));
}

/**
 * بررسی اینکه آیا کاربر Admin هست یا نه
 * @param {string[]} userRoles - نقش‌های کاربر
 * @returns {boolean}
 */
export function isAdmin(userRoles) {
  return userRoles?.includes(ROLES.ADMIN) || false;
}

/**
 * بررسی اینکه آیا کاربر Event Owner هست یا نه
 * @param {string[]} userRoles - نقش‌های کاربر
 * @returns {boolean}
 */
export function isEventOwner(userRoles) {
  return userRoles?.includes(ROLES.EVENT_OWNER) || false;
}

/**
 * بررسی اینکه آیا کاربر Moderator هست یا نه
 * @param {string[]} userRoles - نقش‌های کاربر
 * @returns {boolean}
 */
export function isModerator(userRoles) {
  return userRoles?.includes(ROLES.MODERATOR) || false;
}

/**
 * گرفتن تمام permissions یک کاربر بر اساس نقش‌هاش
 * @param {string[]} userRoles - نقش‌های کاربر
 * @returns {string[]} - لیست permissions
 */
export function getUserPermissions(userRoles) {
  if (!userRoles || userRoles.length === 0) {
    return [];
  }

  const permissions = [];

  Object.entries(PERMISSIONS).forEach(([permission, allowedRoles]) => {
    if (userRoles.some((role) => allowedRoles.includes(role))) {
      permissions.push(permission);
    }
  });

  return permissions;
}

/**
 * مثال استفاده:
 *
 * import { hasPermission, hasRouteAccess, ROLES } from '@/lib/config/permissions.config';
 *
 * // Check permission
 * if (hasPermission(user.roles, 'users.edit')) {
 *   // نمایش دکمه ویرایش
 * }
 *
 * // Check route access
 * if (!hasRouteAccess(user.roles, '/admin')) {
 *   router.push('/');
 * }
 *
 * // Conditional rendering
 * {hasPermission(user.roles, 'events.create') && (
 *   <button>ایجاد رویداد</button>
 * )}
 */


