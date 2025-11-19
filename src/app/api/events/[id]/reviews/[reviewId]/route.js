import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import Event from "@/lib/models/Event.model";
import Review from "@/lib/models/Review.model";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * PUT /api/events/[id]/reviews/[reviewId]
 * تغییر وضعیت نظر (تایید/رد) توسط مالک
 */
export async function PUT(request, { params }) {
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
    const { status, rejectionReason } = body;

    // اعتبارسنجی
    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "وضعیت نامعتبر است" },
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

    // تغییر وضعیت
    const oldStatus = review.status;
    review.status = status;
    
    if (status === "rejected" && rejectionReason) {
      review.rejectionReason = rejectionReason;
    }

    await review.save();

    // لاگ فعالیت
    await logActivity(
      userId, 
      status === "approved" ? "review.approve" : status === "rejected" ? "review.reject" : "review.moderate", 
      {
        targetType: "Review",
        targetId: reviewId,
        details: {
          eventId,
          eventTitle: event.title,
          oldStatus,
          newStatus: status,
          rejectionReason,
        },
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      }
    );

    console.log(`✅ Review ${reviewId} status changed: ${oldStatus} → ${status}`);

    return NextResponse.json({
      success: true,
      message: `نظر ${status === "approved" ? "تایید" : "رد"} شد`,
      review: {
        _id: review._id,
        status: review.status,
      },
    });
  } catch (error) {
    console.error("❌ Error updating review status:", error);
    return NextResponse.json(
      { error: "خطا در تغییر وضعیت نظر", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]/reviews/[reviewId]
 * حذف نظر توسط مالک
 */
export async function DELETE(request, { params }) {
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

    // حذف نظر
    const review = await Review.findOneAndDelete({
      _id: reviewId,
      event: eventId,
    });

    if (!review) {
      return NextResponse.json(
        { error: "نظر یافت نشد" },
        { status: 404 }
      );
    }

    // بروزرسانی امتیاز رویداد
    await Review.updateEventRating(eventId);

    // لاگ فعالیت
    await logActivity(userId, "review.delete", {
      targetType: "Review",
      targetId: reviewId,
      details: {
        eventId,
        eventTitle: event.title,
      },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    console.log(`✅ Review ${reviewId} deleted`);

    return NextResponse.json({
      success: true,
      message: "نظر حذف شد",
    });
  } catch (error) {
    console.error("❌ Error deleting review:", error);
    return NextResponse.json(
      { error: "خطا در حذف نظر", details: error.message },
      { status: 500 }
    );
  }
}

