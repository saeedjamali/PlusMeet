/**
 * API Route: Ticket Categories
 * مدیریت موضوعات تیکت
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import TicketCategory from "@/lib/models/TicketCategory.model";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET /api/tickets/categories
 * دریافت لیست موضوعات تیکت
 */
export async function GET(request) {
  try {
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const query = activeOnly ? { isActive: true } : {};

    const categories = await TicketCategory.find(query)
      .populate("assignedRole", "name slug icon")
      .populate("assignedUser", "displayName phoneNumber avatar")
      .populate("createdBy", "displayName")
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error("GET /api/tickets/categories error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

/**
 * POST /api/tickets/categories
 * ایجاد موضوع جدید
 */
export async function POST(request) {
  try {
    const protection = await protectAPI(request, {
      allowedRoles: ["admin", "moderator"],
    });
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      title,
      description,
      icon,
      assignedRole,
      assignedUser,
      isActive,
      order,
      color,
    } = body;

    // Validation
    if (!title || !assignedRole) {
      return NextResponse.json(
        { error: "عنوان و نقش پیش‌فرض الزامی است" },
        { status: 400 }
      );
    }

    const category = await TicketCategory.create({
      title,
      description,
      icon: icon || "🎫",
      assignedRole,
      assignedUser: assignedUser || null,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      color: color || "#3b82f6",
      createdBy: protection.user.id,
    });

    await category.populate("assignedRole", "name slug icon");
    await category.populate("assignedUser", "displayName phoneNumber avatar");

    // Log activity
    await logActivity(protection.user.phoneNumber, "ticket.category.create", {
      targetType: "TicketCategory",
      targetId: category._id,
      metadata: { title: category.title },
    });

    return NextResponse.json({
      success: true,
      message: "موضوع با موفقیت ایجاد شد",
      data: { category },
    });
  } catch (error) {
    console.error("POST /api/tickets/categories error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

