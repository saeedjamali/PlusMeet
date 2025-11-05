/**
 * API Route: Mark Ticket as Viewed
 * علامت زدن زمان مشاهده تیکت
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Ticket from "@/lib/models/Ticket.model";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * POST /api/tickets/:id/view
 * ثبت زمان مشاهده تیکت توسط طرف مقابل
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
    // فقط سازنده، assignedTo، یا admin می‌توانند تیکت را ببینند
    const isCreator = ticket.creator.toString() === protection.user.id;
    const isAssigned = ticket.assignedTo?.toString() === protection.user.id;
    const userRoles = protection.user.roles || [];
    const isAdmin = userRoles.includes("admin");

    if (!isCreator && !isAssigned && !isAdmin) {
      return NextResponse.json(
        { error: "شما دسترسی به این تیکت ندارید" },
        { status: 403 }
      );
    }

    // برای منطق lastViewed - از دیتابیس
    const isStaff = protection.user.isStaff || false;

    // Update کردن زمان مشاهده (هر بار که صفحه باز می‌شود)
    const now = new Date();
    
    if (isCreator) {
      // سازنده تیکت را دیده - همیشه به‌روز می‌شود
      ticket.lastViewedByCreator = now;
    } else if (isStaff || isAssigned) {
      // کارشناس تیکت را دیده - همیشه به‌روز می‌شود
      ticket.lastViewedByStaff = now;
    }

    await ticket.save();

    // ثبت فعالیت
    await logActivity({
      user: protection.user.id,
      action: "ticket_viewed",
      resource: "Ticket",
      resourceId: ticket._id,
      details: {
        ticketNumber: ticket.ticketNumber,
        viewerRole: isCreator ? "creator" : "staff",
      },
      ipAddress: protection.ipAddress,
      userAgent: protection.userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "زمان مشاهده ثبت شد",
    });
  } catch (error) {
    console.error(`POST /api/tickets/${params.id}/view error:`, error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

