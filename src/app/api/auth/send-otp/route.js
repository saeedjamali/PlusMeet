/**
 * API Route: Send OTP
 * ارسال کد یکبار مصرف
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User.model";
import {
  sendOTP,
  generateOTP,
  storeOTP,
  checkRateLimit,
} from "@/lib/services/sms.service";
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

    const { phoneNumber } = await request.json();

    // اعتبارسنجی
    if (!phoneNumber || !/^09\d{9}$/.test(phoneNumber)) {
      return NextResponse.json(
        {
          success: false,
          error: "InvalidPhone",
          message: "شماره موبایل نامعتبر است",
        },
        { status: 400 }
      );
    }

    // بررسی محدودیت ارسال
    const rateLimit = checkRateLimit(phoneNumber);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "RateLimitExceeded",
          message: `لطفاً ${rateLimit.remainingSeconds} ثانیه صبر کنید`,
          remainingSeconds: rateLimit.remainingSeconds,
        },
        { status: 429 }
      );
    }

    // اتصال به دیتابیس
    await connectDB();

    // بررسی وجود کاربر (اختیاری)
    let user = await User.findByPhone(phoneNumber);
    let isNewUser = false;

    if (user) {
      // اگر کاربر وجود داشت، وضعیتش رو چک کن
      if (user.state === "deleted") {
        return NextResponse.json(
          {
            success: false,
            error: "UserDeleted",
            message: "حساب کاربری حذف شده است",
          },
          { status: 403 }
        );
      }

      if (user.state === "suspended") {
        return NextResponse.json(
          {
            success: false,
            error: "UserSuspended",
            message: "حساب کاربری مسدود شده است",
            data: {
              reason: user.suspensionReason,
              suspendedAt: user.suspendedAt,
            },
          },
          { status: 403 }
        );
      }
    } else {
      // کاربر جدید است - بعد از تایید OTP ثبت‌نام می‌شود
      isNewUser = true;
    }

    // تولید کد OTP
    const code = generateOTP();
    console.log("code----->", code);

    // ذخیره OTP
    await storeOTP(phoneNumber, code, 2); // 2 دقیقه اعتبار

    // ارسال SMS
    try {
      await sendOTP(phoneNumber, code);
    } catch (smsError) {
      console.error("SMS Error:", smsError);
      // در محیط development، کد را لاگ کنیم
      if (process.env.NODE_ENV === "development") {
        console.log(`🔐 OTP Code for ${phoneNumber}: ${code}`);
      }
    }

    // ثبت لاگ
    await logActivity(phoneNumber, "otp_request", {
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      message: "کد تایید به شماره شما ارسال شد",
      expiresIn: 120, // ثانیه
      isNewUser, // برای نمایش پیام مناسب در فرانت
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
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
