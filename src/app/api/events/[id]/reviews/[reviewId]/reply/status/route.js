import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import Review from "@/lib/models/Review.model";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * PUT /api/events/[id]/reviews/[reviewId]/reply/status
 * تایید یا رد پاسخ مالک توسط مدیر بخش نظرات
 */
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    // احراز هویت و بررسی دسترسی (مدیر بخش نظرات)
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        {
          error: protection.error || "شما به این بخش دسترسی ندارید",
          requiresAuth: true,
        },
        { status: protection.status || 403 }
      );
    }

    const userId = protection.user.id;
    const eventId = params.id;
    const reviewId = params.reviewId;

    const body = await request.json();
    const { status } = body; // "approved" | "rejected"

    // اعتبارسنجی
    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "وضعیت باید approved یا rejected باشد" },
        { status: 400 }
      );
    }

    // بررسی نظر
    const review = await Review.findOne({
      _id: reviewId,
      event: eventId,
    }).populate("event", "title");

    if (!review) {
      return NextResponse.json(
        { error: "نظر یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی وجود پاسخ
    if (!review.ownerResponse || !review.ownerResponse.text) {
      return NextResponse.json(
        { error: "این نظر پاسخی ندارد" },
        { status: 400 }
      );
    }

    // بروزرسانی وضعیت پاسخ
    review.ownerResponse.status = status;
    await review.save();

    // لاگ فعالیت
    await logActivity(
      userId, 
      status === "approved" ? "review.reply.approve" : "review.reply.reject",
      {
        targetType: "Review",
        targetId: reviewId,
        details: {
          eventId,
          eventTitle: review.event.title,
          action: status,
          replyText: review.ownerResponse.text.substring(0, 100),
        },
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      }
    );

    console.log(
      `✅ Reply status updated: ${reviewId} -> ${status} by moderator ${userId}`
    );

    return NextResponse.json({
      success: true,
      message:
        status === "approved"
          ? "پاسخ تایید شد و در صفحه رویداد نمایش داده خواهد شد"
          : "پاسخ رد شد",
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
    console.error("❌ Error updating reply status:", error);
    return NextResponse.json(
      { error: "خطا در بروزرسانی وضعیت پاسخ", details: error.message },
      { status: 500 }
    );
  }
}

