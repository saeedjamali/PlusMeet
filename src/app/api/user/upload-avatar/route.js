/**
 * API Route: Upload Avatar/Logo
 * آپلود آواتار کاربر یا لوگو سازمان
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User.model";
import { authenticate } from "@/lib/middleware/auth";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * POST /api/user/upload-avatar
 * آپلود آواتار یا لوگو
 */
export async function POST(request) {
  try {
    // Authentication
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { image, type } = await request.json(); // type: 'avatar' | 'logo'

    // Validation
    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: "ValidationError",
          message: "تصویر الزامی است",
        },
        { status: 400 }
      );
    }

    if (!type || !["avatar", "logo"].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: "ValidationError",
          message: "نوع تصویر نامعتبر است",
        },
        { status: 400 }
      );
    }

    // بررسی فرمت base64
    if (!image.startsWith("data:image/")) {
      return NextResponse.json(
        {
          success: false,
          error: "ValidationError",
          message: "فرمت تصویر نامعتبر است",
        },
        { status: 400 }
      );
    }

    // بررسی حجم (max 2MB)
    const base64Size = image.length * (3 / 4) - 2; // تقریبی
    if (base64Size > 2 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "ValidationError",
          message: "حجم تصویر نباید بیشتر از 2 مگابایت باشد",
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

    // ذخیره تصویر
    // در production: آپلود به S3/Cloudinary و ذخیره URL
    // در development: ذخیره base64 (برای سادگی)

    if (type === "avatar") {
      user.avatar = image;
    } else if (type === "logo") {
      // بررسی اینکه کاربر سازمانی باشه
      if (user.userType !== "organization" && user.userType !== "government") {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden",
            message: "فقط کاربران سازمانی می‌توانند لوگو آپلود کنند",
          },
          { status: 403 }
        );
      }
      user.organizationLogo = image;
    }

    await user.save();

    console.log(`✅ ${type} uploaded successfully for:`, user.phoneNumber);

    // Log activity
    try {
      await logActivity(user.phoneNumber, "profile_update", {
        targetType: "User",
        targetId: user._id.toString(),
        metadata: {
          action: `${type}_upload`,
          imageSize: base64Size,
        },
      });
    } catch (logError) {
      console.error("Error logging avatar upload:", logError);
    }

    return NextResponse.json({
      success: true,
      message:
        type === "avatar"
          ? "آواتار با موفقیت آپلود شد"
          : "لوگو با موفقیت آپلود شد",
      data: {
        [type]: type === "avatar" ? user.avatar : user.organizationLogo,
      },
    });
  } catch (error) {
    console.error("POST /api/user/upload-avatar error:", error);
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


