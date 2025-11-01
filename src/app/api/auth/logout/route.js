/**
 * API Route: Logout
 * خروج از سیستم و پاک کردن cookies
 */

import { NextResponse } from "next/server";
import { clearCookie } from "@/lib/utils/cookies";
import { authenticate } from "@/lib/middleware/auth";
import { logActivity } from "@/lib/models/ActivityLog.model";

export async function POST(request) {
  try {
    // Authentication (optional - برای logging)
    const authResult = await authenticate(request, { requireCSRF: false });

    if (authResult.success) {
      // ثبت لاگ خروج
      await logActivity(authResult.user.phoneNumber, "logout", {
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
      });
    }

    // ایجاد response
    const response = NextResponse.json({
      success: true,
      message: "خروج موفقیت‌آمیز",
    });

    // پاک کردن cookies
    clearCookie(response, "accessToken");
    clearCookie(response, "refreshToken");
    clearCookie(response, "XSRF-TOKEN");

    return response;
  } catch (error) {
    console.error("Logout Error:", error);

    // حتی در صورت خطا، cookies رو پاک می‌کنیم
    const response = NextResponse.json(
      {
        success: true,
        message: "خروج انجام شد",
      },
      { status: 200 }
    );

    clearCookie(response, "accessToken");
    clearCookie(response, "refreshToken");
    clearCookie(response, "XSRF-TOKEN");

    return response;
  }
}

