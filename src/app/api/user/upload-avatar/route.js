/**
 * API Route: Upload Avatar/Logo
 * آپلود آواتار کاربر یا لوگو سازمان
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User.model";
import { authenticate } from "@/lib/middleware/auth";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";
import {
  saveBase64Image,
  deleteOldFile,
  validateImageFile,
  ensureUploadDirectories,
} from "@/lib/utils/fileUpload";

/**
 * POST /api/user/upload-avatar
 * آپلود آواتار یا لوگو
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

    // Authentication
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { image, type } = await request.json(); // type: 'avatar' | 'logo'

    // تضمین وجود پوشه‌های uploads
    await ensureUploadDirectories();

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

    // اعتبارسنجی تصویر
    try {
      validateImageFile(image, 2); // max 2MB
    } catch (validationError) {
      return NextResponse.json(
        {
          success: false,
          error: "ValidationError",
          message: validationError.message,
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

    // بررسی دسترسی برای لوگو
    if (type === "logo") {
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
    }

    // ذخیره تصویر در پوشه uploads
    const folder = type === "avatar" ? "avatars" : "logos";
    let imageUrl;

    try {
      imageUrl = await saveBase64Image(image, folder);
    } catch (saveError) {
      console.error("Error saving image:", saveError);
      return NextResponse.json(
        {
          success: false,
          error: "ServerError",
          message: "خطا در ذخیره تصویر",
        },
        { status: 500 }
      );
    }

    // حذف فایل قدیمی
    const oldImageUrl = type === "avatar" ? user.avatar : user.organizationLogo;
    if (oldImageUrl) {
      await deleteOldFile(oldImageUrl);
    }

    // به‌روزرسانی URL در دیتابیس
    if (type === "avatar") {
      user.avatar = imageUrl;
    } else {
      user.organizationLogo = imageUrl;
    }

    await user.save();

    console.log(`✅ ${type} uploaded successfully for:`, user.phoneNumber);
    console.log(`   URL: ${imageUrl}`);

    // Log activity
    try {
      await logActivity(user.phoneNumber, "profile_update", {
        targetType: "User",
        targetId: user._id.toString(),
        metadata: {
          action: `${type}_upload`,
          imageUrl,
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
        [type]: imageUrl,
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



