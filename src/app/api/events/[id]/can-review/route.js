import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import Event from "@/lib/models/Event.model";
import Review from "@/lib/models/Review.model";
import JoinRequest from "@/lib/models/JoinRequest.model";
import { FINAL_EVENT_STATUSES } from "@/lib/utils/joinRequestHelpers";

/**
 * GET /api/events/[id]/can-review
 * بررسی امکان ثبت نظر برای کاربر
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();

    // احراز هویت الزامی
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        {
          canReview: false,
          reason: "requiresAuth",
          message: "لطفاً وارد سیستم شوید",
        },
        { status: 200 }
      );
    }

    const userId = protection.user.id;
    const eventId = params.id;

    // ═══════════════════════════════════════════════════════════
    // بررسی رویداد
    // ═══════════════════════════════════════════════════════════
    const event = await Event.findById(eventId).select("status title");

    if (!event) {
      return NextResponse.json(
        {
          canReview: false,
          reason: "eventNotFound",
          message: "رویداد یافت نشد",
        },
        { status: 404 }
      );
    }

    // چک کردن وضعیت رویداد
    if (!["finished", "expired"].includes(event.status)) {
      return NextResponse.json(
        {
          canReview: false,
          reason: "eventNotFinished",
          message: "فقط می‌توانید برای رویدادهای پایان یافته نظر ثبت کنید",
          eventStatus: event.status,
        },
        { status: 200 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // بررسی درخواست پیوستن
    // ═══════════════════════════════════════════════════════════
    const joinRequest = await JoinRequest.findOne({
      event: eventId,
      user: userId,
    }).select("status _id");

    if (!joinRequest) {
      return NextResponse.json(
        {
          canReview: false,
          reason: "notParticipated",
          message: "شما در این رویداد شرکت نکرده‌اید",
        },
        { status: 200 }
      );
    }

    // چک کردن وضعیت درخواست
    if (!FINAL_EVENT_STATUSES.includes(joinRequest.status)) {
      return NextResponse.json(
        {
          canReview: false,
          reason: "statusNotFinal",
          message: "وضعیت شرکت شما هنوز نهایی نشده است",
          joinRequestStatus: joinRequest.status,
        },
        { status: 200 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // بررسی نظر قبلی
    // ═══════════════════════════════════════════════════════════
    const existingReview = await Review.findOne({
      event: eventId,
      user: userId,
    }).select("_id rating createdAt");

    if (existingReview) {
      return NextResponse.json(
        {
          canReview: false,
          reason: "alreadyReviewed",
          message: "شما قبلاً برای این رویداد نظر ثبت کرده‌اید",
          existingReview: {
            _id: existingReview._id,
            rating: existingReview.rating,
            createdAt: existingReview.createdAt,
          },
        },
        { status: 200 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // می‌تواند نظر ثبت کند
    // ═══════════════════════════════════════════════════════════
    return NextResponse.json({
      canReview: true,
      reason: "eligible",
      message: "شما می‌توانید نظر خود را ثبت کنید",
      joinRequestId: joinRequest._id,
    });
  } catch (error) {
    console.error("❌ Error checking review eligibility:", error);
    return NextResponse.json(
      {
        canReview: false,
        reason: "error",
        message: "خطا در بررسی امکان نظردهی",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

