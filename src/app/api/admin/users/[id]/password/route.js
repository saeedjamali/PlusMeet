/**
 * API Route: User Password Management
 * مسیر API: مدیریت رمز عبور کاربر
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User.model";
import { authenticate, requireRole } from "@/lib/middleware/auth";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";
import bcrypt from "bcryptjs";

/**
 * PUT /api/admin/users/[id]/password
 * تنظیم یا تغییر رمز عبور کاربر
 */
export async function PUT(request, { params }) {
  try {
    // API Protection
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: authResult.error,
        },
        { status: 401 }
      );
    }

    const roleCheck = await requireRole(authResult.user, ["admin"]);
    if (!roleCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: roleCheck.error,
        },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;
    const { password } = await request.json();

    console.log("🔐 Setting password for user ID:", id);

    // Validation
    if (!password || password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "ValidationError",
          message: "رمز عبور باید حداقل 6 کاراکتر باشد",
        },
        { status: 400 }
      );
    }

    // Find user by _id
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "NotFound",
          message: "کاربر یافت نشد",
        },
        { status: 404 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    console.log("✅ Password updated successfully");

    // Log activity
    try {
      await logActivity(authResult.user.phoneNumber, "password_change", {
        targetType: "User",
        targetId: user._id.toString(),
        metadata: {
          changedBy: "admin",
          targetUser: user.phoneNumber,
        },
      });
    } catch (logError) {
      console.error("Error logging password change:", logError);
      // ادامه می‌دهیم حتی اگر لاگ با خطا مواجه شد
    }

    return NextResponse.json({
      success: true,
      message: "رمز عبور با موفقیت تنظیم شد",
    });
  } catch (error) {
    console.error("PUT /api/admin/users/[id]/password error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "ServerError",
        message: "خطا در تنظیم رمز عبور",
      },
      { status: 500 }
    );
  }
}



