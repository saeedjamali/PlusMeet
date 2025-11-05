/**
 * API Route: Single Role Management
 * مدیریت یک نقش خاص (دریافت، ویرایش، حذف)
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Role from "@/lib/models/Role.model";
import User from "@/lib/models/User.model";
import { authenticate } from "@/lib/middleware/auth";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET - دریافت اطلاعات یک نقش
 */
export async function GET(request, { params }) {
  try {
    // API Protection
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    // Authentication
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    // Authorization
    if (!authResult.user.roles?.includes("admin")) {
      return NextResponse.json(
        { success: false, error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    await connectDB();

    const role = await Role.findById(params.id);

    if (!role) {
      return NextResponse.json(
        { success: false, error: "نقش یافت نشد" },
        { status: 404 }
      );
    }

    // شمارش کاربران با این نقش
    const usersCount = await User.countDocuments({ roles: role.slug });
    const roleData = role.toJSON();
    roleData.usersCount = usersCount;

    // مطمئن شویم که permissions همیشه array هستند
    if (!roleData.menuPermissions) roleData.menuPermissions = [];
    if (!roleData.apiPermissions) roleData.apiPermissions = [];

    return NextResponse.json({
      success: true,
      data: roleData,
    });
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}

/**
 * PUT - ویرایش یک نقش
 */
export async function PUT(request, { params }) {
  try {
    // Authentication
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    // Authorization
    if (!authResult.user.roles?.includes("admin")) {
      return NextResponse.json(
        { success: false, error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      color,
      icon,
      priority,
      isStaff, // 👈 اضافه شد
      menuPermissions,
      apiPermissions,
      isActive,
    } = body;

    await connectDB();

    const role = await Role.findById(params.id);

    if (!role) {
      return NextResponse.json(
        { success: false, error: "نقش یافت نشد" },
        { status: 404 }
      );
    }

    // نقش‌های سیستمی فقط permissions، priority، isStaff و isActive شون قابل تغییره
    if (role.isSystem) {
      // فقط این فیلدها رو می‌شه تغییر داد
      if (menuPermissions !== undefined) {
        role.menuPermissions = menuPermissions;
      }
      if (apiPermissions !== undefined) {
        role.apiPermissions = apiPermissions;
      }
      if (priority !== undefined) {
        role.priority = priority;
      }
      if (isStaff !== undefined) {
        role.isStaff = isStaff; // 👈 اضافه شد
      }
      if (isActive !== undefined) {
        role.isActive = isActive;
      }
    } else {
      // نقش‌های custom همه چیزشون قابل تغییره (به جز slug و isSystem)
      if (name) role.name = name;
      if (description !== undefined) role.description = description;
      if (color) role.color = color;
      if (icon) role.icon = icon;
      if (priority !== undefined) role.priority = priority;
      if (isStaff !== undefined) role.isStaff = isStaff; // 👈 اضافه شد
      if (menuPermissions !== undefined) {
        role.menuPermissions = menuPermissions;
      }
      if (apiPermissions !== undefined) role.apiPermissions = apiPermissions;
      if (isActive !== undefined) role.isActive = isActive;
    }

    await role.save();

    // ثبت لاگ
    await logActivity(authResult.user.phoneNumber, "role_update", {
      targetType: "Role",
      targetId: role._id.toString(),
      metadata: {
        roleName: role.name,
        roleSlug: role.slug,
        changes: body,
      },
    });

    return NextResponse.json({
      success: true,
      message: "نقش با موفقیت ویرایش شد",
      data: { role: role.toPublicJSON() },
    });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - حذف یک نقش
 */
export async function DELETE(request, { params }) {
  try {
    // Authentication
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    // Authorization
    if (!authResult.user.roles?.includes("admin")) {
      return NextResponse.json(
        { success: false, error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    await connectDB();

    const role = await Role.findById(params.id);

    if (!role) {
      return NextResponse.json(
        { success: false, error: "نقش یافت نشد" },
        { status: 404 }
      );
    }

    // نقش‌های سیستمی قابل حذف نیستن
    if (role.isSystem) {
      return NextResponse.json(
        { success: false, error: "نقش‌های سیستمی قابل حذف نیستند" },
        { status: 400 }
      );
    }

    // بررسی اینکه آیا کاربری با این نقش وجود داره
    const usersWithRole = await User.countDocuments({ roles: role.slug });

    if (usersWithRole > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `این نقش به ${usersWithRole} کاربر اختصاص داده شده و قابل حذف نیست`,
        },
        { status: 400 }
      );
    }

    const deletedRole = role.toPublicJSON();
    await Role.deleteOne({ _id: role._id });

    // ثبت لاگ
    await logActivity(authResult.user.phoneNumber, "role_delete", {
      targetType: "Role",
      targetId: params.id,
      metadata: {
        roleName: deletedRole.name,
        roleSlug: deletedRole.slug,
      },
    });

    return NextResponse.json({
      success: true,
      message: "نقش با موفقیت حذف شد",
      data: { role: deletedRole },
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}
