/**
 * API Route: Public Notifications (Homepage)
 * اعلانات عمومی برای صفحه اصلی
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Notification from "@/lib/models/Notification.model";
import { protectAPI } from "@/lib/middleware/apiProtection";

/**
 * GET /api/notifications/public
 * دریافت اعلانات عمومی برای نمایش در صفحه اصلی
 */
export async function GET(request) {
  try {
    // API Protection (public endpoint with rate limiting)
    const protection = await protectAPI(request, { isPublic: true });
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 5;

    // دریافت اعلانات عمومی فعال
    const query = {
      status: "published",
      showOnHomepage: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
      $and: [
        {
          $or: [
            { scheduledAt: { $exists: false } },
            { scheduledAt: { $lte: new Date() } },
          ],
        },
      ],
    };

    const notifications = await Notification.find(query)
      .sort({ pinned: -1, createdAt: -1 })
      .limit(limit)
      .select("title message image type priority actionUrl actionText createdAt viewCount")
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        total: notifications.length,
      },
    });
  } catch (error) {
    console.error("GET /api/notifications/public error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

