/**
 * API Route: Reset Password
 * بازنشانی رمز عبور
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User.model";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    // API Protection
    const protection = await protectAPI(request, { publicEndpoint: true });
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    const { phoneNumber, code, password } = await request.json();

    // Validation
    if (!phoneNumber || !code || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "ValidationError",
          message: "تمام فیلدها الزامی هستند",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "ValidationError",
          message: "رمز عبور باید حداقل 6 کاراکتر باشد",
        },
        { status: 400 }
      );
    }

    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\D/g, "");

    // Verify OTP one more time using global otpStore
    if (!global.otpStore) {
      return NextResponse.json(
        {
          success: false,
          error: "OTPExpired",
          message: "کد تایید منقضی شده است",
        },
        { status: 400 }
      );
    }

    const storedOtp = global.otpStore.get(cleanPhone);

    if (!storedOtp || storedOtp.code !== code) {
      return NextResponse.json(
        {
          success: false,
          error: "InvalidOTP",
          message: "کد تایید نامعتبر است",
        },
        { status: 400 }
      );
    }

    if (Date.now() > storedOtp.expiresAt) {
      global.otpStore.delete(cleanPhone);
      return NextResponse.json(
        {
          success: false,
          error: "OTPExpired",
          message: "کد تایید منقضی شده است",
        },
        { status: 400 }
      );
    }

    // Find user
    await connectDB();
    const user = await User.findOne({ phoneNumber: cleanPhone });

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

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Delete OTP from global store
    global.otpStore.delete(cleanPhone);

    console.log("✅ Password reset successfully for:", cleanPhone);

    // Log activity
    try {
      await logActivity(cleanPhone, "password_change", {
        targetType: "User",
        targetId: user._id.toString(),
        metadata: {
          method: "forgot_password",
          ipAddress:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip"),
        },
      });
    } catch (logError) {
      console.error("Error logging password reset:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "رمز عبور با موفقیت تغییر کرد",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
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
