/**
 * API Route: User Notifications
 * اعلانات کاربر
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Notification from "@/lib/models/Notification.model";
import UserNotification from "@/lib/models/UserNotification.model";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { authenticate } from "@/lib/middleware/auth";

/**
 * GET /api/notifications
 * دریافت اعلانات کاربر
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const skip = (page - 1) * limit;

    // دریافت اعلانات مرتبط با کاربر
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
            { targetRoles: { $size: 0 } }, // برای همه
            { targetRoles: { $in: protection.user.roles } }, // بر اساس نقش
            { targetUsers: protection.user.id }, // کاربر مشخص
          ],
        },
      ],
    };

    const notifications = await Notification.find(query)
      .sort({ pinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "firstName lastName displayName")
      .lean();

    // دریافت وضعیت خوانده شده/نشده برای هر اعلان
    const notificationIds = notifications.map((n) => n._id);
    const userNotifications = await UserNotification.find({
      user: protection.user.id,
      notification: { $in: notificationIds },
    }).lean();

    const userNotifMap = new Map();
    userNotifications.forEach((un) => {
      userNotifMap.set(un.notification.toString(), un);
    });

    // ترکیب اطلاعات
    const enrichedNotifications = notifications.map((notif) => {
      const userNotif = userNotifMap.get(notif._id.toString());
      return {
        ...notif,
        isRead: userNotif?.isRead || false,
        readAt: userNotif?.readAt || null,
        isClicked: userNotif?.isClicked || false,
        clickedAt: userNotif?.clickedAt || null,
      };
    });

    // فیلتر کردن برای فقط خوانده نشده‌ها
    const finalNotifications = unreadOnly
      ? enrichedNotifications.filter((n) => !n.isRead)
      : enrichedNotifications;

    const total = await Notification.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        notifications: finalNotifications,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

