/**
 * API Route: Admin Notification Management (Single)
 * مدیریت یک اعلان خاص
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Notification from "@/lib/models/Notification.model";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { authenticate } from "@/lib/middleware/auth";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET /api/admin/notifications/:id
 * دریافت جزئیات یک اعلان
 */
export async function GET(request, { params }) {
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

    const notification = await Notification.findById(params.id)
      .populate("createdBy", "firstName lastName displayName phoneNumber")
      .populate("updatedBy", "firstName lastName displayName phoneNumber")
      .populate("targetUsers", "firstName lastName displayName phoneNumber")
      .lean();

    if (!notification) {
      return NextResponse.json(
        { error: "اعلان یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error(`GET /api/admin/notifications/${params.id} error:`, error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/notifications/:id
 * ویرایش یک اعلان
 */
export async function PUT(request, { params }) {
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

    await connectDB();

    const notification = await Notification.findById(params.id);

    if (!notification) {
      return NextResponse.json(
        { error: "اعلان یافت نشد" },
        { status: 404 }
      );
    }

    // بروزرسانی فیلدها
    const allowedFields = [
      "title",
      "message",
      "image",
      "type",
      "priority",
      "targetRoles",
      "targetUsers",
      "actionUrl",
      "actionText",
      "scheduledAt",
      "expiresAt",
      "status",
      "pinned",
      "showOnHomepage",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        if (field === "scheduledAt" || field === "expiresAt") {
          notification[field] = body[field] ? new Date(body[field]) : null;
        } else {
          notification[field] = body[field];
        }
      }
    });

    notification.updatedBy = protection.user.id;
    await notification.save();

    // Log activity
    try {
      await logActivity(protection.user.phoneNumber, "notification.update", {
        targetType: "Notification",
        targetId: notification._id.toString(),
        metadata: {
          title: notification.title,
          status: notification.status,
          updatedFields: Object.keys(body),
        },
      });
    } catch (logError) {
      console.error("Error logging activity:", logError);
    }

    const updatedNotification = await Notification.findById(notification._id)
      .populate("createdBy", "firstName lastName displayName")
      .populate("updatedBy", "firstName lastName displayName")
      .lean();

    return NextResponse.json({
      success: true,
      message: "اعلان با موفقیت بروزرسانی شد",
      data: updatedNotification,
    });
  } catch (error) {
    console.error(`PUT /api/admin/notifications/${params.id} error:`, error);
    return NextResponse.json(
      { error: error.message || "خطای سرور" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/notifications/:id
 * حذف یک اعلان
 */
export async function DELETE(request, { params }) {
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

    const notification = await Notification.findByIdAndDelete(params.id);

    if (!notification) {
      return NextResponse.json(
        { error: "اعلان یافت نشد" },
        { status: 404 }
      );
    }

    // Log activity
    try {
      await logActivity(protection.user.phoneNumber, "notification.delete", {
        targetType: "Notification",
        targetId: params.id,
        metadata: {
          title: notification.title,
        },
      });
    } catch (logError) {
      console.error("Error logging activity:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "اعلان با موفقیت حذف شد",
    });
  } catch (error) {
    console.error(`DELETE /api/admin/notifications/${params.id} error:`, error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

