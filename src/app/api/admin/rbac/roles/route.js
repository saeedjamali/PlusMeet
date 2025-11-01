/**
 * API Route: RBAC Roles Management
 * مدیریت نقش‌ها (لیست و ایجاد)
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Role from "@/lib/models/Role.model";
import User from "@/lib/models/User.model";
import { protectApi } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET - دریافت لیست تمام نقش‌ها
 */
export async function GET(request) {
  try {
    console.log("🔍 [GET ROLES] Starting...");

    // محافظت API با RBAC دینامیک
    const protection = await protectApi(request, {
      allowedRoles: ["admin", "moderator"], // fallback
      checkPermission: true, // چک از apiPermissions نقش‌ها در دیتابیس
    });

    if (!protection.success) {
      console.log("❌ [GET ROLES] Protection failed:", protection.error);
      return NextResponse.json(
        { success: false, error: protection.error },
        { status: protection.status }
      );
    }

    const user = protection.user;
    console.log("✅ [GET ROLES] User authenticated:", user.phoneNumber);

    console.log("🔍 [GET ROLES] Connecting to DB...");
    await connectDB();
    console.log("🔍 [GET ROLES] Connected!");

    // گرفتن query params
    const { searchParams } = new URL(request.url);
    const includeSystem = searchParams.get("includeSystem") !== "false"; // default: true
    const onlyActive = searchParams.get("onlyActive") === "true"; // default: false

    // Build query
    const query = {};
    if (!includeSystem) {
      query.isSystem = false;
    }
    if (onlyActive) {
      query.isActive = true;
    }

    const roles = await Role.find(query).sort({ priority: -1, createdAt: -1 });

    // شمارش تعداد کاربران هر نقش
    const rolesWithUserCount = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.countDocuments({ roles: role.slug });
        return {
          ...role.toPublicJSON(),
          userCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        roles: rolesWithUserCount,
        total: roles.length,
      },
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}

/**
 * POST - ایجاد نقش جدید
 */
export async function POST(request) {
  try {
    // محافظت API با RBAC دینامیک
    const protection = await protectApi(request, {
      allowedRoles: ["admin"], // فقط admin
      checkPermission: true, // چک از apiPermissions نقش‌ها در دیتابیس
    });

    if (!protection.success) {
      return NextResponse.json(
        { success: false, error: protection.error },
        { status: protection.status }
      );
    }

    const user = protection.user;

    const body = await request.json();
    const {
      name,
      slug,
      description,
      color,
      icon,
      priority,
      menuPermissions,
      apiPermissions,
    } = body;

    // Validation
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "نام و شناسه نقش الزامی است" },
        { status: 400 }
      );
    }

    await connectDB();

    // بررسی تکراری بودن slug
    const existingRole = await Role.findOne({ slug: slug.toLowerCase() });
    if (existingRole) {
      return NextResponse.json(
        { success: false, error: "شناسه نقش تکراری است" },
        { status: 400 }
      );
    }

    // ایجاد نقش جدید
    const role = new Role({
      name,
      slug: slug.toLowerCase(),
      description,
      color: color || "#6B7280",
      icon: icon || "👤",
      priority: priority || 0,
      isSystem: false, // نقش‌های custom همیشه false
      menuPermissions: menuPermissions || [],
      apiPermissions: apiPermissions || [],
      createdBy: user._id,
    });

    await role.save();

    // ثبت لاگ
    await logActivity(user.phoneNumber, "role_create", {
      targetType: "Role",
      targetId: role._id.toString(),
      metadata: {
        roleName: role.name,
        roleSlug: role.slug,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "نقش با موفقیت ایجاد شد",
        data: { role: role.toPublicJSON() },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}
