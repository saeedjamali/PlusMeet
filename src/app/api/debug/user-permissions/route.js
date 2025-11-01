/**
 * Debug API - نمایش دقیق دسترسی‌های کاربر
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Role from "@/lib/models/Role.model";
import { authenticate } from "@/lib/middleware/auth";

export async function GET(request) {
  try {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    await connectDB();

    const user = authResult.user;
    const userRoles = user.roles || [];

    console.log("🔍 [DEBUG] Fetching permissions for:", user.phoneNumber);
    console.log("🔍 [DEBUG] User roles:", userRoles);

    // گرفتن نقش‌ها با تمام دسترسی‌ها
    const roles = await Role.find({
      slug: { $in: userRoles },
      isActive: true,
    }).lean();

    console.log("🔍 [DEBUG] Found roles:", roles.length);

    // تبدیل به فرمت خوانا
    const rolesWithPermissions = roles.map((role) => ({
      name: role.name,
      slug: role.slug,
      apiPermissions: role.apiPermissions || [],
      menuPermissions: role.menuPermissions || [],
    }));

    return NextResponse.json({
      success: true,
      user: {
        phoneNumber: user.phoneNumber,
        roles: userRoles,
      },
      roles: rolesWithPermissions,
    });
  } catch (error) {
    console.error("❌ [DEBUG] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

