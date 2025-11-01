/**
 * API Route: Roles List (Legacy - Redirects to RBAC)
 * مسیر API: لیست نقش‌ها (قدیمی - هدایت به RBAC)
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Role from "@/lib/models/Role.model";
import { authenticate } from "@/lib/middleware/auth";

/**
 * GET /api/admin/roles
 * دریافت لیست تمام نقش‌ها از سیستم RBAC دینامیک
 */
export async function GET(request) {
  try {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    if (!authResult.user.roles?.includes("admin")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    await connectDB();

    // گرفتن نقش‌های فعال از دیتابیس RBAC
    const roles = await Role.find({ isActive: true })
      .sort({ priority: -1 })
      .lean();

    // تبدیل به فرمت قدیمی برای سازگاری
    const formattedRoles = roles.map((role) => ({
      _id: role._id,
      name: role.slug, // برای سازگاری با کد قدیمی
      label: role.name, // نام فارسی
      description: role.description,
      isSystem: role.isSystem,
      color: role.color,
      icon: role.icon,
      priority: role.priority,
    }));

    return NextResponse.json({
      success: true,
      data: formattedRoles,
    });
  } catch (error) {
    console.error("GET /api/admin/roles error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت لیست نقش‌ها" },
      { status: 500 }
    );
  }
}
