/**
 * لیست کامل تمام API Endpoints پروژه PlusMeet
 * تعداد: 48+ API
 */

const ALL_API_ENDPOINTS = [
  // ==================== AUTH APIs ====================
  { path: "/api/auth/send-otp", methods: ["POST"] },
  { path: "/api/auth/verify-otp", methods: ["POST"] },
  { path: "/api/auth/login", methods: ["POST"] },
  { path: "/api/auth/logout", methods: ["POST"] },
  { path: "/api/auth/refresh", methods: ["POST"] },
  { path: "/api/auth/reset-password", methods: ["POST"] },
  { path: "/api/auth/verify-otp-forgot", methods: ["POST"] },

  // ==================== USER APIs ====================
  { path: "/api/user/profile", methods: ["GET", "PUT"] },
  { path: "/api/user/upload-avatar", methods: ["POST"] },
  { path: "/api/user/change-password", methods: ["PUT"] },
  { path: "/api/user/upgrade-role", methods: ["POST"] },
  { path: "/api/user/menus", methods: ["GET"] },

  // ==================== ADMIN USERS APIs ====================
  { path: "/api/admin/users", methods: ["GET", "POST"] },
  { path: "/api/admin/users/:id", methods: ["GET", "PUT", "DELETE"] },
  { path: "/api/admin/users/:id/roles", methods: ["PUT"] },
  { path: "/api/admin/users/:id/password", methods: ["PUT"] },
  { path: "/api/admin/users/:id/permissions", methods: ["GET", "POST"] },
  { path: "/api/admin/users/:id/state", methods: ["PUT"] },

  // ==================== RBAC APIs ====================
  { path: "/api/admin/rbac/roles", methods: ["GET", "POST"] },
  { path: "/api/admin/rbac/roles/:id", methods: ["GET", "PUT", "DELETE"] },
  { path: "/api/admin/rbac/menus", methods: ["GET"] },
  { path: "/api/admin/rbac/apis", methods: ["GET"] },
  { path: "/api/admin/rbac/seed", methods: ["POST"] },
  { path: "/api/admin/permissions", methods: ["GET"] },
  { path: "/api/admin/roles", methods: ["GET"] },

  // ==================== WALLET & PAYMENT APIs ====================
  { path: "/api/wallet", methods: ["GET"] },
  { path: "/api/wallet/transactions", methods: ["GET"] },
  { path: "/api/wallet/withdraw", methods: ["POST"] },
  { path: "/api/payment/request", methods: ["POST"] },
  { path: "/api/payment/verify", methods: ["GET"] },

  // ==================== FINANCE MANAGEMENT APIs ====================
  { path: "/api/admin/finance/stats", methods: ["GET"] },
  { path: "/api/admin/finance/withdrawals", methods: ["GET"] },
  { path: "/api/admin/finance/withdrawals/:id", methods: ["PUT"] },
  { path: "/api/admin/finance/transactions", methods: ["GET"] },
  { path: "/api/admin/finance/wallets/:userId", methods: ["GET", "PUT"] },

  // ==================== CATEGORY MANAGEMENT APIs ====================
  { path: "/api/dashboard/cat_topic", methods: ["GET", "POST"] },
  { path: "/api/dashboard/cat_topic/:id", methods: ["GET", "PUT", "DELETE"] },
  { path: "/api/dashboard/cat_topic/upload-excel", methods: ["GET", "POST"] },
  { path: "/api/dashboard/cat_topic/reorder", methods: ["POST"] },
  { path: "/api/dashboard/cat_topic/migrate-codes", methods: ["POST"] },
  { path: "/api/dashboard/format_mode", methods: ["GET", "POST"] },
  { path: "/api/dashboard/format_mode/:id", methods: ["GET", "PUT", "DELETE"] },

  // ==================== SETTINGS & MISC APIs ====================
  { path: "/api/admin/settings/menus", methods: ["GET", "POST"] },
  { path: "/api/admin/settings/menus/:id", methods: ["GET", "PUT", "DELETE"] },
  { path: "/api/admin/sync-apis", methods: ["POST"] },
  { path: "/api/debug/permissions", methods: ["GET"] },
  { path: "/api/debug/user-permissions", methods: ["GET"] },
  { path: "/api/health", methods: ["GET"] },

  // ==================== FILE UPLOAD APIs ====================
  { path: "/api/uploads/*", methods: ["GET"] },
];

/**
 * لیست فقط path ها (برای استفاده آسان‌تر)
 */
const ALL_API_PATHS = ALL_API_ENDPOINTS.map((api) => api.path);

/**
 * لیست تمام API ها با تمام متدها (برای دسترسی کامل ادمین)
 */
const ADMIN_FULL_ACCESS = ALL_API_ENDPOINTS.map((api) => ({
  path: api.path,
  methods: api.methods,
}));

// Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ALL_API_ENDPOINTS,
    ALL_API_PATHS,
    ADMIN_FULL_ACCESS,
  };
}

// برای استفاده در MongoDB
const ADMIN_API_PERMISSIONS_FOR_DB = ALL_API_ENDPOINTS.map((api) => ({
  path: api.path,
  methods: api.methods,
}));

console.log("✅ تعداد کل API ها:", ALL_API_ENDPOINTS.length);
console.log(
  "✅ لیست API های admin:",
  JSON.stringify(ADMIN_FULL_ACCESS, null, 2)
);
