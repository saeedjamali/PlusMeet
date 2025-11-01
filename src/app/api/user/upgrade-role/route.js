/**
 * API Route: Upgrade User Role
 * ارتقا نقش کاربر (self-upgrade به event_owner)
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User.model";
import { authenticate } from "@/lib/middleware/auth";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * POST /api/user/upgrade-role
 * ارتقا نقش کاربر به event_owner
 */
export async function POST(request) {
  try {
    // Authentication
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { role } = await request.json();

    // فقط event_owner قابل ارتقا است (self-upgrade)
    if (role !== "event_owner") {
      return NextResponse.json(
        {
          success: false,
          error: "InvalidRole",
          message: "فقط نقش مالک رویداد قابل فعال‌سازی است",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({
      phoneNumber: authResult.user.phoneNumber,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "NotFound",
          message: "کاربر یافت نشد",
        },
        { status: 404 }
      );
    }

    // بررسی اینکه نقش از قبل وجود داره یا نه
    if (user.roles.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: "AlreadyHasRole",
          message: "شما از قبل این نقش را دارید",
        },
        { status: 400 }
      );
    }

    // اضافه کردن نقش
    const oldRoles = [...user.roles];
    user.roles.push(role);
    await user.save();

    console.log(`✅ User ${user.phoneNumber} upgraded to ${role}`);

    // Log activity
    try {
      await logActivity(user.phoneNumber, "role_upgrade", {
        targetType: "User",
        targetId: user._id.toString(),
        metadata: {
          newRole: role,
          oldRoles,
          newRoles: user.roles,
        },
      });
    } catch (logError) {
      console.error("Error logging role upgrade:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "نقش شما با موفقیت ارتقا یافت",
      data: {
        roles: user.roles,
      },
    });
  } catch (error) {
    console.error("POST /api/user/upgrade-role error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "ServerError",
        message: "خطای سرور",
      },
      { status: 500 }
    );
  }
}


