/**
 * API Route: Mark Notification as Read
 * علامت‌گذاری اعلان به عنوان خوانده شده
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Notification from "@/lib/models/Notification.model";
import UserNotification from "@/lib/models/UserNotification.model";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { authenticate } from "@/lib/middleware/auth";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * POST /api/notifications/:id/read
 * علامت‌گذاری یک اعلان به عنوان خوانده شده
 */
export async function POST(request, { params }) {
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

    // بررسی وجود اعلان
    const notification = await Notification.findById(params.id);
    if (!notification) {
      return NextResponse.json(
        { error: "اعلان یافت نشد" },
        { status: 404 }
      );
    }

    // دریافت یا ایجاد UserNotification
    let userNotif = await UserNotification.findOne({
      user: protection.user.id,
      notification: params.id,
    });

    if (!userNotif) {
      userNotif = await UserNotification.create({
        user: protection.user.id,
        notification: params.id,
        isRead: true,
        readAt: new Date(),
      });
    } else if (!userNotif.isRead) {
      userNotif.isRead = true;
      userNotif.readAt = new Date();
      await userNotif.save();
    }

    // افزایش شمارنده بازدید با هر بار خواندن
    await notification.incrementView();
    console.log(`✅ Notification ${params.id} viewCount incremented (total: ${notification.viewCount + 1})`);

    // Log activity
    try {
      await logActivity(protection.user.phoneNumber, "notification.read", {
        targetType: "Notification",
        targetId: params.id,
        metadata: { title: notification.title },
      });
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "اعلان به عنوان خوانده شده علامت‌گذاری شد",
    });
  } catch (error) {
    console.error(`POST /api/notifications/${params.id}/read error:`, error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

