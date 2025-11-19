import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import Event from "@/lib/models/Event.model";
import Review from "@/lib/models/Review.model";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * POST /api/events/[id]/reviews/[reviewId]/reply
 * ثبت پاسخ به نظر توسط مالک رویداد
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
    const reviewId = params.reviewId;

    const body = await request.json();
    const { reply } = body;

    // اعتبارسنجی
    if (!reply || !reply.trim()) {
      return NextResponse.json(
        { error: "متن پاسخ الزامی است" },
        { status: 400 }
      );
    }

    if (reply.length > 500) {
      return NextResponse.json(
        { error: "متن پاسخ نباید بیشتر از 500 کاراکتر باشد" },
        { status: 400 }
      );
    }

    // بررسی رویداد و مالکیت
    const event = await Event.findById(eventId).select("creator title");

    if (!event) {
      return NextResponse.json(
        { error: "رویداد یافت نشد" },
        { status: 404 }
      );
    }

    if (event.creator.toString() !== userId) {
      return NextResponse.json(
        { error: "شما مالک این رویداد نیستید" },
        { status: 403 }
      );
    }

    // بررسی نظر
    const review = await Review.findOne({
      _id: reviewId,
      event: eventId,
    });

    if (!review) {
      return NextResponse.json(
        { error: "نظر یافت نشد" },
        { status: 404 }
      );
    }

    // فقط به نظرات تایید شده می‌توان پاسخ داد
    if (review.status !== "approved") {
      return NextResponse.json(
        { error: "فقط می‌توانید به نظرات تایید شده پاسخ دهید" },
        { status: 400 }
      );
    }

    // ثبت پاسخ (با وضعیت pending برای تایید توسط مدیر)
    review.ownerResponse = {
      text: reply.trim(),
      respondedAt: new Date(),
      status: "pending", // ✅ منتظر تایید مدیر بخش نظرات
      responderId: userId,
    };

    await review.save();

    // لاگ فعالیت
    await logActivity(userId, "review.reply", {
      targetType: "Review",
      targetId: reviewId,
      details: {
        eventId,
        eventTitle: event.title,
        replyLength: reply.trim().length,
      },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    console.log(`✅ Reply added to review ${reviewId}`);

    return NextResponse.json({
      success: true,
      message: "پاسخ شما ثبت شد و پس از تایید مدیر نمایش داده خواهد شد",
      review: {
        _id: review._id,
        ownerResponse: {
          text: review.ownerResponse.text,
          status: review.ownerResponse.status,
          respondedAt: review.ownerResponse.respondedAt,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error adding reply to review:", error);
    return NextResponse.json(
      { error: "خطا در ثبت پاسخ", details: error.message },
      { status: 500 }
    );
  }
}

