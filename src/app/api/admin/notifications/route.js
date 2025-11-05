/**
 * API Route: Admin Notifications Management
 * مدیریت اعلانات توسط ادمین/مدریتر
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Notification from "@/lib/models/Notification.model";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { authenticate } from "@/lib/middleware/auth";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET /api/admin/notifications
 * دریافت لیست اعلانات (برای ادمین)
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
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const query = {};

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "firstName lastName displayName")
        .populate("updatedBy", "firstName lastName displayName")
        .lean(),
      Notification.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/notifications error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

/**
 * POST /api/admin/notifications
 * ایجاد اعلان جدید
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

    const body = await request.json();
    const {
      title,
      message,
      image,
      type,
      priority,
      targetRoles,
      targetUsers,
      actionUrl,
      actionText,
      scheduledAt,
      expiresAt,
      status,
      pinned,
      showOnHomepage,
    } = body;

    // Validation
    if (!title || !message) {
      return NextResponse.json(
        { error: "عنوان و متن اعلان الزامی است" },
        { status: 400 }
      );
    }

    await connectDB();

    // ایجاد اعلان
    const notification = await Notification.create({
      title,
      message,
      image,
      type: type || "info",
      priority: priority || "medium",
      targetRoles: targetRoles || [],
      targetUsers: targetUsers || [],
      actionUrl,
      actionText,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      status: status || "draft",
      pinned: pinned || false,
      showOnHomepage: showOnHomepage || false,
      createdBy: protection.user.id,
    });

    // Log activity
    try {
      await logActivity(protection.user.phoneNumber, "notification.create", {
        targetType: "Notification",
        targetId: notification._id.toString(),
        metadata: {
          title: notification.title,
          type: notification.type,
          status: notification.status,
        },
      });
    } catch (logError) {
      console.error("Error logging activity:", logError);
    }

    const populatedNotification = await Notification.findById(notification._id)
      .populate("createdBy", "firstName lastName displayName")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "اعلان با موفقیت ایجاد شد",
        data: populatedNotification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/notifications error:", error);
    return NextResponse.json(
      { error: error.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
