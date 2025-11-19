/**
 * API Route: تغییر وضعیت کاربر (active/suspended)
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User.model";
import { protectApi } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * PUT - تغییر وضعیت کاربر
 */
export async function PUT(request, { params }) {
  try {
    // محافظت API
    const protection = await protectApi(request, {
      allowedRoles: ["admin", "moderator"],
      checkPermission: true,
    });

    if (!protection.success) {
      return NextResponse.json(
        { success: false, error: protection.error },
        { status: protection.status }
      );
    }

    await connectDB();

    const { id } = params;
    const { state } = await request.json();

    // Validation
    const validStates = [
      "active",
      "suspended",
      "pending_verification",
      "verified",
      "deleted",
    ];
    if (!state || !validStates.includes(state)) {
      return NextResponse.json(
        {
          success: false,
          error: "وضعیت نامعتبر است",
          code: "INVALID_STATE",
        },
        { status: 400 }
      );
    }

    // پیدا کردن کاربر
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // جلوگیری از تغییر وضعیت admin توسط moderator
    if (
      user.roles.includes("admin") &&
      protection.user.roles.includes("moderator") &&
      !protection.user.roles.includes("admin")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "شما مجوز تغییر وضعیت ادمین را ندارید",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // ذخیره state قبلی برای لاگ
    const oldState = user.state;

    // آپدیت state
    user.state = state;
    await user.save();

    // ثبت لاگ
    await logActivity(protection.user.phoneNumber, "user_state_change", {
      targetType: "User",
      targetId: user._id,
      metadata: {
        userId: user._id,
        phoneNumber: user.phoneNumber,
        oldState,
        newState: state,
        changedBy: protection.user.phoneNumber,
      },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: "وضعیت کاربر با موفقیت تغییر کرد",
      data: {
        userId: user._id,
        oldState,
        newState: state,
      },
    });
  } catch (error) {
    console.error("Error changing user state:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور", details: error.message },
      { status: 500 }
    );
  }
}





