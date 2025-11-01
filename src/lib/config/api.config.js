/**
 * API Routes Configuration
 * مدیریت متمرکز آدرس‌های API
 */

export const API_ROUTES = {
  // ==================== Auth ====================
  auth: {
    sendOtp: "/api/auth/send-otp",
    verifyOtp: "/api/auth/verify-otp",
    verifyOtpForgot: "/api/auth/verify-otp-forgot",
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    refresh: "/api/auth/refresh",
    resetPassword: "/api/auth/reset-password",
  },

  // ==================== User ====================
  user: {
    profile: "/api/user/profile",
    uploadAvatar: "/api/user/upload-avatar",
    changePassword: "/api/user/change-password",
    upgradeRole: "/api/user/upgrade-role",
  },

  // ==================== Admin ====================
  admin: {
    users: {
      list: "/api/admin/users",
      detail: (id) => `/api/admin/users/${id}`,
      roles: (id) => `/api/admin/users/${id}/roles`,
      permissions: (id) => `/api/admin/users/${id}/permissions`,
      password: (id) => `/api/admin/users/${id}/password`,
    },
    roles: "/api/admin/roles",
    permissions: "/api/admin/permissions",
  },

  // ==================== Events (آینده) ====================
  events: {
    list: "/api/events",
    detail: (id) => `/api/events/${id}`,
    create: "/api/events",
    update: (id) => `/api/events/${id}`,
    delete: (id) => `/api/events/${id}`,
  },
};

/**
 * Helper برای build کردن URL با query params
 */
export function buildUrl(url, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * مثال استفاده:
 *
 * import { API_ROUTES, buildUrl } from '@/lib/config/api.config';
 *
 * // Simple
 * fetch(API_ROUTES.user.profile)
 *
 * // With params
 * fetch(buildUrl(API_ROUTES.admin.users.list, {
 *   page: 1,
 *   limit: 10,
 *   search: 'علی'
 * }))
 *
 * // Dynamic ID
 * fetch(API_ROUTES.admin.users.detail('user123'))
 */

