/**
 * Seed RBAC Data
 * ایجاد داده‌های اولیه برای سیستم RBAC پویا
 */

import mongoose from "mongoose";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, "../.env") });

// Import models
import Role from "../src/lib/models/Role.model.js";
import Menu from "../src/lib/models/Menu.model.js";
import ApiEndpoint from "../src/lib/models/ApiEndpoint.model.js";

// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/plusmeet";

async function seedRBAC() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // ==================== Seed Menus ====================
    console.log("\n📋 Seeding Menus...");

    const menus = [
      // Level 1: Dashboard
      {
        menuId: "dashboard",
        title: "داشبورد",
        titleEn: "Dashboard",
        path: "/admin",
        icon: "📊",
        order: 1,
      },

      // Level 1: Users
      {
        menuId: "users",
        title: "کاربران",
        titleEn: "Users",
        path: null,
        icon: "👥",
        order: 2,
      },
      {
        menuId: "users.list",
        title: "لیست کاربران",
        titleEn: "User List",
        path: "/admin/users",
        parentId: "users",
        order: 1,
      },
      {
        menuId: "users.create",
        title: "ایجاد کاربر",
        titleEn: "Create User",
        path: "/admin/users/create",
        parentId: "users",
        order: 2,
      },

      // Level 1: Events
      {
        menuId: "events",
        title: "رویدادها",
        titleEn: "Events",
        path: null,
        icon: "📅",
        order: 3,
      },
      {
        menuId: "events.list",
        title: "لیست رویدادها",
        titleEn: "Event List",
        path: "/admin/events",
        parentId: "events",
        order: 1,
      },
      {
        menuId: "events.create",
        title: "ایجاد رویداد",
        titleEn: "Create Event",
        path: "/admin/events/create",
        parentId: "events",
        order: 2,
      },

      // Level 1: RBAC Management
      {
        menuId: "rbac",
        title: "مدیریت دسترسی",
        titleEn: "Access Control",
        path: null,
        icon: "🔐",
        order: 4,
        defaultRoles: ["admin"],
      },
      {
        menuId: "rbac.roles",
        title: "نقش‌ها",
        titleEn: "Roles",
        path: "/admin/rbac/roles",
        parentId: "rbac",
        order: 1,
      },

      // Level 1: System Settings (تنظیمات سیستم)
      {
        menuId: "settings.system",
        title: "تنظیمات سیستم",
        titleEn: "System Settings",
        path: null,
        icon: "⚙️",
        order: 10,
        defaultRoles: ["admin"],
      },
      {
        menuId: "settings.menus",
        title: "مدیریت منوها",
        titleEn: "Menu Management",
        path: "/admin/settings/menus",
        parentId: "settings.system",
        order: 1,
      },
      {
        menuId: "settings.sync",
        title: "همگام‌سازی API",
        titleEn: "Sync APIs",
        path: "/admin/sync-apis",
        parentId: "settings.system",
        order: 2,
      },
    ];

    await Menu.deleteMany({}); // پاک کردن داده‌های قبلی
    await Menu.insertMany(menus);
    console.log(`✅ Inserted ${menus.length} menus`);

    // ==================== Seed API Endpoints ====================
    console.log("\n🔌 Seeding API Endpoints...");

    const apiEndpoints = [
      // Auth
      {
        path: "/api/auth/send-otp",
        availableMethods: ["POST"],
        module: "auth",
        category: "public",
        title: "ارسال کد یکبار مصرف",
        description: "ارسال OTP به شماره موبایل",
        isPublic: true,
        tags: ["auth", "public"],
      },
      {
        path: "/api/auth/verify-otp",
        availableMethods: ["POST"],
        module: "auth",
        title: "تایید OTP",
        isPublic: true,
        tags: ["auth", "public"],
      },
      {
        path: "/api/auth/login",
        availableMethods: ["POST"],
        module: "auth",
        title: "ورود با رمز عبور",
        isPublic: true,
        tags: ["auth", "public"],
      },
      {
        path: "/api/auth/logout",
        availableMethods: ["POST"],
        module: "auth",
        title: "خروج",
        tags: ["auth"],
      },
      {
        path: "/api/auth/refresh",
        availableMethods: ["POST"],
        module: "auth",
        title: "تمدید توکن",
        tags: ["auth"],
      },

      // Users
      {
        path: "/api/user/profile",
        availableMethods: ["GET", "PUT"],
        module: "user",
        title: "پروفایل کاربر",
        description: "دریافت و ویرایش پروفایل",
        queryParams: [],
        defaultRoles: ["user", "event_owner", "moderator", "admin"],
        tags: ["user", "profile"],
      },
      {
        path: "/api/admin/users",
        availableMethods: ["GET", "POST"],
        module: "admin",
        category: "user-management",
        title: "مدیریت کاربران",
        description: "لیست کاربران و ایجاد کاربر جدید",
        queryParams: ["page", "limit", "search", "role", "state"],
        defaultRoles: ["admin", "moderator"],
        tags: ["admin", "users", "crud"],
      },
      {
        path: "/api/admin/users/:id",
        availableMethods: ["GET", "PUT", "DELETE"],
        module: "admin",
        category: "user-management",
        title: "عملیات تک کاربر",
        description: "دریافت، ویرایش و حذف کاربر",
        defaultRoles: ["admin", "moderator"],
        tags: ["admin", "users", "crud"],
      },
      {
        path: "/api/admin/rbac/roles",
        availableMethods: ["GET", "POST"],
        module: "admin",
        category: "rbac",
        title: "مدیریت نقش‌ها",
        description: "لیست نقش‌ها و ایجاد نقش جدید",
        queryParams: ["includeSystem", "onlyActive"],
        defaultRoles: ["admin", "moderator"],
        tags: ["admin", "rbac", "roles"],
      },
      {
        path: "/api/admin/users/:id",
        availableMethods: ["GET", "PUT", "DELETE"],
        module: "admin",
        title: "عملیات روی کاربر خاص",
        pathParams: ["id"],
        defaultRoles: ["admin"],
        tags: ["admin", "users", "crud"],
      },
      {
        path: "/api/admin/users/:id/roles",
        availableMethods: ["PUT"],
        module: "admin",
        title: "تغییر نقش کاربر",
        pathParams: ["id"],
        defaultRoles: ["admin", "moderator"],
        tags: ["admin", "users", "rbac"],
      },

      // RBAC Management
      {
        path: "/api/admin/rbac/roles",
        availableMethods: ["GET", "POST"],
        module: "admin-rbac",
        title: "مدیریت نقش‌ها",
        defaultRoles: ["admin"],
        tags: ["admin", "rbac"],
      },
      {
        path: "/api/admin/rbac/roles/:id",
        availableMethods: ["GET", "PUT", "DELETE"],
        module: "admin-rbac",
        title: "ویرایش نقش",
        pathParams: ["id"],
        defaultRoles: ["admin"],
        tags: ["admin", "rbac"],
      },
      {
        path: "/api/admin/rbac/menus",
        availableMethods: ["GET", "POST", "PUT"],
        module: "admin-rbac",
        title: "مدیریت منوها",
        defaultRoles: ["admin"],
        tags: ["admin", "rbac", "menus"],
      },
      {
        path: "/api/admin/rbac/apis",
        availableMethods: ["GET", "POST", "PUT"],
        module: "admin-rbac",
        title: "مدیریت API Endpoints",
        defaultRoles: ["admin"],
        tags: ["admin", "rbac", "apis"],
      },
      // Settings - Menu Management
      {
        path: "/api/admin/settings/menus",
        availableMethods: ["GET", "POST", "PUT", "DELETE"],
        module: "admin-settings",
        category: "settings",
        title: "مدیریت منوها",
        description: "CRUD عملیات روی منوها",
        defaultRoles: ["admin"],
        tags: ["admin", "settings", "menus"],
      },
      {
        path: "/api/admin/settings/menus/:id",
        availableMethods: ["GET", "PUT", "DELETE"],
        module: "admin-settings",
        category: "settings",
        title: "عملیات روی منوی خاص",
        pathParams: ["id"],
        defaultRoles: ["admin"],
        tags: ["admin", "settings", "menus"],
      },
      {
        path: "/api/admin/sync-apis",
        availableMethods: ["POST"],
        module: "admin-rbac",
        title: "همگام‌سازی خودکار API ها",
        description: "اسکن و همگام‌سازی تمام API route های پروژه",
        defaultRoles: ["admin"],
        tags: ["admin", "rbac", "sync"],
      },
    ];

    await ApiEndpoint.deleteMany({}); // پاک کردن داده‌های قبلی
    await ApiEndpoint.insertMany(apiEndpoints);
    console.log(`✅ Inserted ${apiEndpoints.length} API endpoints`);

    // ==================== Seed Roles ====================
    console.log("\n👔 Seeding Roles...");

    const roles = [
      // Admin (System Role)
      {
        name: "مدیر سیستم",
        slug: "admin",
        description: "دسترسی کامل به تمام بخش‌ها",
        isSystem: true,
        isStaff: true, // 👈 نقش Staff
        color: "#EF4444", // red
        icon: "👑",
        priority: 100,
        menuPermissions: [
          { menuId: "dashboard", access: "full" },
          { menuId: "users", access: "full" },
          { menuId: "users.list", access: "full" },
          { menuId: "users.create", access: "full" },
          { menuId: "events", access: "full" },
          { menuId: "events.list", access: "full" },
          { menuId: "events.create", access: "full" },
          { menuId: "rbac", access: "full" },
          { menuId: "rbac.roles", access: "full" },
          { menuId: "settings.system", access: "full" },
          { menuId: "settings.menus", access: "full" },
          { menuId: "settings.sync", access: "full" },
        ],
        apiPermissions: [
          // Admin به همه چیز دسترسی داره (checked in middleware)
        ],
      },

      // Event Owner (System Role)
      {
        name: "مالک رویداد",
        slug: "event_owner",
        description: "ایجاد و مدیریت رویدادها",
        isSystem: true,
        color: "#F59E0B", // amber
        icon: "📅",
        priority: 50,
        menuPermissions: [
          { menuId: "dashboard", access: "view" },
          { menuId: "events", access: "full" },
          { menuId: "events.list", access: "full" },
          { menuId: "events.create", access: "full" },
        ],
        apiPermissions: [
          { path: "/api/user/profile", methods: ["GET", "PUT"] },
          { path: "/api/events", methods: ["GET", "POST"] },
          { path: "/api/events/:id", methods: ["GET", "PUT", "DELETE"] },
        ],
      },

      // Moderator (System Role)
      {
        name: "مدیر محتوا",
        slug: "moderator",
        description: "مدیریت محتوا و نظارت بر رویدادها",
        isSystem: true,
        isStaff: true, // 👈 نقش Staff
        color: "#8B5CF6", // purple
        icon: "🛡️",
        priority: 60,
        menuPermissions: [
          { menuId: "dashboard", access: "view" },
          { menuId: "users", access: "view" },
          { menuId: "users.list", access: "view" },
          { menuId: "events", access: "full" },
          { menuId: "events.list", access: "full" },
          { menuId: "events.create", access: "full" },
        ],
        apiPermissions: [
          { path: "/api/user/profile", methods: ["GET", "PUT"] },
          { path: "/api/admin/users", methods: ["GET"] },
          { path: "/api/admin/users/:id", methods: ["GET", "PUT"] },
          { path: "/api/admin/users/:id/roles", methods: ["PUT"] },
          { path: "/api/admin/rbac/roles", methods: ["GET"] },
          { path: "/api/events", methods: ["GET", "POST"] },
          { path: "/api/events/:id", methods: ["GET", "PUT", "DELETE"] },
        ],
      },

      // Support (System Role)
      {
        name: "پشتیبانی",
        slug: "support",
        description: "مدیریت تیکت‌ها و پشتیبانی کاربران",
        isSystem: true,
        isStaff: true, // 👈 نقش Staff
        color: "#10B981", // green
        icon: "🎧",
        priority: 55,
        menuPermissions: [
          { menuId: "dashboard", access: "view" },
          { menuId: "support", access: "full" },
          { menuId: "support.ticketList", access: "full" },
          { menuId: "support.ticketSetting", access: "full" },
        ],
        apiPermissions: [
          { path: "/api/user/profile", methods: ["GET", "PUT"] },
          { path: "/api/tickets", methods: ["GET", "POST"] },
          { path: "/api/tickets/:id", methods: ["GET", "PUT"] },
          { path: "/api/tickets/:id/reply", methods: ["POST"] },
          { path: "/api/tickets/:id/replies", methods: ["GET"] },
          { path: "/api/tickets/:id/reassign", methods: ["POST"] },
          { path: "/api/tickets/:id/view", methods: ["POST"] },
          { path: "/api/tickets/categories", methods: ["GET", "POST"] },
          { path: "/api/tickets/categories/:id", methods: ["GET", "PUT", "DELETE"] },
        ],
      },

      // Finance Manager (System Role)
      {
        name: "مدیر مالی",
        slug: "finance_manager",
        description: "مدیریت امور مالی، تراکنش‌ها و کیف پول‌ها",
        isSystem: true,
        isStaff: true, // 👈 نقش Staff
        color: "#F59E0B", // orange
        icon: "💰",
        priority: 70,
        menuPermissions: [
          { menuId: "dashboard", access: "view" },
          { menuId: "finance", access: "full" },
          { menuId: "support", access: "view" },
          { menuId: "support.ticketList", access: "view" },
        ],
        apiPermissions: [
          { path: "/api/user/profile", methods: ["GET", "PUT"] },
          { path: "/api/wallet", methods: ["GET"] },
          { path: "/api/wallet/deposit", methods: ["POST"] },
          { path: "/api/wallet/withdraw", methods: ["POST"] },
          { path: "/api/wallet/transactions", methods: ["GET"] },
          { path: "/api/tickets", methods: ["GET", "POST"] },
          { path: "/api/tickets/:id", methods: ["GET"] },
          { path: "/api/tickets/:id/reply", methods: ["POST"] },
          { path: "/api/tickets/:id/replies", methods: ["GET"] },
        ],
      },

      // User (System Role)
      {
        name: "کاربر عادی",
        slug: "user",
        description: "دسترسی‌های پایه",
        isSystem: true,
        color: "#3B82F6", // blue
        icon: "👤",
        priority: 10,
        menuPermissions: [
          { menuId: "dashboard", access: "view" },
          { menuId: "events", access: "view" },
          { menuId: "events.list", access: "view" },
        ],
        apiPermissions: [
          { path: "/api/user/profile", methods: ["GET", "PUT"] },
          { path: "/api/events", methods: ["GET"] },
          { path: "/api/events/:id", methods: ["GET"] },
          // دسترسی‌های مورد نیاز برای استفاده از پنل (فقط مشاهده)
          { path: "/api/admin/users", methods: ["GET"] },
          { path: "/api/admin/rbac/roles", methods: ["GET"] },
        ],
      },

      // Guest (System Role)
      {
        name: "میهمان",
        slug: "guest",
        description: "دسترسی محدود برای کاربران مهمان",
        isSystem: true,
        color: "#9CA3AF", // gray
        icon: "👁️",
        priority: 1,
        menuPermissions: [
          { menuId: "events", access: "view" },
          { menuId: "events.list", access: "view" },
        ],
        apiPermissions: [
          { path: "/api/events", methods: ["GET"] },
          { path: "/api/events/:id", methods: ["GET"] },
        ],
      },
    ];

    await Role.deleteMany({}); // پاک کردن داده‌های قبلی
    await Role.insertMany(roles);
    console.log(`✅ Inserted ${roles.length} roles`);

    console.log("\n✅ RBAC Seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Menus: ${menus.length}`);
    console.log(`   - API Endpoints: ${apiEndpoints.length}`);
    console.log(`   - Roles: ${roles.length}`);
    console.log(
      "\n🚀 Admin can now manage roles and permissions in /admin/rbac"
    );

    await mongoose.connection.close();
    console.log("\n🔌 MongoDB connection closed");
  } catch (error) {
    console.error("❌ Error seeding RBAC:", error);
    process.exit(1);
  }
}

// Run
seedRBAC();
