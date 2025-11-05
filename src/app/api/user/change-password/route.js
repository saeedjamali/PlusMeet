/**
 * API Route: Change Password
 * تغییر رمز عبور توسط کاربر
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User.model";
import { authenticate } from "@/lib/middleware/auth";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";
import bcrypt from "bcryptjs";

/**
 * PUT /api/user/change-password
 * تغییر رمز عبور
 */
export async function PUT(request) {
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
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "ValidationError",
          message: "رمز فعلی و رمز جدید الزامی است",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "ValidationError",
          message: "رمز عبور جدید باید حداقل 6 کاراکتر باشد",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({
      phoneNumber: authResult.user.phoneNumber,
    });

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

    // اگر کاربر رمز نداره (فقط با OTP لاگین کرده)
    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          error: "NoPassword",
          message: "شما هنوز رمز عبوری تنظیم نکرده‌اید. رمز جدید را وارد کنید.",
          requireCurrentPassword: false,
        },
        { status: 400 }
      );
    }

    // بررسی رمز فعلی
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          error: "InvalidPassword",
          message: "رمز عبور فعلی اشتباه است",
        },
        { status: 400 }
      );
    }

    // Hash رمز جدید
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // به‌روزرسانی رمز
    user.password = hashedPassword;
    await user.save();

    console.log("✅ Password changed successfully for:", user.phoneNumber);

    // Log activity
    try {
      await logActivity(user.phoneNumber, "password_change", {
        targetType: "User",
        targetId: user._id.toString(),
        metadata: {
          method: "user_change_password",
          ipAddress:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip"),
        },
      });
    } catch (logError) {
      console.error("Error logging password change:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "رمز عبور با موفقیت تغییر کرد",
    });
  } catch (error) {
    console.error("PUT /api/user/change-password error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "ServerError",
        message: "خطای سرور",
      },
      { status: 500 }
    );
  }
}



