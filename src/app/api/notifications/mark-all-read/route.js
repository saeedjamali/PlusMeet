/**
 * API Route: Mark All Notifications as Read
 * علامت‌گذاری همه اعلانات به عنوان خوانده شده
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Notification from "@/lib/models/Notification.model";
import UserNotification from "@/lib/models/UserNotification.model";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { authenticate } from "@/lib/middleware/auth";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * POST /api/notifications/mark-all-read
 * علامت‌گذاری همه اعلانات به عنوان خوانده شده
 */
export async function POST(request) {
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

    // دریافت UserNotifications موجود
    const existingUserNotifs = await UserNotification.find({
      user: protection.user.id,
      notification: { $in: allNotificationIds },
    });

    const existingNotifIds = new Set(
      existingUserNotifs.map((un) => un.notification.toString())
    );

    // بروزرسانی موجودها
    await UserNotification.updateMany(
      {
        user: protection.user.id,
        notification: { $in: allNotificationIds },
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    // ایجاد برای آنهایی که وجود ندارند
    const newUserNotifs = allNotificationIds
      .filter((id) => !existingNotifIds.has(id.toString()))
      .map((id) => ({
        user: protection.user.id,
        notification: id,
        isRead: true,
        readAt: new Date(),
      }));

    if (newUserNotifs.length > 0) {
      await UserNotification.insertMany(newUserNotifs);
    }

    // Log activity
    try {
      await logActivity(
        protection.user.phoneNumber,
        "notification.mark_all_read",
        {
          metadata: { count: allNotificationIds.length },
        }
      );
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "همه اعلانات به عنوان خوانده شده علامت‌گذاری شدند",
      data: {
        markedCount: allNotificationIds.length,
      },
    });
  } catch (error) {
    console.error("POST /api/notifications/mark-all-read error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

