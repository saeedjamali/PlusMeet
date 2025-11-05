/**
 * API Route: Refresh Access Token
 * تمدید توکن دسترسی با استفاده از refresh token
 */

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User.model";
import { generateToken } from "@/lib/middleware/auth";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";
import {
  getCookieFromRequest,
  setHttpOnlyCookie,
  clearCookie,
} from "@/lib/utils/cookies";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "your-refresh-secret-key-change-in-production";

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

    // دریافت refresh token از cookie
    const refreshToken = getCookieFromRequest(request, "refreshToken");

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: "NoRefreshToken",
          message: "refresh token یافت نشد",
        },
        { status: 401 }
      );
    }

    // تایید refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      const response = NextResponse.json(
        {
          success: false,
          error: "InvalidRefreshToken",
          message: "refresh token نامعتبر است",
        },
        { status: 401 }
      );

      // پاک کردن cookies
      clearCookie(response, "accessToken");
      clearCookie(response, "refreshToken");

      return response;
    }

    // پیدا کردن کاربر
    await connectDB();
    const user = await User.findByPhone(decoded.phoneNumber);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "UserNotFound",
          message: "کاربر یافت نشد",
        },
        { status: 404 }
      );
    }

    // بررسی وضعیت کاربر
    if (user.state === "deleted" || user.state === "suspended") {
      const response = NextResponse.json(
        {
          success: false,
          error: "AccountInactive",
          message: "حساب کاربری غیرفعال است",
        },
        { status: 403 }
      );

      clearCookie(response, "accessToken");
      clearCookie(response, "refreshToken");

      return response;
    }

    // تولید access token جدید
    const newAccessToken = generateToken(user);

    // ثبت لاگ
    await logActivity(user.phoneNumber, "token_refresh", {
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent"),
    });

    // ایجاد response
    const response = NextResponse.json({
      success: true,
      message: "توکن با موفقیت تمدید شد",
      data: {
        user: await user.toPublicJSON(), // 👈 async method
      },
    });

    // Set کردن access token جدید
    setHttpOnlyCookie(response, "accessToken", newAccessToken, {
      maxAge: 60 * 60, // 1 hour
    });

    return response;
  } catch (error) {
    console.error("Refresh Token Error:", error);
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
