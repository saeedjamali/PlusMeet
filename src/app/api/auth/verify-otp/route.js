/**
 * API Route: Verify OTP
 * تایید کد یکبار مصرف و ورود
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User.model";
import { verifyOTP } from "@/lib/services/sms.service";
import { generateToken, generateRefreshToken } from "@/lib/middleware/auth";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";
import { setHttpOnlyCookie } from "@/lib/utils/cookies";

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

    const { phoneNumber, code, role } = await request.json();

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

    if (!code || code.length !== 5) {
      return NextResponse.json(
        {
          success: false,
          error: "InvalidCode",
          message: "کد تایید باید 5 رقم باشد",
        },
        { status: 400 }
      );
    }

    // تایید OTP
    const otpResult = await verifyOTP(phoneNumber, code);

    if (!otpResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "InvalidOTP",
          message: otpResult.error,
        },
        { status: 400 }
      );
    }

    // اتصال به دیتابیس
    await connectDB();

    // پیدا کردن یا ایجاد کاربر
    let user = await User.findByPhone(phoneNumber);
    let isNewUser = false;

    if (!user) {
      // ثبت‌نام کاربر جدید
      isNewUser = true;

      // تعیین نقش‌ها بر اساس انتخاب کاربر
      let userRoles = ["user"]; // پیش‌فرض: همیشه user داره
      if (role === "event_owner") {
        userRoles.push("event_owner"); // اضافه کردن event_owner
      }

      console.log("🎭 Creating new user with roles:", userRoles);

      user = new User({
        phoneNumber,
        firstName: "کاربر", // موقت
        lastName: phoneNumber.substring(7), // 4 رقم آخر شماره
        displayName: `کاربر ${phoneNumber.substring(7)}`,
        roles: userRoles,
        state: "active",
        userType: "individual",
        lastLoginAt: new Date(),
      });

      await user.save();

      console.log("✅ User saved with roles:", user.roles);

      // ثبت لاگ ثبت‌نام
      await logActivity(phoneNumber, "register", {
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
        metadata: { method: "otp" },
      });
    } else {
      // بررسی وضعیت کاربر موجود
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
          },
          { status: 403 }
        );
      }

      // ✨ ارتقا نقش: اگر کاربر event_owner انتخاب کرده و قبلاً نداره، اضافه کن
      let roleUpdated = false;
      if (role === "event_owner" && !user.roles.includes("event_owner")) {
        console.log("⬆️ Upgrading user role to event_owner");
        user.roles.push("event_owner");
        roleUpdated = true;
      }

      // به‌روزرسانی زمان ورود
      user.lastLoginAt = new Date();
      await user.save();

      if (roleUpdated) {
        console.log("✅ User role upgraded:", user.roles);
        // ثبت لاگ ارتقا نقش
        await logActivity(phoneNumber, "role_upgrade", {
          targetType: "User",
          targetId: user._id,
          metadata: {
            newRole: "event_owner",
            allRoles: user.roles,
          },
        });
      }
    }

    // تولید توکن‌ها
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // ثبت لاگ
    await logActivity(phoneNumber, "login", {
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent"),
      metadata: { method: "otp" },
    });

    // ایجاد response
    const response = NextResponse.json({
      success: true,
      message: isNewUser ? "ثبت‌نام و ورود موفقیت‌آمیز" : "ورود موفقیت‌آمیز",
      data: {
        user: await user.toPublicJSON(), // 👈 async method
        isNewUser, // برای نمایش پیام خوش‌آمدگویی یا هدایت به تکمیل پروفایل
      },
    });

    // Set کردن توکن‌ها در httpOnly cookies
    setHttpOnlyCookie(response, "accessToken", accessToken, {
      maxAge: 60 * 60, // 15 minutes
    });

    setHttpOnlyCookie(response, "refreshToken", refreshToken, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Verify OTP Error:", error);
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
