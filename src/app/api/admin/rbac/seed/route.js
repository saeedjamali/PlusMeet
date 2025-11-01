/**
 * API Route: Seed RBAC Data
 * ایجاد داده‌های اولیه RBAC (فقط برای admin)
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Role from "@/lib/models/Role.model";
import Menu from "@/lib/models/Menu.model";
import ApiEndpoint from "@/lib/models/ApiEndpoint.model";
import { authenticate } from "@/lib/middleware/auth";

export async function POST(request) {
  try {
    console.log("🔍 [SEED] Starting seed request...");
    console.log("🔍 [SEED] Headers:", Object.fromEntries(request.headers));

    // Authentication
    const authResult = await authenticate(request, { requireCSRF: false });
    console.log("🔍 [SEED] Auth result:", authResult);

    if (!authResult.success) {
      console.error("❌ [SEED] Auth failed:", authResult.error);
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    console.log(
      "✅ [SEED] Auth successful, user:",
      authResult.user.phoneNumber
    );

    // Authorization - فقط admin
    if (!authResult.user.roles?.includes("admin")) {
      console.error("❌ [SEED] Not admin, roles:", authResult.user.roles);
      return NextResponse.json(
        { success: false, error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    console.log("✅ [SEED] User is admin, proceeding...");

    await connectDB();

    const results = {
      menus: 0,
      apiEndpoints: 0,
      roles: 0,
    };

    // ==================== Seed Menus ====================
    const menus = [
      {
        menuId: "dashboard",
        title: "داشبورد",
        titleEn: "Dashboard",
        path: "/admin",
        icon: "📊",
        order: 1,
      },
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
      {
        menuId: "sync.apis",
        title: "همگام‌سازی API",
        titleEn: "Sync APIs",
        path: "/admin/sync-apis",
        parentId: "rbac",
        order: 4,
      },
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

    await Menu.deleteMany({});
    await Menu.insertMany(menus);
    results.menus = menus.length;

    // ==================== Seed API Endpoints ====================
    const apiEndpoints = [
      {
        path: "/api/auth/send-otp",
        availableMethods: ["POST"],
        module: "auth",
        category: "public",
        title: "ارسال کد یکبار مصرف",
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
      {
        path: "/api/user/profile",
        availableMethods: ["GET", "PUT"],
        module: "user",
        title: "پروفایل کاربر",
        defaultRoles: ["user", "event_owner", "moderator", "admin"],
        tags: ["user", "profile"],
      },
      {
        path: "/api/admin/users",
        availableMethods: ["GET", "POST"],
        module: "admin",
        category: "user-management",
        title: "مدیریت کاربران",
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
        availableMethods: ["GET", "POST"],
        module: "admin-rbac",
        title: "مدیریت منوها",
        defaultRoles: ["admin"],
        tags: ["admin", "rbac", "menus"],
      },
      {
        path: "/api/admin/rbac/apis",
        availableMethods: ["GET", "POST"],
        module: "admin-rbac",
        title: "مدیریت API Endpoints",
        defaultRoles: ["admin"],
        tags: ["admin", "rbac", "apis"],
      },
      {
        path: "/api/admin/sync-apis",
        availableMethods: ["POST"],
        module: "admin-rbac",
        title: "همگام‌سازی خودکار API ها",
        defaultRoles: ["admin"],
        tags: ["admin", "rbac", "sync"],
      },
    ];

    await ApiEndpoint.deleteMany({});
    await ApiEndpoint.insertMany(apiEndpoints);
    results.apiEndpoints = apiEndpoints.length;

    // ==================== Seed Roles ====================
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
          { menuId: "dashboard", access: "full" },
          { menuId: "users", access: "full" },
          { menuId: "users.list", access: "full" },
          { menuId: "users.create", access: "full" },
          { menuId: "events", access: "full" },
          { menuId: "events.list", access: "full" },
          { menuId: "events.create", access: "full" },
          { menuId: "rbac", access: "full" },
          { menuId: "rbac.roles", access: "full" },
          { menuId: "rbac.menus", access: "full" },
          { menuId: "rbac.apis", access: "full" },
          { menuId: "sync.apis", access: "full" },
          { menuId: "settings", access: "full" },
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

    await Role.deleteMany({});
    await Role.insertMany(roles);
    results.roles = roles.length;

    return NextResponse.json({
      success: true,
      message: "داده‌های اولیه با موفقیت ایجاد شد",
      data: results,
    });
  } catch (error) {
    console.error("Error seeding RBAC:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور: " + error.message },
      { status: 500 }
    );
  }
}
