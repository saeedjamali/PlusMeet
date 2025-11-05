/**
 * API Route: Ticket Reply
 * پاسخ به تیکت
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Ticket from "@/lib/models/Ticket.model";
import TicketReply from "@/lib/models/TicketReply.model";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";
import {
  saveBase64Image,
  validateImageFile,
  ensureUploadDirectories,
} from "@/lib/utils/fileUpload";

/**
 * POST /api/tickets/:id/reply
 * ارسال پاسخ به تیکت
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
    // فقط سازنده، assignedTo، یا admin می‌توانند پاسخ دهند
    const isCreator = ticket.creator.toString() === protection.user.id;
    const isAssigned = ticket.assignedTo?.toString() === protection.user.id;
    const userRoles = protection.user.roles || [];
    const isAdmin = userRoles.includes("admin");

    if (!isCreator && !isAssigned && !isAdmin) {
      return NextResponse.json(
        { error: "شما دسترسی به پاسخ دادن این تیکت ندارید" },
        { status: 403 }
      );
    }

    // برای تشخیص staff (برای replyType) - از دیتابیس
    const isStaff = protection.user.isStaff || false;

    const body = await request.json();
    const { message, image, isInternal } = body;

    // Validation
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "متن پیام الزامی است" },
        { status: 400 }
      );
    }

    // تضمین وجود پوشه‌های uploads
    await ensureUploadDirectories();

    // ذخیره تصویر (اختیاری)
    let imageUrl = null;
    if (image) {
      try {
        validateImageFile(image, 2); // max 2MB
        imageUrl = await saveBase64Image(image, "tickets");
        console.log(`✅ Reply image saved: ${imageUrl}`);
      } catch (imageError) {
        console.error("Error saving reply image:", imageError);
        return NextResponse.json(
          { error: imageError.message || "خطا در ذخیره تصویر" },
          { status: 400 }
        );
      }
    }

    // ساخت attachments
    const attachments = [];
    if (imageUrl) {
      attachments.push({
        url: imageUrl,
        type: "image",
        uploadedAt: new Date(),
      });
    }

    // کاربر عادی نمی‌تواند پیام داخلی ارسال کند
    const canSendInternal = isStaff || isAssigned;

    // تعیین نوع پاسخ براساس رابطه با تیکت
    let replyType = "other";
    if (isCreator) {
      replyType = "creator"; // سازنده تیکت
    } else if (isAssigned) {
      replyType = "assigned"; // کارشناس مسئول (assignedTo)
    } else if (isStaff) {
      replyType = "assigned"; // سایر کارشناسان (staff)
    }

    // ایجاد پاسخ
    const reply = await TicketReply.create({
      ticket: params.id,
      sender: protection.user.id,
      message: message.trim(),
      attachments,
      isInternal: canSendInternal && isInternal ? true : false,
      replyType: replyType,
    });

    await reply.populate("sender", "displayName phoneNumber avatar");

    // اگر تیکت بسته شده بود، باز شود
    if (ticket.status === "closed" && isCreator) {
      ticket.status = "reopened";
      ticket.closedAt = null;
      await ticket.save();
    }

    // اگر تیکت pending بود و کارشناس پاسخ داد، به in_progress تغییر کند
    if (ticket.status === "pending" && (isStaff || isAssigned)) {
      ticket.status = "in_progress";
      await ticket.save();
    }

    // Log activity
    await logActivity(protection.user.phoneNumber, "ticket.reply", {
      targetType: "Ticket",
      targetId: ticket._id,
      metadata: {
        ticketNumber: ticket.ticketNumber,
        replyId: reply._id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "پاسخ با موفقیت ارسال شد",
        data: { reply },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(`POST /api/tickets/${params.id}/reply error:`, error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

