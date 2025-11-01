/**
 * API Route: Login with Password
 * ورود با نام کاربری و رمز عبور
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User.model";
import {
  comparePassword,
  generateToken,
  generateRefreshToken,
} from "@/lib/middleware/auth";
import { logActivity } from "@/lib/models/ActivityLog.model";
import { setHttpOnlyCookie } from "@/lib/utils/cookies";

export async function POST(request) {
  try {
    const { phoneNumber, password } = await request.json();

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

    if (!password || password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "InvalidPassword",
          message: "رمز عبور حداقل باید 6 کاراکتر باشد",
        },
        { status: 400 }
      );
    }

    // اتصال به دیتابیس
    await connectDB();

    // پیدا کردن کاربر (با password)
    const user = await User.findOne({ phoneNumber }).select("+password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "InvalidCredentials",
          message: "شماره موبایل یا رمز عبور اشتباه است",
        },
        { status: 401 }
      );
    }

    // بررسی وجود رمز عبور
    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          error: "NoPassword",
          message:
            "برای این حساب رمز عبور تنظیم نشده است. لطفاً از ورود با کد استفاده کنید",
        },
        { status: 400 }
      );
    }

    // تایید رمز عبور
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      // ثبت لاگ ورود ناموفق
      await logActivity(phoneNumber, "login", {
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
        status: "failed",
        metadata: { method: "password", reason: "invalid_password" },
      });

      return NextResponse.json(
        {
          success: false,
          error: "InvalidCredentials",
          message: "شماره موبایل یا رمز عبور اشتباه است",
        },
        { status: 401 }
      );
    }

    // بررسی وضعیت کاربر
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

    // به‌روزرسانی زمان ورود
    user.lastLoginAt = new Date();
    await user.save();

    // حذف password از response
    user.password = undefined;

    // تولید توکن‌ها
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // ثبت لاگ موفق
    await logActivity(phoneNumber, "login", {
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent"),
      metadata: { method: "password" },
    });

    // ایجاد response
    const response = NextResponse.json({
      success: true,
      message: "ورود موفقیت‌آمیز",
      data: {
        user: user.toPublicJSON(),
      },
    });

    // Set کردن توکن‌ها در httpOnly cookies
    setHttpOnlyCookie(response, "accessToken", accessToken, {
      maxAge: 60 * 15, // 15 minutes
    });

    setHttpOnlyCookie(response, "refreshToken", refreshToken, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login Error:", error);
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
