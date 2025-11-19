import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectApi } from "@/lib/middleware/apiProtection";
import Event from "@/lib/models/Event.model";
import "@/lib/models/User.model";
import "@/lib/models/TopicCategory.model";
import "@/lib/models/FormatModeCategory.model";
import "@/lib/models/ParticipationTypeCategory.model";
import { logActivity } from "@/lib/models/ActivityLog.model";
import { parsePersianDate } from "@/lib/utils/dateConverter";

/**
 * PUT /api/events/[id]/update
 * ویرایش رویداد
 */
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectApi(request);
    if (!protection.success) {
      console.error("❌ Protection failed:", protection.error);
      return NextResponse.json(
        { error: protection.error || "Unauthorized" },
        { status: protection.status || 401 }
      );
    }

    const eventId = params.id;
    const userId = protection.user.id;
    const body = await request.json();

    // پیدا کردن رویداد
    const event = await Event.findById(eventId);

    if (!event) {
      return NextResponse.json({ error: "رویداد یافت نشد" }, { status: 404 });
    }

    // چک مالکیت
    if (event.creator.toString() !== userId) {
      return NextResponse.json(
        { error: "فقط مالک رویداد می‌تواند آن را ویرایش کند" },
        { status: 403 }
      );
    }

    // تبدیل تاریخ‌های فارسی به میلادی (اگر وجود داشته باشند)
    if (body.startDate) {
      body.startDate = parsePersianDate(body.startDate);
    }
    if (body.endDate) {
      body.endDate = parsePersianDate(body.endDate);
    }
    if (body.registrationDeadline) {
      body.registrationDeadline = parsePersianDate(body.registrationDeadline);
    }
    if (body.ticket?.saleEndDate) {
      body.ticket.saleEndDate = parsePersianDate(body.ticket.saleEndDate);
    }
    if (body.schedule?.startDate) {
      body.schedule.startDate = parsePersianDate(body.schedule.startDate);
    }
    if (body.schedule?.endDate) {
      body.schedule.endDate = parsePersianDate(body.schedule.endDate);
    }

    // به‌روزرسانی فیلدها
    const allowedFields = [
      "title",
      "description",
      "topicCategory",
      "topicSubcategory",
      "images",
      "coverImage",
      "speakers",
      "contactInfo",
      "formatMode",
      "location",
      "onlinePlatform",
      "onlineLink",
      "capacity",
      "participationType",
      "ticket",
      "schedule",
      "startDate",
      "endDate",
      "visibility",
      "eligibility",
      "targetAudience",
      "createGroupChat",
      "hasCertificate",
      "certificateSettings",
      "intent",
      "emotional",
      "audienceType",
      "socialDynamics",
      "impactPurpose",
      "currentStep", // ✅ مرحله فعلی
      "completedSteps", // ✅ مراحل تکمیل شده
      "tags",
      "keywords",
      "organizer",
      "approval",
      "invitation",
      "inviteToken", // ✅ توکن دعوت
    ];

    // ✅ اگر invitation.inviteCode ارسال شده، از آن به عنوان inviteToken استفاده کن
    if (body.invitation?.inviteCode) {
      body.inviteToken = body.invitation.inviteCode;
    }

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        // ⚠️ برای inviteToken، اگر null است، set نکن (تا خطای duplicate key نداشته باشیم)
        if (field === 'inviteToken' && body[field] === null) {
          return; // skip این فیلد
        }
        event[field] = body[field];
      }
    });

    // ✅ تغییر وضعیت
    // اگر status در body ارسال شده، از آن استفاده کن (مثلاً draft یا pending)
    // در غیر این صورت:
    //  - اگر رویداد rejected بود، با ویرایش به pending تغییر می‌کند (ارسال مجدد)
    //  - اگر draft بود، به pending تغییر می‌کند
    //  - approved و expired را تغییر ندهیم
    const oldStatus = event.status; // ذخیره وضعیت قبلی
    
    if (body.status !== undefined) {
      event.status = body.status; // کاربر می‌خواهد draft ذخیره کند یا pending
    } else if (oldStatus === "rejected" || oldStatus === "draft") {
      event.status = "pending"; // ارسال مجدد یا ارسال اولیه -> در انتظار تایید
    }
    
    // پاک کردن دلیل رد قبلی (اگر وضعیت از rejected تغییر کرد)
    if (oldStatus === "rejected" && event.status !== "rejected") {
      event.rejectionReason = undefined;
    }

    console.log("✅ Event status after update:", event.status);
    console.log("✅ Current step:", event.currentStep);

    // به‌روزرسانی startDate و endDate از schedule (در صورت وجود)
    if (event.schedule?.startDate) {
      event.startDate = event.schedule.startDate;
    }
    if (event.schedule?.endDate) {
      event.endDate = event.schedule.endDate;
    }

    await event.save();

    // لاگ فعالیت
    await logActivity(userId, "event.update", {
      targetType: "Event",
      targetId: eventId,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: { eventTitle: event.title, newStatus: event.status },
    });

    // Populate برای response
    await event.populate("topicCategory", "title code icon");
    await event.populate("topicSubcategory", "title code icon");
    await event.populate("formatMode", "title code icon");
    await event.populate("participationType", "title code icon");
    await event.populate("creator", "firstName lastName username avatar");

    return NextResponse.json({
      success: true,
      message: "رویداد با موفقیت ویرایش شد و در انتظار تایید است",
      event,
    });
  } catch (error) {
    console.error("❌ Error updating event:", error);
    return NextResponse.json(
      { error: "خطا در ویرایش رویداد", details: error.message },
      { status: 500 }
    );
  }
}

