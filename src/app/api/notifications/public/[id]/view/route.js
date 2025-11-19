/**
 * API Route: Increment Public Notification View Count
 * افزایش تعداد بازدید اعلانات عمومی (بدون احراز هویت)
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Notification from "@/lib/models/Notification.model";
import { protectAPI } from "@/lib/middleware/apiProtection";

/**
 * POST /api/notifications/public/:id/view
 * افزایش تعداد بازدید یک اعلان عمومی
 */
export async function POST(request, { params }) {
  try {
    // API Protection (Public endpoint)
    const protection = await protectAPI(request, { isPublic: true });
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    await connectDB();

    // بررسی وجود اعلان
    const notification = await Notification.findById(params.id);
    if (!notification) {
      return NextResponse.json(
        { error: "اعلان یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی که اعلان عمومی باشد
    if (!notification.showOnHomepage || notification.status !== "published") {
      return NextResponse.json(
        { error: "این اعلان عمومی نیست" },
        { status: 403 }
      );
    }

    // افزایش شمارنده بازدید
    await notification.incrementView();

    return NextResponse.json({
      success: true,
      message: "تعداد بازدید افزایش یافت",
      data: {
        viewCount: notification.viewCount + 1,
      },
    });
  } catch (error) {
    console.error("POST /api/notifications/public/:id/view error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}




