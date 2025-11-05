/**
 * API Configuration
 * تنظیمات مرکزی API Routes و Permissions
 */

/**
 * تعریف تمام API Endpoints
 * با مشخص کردن مجوزهای لازم برای هر endpoint
 */
export const API_ROUTES = {
  // ==================== AUTH ====================
  AUTH: {
    SEND_OTP: {
      path: "/api/auth/send-otp",
      method: "POST",
      public: true, // عمومی (نیاز به احراز هویت ندارد)
      rateLimit: {
        window: 60, // 1 minute
        max: 3, // 3 requests
      },
    },
    VERIFY_OTP: {
      path: "/api/auth/verify-otp",
      method: "POST",
      public: true,
      rateLimit: {
        window: 60,
        max: 5,
      },
    },
    LOGIN: {
      path: "/api/auth/login",
      method: "POST",
      public: true,
      rateLimit: {
        window: 60,
        max: 5,
      },
    },
    LOGOUT: {
      path: "/api/auth/logout",
      method: "POST",
      requireAuth: true,
    },
    REFRESH: {
      path: "/api/auth/refresh",
      method: "POST",
      requireAuth: false, // فقط refreshToken لازمه
    },
    VERIFY_OTP_FORGOT: {
      path: "/api/auth/verify-otp-forgot",
      method: "POST",
      public: true,
    },
    RESET_PASSWORD: {
      path: "/api/auth/reset-password",
      method: "POST",
      public: true,
    },
  },

  // ==================== USER ====================
  USER: {
    PROFILE: {
      path: "/api/user/profile",
      method: ["GET", "PUT"],
      requireAuth: true,
      permissions: {
        GET: [], // همه کاربران لاگین شده
        PUT: [], // همه کاربران لاگین شده
      },
    },
    UPLOAD_AVATAR: {
      path: "/api/user/upload-avatar",
      method: "POST",
      requireAuth: true,
      maxFileSize: 2 * 1024 * 1024, // 2MB
    },
    CHANGE_PASSWORD: {
      path: "/api/user/change-password",
      method: "PUT",
      requireAuth: true,
    },
    UPGRADE_ROLE: {
      path: "/api/user/upgrade-role",
      method: "POST",
      requireAuth: true,
      allowedRoles: ["event_owner"], // فقط ارتقا به event_owner
    },
  },

  // ==================== ADMIN ====================
  ADMIN: {
    USERS: {
      LIST: {
        path: "/api/admin/users",
        method: "GET",
        requireAuth: true,
        requiredRoles: ["admin"],
        permissions: ["users.list"],
      },
      GET: {
        path: "/api/admin/users/:id",
        method: "GET",
        requireAuth: true,
        requiredRoles: ["admin"],
        permissions: ["users.view"],
      },
      UPDATE: {
        path: "/api/admin/users/:id",
        method: "PUT",
        requireAuth: true,
        requiredRoles: ["admin"],
        permissions: ["users.update"],
      },
      DELETE: {
        path: "/api/admin/users/:id",
        method: "DELETE",
        requireAuth: true,
        requiredRoles: ["admin"],
        permissions: ["users.delete"],
      },
    },
    ROLES: {
      LIST: {
        path: "/api/admin/roles",
        method: "GET",
        requireAuth: true,
        requiredRoles: ["admin"],
      },
      UPDATE_USER_ROLES: {
        path: "/api/admin/users/:id/roles",
        method: "PUT",
        requireAuth: true,
        requiredRoles: ["admin"],
        permissions: ["users.roles.update"],
      },
      UPDATE_USER_PASSWORD: {
        path: "/api/admin/users/:id/password",
        method: "PUT",
        requireAuth: true,
        requiredRoles: ["admin"],
        permissions: ["users.password.update"],
      },
    },
    PERMISSIONS: {
      LIST: {
        path: "/api/admin/permissions",
        method: "GET",
        requireAuth: true,
        requiredRoles: ["admin"],
      },
      GRANT: {
        path: "/api/admin/users/:id/permissions",
        method: "POST",
        requireAuth: true,
        requiredRoles: ["admin"],
        permissions: ["users.permissions.grant"],
      },
      GET: {
        path: "/api/admin/users/:id/permissions",
        method: "GET",
        requireAuth: true,
        requiredRoles: ["admin"],
        permissions: ["users.permissions.view"],
      },
    },
  },

  // ==================== EVENTS (آینده) ====================
  EVENTS: {
    LIST: {
      path: "/api/events",
      method: "GET",
      public: true, // لیست رویدادها عمومی است
    },
    CREATE: {
      path: "/api/events",
      method: "POST",
      requireAuth: true,
      requiredRoles: ["event_owner", "admin"],
      permissions: ["events.create"],
    },
    GET: {
      path: "/api/events/:id",
      method: "GET",
      public: true,
    },
    UPDATE: {
      path: "/api/events/:id",
      method: "PUT",
      requireAuth: true,
      requiredRoles: ["event_owner", "admin"],
      checkOwnership: true, // فقط مالک یا admin
    },
    DELETE: {
      path: "/api/events/:id",
      method: "DELETE",
      requireAuth: true,
      requiredRoles: ["event_owner", "admin"],
      checkOwnership: true,
    },
  },
};

/**
 * تعریف تمام صفحات و مجوزهای دسترسی
 */
export const PAGE_ROUTES = {
  // ==================== PUBLIC ====================
  PUBLIC: {
    HOME: {
      path: "/",
      public: true,
    },
    LOGIN: {
      path: "/login",
      public: true,
      redirectIfAuth: "/", // اگر لاگین باشه، redirect کن
    },
    FORGOT_PASSWORD: {
      path: "/forgot-password",
      public: true,
      redirectIfAuth: "/",
    },
  },

  // ==================== USER ====================
  USER: {
    PROFILE: {
      path: "/profile",
      requireAuth: true,
      allowedRoles: ["user", "event_owner", "moderator", "admin"],
    },
    DASHBOARD: {
      path: "/dashboard",
      requireAuth: true,
      allowedRoles: ["user", "event_owner", "moderator", "admin"],
    },
  },

  // ==================== ADMIN ====================
  ADMIN: {
    LOGIN: {
      path: "/admin/login",
      public: true,
      redirectIfAuth: "/admin",
    },
    DASHBOARD: {
      path: "/admin",
      requireAuth: true,
      requiredRoles: ["admin"],
    },
    USERS: {
      path: "/admin/users",
      requireAuth: true,
      requiredRoles: ["admin"],
    },
    EVENTS: {
      path: "/admin/events",
      requireAuth: true,
      requiredRoles: ["admin"],
    },
    REPORTS: {
      path: "/admin/reports",
      requireAuth: true,
      requiredRoles: ["admin"],
    },
    SETTINGS: {
      path: "/admin/settings",
      requireAuth: true,
      requiredRoles: ["admin"],
    },
  },
};

/**
 * تعریف سطوح دسترسی (Permission Levels)
 */
export const PERMISSION_LEVELS = {
  PUBLIC: 0, // همه
  USER: 1, // کاربران لاگین شده
  EVENT_OWNER: 2, // مالکان رویداد
  MODERATOR: 3, // ناظران
  ADMIN: 4, // مدیران
};

/**
 * نقشه نقش‌ها به سطح دسترسی
 */
export const ROLE_PERMISSIONS = {
  guest: PERMISSION_LEVELS.PUBLIC,
  user: PERMISSION_LEVELS.USER,
  event_owner: PERMISSION_LEVELS.EVENT_OWNER,
  moderator: PERMISSION_LEVELS.MODERATOR,
  admin: PERMISSION_LEVELS.ADMIN,
};

/**
 * بررسی دسترسی کاربر به یک route
 * @param {Object} route - Route config
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function checkRouteAccess(route, user) {
  // Public route
  if (route.public) {
    return true;
  }

  // Require authentication
  if (route.requireAuth && !user) {
    return false;
  }

  // Check required roles
  if (route.requiredRoles && user) {
    const hasRequiredRole = route.requiredRoles.some((role) =>
      user.roles?.includes(role)
    );
    if (!hasRequiredRole) {
      return false;
    }
  }

  // Check allowed roles
  if (route.allowedRoles && user) {
    const hasAllowedRole = route.allowedRoles.some((role) =>
      user.roles?.includes(role)
    );
    if (!hasAllowedRole) {
      return false;
    }
  }

  return true;
}

/**
 * Get highest permission level of user
 * @param {Object} user
 * @returns {number}
 */
export function getUserPermissionLevel(user) {
  if (!user || !user.roles) {
    return PERMISSION_LEVELS.PUBLIC;
  }

  let maxLevel = PERMISSION_LEVELS.PUBLIC;

  user.roles.forEach((role) => {
    const level = ROLE_PERMISSIONS[role] || PERMISSION_LEVELS.PUBLIC;
    if (level > maxLevel) {
      maxLevel = level;
    }
  });

  return maxLevel;
}

/**
 * بررسی اینکه آیا کاربر permission خاصی دارد
 * @param {Object} user
 * @param {string} permission - e.g., "users.update"
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
  if (!user) return false;

  // Admin has all permissions
  if (user.roles?.includes("admin")) {
    return true;
  }

  // Check user's custom permissions (از UserPermission model)
  if (user.customPermissions?.includes(permission)) {
    return true;
  }

  // Check role-based permissions
  // این قسمت با Role model و populated permissions کار می‌کنه
  return false;
}

/**
 * CSRF Token Configuration
 */
export const CSRF_CONFIG = {
  enabled: true,
  cookieName: "csrf-token",
  headerName: "X-CSRF-Token",
  excludePaths: [
    "/api/auth/send-otp",
    "/api/auth/verify-otp",
    "/api/auth/login",
  ],
};

/**
 * Cookie Configuration
 */
export const COOKIE_CONFIG = {
  accessToken: {
    name: "access_token",
    maxAge: 60 * 60, // 60 minutes
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
  refreshToken: {
    name: "refresh_token",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
  csrfToken: {
    name: "csrf_token",
    maxAge: 24 * 60 * 60, // 24 hours
    httpOnly: false, // JS needs to read this
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  },
};

/**
 * Rate Limiting Configuration
 */
export const RATE_LIMIT_CONFIG = {
  OTP: {
    window: 60 * 1000, // 1 minute
    max: 3,
  },
  LOGIN: {
    window: 60 * 1000, // 1 minute
    max: 5,
  },
  API: {
    window: 60 * 1000, // 1 minute
    max: 100,
  },
};


