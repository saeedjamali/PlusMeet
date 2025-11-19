import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import Event from "@/lib/models/Event.model";
import { protectApi } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";

// Import models برای populate
import "@/lib/models/User.model";
import "@/lib/models/TopicCategory.model";
import "@/lib/models/FormatModeCategory.model";
import "@/lib/models/ParticipationTypeCategory.model";

/**
 * GET /api/dashboard/eventmanagment
 * دریافت لیست تمام رویدادها برای مدیران
 */
export async function GET(request) {
  try {
    await dbConnect();

    const protection = await protectApi(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    // بررسی دسترسی مدیریت
    // TODO: اضافه کردن بررسی نقش کاربر (admin یا moderator)
    const userId = protection.user.id;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    let query = { status: { $ne: "deleted" } }; // عدم نمایش رویدادهای حذف شده

    // فیلتر بر اساس وضعیت
    if (status && status !== "all") {
      query.status = status;
    }

    // جستجو بر اساس عنوان یا توضیحات
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const events = await Event.find(query)
      .populate("creator", "firstName lastName displayName avatar email phoneNumber")
      .populate("topicCategory", "title code icon")
      .populate("topicSubcategory", "title code icon")
      .populate("formatMode", "title code icon")
      .populate("participationType", "title code icon")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Event.countDocuments(query);

    // آمار وضعیت‌ها
    const stats = {
      draft: await Event.countDocuments({ status: "draft" }),
      pending: await Event.countDocuments({ status: "pending" }),
      approved: await Event.countDocuments({ status: "approved" }),
      rejected: await Event.countDocuments({ status: "rejected" }),
      suspended: await Event.countDocuments({ status: "suspended" }),
      expired: await Event.countDocuments({ status: "expired" }),
      total: await Event.countDocuments({ status: { $ne: "deleted" } }),
    };

    // تبدیل _id به string
    const eventsData = events.map((event) => ({
      ...event,
      _id: event._id.toString(),
      creator: event.creator
        ? {
            ...event.creator,
            _id: event.creator._id.toString(),
          }
        : null,
      topicCategory: event.topicCategory
        ? {
            ...event.topicCategory,
            _id: event.topicCategory._id.toString(),
          }
        : null,
      topicSubcategory: event.topicSubcategory
        ? {
            ...event.topicSubcategory,
            _id: event.topicSubcategory._id.toString(),
          }
        : null,
      formatMode: event.formatMode
        ? {
            ...event.formatMode,
            _id: event.formatMode._id.toString(),
          }
        : null,
      participationType: event.participationType
        ? {
            ...event.participationType,
            _id: event.participationType._id.toString(),
          }
        : null,
    }));

    // لاگ فعالیت
    await logActivity(userId, "event.list_all", {
      targetType: "Event",
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: { total, page, limit, status, search },
    });

    return NextResponse.json({
      success: true,
      data: eventsData,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("❌ Error fetching events for management:", error);
    return NextResponse.json(
      { error: "خطا در دریافت رویدادها", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dashboard/eventmanagment
 * تغییر وضعیت رویداد توسط مدیر
 */
export async function PUT(request) {
  try {
    await dbConnect();

    const protection = await protectApi(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    // TODO: بررسی نقش مدیریت
    const userId = protection.user.id;

    const body = await request.json();
    const { eventId, action, status, rejectionReason } = body;

    if (!eventId || !action) {
      return NextResponse.json(
        { error: "شناسه رویداد و عملیات الزامی است" },
        { status: 400 }
      );
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "رویداد یافت نشد" },
        { status: 404 }
      );
    }

    let updateData = {};
    let actionDescription = "";

    switch (action) {
      case "approve":
        updateData.status = "approved";
        updateData["approval.approvedBy"] = userId;
        updateData["approval.approvedAt"] = new Date();
        actionDescription = "تایید";
        break;

      case "reject":
        updateData.status = "rejected";
        updateData["approval.rejectedBy"] = userId;
        updateData["approval.rejectedAt"] = new Date();
        updateData.rejectionReason = rejectionReason || ""; // ✅ مستقیم، نه approval.rejectionReason
        actionDescription = "رد";
        break;

      case "suspend":
        updateData.status = "suspended";
        actionDescription = "تعلیق";
        break;

      case "activate":
        updateData.status = "approved";
        actionDescription = "فعال‌سازی";
        break;

      case "delete":
        updateData.status = "deleted";
        updateData.deletedAt = new Date();
        actionDescription = "حذف";
        break;

      case "changeStatus":
        if (!status) {
          return NextResponse.json(
            { error: "وضعیت جدید الزامی است" },
            { status: 400 }
          );
        }
        updateData.status = status;
        actionDescription = `تغییر وضعیت به ${status}`;
        break;

      default:
        return NextResponse.json(
          { error: "عملیات نامعتبر" },
          { status: 400 }
        );
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { $set: updateData },
      { new: true }
    )
      .populate("creator", "firstName lastName displayName")
      .lean();

    // لاگ فعالیت
    await logActivity(userId, `event.manage_${action}`, {
      targetType: "Event",
      targetId: eventId,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: {
        eventTitle: event.title,
        action: actionDescription,
        oldStatus: event.status,
        newStatus: updateData.status,
        rejectionReason,
      },
    });

    return NextResponse.json({
      success: true,
      message: `رویداد با موفقیت ${actionDescription} شد`,
      data: {
        ...updatedEvent,
        _id: updatedEvent._id.toString(),
      },
    });
  } catch (error) {
    console.error("❌ Error managing event:", error);
    return NextResponse.json(
      { error: "خطا در مدیریت رویداد", details: error.message },
      { status: 500 }
    );
  }
}

