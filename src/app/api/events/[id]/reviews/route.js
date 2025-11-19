import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import Event from "@/lib/models/Event.model";
import Review from "@/lib/models/Review.model";
import JoinRequest from "@/lib/models/JoinRequest.model";
import User from "@/lib/models/User.model";
import { FINAL_EVENT_STATUSES } from "@/lib/utils/joinRequestHelpers";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET /api/events/[id]/reviews
 * دریافت نظرات یک رویداد
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const eventId = params.id;

    // دریافت نظرات تایید شده
    const reviews = await Review.find({
      event: eventId,
      status: "approved",
    })
      .populate("user", "firstName lastName profileImage")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // دریافت آمار
    const stats = await Review.getEventStats(eventId);

    return NextResponse.json({
      success: true,
      reviews,
      stats,
    });
  } catch (error) {
    console.error("❌ Error fetching reviews:", error);
    return NextResponse.json(
      { error: "خطا در دریافت نظرات", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/[id]/reviews
 * ثبت نظر جدید
 */
export async function POST(request, { params }) {
  try {
    await dbConnect();

    // احراز هویت الزامی
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        {
          error: "لطفاً وارد سیستم شوید",
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    const userId = protection.user.id;
    const eventId = params.id;

    const body = await request.json();
    const { rating, comment, detailedRatings, joinRequestId } = body;

    // اعتبارسنجی ورودی
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "امتیاز کلی باید بین 1 تا 5 باشد" },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // بررسی رویداد
    // ═══════════════════════════════════════════════════════════
    const event = await Event.findById(eventId);

    if (!event) {
      return NextResponse.json(
        { error: "رویداد یافت نشد" },
        { status: 404 }
      );
    }

    // چک کردن وضعیت رویداد (باید finished یا expired باشد)
    if (!["finished", "expired"].includes(event.status)) {
      return NextResponse.json(
        {
          error: "فقط می‌توانید برای رویدادهای پایان یافته یا منقضی شده نظر ثبت کنید",
        },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // بررسی درخواست پیوستن کاربر
    // ═══════════════════════════════════════════════════════════
    const joinRequest = await JoinRequest.findOne({
      _id: joinRequestId || undefined,
      event: eventId,
      user: userId,
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: "شما در این رویداد شرکت نکرده‌اید" },
        { status: 403 }
      );
    }

    // چک کردن وضعیت درخواست (باید در FINAL_EVENT_STATUSES باشد)
    if (!FINAL_EVENT_STATUSES.includes(joinRequest.status)) {
      return NextResponse.json(
        {
          error: `برای ثبت نظر، وضعیت شرکت شما باید نهایی شده باشد. وضعیت فعلی: ${joinRequest.status}`,
        },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // چک کردن نظر قبلی
    // ═══════════════════════════════════════════════════════════
    const existingReview = await Review.findOne({
      event: eventId,
      user: userId,
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "شما قبلاً برای این رویداد نظر ثبت کرده‌اید" },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // ایجاد نظر جدید
    // ═══════════════════════════════════════════════════════════
    const review = new Review({
      event: eventId,
      user: userId,
      joinRequest: joinRequest._id,
      rating,
      comment: comment || "",
      detailedRatings: detailedRatings || {},
      status: "pending", // ✅ در انتظار تایید مالک
    });

    await review.save();

    // لاگ فعالیت
    await logActivity(userId, "review.create", {
      targetType: "Review",
      targetId: review._id,
      details: {
        eventId,
        eventTitle: event.title,
        rating,
        hasComment: !!comment,
        detailedRatingsCount: Object.keys(detailedRatings || {}).length,
      },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    console.log(`✅ Review created: ${review._id} for event ${eventId} by user ${userId}`);

    return NextResponse.json({
      success: true,
      message: "نظر شما با موفقیت ثبت شد و پس از تایید مالک رویداد نمایش داده خواهد شد",
      review: {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        createdAt: review.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Error creating review:", error);
    return NextResponse.json(
      { error: "خطا در ثبت نظر", details: error.message },
      { status: 500 }
    );
  }
}

