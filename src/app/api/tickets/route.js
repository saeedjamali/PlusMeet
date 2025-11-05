/**
 * API Route: Tickets
 * مدیریت تیکت‌ها
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Ticket from "@/lib/models/Ticket.model";
import TicketCategory from "@/lib/models/TicketCategory.model";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";
import {
  saveBase64Image,
  validateImageFile,
  ensureUploadDirectories,
} from "@/lib/utils/fileUpload";

/**
 * GET /api/tickets
 * دریافت لیست تیکت‌ها
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
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const myTickets = searchParams.get("myTickets") === "true";
    const assignedToMe = searchParams.get("assignedToMe") === "true";

    const skip = (page - 1) * limit;

    // ساخت query
    const query = {};

    // فیلتر بر اساس وضعیت
    if (status) {
      query.status = status;
    }

    // فیلتر بر اساس موضوع
    if (category) {
      query.category = category;
    }

    // فیلتر بر اساس اولویت
    if (priority) {
      query.priority = priority;
    }

    // جستجو در عنوان یا شماره تیکت
    if (search) {
      query.$or = [
        { subject: new RegExp(search, "i") },
        { ticketNumber: new RegExp(search, "i") },
      ];
    }

    // تیکت‌های خودم (ایجاد کرده‌ام)
    if (myTickets) {
      query.creator = protection.user.id;
    }

    // تیکت‌های ارجاع شده به من
    if (assignedToMe) {
      query.assignedTo = protection.user.id;
    }

    // محدودیت دسترسی به تیکت‌ها
    const userRoles = protection.user.roles || [];
    const isAdmin = userRoles.includes("admin");

    // فقط admin می‌تواند همه تیکت‌ها را ببیند
    // بقیه فقط تیکت‌های خودشان یا assign شده به خودشان را می‌بینند
    if (!isAdmin) {
      query.$or = [
        { creator: protection.user.id },
        { assignedTo: protection.user.id },
      ];
    }

    const tickets = await Ticket.find(query)
      .populate("category", "title icon color")
      .populate("creator", "displayName phoneNumber avatar")
      .populate("assignedTo", "displayName phoneNumber avatar")
      .populate("assignedRole", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Ticket.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        tickets,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/tickets error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

/**
 * POST /api/tickets
 * ایجاد تیکت جدید
 */
export async function POST(request) {
  try {
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    await connectDB();

    const body = await request.json();
    const { category, subject, description, image, priority } = body;

    // Validation
    if (!category || !subject || !description) {
      return NextResponse.json(
        { error: "موضوع، عنوان و توضیحات الزامی است" },
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
        console.log(`✅ Ticket image saved: ${imageUrl}`);
      } catch (imageError) {
        console.error("Error saving ticket image:", imageError);
        return NextResponse.json(
          { error: imageError.message || "خطا در ذخیره تصویر" },
          { status: 400 }
        );
      }
    }

    // بررسی موضوع
    const categoryDoc = await TicketCategory.findById(category);
    if (!categoryDoc) {
      return NextResponse.json({ error: "موضوع یافت نشد" }, { status: 404 });
    }

    if (!categoryDoc.isActive) {
      return NextResponse.json(
        { error: "این موضوع غیرفعال است" },
        { status: 400 }
      );
    }

    // ایجاد تیکت
    const attachments = [];
    if (imageUrl) {
      attachments.push({
        url: imageUrl,
        type: "image",
        uploadedAt: new Date(),
      });
    }

    const ticket = await Ticket.create({
      category,
      subject,
      description,
      attachments,
      priority: priority || "medium",
      creator: protection.user.id,
      assignedTo: categoryDoc.assignedUser || null,
      assignedRole: categoryDoc.assignedRole,
      assignmentHistory: [
        {
          toUser: categoryDoc.assignedUser || null,
          toRole: categoryDoc.assignedRole,
          reason: "ارجاع اولیه بر اساس موضوع تیکت",
          assignedAt: new Date(),
          assignedBy: protection.user.id,
        },
      ],
    });

    await ticket.populate("category", "title icon color");
    await ticket.populate("creator", "displayName phoneNumber avatar");
    await ticket.populate("assignedTo", "displayName phoneNumber avatar");
    await ticket.populate("assignedRole", "name slug");

    // Log activity
    await logActivity(protection.user.phoneNumber, "ticket.create", {
      targetType: "Ticket",
      targetId: ticket._id,
      metadata: {
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "تیکت با موفقیت ایجاد شد",
        data: { ticket },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/tickets error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
