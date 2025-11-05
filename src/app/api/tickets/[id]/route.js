/**
 * API Route: Single Ticket
 * مدیریت یک تیکت
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Ticket from "@/lib/models/Ticket.model";
import TicketReply from "@/lib/models/TicketReply.model";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET /api/tickets/:id
 * دریافت جزئیات یک تیکت + پاسخ‌ها
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

    const ticket = await Ticket.findById(params.id)
      .populate("category", "title icon color")
      .populate("creator", "displayName phoneNumber avatar")
      .populate("assignedTo", "displayName phoneNumber avatar")
      .populate("assignedRole", "name slug")
      .populate({
        path: "assignmentHistory.fromUser",
        select: "displayName phoneNumber",
      })
      .populate({
        path: "assignmentHistory.toUser",
        select: "displayName phoneNumber",
      })
      .populate({
        path: "assignmentHistory.toRole",
        select: "name slug",
      })
      .populate({
        path: "assignmentHistory.assignedBy",
        select: "displayName",
      })
      .lean();

    if (!ticket) {
      return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی
    // فقط سازنده، assignedTo، یا admin می‌توانند تیکت را ببینند
    const isCreator = ticket.creator._id.toString() === protection.user.id;
    const isAssigned = ticket.assignedTo?._id.toString() === protection.user.id;
    const userRoles = protection.user.roles || [];
    const isAdmin = userRoles.includes("admin");

    if (!isCreator && !isAssigned && !isAdmin) {
      return NextResponse.json(
        { error: "شما دسترسی به این تیکت ندارید" },
        { status: 403 }
      );
    }

    // برای منطق پاسخ‌ها، staff از دیتابیس گرفته می‌شود
    const isStaff = protection.user.isStaff || false;

    // دریافت پاسخ‌ها
    const repliesQuery = {
      ticket: params.id,
      // اگر کاربر عادی باشد، پیام‌های داخلی را نشان نده
      ...(isStaff ? {} : { isInternal: false }),
    };

    const replies = await TicketReply.find(repliesQuery)
      .populate("sender", "displayName phoneNumber avatar")
      .sort({ createdAt: 1 })
      .lean();

    // علامت‌گذاری پاسخ‌های خوانده نشده
    if (isCreator) {
      // کاربر است، پاسخ‌های کارشناس را خوانده علامت بزن
      await Ticket.findByIdAndUpdate(params.id, {
        hasUnreadUserReply: false,
      });
    } else if (isAssigned || isStaff) {
      // کارشناس است، پاسخ‌های کاربر را خوانده علامت بزن
      await Ticket.findByIdAndUpdate(params.id, {
        hasUnreadStaffReply: false,
      });
    }

    return NextResponse.json({
      success: true,
      data: { ticket, replies },
    });
  } catch (error) {
    console.error(`GET /api/tickets/${params.id} error:`, error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

/**
 * PUT /api/tickets/:id
 * بروزرسانی تیکت (وضعیت، اولویت، ...)
 */
export async function PUT(request, { params }) {
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
    const isCreator = ticket.creator.toString() === protection.user.id;
    const isAssigned = ticket.assignedTo?.toString() === protection.user.id;
    const userRoles = protection.user.roles || [];
    const isStaff = userRoles.some((r) =>
      ["admin", "moderator", "support"].includes(r)
    );

    if (!isCreator && !isAssigned && !isStaff) {
      return NextResponse.json(
        { error: "شما دسترسی به این تیکت ندارید" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // فقط کارشناس (assignedTo یا staff) می‌تواند وضعیت تیکت را تغییر دهد
    // سازنده نمی‌تواند وضعیت را تغییر دهد (حتی اگر staff باشد)
    const canManageTicket = (isStaff || isAssigned) && !isCreator;
    
    if (!canManageTicket) {
      return NextResponse.json(
        { error: "فقط کارشناس مسئول می‌تواند وضعیت تیکت را تغییر دهد" },
        { status: 403 }
      );
    }

    // کارشناس می‌تواند همه فیلدها را تغییر دهد
    if (isStaff || isAssigned) {
      const allowedFields = ["status", "priority"];
      allowedFields.forEach((field) => {
        if (body[field] !== undefined) {
          ticket[field] = body[field];

          if (field === "status") {
            if (body[field] === "closed") {
              ticket.closedAt = new Date();
              // صفر کردن کانترها وقتی تیکت بسته می‌شود
              ticket.unreadCountForCreator = 0;
              ticket.unreadCountForStaff = 0;
              ticket.hasUnreadUserReply = false;
              ticket.hasUnreadStaffReply = false;
              console.log(`✅ تیکت بسته شد - کانترها صفر شدند`);
            } else if (body[field] === "resolved") {
              ticket.resolvedAt = new Date();
              // صفر کردن کانترها وقتی تیکت حل می‌شود
              ticket.unreadCountForCreator = 0;
              ticket.unreadCountForStaff = 0;
              ticket.hasUnreadUserReply = false;
              ticket.hasUnreadStaffReply = false;
              console.log(`✅ تیکت حل شد - کانترها صفر شدند`);
            }
          }
        }
      });
    }

    await ticket.save();

    // Log activity
    await logActivity(protection.user.phoneNumber, "ticket.update", {
      targetType: "Ticket",
      targetId: ticket._id,
      metadata: {
        ticketNumber: ticket.ticketNumber,
        changes: body,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تیکت با موفقیت بروزرسانی شد",
      data: { ticket },
    });
  } catch (error) {
    console.error(`PUT /api/tickets/${params.id} error:`, error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

/**
 * DELETE /api/tickets/:id
 * حذف تیکت (فقط admin)
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

    const ticket = await Ticket.findById(params.id);
    if (!ticket) {
      return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });
    }

    // حذف پاسخ‌ها
    await TicketReply.deleteMany({ ticket: params.id });

    // حذف تیکت
    await ticket.deleteOne();

    // Log activity
    await logActivity(protection.user.phoneNumber, "ticket.delete", {
      targetType: "Ticket",
      targetId: params.id,
      metadata: { ticketNumber: ticket.ticketNumber },
    });

    return NextResponse.json({
      success: true,
      message: "تیکت با موفقیت حذف شد",
    });
  } catch (error) {
    console.error(`DELETE /api/tickets/${params.id} error:`, error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

