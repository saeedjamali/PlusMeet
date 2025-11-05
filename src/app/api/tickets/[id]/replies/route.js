/**
 * API Route: Ticket Replies
 * دریافت لیست پاسخ‌های تیکت
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Ticket from "@/lib/models/Ticket.model";
import TicketReply from "@/lib/models/TicketReply.model";
import { protectAPI } from "@/lib/middleware/apiProtection";

/**
 * GET /api/tickets/:id/replies
 * دریافت لیست پاسخ‌های یک تیکت
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

    // بررسی وجود تیکت
    const ticket = await Ticket.findById(params.id)
      .select("creator assignedTo")
      .lean();

    if (!ticket) {
      return NextResponse.json(
        { error: "تیکت یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی دسترسی
    // فقط سازنده، assignedTo، یا admin می‌توانند پاسخ‌ها را ببینند
    const userRoles = protection.user.roles || [];
    const isAdmin = userRoles.includes("admin");
    const isCreator = ticket.creator?.toString() === protection.user.id;
    const isAssignedTo = ticket.assignedTo?.toString() === protection.user.id;

    if (!isAdmin && !isCreator && !isAssignedTo) {
      return NextResponse.json(
        { error: "شما دسترسی به این تیکت ندارید" },
        { status: 403 }
      );
    }

    // دریافت پاسخ‌ها
    const replies = await TicketReply.find({ ticket: params.id })
      .populate("sender", "displayName phoneNumber avatar roles")
      .sort({ createdAt: 1 }) // قدیمی‌ترین اول
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        replies,
      },
    });
  } catch (error) {
    console.error(`GET /api/tickets/${params.id}/replies error:`, error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

