/**
 * API Route: Verify OTP for Forgot Password
 * تایید OTP برای فراموشی رمز عبور
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User.model";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";

export async function POST(request) {
  try {
    // // API Protection
    // const protection = await protectAPI(request, { publicEndpoint: true });
    // if (!protection.success) {
    //   return NextResponse.json(
    //     { error: protection.error },
    //     { status: protection.status }
    //   );
    // }

    const { phoneNumber, code } = await request.json();

    // Validation
    if (!phoneNumber || !code) {
      return NextResponse.json(
        {
          success: false,
          error: "ValidationError",
          message: "شماره موبایل و کد تایید الزامی است",
        },
        { status: 400 }
      );
    }

    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\D/g, "");

    // Check if phone number exists
    await connectDB();
    const user = await User.findOne({ phoneNumber: cleanPhone });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "NotFound",
          message: "کاربری با این شماره یافت نشد",
        },
        { status: 404 }
      );
    }

    // Check OTP validity using global otpStore
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

    if (!storedOtp) {
      return NextResponse.json(
        {
          success: false,
          error: "OTPExpired",
          message: "کد تایید منقضی شده است",
        },
        { status: 400 }
      );
    }

    if (storedOtp.code !== code) {
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

    // OTP is valid - keep it for password reset (don't delete yet)

    // ثبت لاگ
    try {
      await logActivity(cleanPhone, "otp_verify_forgot", {
        targetType: "User",
        targetId: user._id.toString(),
        metadata: {
          ipAddress:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip"),
        },
      });
    } catch (logError) {
      console.error("Error logging OTP verification:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "کد تایید معتبر است",
    });
  } catch (error) {
    console.error("Verify OTP Forgot Error:", error);
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
