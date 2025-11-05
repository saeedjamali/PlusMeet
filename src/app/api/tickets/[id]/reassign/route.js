/**
 * API Route: Reassign Ticket
 * ارجاع تیکت به موضوع/کارشناس دیگر
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Ticket from "@/lib/models/Ticket.model";
import TicketCategory from "@/lib/models/TicketCategory.model";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * POST /api/tickets/:id/reassign
 * ارجاع تیکت به موضوع جدید
 */
export async function POST(request, { params }) {
  try {
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    await connectDB();

    const ticket = await Ticket.findById(params.id);
    if (!ticket) {
      return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی
    // فقط assignedTo یا admin می‌توانند تیکت را ارجاع دهند
    const isAssigned = ticket.assignedTo?.toString() === protection.user.id;
    const userRoles = protection.user.roles || [];
    const isAdmin = userRoles.includes("admin");

    if (!isAssigned && !isAdmin) {
      return NextResponse.json(
        { error: "فقط کارشناس مسئول یا admin می‌تواند تیکت را ارجاع دهد" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { newCategoryId } = body;

    if (!newCategoryId) {
      return NextResponse.json(
        { error: "موضوع جدید الزامی است" },
        { status: 400 }
      );
    }

    // بررسی وجود category جدید
    const newCategory = await TicketCategory.findById(newCategoryId).populate(
      "assignedRole",
      "name slug"
    );

    if (!newCategory) {
      return NextResponse.json(
        { error: "موضوع جدید یافت نشد" },
        { status: 404 }
      );
    }

    // ذخیره اطلاعات قبلی برای history
    const oldCategory = ticket.category;
    const oldAssignedTo = ticket.assignedTo;
    const oldAssignedRole = ticket.assignedRole;

    // ارجاع به موضوع/کارشناس جدید
    ticket.category = newCategory._id;
    ticket.assignedRole = newCategory.assignedRole?._id || null;
    ticket.assignedTo = newCategory.assignedUser || null;
    ticket.status = "open"; // بازگشت به وضعیت "باز"

    // افزودن به تاریخچه ارجاع
    ticket.assignmentHistory.push({
      fromUser: oldAssignedTo,
      toUser: newCategory.assignedUser || null,
      fromRole: oldAssignedRole,
      toRole: newCategory.assignedRole?._id || null,
      assignedBy: protection.user.id,
      reason: `ارجاع از موضوع "${oldCategory}" به موضوع "${newCategory.title}"`,
      assignedAt: new Date(),
    });

    await ticket.save();

    // ثبت فعالیت
    await logActivity({
      user: protection.user.id,
      action: "ticket_reassigned",
      resource: "Ticket",
      resourceId: ticket._id,
      details: {
        ticketNumber: ticket.ticketNumber,
        oldCategory: oldCategory,
        newCategory: newCategory.title,
        oldAssignedTo: oldAssignedTo,
        newAssignedTo: newCategory.assignedUser || null,
      },
      ipAddress: protection.ipAddress,
      userAgent: protection.userAgent,
    });

    console.log(
      `✅ تیکت ${ticket.ticketNumber} از "${oldCategory}" به "${newCategory.title}" ارجاع شد`
    );

    return NextResponse.json({
      success: true,
      message: "تیکت با موفقیت ارجاع شد",
      data: { ticket },
    });
  } catch (error) {
    console.error(`POST /api/tickets/${params.id}/reassign error:`, error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
