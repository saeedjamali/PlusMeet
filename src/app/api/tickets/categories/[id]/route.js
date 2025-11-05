/**
 * API Route: Single Ticket Category
 * مدیریت یک موضوع تیکت
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import TicketCategory from "@/lib/models/TicketCategory.model";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET /api/tickets/categories/:id
 * دریافت جزئیات یک موضوع
 */
export async function GET(request, { params }) {
  try {
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    await connectDB();

    const category = await TicketCategory.findById(params.id)
      .populate("assignedRole", "name slug icon")
      .populate("assignedUser", "displayName phoneNumber avatar")
      .populate("createdBy", "displayName")
      .lean();

    if (!category) {
      return NextResponse.json(
        { error: "موضوع یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { category },
    });
  } catch (error) {
    console.error(`GET /api/tickets/categories/${params.id} error:`, error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

/**
 * PUT /api/tickets/categories/:id
 * بروزرسانی یک موضوع
 */
export async function PUT(request, { params }) {
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

    const category = await TicketCategory.findById(params.id);
    if (!category) {
      return NextResponse.json(
        { error: "موضوع یافت نشد" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const allowedFields = [
      "title",
      "description",
      "icon",
      "assignedRole",
      "assignedUser",
      "isActive",
      "order",
      "color",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        category[field] = body[field];
      }
    });

    category.updatedBy = protection.user.id;
    await category.save();

    await category.populate("assignedRole", "name slug icon");
    await category.populate("assignedUser", "displayName phoneNumber avatar");

    // Log activity
    await logActivity(protection.user.phoneNumber, "ticket.category.update", {
      targetType: "TicketCategory",
      targetId: category._id,
      metadata: { title: category.title },
    });

    return NextResponse.json({
      success: true,
      message: "موضوع با موفقیت بروزرسانی شد",
      data: { category },
    });
  } catch (error) {
    console.error(`PUT /api/tickets/categories/${params.id} error:`, error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

/**
 * DELETE /api/tickets/categories/:id
 * حذف یک موضوع
 */
export async function DELETE(request, { params }) {
  try {
    const protection = await protectAPI(request, {
      allowedRoles: ["admin"],
    });
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    await connectDB();

    const category = await TicketCategory.findById(params.id);
    if (!category) {
      return NextResponse.json(
        { error: "موضوع یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی اینکه آیا تیکتی با این موضوع وجود دارد
    const Ticket = (await import("@/lib/models/Ticket.model")).default;
    const ticketCount = await Ticket.countDocuments({ category: params.id });

    if (ticketCount > 0) {
      return NextResponse.json(
        {
          error: `نمی‌توان این موضوع را حذف کرد. ${ticketCount} تیکت با این موضوع وجود دارد`,
        },
        { status: 400 }
      );
    }

    await category.deleteOne();

    // Log activity
    await logActivity(protection.user.phoneNumber, "ticket.category.delete", {
      targetType: "TicketCategory",
      targetId: params.id,
      metadata: { title: category.title },
    });

    return NextResponse.json({
      success: true,
      message: "موضوع با موفقیت حذف شد",
    });
  } catch (error) {
    console.error(`DELETE /api/tickets/categories/${params.id} error:`, error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

