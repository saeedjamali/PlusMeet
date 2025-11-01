/**
 * API Route: User Custom Permissions Management
 * مسیر API: مدیریت مجوزهای سفارشی کاربر
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { UserPermission } from "@/lib/models/Permission.model";
import { authenticate, requireRole } from "@/lib/middleware/auth";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET /api/admin/users/[id]/permissions
 * دریافت مجوزهای سفارشی کاربر
 */
export async function GET(request, { params }) {
  try {
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

    const { id } = params;

    const permissions = await UserPermission.find({
      userId: id,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    })
      .populate("permissionId")
      .lean();

    return NextResponse.json({ success: true, data: permissions });
  } catch (error) {
    console.error("GET /api/admin/users/[id]/permissions error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت مجوزها" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users/[id]/permissions
 * تخصیص مجوز سفارشی به کاربر
 */
export async function POST(request, { params }) {
  try {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const roleCheck = await requireRole(authResult.user, ["admin"]);
    if (!roleCheck.success) {
      return NextResponse.json({ error: roleCheck.error }, { status: 403 });
    }

    await connectDB();

    const { id } = params;
    const { permissionId, expiresAt, scope, notes } = await request.json();

    // Check if permission already exists
    const existingPermission = await UserPermission.findOne({
      userId: id,
      permissionId,
    });

    if (existingPermission) {
      return NextResponse.json(
        { error: "این مجوز قبلاً به کاربر تخصیص داده شده است" },
        { status: 400 }
      );
    }

    const userPermission = await UserPermission.create({
      userId: id,
      permissionId,
      grantedBy: authResult.user.phoneNumber,
      expiresAt: expiresAt || null,
      scope: scope || {},
      notes: notes || "",
    });

    await logActivity(authResult.user.phoneNumber, "users.permissions.grant", {
      targetType: "user",
      targetId: id,
      metadata: { permissionId, expiresAt, scope },
    });

    return NextResponse.json({
      success: true,
      message: "مجوز با موفقیت تخصیص داده شد",
      data: userPermission,
    });
  } catch (error) {
    console.error("POST /api/admin/users/[id]/permissions error:", error);
    return NextResponse.json({ error: "خطا در تخصیص مجوز" }, { status: 500 });
  }
}


