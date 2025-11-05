/**
 * Seed RBAC Data
 * ایجاد داده‌های اولیه برای سیستم RBAC پویا
 */

const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/plusmeet";

async function seedRBAC() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Import models (dynamic import for ES modules)
    const { default: Role } = await import("../src/lib/models/Role.model.js");
    const { default: Menu } = await import("../src/lib/models/Menu.model.js");
    const { default: ApiEndpoint } = await import(
      "../src/lib/models/ApiEndpoint.model.js"
    );

    // ==================== Seed Menus ====================
    console.log("\n📋 Seeding Menus...");

    const menus = [
      // Level 1: Dashboard
      {
        menuId: "dashboard",
        title: "داشبورد",
        titleEn: "Dashboard",
        path: "/dashboard",
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

      // Level 1: Support/Ticketing
      {
        menuId: "support",
        title: "پشتیبانی",
        titleEn: "Support",
        path: null,
        icon: "🎫",
        order: 4,
        defaultRoles: [
          "admin",
          "moderator",
          "support",
          "finance_manager",
          "user",
        ],
      },
      {
        menuId: "support.ticketList",
        title: "لیست تیکت‌ها",
        titleEn: "Tickets",
        path: "/dashboard/ticketList",
        parentId: "support",
        order: 1,
        defaultRoles: [
          "admin",
          "moderator",
          "support",
          "finance_manager",
          "user",
        ],
      },
      {
        menuId: "support.ticketSetting",
        title: "تنظیمات تیکت",
        titleEn: "Ticket Settings",
        path: "/dashboard/ticketSetting",
        parentId: "support",
        order: 2,
        defaultRoles: ["admin", "moderator", "support"],
      },

      // Level 1: RBAC Management
      {
        menuId: "rbac",
        title: "مدیریت دسترسی",
        titleEn: "Access Control",
        path: null,
        icon: "🔐",
        order: 9,
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
      {
        menuId: "rbac.menus",
        title: "منوها",
        titleEn: "Menus",
        path: "/admin/rbac/menus",
        parentId: "rbac",
        order: 2,
      },
      {
        menuId: "rbac.apis",
        title: "API Endpoints",
        titleEn: "API Endpoints",
        path: "/admin/rbac/apis",
        parentId: "rbac",
        order: 3,
      },

      // Level 1: Settings
      {
        menuId: "settings",
        title: "تنظیمات",
        titleEn: "Settings",
        path: "/admin/settings",
        icon: "⚙️",
        order: 10,
        defaultRoles: ["admin"],
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
        defaultRoles: ["admin"],
        tags: ["admin", "users", "crud"],
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
        defaultRoles: ["admin"],
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

      // Ticketing System
      {
        path: "/api/tickets",
        availableMethods: ["GET", "POST"],
        module: "tickets",
        title: "لیست و ایجاد تیکت",
        defaultRoles: [
          "admin",
          "moderator",
          "support",
          "finance_manager",
          "user",
        ],
        tags: ["tickets", "support"],
      },
      {
        path: "/api/tickets/:id",
        availableMethods: ["GET", "PUT", "DELETE"],
        module: "tickets",
        title: "جزئیات تیکت",
        pathParams: ["id"],
        defaultRoles: [
          "admin",
          "moderator",
          "support",
          "finance_manager",
          "user",
        ],
        tags: ["tickets", "support"],
      },
      {
        path: "/api/tickets/:id/reply",
        availableMethods: ["POST"],
        module: "tickets",
        title: "پاسخ به تیکت",
        pathParams: ["id"],
        defaultRoles: [
          "admin",
          "moderator",
          "support",
          "finance_manager",
          "user",
        ],
        tags: ["tickets", "support"],
      },
      {
        path: "/api/tickets/:id/replies",
        availableMethods: ["GET"],
        module: "tickets",
        title: "لیست پاسخ‌های تیکت",
        pathParams: ["id"],
        defaultRoles: [
          "admin",
          "moderator",
          "support",
          "finance_manager",
          "user",
        ],
        tags: ["tickets", "support"],
      },
      {
        path: "/api/tickets/:id/assign",
        availableMethods: ["POST"],
        module: "tickets",
        title: "ارجاع تیکت به کارشناس",
        pathParams: ["id"],
        defaultRoles: ["admin", "moderator", "support", "finance_manager"],
        tags: ["tickets", "support", "admin"],
      },
      {
        path: "/api/tickets/:id/reassign",
        availableMethods: ["POST"],
        module: "tickets",
        title: "ارجاع تیکت به موضوع دیگر",
        pathParams: ["id"],
        defaultRoles: ["admin", "moderator", "support", "finance_manager"],
        tags: ["tickets", "support", "admin"],
      },
      {
        path: "/api/tickets/:id/view",
        availableMethods: ["POST"],
        module: "tickets",
        title: "ثبت زمان مشاهده تیکت",
        pathParams: ["id"],
        defaultRoles: [
          "admin",
          "moderator",
          "support",
          "finance_manager",
          "user",
        ],
        tags: ["tickets", "support"],
      },
      {
        path: "/api/tickets/categories",
        availableMethods: ["GET", "POST"],
        module: "tickets",
        title: "مدیریت موضوعات تیکت",
        defaultRoles: ["admin", "moderator", "support"],
        tags: ["tickets", "support", "admin"],
      },
      {
        path: "/api/tickets/categories/:id",
        availableMethods: ["GET", "PUT", "DELETE"],
        module: "tickets",
        title: "ویرایش موضوع تیکت",
        pathParams: ["id"],
        defaultRoles: ["admin", "moderator", "support"],
        tags: ["tickets", "support", "admin"],
      },

      // File Uploads
      {
        path: "/api/uploads/*",
        availableMethods: ["GET"],
        module: "uploads",
        title: "دسترسی به فایل‌های آپلود شده",
        description:
          "دسترسی به تصاویر و فایل‌های آپلود شده (avatars public، tickets با RBAC)",
        defaultRoles: [
          "admin",
          "moderator",
          "support",
          "finance_manager",
          "user",
        ],
        tags: ["uploads", "files"],
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
        color: "#EF4444", // red
        icon: "👑",
        priority: 100,
        menuPermissions: [
          { menuId: "dashboard", canView: true },
          { menuId: "users", canView: true },
          { menuId: "users.list", canView: true },
          { menuId: "users.create", canView: true },
          { menuId: "events", canView: true },
          { menuId: "events.list", canView: true },
          { menuId: "events.create", canView: true },
          { menuId: "support", canView: true },
          { menuId: "support.ticketList", canView: true },
          { menuId: "support.ticketSetting", canView: true },
          { menuId: "rbac", canView: true },
          { menuId: "rbac.roles", canView: true },
          { menuId: "rbac.menus", canView: true },
          { menuId: "rbac.apis", canView: true },
          { menuId: "settings", canView: true },
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
          { menuId: "dashboard", canView: true },
          { menuId: "events", canView: true },
          { menuId: "events.list", canView: true },
          { menuId: "events.create", canView: true },
        ],
        apiPermissions: [
          { endpoint: "/api/user/profile", methods: ["GET", "PUT"] },
          { endpoint: "/api/events", methods: ["GET", "POST"] },
          { endpoint: "/api/events/:id", methods: ["GET", "PUT", "DELETE"] },
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
          { menuId: "dashboard", canView: true },
          { menuId: "events", canView: true },
          { menuId: "events.list", canView: true },
          { menuId: "support", canView: true },
          { menuId: "support.ticketList", canView: true },
        ],
        apiPermissions: [
          { endpoint: "/api/user/profile", methods: ["GET", "PUT"] },
          { endpoint: "/api/events", methods: ["GET"] },
          { endpoint: "/api/events/:id", methods: ["GET"] },
          { endpoint: "/api/tickets", methods: ["GET", "POST"] },
          { endpoint: "/api/tickets/:id", methods: ["GET", "PUT"] },
          { endpoint: "/api/tickets/:id/reply", methods: ["POST"] },
          { endpoint: "/api/tickets/:id/replies", methods: ["GET"] },
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
