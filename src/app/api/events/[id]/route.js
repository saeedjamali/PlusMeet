import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectApi } from "@/lib/middleware/apiProtection";
import Event from "@/lib/models/Event.model";
import "@/lib/models/User.model";
import "@/lib/models/TopicCategory.model";
import "@/lib/models/FormatModeCategory.model";
import "@/lib/models/ParticipationTypeCategory.model";
import "@/lib/models/ImpactPurposeCategory.model";
import "@/lib/models/SocialDynamicsCategory.model";
import "@/lib/models/AudienceTypeCategory.model";
import "@/lib/models/EmotionalCategory.model";
import "@/lib/models/IntentCategory.model";
import { logActivity } from "@/lib/models/ActivityLog.model";
import {
  VISIBLE_STATUSES_ARRAY,
  isEventVisible,
} from "@/lib/helpers/eventVisibility";

/**
 * GET /api/events/[id]
 * دریافت اطلاعات یک رویداد
 * پارامتر id می‌تواند slug یا _id باشد
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();

    // API Protection بدون authentication اجباری (برای رویدادهای عمومی)
    const protection = await protectApi(request);
    const userId = protection.success ? protection.user.id : null;
    const isAuthenticated = protection.success;

    const identifier = params.id; // می‌تواند slug یا _id باشد

    // ✅ دریافت invite token از query string
    const { searchParams } = new URL(request.url);
    const inviteToken = searchParams.get("invite");

    // ✅ Validation برای identifier
    if (
      !identifier ||
      identifier === "-1" ||
      identifier === "undefined" ||
      identifier === "null"
    ) {
      return NextResponse.json(
        { error: "شناسه رویداد نامعتبر است" },
        { status: 400 }
      );
    }

    // ✅ تشخیص اینکه identifier یک ObjectId است یا slug
    const mongoose = require("mongoose");
    const isObjectId =
      mongoose.Types.ObjectId.isValid(identifier) && identifier.length === 24;

    let event;

    if (isObjectId) {
      // جستجو با _id
      event = await Event.findById(identifier)
        .populate("creator", "firstName lastName username email avatar")
        .populate("topicCategory", "title code icon")
        .populate("topicSubcategory", "title code icon")
        .populate("formatMode", "title code icon")
        .populate("participationType", "title code icon")
        .populate("impactPurpose", "title code icon")
        .populate("socialDynamics", "title code icon")
        .populate("audienceType", "title code icon")
        .populate("emotional", "title code icon")
        .populate("intent", "title code icon")
        .lean();
    } else {
      // جستجو با slug
      event = await Event.findOne({ slug: identifier })
        .populate("creator", "firstName lastName username email avatar")
        .populate("topicCategory", "title code icon")
        .populate("topicSubcategory", "title code icon")
        .populate("formatMode", "title code icon")
        .populate("participationType", "title code icon")
        .populate("impactPurpose", "title code icon")
        .populate("socialDynamics", "title code icon")
        .populate("audienceType", "title code icon")
        .populate("emotional", "title code icon")
        .populate("intent", "title code icon")
        .lean();
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // ✅ رویدادهای حذف شده قابل مشاهده نیستند (حتی برای مالک)
    if (event.status === "deleted") {
      return NextResponse.json(
        { error: "این رویداد حذف شده است" },
        { status: 404 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // چک دسترسی (Access Control)
    // ═══════════════════════════════════════════════════════════
    const creatorId =
      event.creator?._id?.toString() || event.creator?.toString();
    const isOwner = userId && creatorId === userId;

    // قوانین دسترسی بر اساس visibility و status
    // رویدادهای با وضعیت approved, finished, expired قابل مشاهده هستند
    const hasVisibleStatus = VISIBLE_STATUSES_ARRAY.includes(event.status);
    const isPublic = hasVisibleStatus && event.visibility?.level === "public";

    const isUnlisted =
      hasVisibleStatus && event.visibility?.level === "unlisted";

    const isPrivate = event.visibility?.level === "private";

    // برای رویدادهای private فقط با invite token یا مالک می‌توان وارد شد
    const hasValidInvite =
      isPrivate && inviteToken && event.invitation?.inviteCode === inviteToken;

    // چک نهایی دسترسی
    let accessGranted = false;
    let accessType = null;
    let accessMessage = null;

    if (isOwner) {
      // مالک رویداد همیشه دسترسی دارد
      accessGranted = true;
      accessType = "owner";
    } else if (isPublic) {
      // رویدادهای عمومی با وضعیت قابل نمایش برای همه قابل دسترسی است
      accessGranted = true;
      accessType = "public";
    } else if (isUnlisted) {
      // رویدادهای unlisted با وضعیت قابل نمایش و لینک مستقیم قابل دسترسی است
      accessGranted = true;
      accessType = "unlisted";
    } else if (isPrivate && hasValidInvite) {
      // رویدادهای خصوصی فقط با invite token
      accessGranted = true;
      accessType = "private_invite";
    } else {
      // دسترسی رد شده
      accessGranted = false;

      if (isPrivate) {
        accessMessage = "این رویداد خصوصی است و نیاز به دعوت‌نامه دارد";
      } else if (event.status === "pending") {
        accessMessage = "این رویداد در انتظار تایید است";
      } else if (event.status === "rejected") {
        accessMessage = "این رویداد رد شده است";
      } else if (event.status === "draft") {
        accessMessage = "این رویداد هنوز منتشر نشده است";
      } else {
        accessMessage = "شما دسترسی لازم برای مشاهده این رویداد را ندارید";
      }
    }

    if (!accessGranted) {
      return NextResponse.json(
        {
          error: "Access denied",
          message: accessMessage,
          requiresInvite: isPrivate,
        },
        { status: 403 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // فیلتر کردن فیلدهای محدود شده (Privacy Fields)
    // ═══════════════════════════════════════════════════════════
    const eventData = { ...event };

    // اگر کاربر مالک نیست، فیلدهای محدود شده را مخفی کن
    if (!isOwner) {
      // مخفی کردن شماره تلفن اگر showPhone = false
      if (eventData.contactInfo && !eventData.contactInfo.showPhone) {
        delete eventData.contactInfo.phone;
      }

      // مخفی کردن ایمیل اگر showEmail = false
      if (eventData.contactInfo && !eventData.contactInfo.showEmail) {
        delete eventData.contactInfo.email;
      }

      // مخفی کردن آدرس دقیق برای رویدادهای آنلاین
      // یا اگر فیلد showAddress در آینده اضافه شود
      if (event.formatMode?.code === "ONLINE" && eventData.location) {
        delete eventData.location.address;
        delete eventData.location.postalCode;
        // فقط شهر و استان نمایش داده شود
      }

      // مخفی کردن فیلدهای داخلی
      delete eventData.invitation;
      delete eventData.inviteToken;
    }

    // ✅ logActivity را comment کردیم چون action در enum نیست
    // if (isAuthenticated) {
    //   await logActivity(userId, "event.view", {
    //     targetType: "Event",
    //     targetId: event._id.toString(),
    //     ipAddress:
    //       request.headers.get("x-forwarded-for") ||
    //       request.headers.get("x-real-ip") ||
    //       "unknown",
    //     userAgent: request.headers.get("user-agent") || "unknown",
    //     metadata: { eventTitle: event.title },
    //   });
    // }

    // ساخت لینک دعوت برای مالک رویدادهای private
    const inviteLink =
      isOwner &&
      event.visibility?.level === "private" &&
      event.invitation?.inviteCode
        ? `/events/${event.slug || event._id}?invite=${
            event.invitation.inviteCode
          }`
        : null;

    return NextResponse.json({
      success: true,
      event: eventData,
      isOwner,
      accessType,
      isAuthenticated,
      inviteLink,
    });
  } catch (error) {
    console.error("❌ Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]
 * حذف رویداد (فقط مالک و فقط پیش‌نویس‌ها یا رویدادهای رد شده)
 */
export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectApi(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error || "Unauthorized" },
        { status: protection.status || 401 }
      );
    }

    const eventId = params.id;
    const userId = protection.user.id;

    // ✅ Validation برای eventId
    if (
      !eventId ||
      eventId === "-1" ||
      eventId === "undefined" ||
      eventId === "null"
    ) {
      return NextResponse.json(
        { error: "شناسه رویداد نامعتبر است" },
        { status: 400 }
      );
    }

    // پیدا کردن رویداد
    const event = await Event.findById(eventId);

    if (!event) {
      return NextResponse.json({ error: "رویداد یافت نشد" }, { status: 404 });
    }

    // چک مالکیت
    if (event.creator.toString() !== userId) {
      return NextResponse.json(
        { error: "فقط مالک رویداد می‌تواند آن را حذف کند" },
        { status: 403 }
      );
    }

    // ✅ فقط رویدادهای approved و expired قابل حذف نیستند
    const nonDeletableStatuses = ["approved", "expired"];
    if (nonDeletableStatuses.includes(event.status)) {
      return NextResponse.json(
        {
          error: `رویدادهای ${
            event.status === "approved" ? "تایید شده" : "منقضی شده"
          } قابل حذف نیستند`,
        },
        { status: 400 }
      );
    }

    // ✅ اگر قبلاً حذف شده، خطا برگردان
    if (event.status === "deleted") {
      return NextResponse.json(
        { error: "این رویداد قبلاً حذف شده است" },
        { status: 400 }
      );
    }

    // ✅ Soft delete: وضعیت را به deleted تغییر بده
    event.status = "deleted";
    event.deletedAt = new Date();
    await event.save();

    // لاگ فعالیت
    await logActivity(userId, "event.delete", {
      targetType: "Event",
      targetId: eventId,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: {
        eventTitle: event.title,
        eventStatus: event.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "رویداد با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("❌ Error deleting event:", error);
    return NextResponse.json(
      { error: "خطا در حذف رویداد", details: error.message },
      { status: 500 }
    );
  }
}
