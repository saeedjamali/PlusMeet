/**
 * API Route: Permissions List
 * مسیر API: لیست مجوزها
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { Permission } from "@/lib/models/Permission.model";
import { authenticate, requireRole } from "@/lib/middleware/auth";
import { protectAPI } from "@/lib/middleware/apiProtection";

/**
 * GET /api/admin/permissions
 * دریافت لیست تمام مجوزها
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

    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const roleCheck = await requireRole(authResult.user, [
      "admin",
      "moderator",
    ]);
    if (!roleCheck.success) {
      return NextResponse.json({ error: roleCheck.error }, { status: 403 });
    }

    await connectDB();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";

    const query = {};
    if (category) {
      query.category = category;
    }

    const permissions = await Permission.find(query)
      .sort({ category: 1, name: 1 })
      .lean();

    // Group by category
    const groupedPermissions = permissions.reduce((acc, permission) => {
      const cat = permission.category;
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(permission);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        permissions,
        grouped: groupedPermissions,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/permissions error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لیست مجوزها" },
      { status: 500 }
    );
  }
}
