/**
 * API Route: User Roles Management
 * مسیر API: مدیریت نقش‌های کاربر
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User.model";
import Role from "@/lib/models/Role.model";
import { protectApi } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * PUT /api/admin/users/[id]/roles
 * تخصیص یا تغییر نقش‌های کاربر
 */
export async function PUT(request, { params }) {
  try {
    console.log("🎭 [UPDATE ROLES] Starting...");
    console.log("🎭 [UPDATE ROLES] Target user ID:", params.id);

    // محافظت API با RBAC دینامیک
    const protection = await protectApi(request, {
      allowedRoles: ["admin", "moderator"],
      checkPermission: true, // چک از apiPermissions نقش‌ها در دیتابیس
    });

    console.log("🎭 [UPDATE ROLES] Protection result:", {
      success: protection.success,
      status: protection.status,
      error: protection.error,
      userRoles: protection.user?.roles,
    });

    if (!protection.success) {
      console.log("❌ [UPDATE ROLES] Access denied!");
      return NextResponse.json(
        {
          success: false,
          error: protection.error,
          code: "ACCESS_DENIED",
          message:
            protection.status === 401
              ? "لطفاً ابتدا وارد شوید"
              : "شما مجوز تغییر نقش کاربران را ندارید",
        },
        { status: protection.status }
      );
    }

    const currentUser = protection.user;
    console.log(
      "✅ [UPDATE ROLES] User authenticated:",
      currentUser.phoneNumber
    );

    await connectDB();

    const { id } = params;
    const { roles } = await request.json();

    console.log("🎭 Updating roles for user ID:", id);
    console.log("📋 New roles:", roles);

    // Validate roles array
    if (!Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "ValidationError",
          code: "INVALID_ROLES",
          message: "حداقل یک نقش باید انتخاب شود",
        },
        { status: 400 }
      );
    }

    // Validate roles against RBAC database
    const dbRoles = await Role.find({ isActive: true }).select("slug").lean();
    let validRoles = dbRoles.map((r) => r.slug);

    // اگر هیچ نقشی در دیتابیس نبود، از نقش‌های پیش‌فرض استفاده کن
    if (validRoles.length === 0) {
      console.log("⚠️ No roles in database, using default roles");
      validRoles = ["guest", "user", "event_owner", "moderator", "admin"];
    }

    console.log("✅ Valid roles:", validRoles);

    const invalidRoles = roles.filter((role) => !validRoles.includes(role));

    if (invalidRoles.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "ValidationError",
          code: "INVALID_ROLES",
          message: `نقش‌های نامعتبر: ${invalidRoles.join(", ")}`,
          invalidRoles: invalidRoles,
          validRoles: validRoles,
        },
        { status: 400 }
      );
    }

    // اطمینان از وجود نقش پایه 'user' برای همه کاربران
    if (!roles.includes("user")) {
      roles.unshift("user"); // اضافه کردن 'user' به ابتدای آرایه
      console.log("✅ نقش 'user' به صورت خودکار اضافه شد");
    }

    // Find user by _id
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "NotFound",
          code: "USER_NOT_FOUND",
          message: "کاربر یافت نشد",
        },
        { status: 404 }
      );
    }

    // Prevent removing admin role from self
    if (
      currentUser.phoneNumber === user.phoneNumber &&
      !roles.includes("admin")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          code: "SELF_ADMIN_REMOVAL",
          message: "نمی‌توانید نقش مدیریت را از خودتان حذف کنید",
        },
        { status: 400 }
      );
    }

    // Store old roles for logging
    const oldRoles = [...user.roles];

    // Update roles
    user.roles = roles;
    await user.save();

    console.log("✅ Roles updated successfully");

    // Log activity
    try {
      await logActivity(currentUser.phoneNumber, "users.roles.update", {
        targetType: "User",
        targetId: user._id.toString(),
        metadata: {
          oldRoles,
          newRoles: roles,
          addedRoles: roles.filter((r) => !oldRoles.includes(r)),
          removedRoles: oldRoles.filter((r) => !roles.includes(r)),
        },
      });
    } catch (logError) {
      console.error("Error logging role update:", logError);
      // ادامه می‌دهیم حتی اگر لاگ با خطا مواجه شد
    }

    return NextResponse.json({
      success: true,
      message: "نقش‌های کاربر با موفقیت به‌روزرسانی شد",
      data: {
        user: user.toPublicJSON(),
      },
    });
  } catch (error) {
    console.error("PUT /api/admin/users/[id]/roles error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی نقش‌ها" },
      { status: 500 }
    );
  }
}
