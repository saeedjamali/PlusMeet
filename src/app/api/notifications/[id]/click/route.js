/**
 * API Route: Mark Notification as Clicked
 * علامت‌گذاری اعلان به عنوان کلیک شده
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Notification from "@/lib/models/Notification.model";
import UserNotification from "@/lib/models/UserNotification.model";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { authenticate } from "@/lib/middleware/auth";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * POST /api/notifications/:id/click
 * علامت‌گذاری یک اعلان به عنوان کلیک شده
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
        isClicked: true,
        clickedAt: new Date(),
      });

      // افزایش شمارنده‌ها
      await notification.incrementView();
      await notification.incrementClick();
    } else {
      // اگر قبلاً خوانده نشده، علامت بزن
      if (!userNotif.isRead) {
        userNotif.isRead = true;
        userNotif.readAt = new Date();
        await notification.incrementView();
      }

      // اگر قبلاً کلیک نشده، علامت بزن
      if (!userNotif.isClicked) {
        userNotif.isClicked = true;
        userNotif.clickedAt = new Date();
        await notification.incrementClick();
      }

      await userNotif.save();
    }

    // Log activity
    try {
      await logActivity(protection.user.phoneNumber, "notification.click", {
        targetType: "Notification",
        targetId: params.id,
        metadata: {
          title: notification.title,
          actionUrl: notification.actionUrl,
        },
      });
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "اعلان به عنوان کلیک شده علامت‌گذاری شد",
      data: {
        actionUrl: notification.actionUrl,
      },
    });
  } catch (error) {
    console.error(`POST /api/notifications/${params.id}/click error:`, error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

