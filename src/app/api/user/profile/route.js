/**
 * API Route: User Profile
 * مدیریت پروفایل کاربر
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User.model";
import { authenticate } from "@/lib/middleware/auth";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET /api/user/profile
 * دریافت اطلاعات پروفایل کاربر
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

    // Authentication
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({
      phoneNumber: authResult.user.phoneNumber,
    }).select("-password -__v");

    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // محاسبه isStaff از role های دیتابیس
    const Role = (await import("@/lib/models/Role.model")).default;
    let isStaff = false;
    if (user.roles && user.roles.length > 0) {
      const staffRolesCount = await Role.countDocuments({
        slug: { $in: user.roles },
        isStaff: true,
      });
      isStaff = staffRolesCount > 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(), // ✅ اضافه کردن id
        _id: user._id.toString(), // ✅ هم _id و هم id برای سازگاری
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        email: user.email,
        roles: user.roles,
        isStaff, // 👈 محاسبه شده از دیتابیس
        state: user.state,
        userType: user.userType,
        organizationName: user.organizationName,
        organizationLogo: user.organizationLogo,
        nationalId: user.nationalId,
        website: user.website,
        socialLinks: user.socialLinks,
        location: user.location,
        stats: user.stats,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("GET /api/user/profile error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

/**
 * PUT /api/user/profile
 * به‌روزرسانی پروفایل کاربر
 */
export async function PUT(request) {
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

    const body = await request.json();
    const {
      firstName,
      lastName,
      displayName,
      bio,
      email,
      userType,
      organizationName,
      nationalId,
      website,
      socialLinks,
      location,
    } = body;

    await connectDB();

    const user = await User.findOne({
      phoneNumber: authResult.user.phoneNumber,
    });

    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // Update fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (displayName !== undefined) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (email !== undefined) user.email = email;

    // Update userType (اگر تغییر کرد)
    if (
      userType &&
      ["individual", "organization", "government"].includes(userType)
    ) {
      user.userType = userType;
    }

    // Organization fields (فقط برای organization و government)
    if (user.userType === "organization" || user.userType === "government") {
      if (organizationName !== undefined)
        user.organizationName = organizationName;
      if (nationalId !== undefined) user.nationalId = nationalId;
      if (website !== undefined) user.website = website;
    }

    // Social links
    if (socialLinks) {
      user.socialLinks = {
        ...user.socialLinks,
        ...socialLinks,
      };
    }

    // Location
    if (location) {
      user.location = {
        ...user.location,
        ...location,
      };
    }

    await user.save();

    // Log activity
    try {
      await logActivity(user.phoneNumber, "user_update", {
        targetType: "User",
        targetId: user._id.toString(),
        metadata: {
          updatedFields: Object.keys(body),
        },
      });
    } catch (logError) {
      console.error("Error logging profile update:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "پروفایل با موفقیت به‌روزرسانی شد",
      data: {
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        email: user.email,
        roles: user.roles,
        state: user.state,
        userType: user.userType,
        organizationName: user.organizationName,
        organizationLogo: user.organizationLogo,
        nationalId: user.nationalId,
        website: user.website,
        socialLinks: user.socialLinks,
        location: user.location,
      },
    });
  } catch (error) {
    console.error("PUT /api/user/profile error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
