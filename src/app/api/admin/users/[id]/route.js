/**
 * API Route: /api/admin/users/[id]
 * دریافت، ویرایش، و حذف کاربر
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User.model";
import { protectApi } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET - دریافت اطلاعات یک کاربر
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;

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

    const user = await User.findById(id).lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // Log activity
    await logActivity(protection.user.phoneNumber, "user.view", {
      targetId: user._id,
      targetType: "User",
      metadata: {
        viewedUser: user.phoneNumber,
      },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT - ویرایش اطلاعات کاربر
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;

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

    const body = await request.json();

    // فیلدهای قابل ویرایش
    const allowedFields = [
      "firstName",
      "lastName",
      "displayName",
      "email",
      "nationalId",
      "bio",
      "state",
      "userType",
      "dateOfBirth",
      "gender",
      "city",
      "personalAddress",
      "organizationName",
      "organizationLogo",
      "registrationNumber",
      "taxId",
      "website",
      "organizationEmail",
      "description",
      "address",
      "contactPerson",
      "socialLinks",
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Validation
    if (updateData.email && !/^\S+@\S+\.\S+$/.test(updateData.email)) {
      return NextResponse.json(
        { success: false, error: "فرمت ایمیل نامعتبر است" },
        { status: 400 }
      );
    }

    if (updateData.nationalId && !/^\d{10}$/.test(updateData.nationalId)) {
      return NextResponse.json(
        { success: false, error: "کد ملی باید 10 رقم باشد" },
        { status: 400 }
      );
    }

    // Moderator نمی‌تونه admin رو ویرایش کنه
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    if (
      protection.user.roles.includes("moderator") &&
      !protection.user.roles.includes("admin") &&
      targetUser.roles.includes("admin")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "شما مجاز به ویرایش ادمین نیستید",
          code: "FORBIDDEN_ADMIN_EDIT",
        },
        { status: 403 }
      );
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    // Log activity
    await logActivity(protection.user.phoneNumber, "user_update", {
      targetId: updatedUser._id,
      targetType: "User",
      metadata: {
        updatedUser: updatedUser.phoneNumber,
        updatedFields: Object.keys(updateData),
      },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: "اطلاعات کاربر با موفقیت به‌روزرسانی شد",
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error("Error updating user:", error);

    // Mongoose validation error
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        { success: false, error: messages.join(", ") },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "خطای سرور", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - حذف کاربر
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // محافظت API
    const protection = await protectApi(request, {
      allowedRoles: ["admin"],
      checkPermission: true,
    });

    if (!protection.success) {
      return NextResponse.json(
        { success: false, error: protection.error },
        { status: protection.status }
      );
    }

    await connectDB();

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // Admin نمی‌تونه خودش رو حذف کنه
    if (user.phoneNumber === protection.user.phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "شما نمی‌توانید خودتان را حذف کنید",
          code: "CANNOT_DELETE_SELF",
        },
        { status: 400 }
      );
    }

    // حذف کاربر
    await User.findByIdAndDelete(id);

    // Log activity
    await logActivity(protection.user.phoneNumber, "user.delete", {
      targetId: id,
      targetType: "User",
      metadata: {
        deletedUser: user.phoneNumber,
        deletedUserName: `${user.firstName} ${user.lastName}`,
      },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: "کاربر با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور", details: error.message },
      { status: 500 }
    );
  }
}
