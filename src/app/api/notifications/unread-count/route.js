/**
 * API Route: Unread Notifications Count
 * شمارش اعلانات خوانده نشده
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Notification from "@/lib/models/Notification.model";
import UserNotification from "@/lib/models/UserNotification.model";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { authenticate } from "@/lib/middleware/auth";

/**
 * GET /api/notifications/unread-count
 * شمارش اعلانات خوانده نشده کاربر
 */
export async function GET(request) {
  try {
    // API Protection
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    await connectDB();

    // دریافت تمام اعلانات قابل نمایش برای کاربر
    const query = {
      status: "published",
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
        {
          $or: [
            { targetRoles: { $size: 0 } },
            { targetRoles: { $in: protection.user.roles } },
            { targetUsers: protection.user.id },
          ],
        },
      ],
    };

    const allNotifications = await Notification.find(query).select("_id").lean();
    const allNotificationIds = allNotifications.map((n) => n._id);

    // دریافت اعلانات خوانده شده
    const readNotifications = await UserNotification.find({
      user: protection.user.id,
      notification: { $in: allNotificationIds },
      isRead: true,
    })
      .select("notification")
      .lean();

    const readNotificationIds = new Set(
      readNotifications.map((un) => un.notification.toString())
    );

    // محاسبه خوانده نشده
    const unreadCount = allNotificationIds.filter(
      (id) => !readNotificationIds.has(id.toString())
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        count: unreadCount, // برای NotificationBell
        unreadCount, // برای سازگاری
        totalCount: allNotificationIds.length,
      },
    });
  } catch (error) {
    console.error("GET /api/notifications/unread-count error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

