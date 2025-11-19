import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import Event from "@/lib/models/Event.model";
import Review from "@/lib/models/Review.model";
import User from "@/lib/models/User.model";

/**
 * GET /api/events/[id]/reviews/manage
 * دریافت نظرات برای مدیریت توسط مدیر بخش نظرات
 * این API محافظت شده با protectAPI است و دسترسی آن توسط RBAC کنترل می‌شود
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();

    // احراز هویت و بررسی دسترسی
    // دسترسی به این API از طریق RBAC و نقش "مدیر بخش نظرات" کنترل می‌شود
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

    const eventId = params.id;

    // بررسی وجود رویداد
    const event = await Event.findById(eventId).select("title status");

    if (!event) {
      return NextResponse.json(
        { error: "رویداد یافت نشد" },
        { status: 404 }
      );
    }

    // دریافت فیلتر وضعیت
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status"); // all | pending | approved | rejected

    let reviews;

    if (statusFilter === "pending") {
      // نظراتی که خودشان pending هستند یا پاسخشان pending است
      reviews = await Review.find({
        event: eventId,
        $or: [
          { status: "pending" }, // نظرات pending
          { 
            status: "approved",
            "ownerResponse.status": "pending" // نظرات approved با پاسخ pending
          }
        ]
      })
        .populate("user", "firstName lastName email profileImage")
        .populate("joinRequest", "status")
        .sort({ createdAt: -1 })
        .lean();
    } else if (statusFilter === "approved") {
      // فقط نظراتی که خودشان و پاسخشان (اگر دارند) approved هستند
      reviews = await Review.find({
        event: eventId,
        status: "approved",
        $or: [
          { "ownerResponse.text": { $exists: false } }, // بدون پاسخ
          { "ownerResponse.text": { $eq: "" } }, // پاسخ خالی
          { "ownerResponse.status": "approved" } // پاسخ approved
        ]
      })
        .populate("user", "firstName lastName email profileImage")
        .populate("joinRequest", "status")
        .sort({ createdAt: -1 })
        .lean();
    } else if (statusFilter === "rejected") {
      // نظرات rejected یا نظرات approved با پاسخ rejected
      reviews = await Review.find({
        event: eventId,
        $or: [
          { status: "rejected" },
          { 
            status: "approved",
            "ownerResponse.status": "rejected"
          }
        ]
      })
        .populate("user", "firstName lastName email profileImage")
        .populate("joinRequest", "status")
        .sort({ createdAt: -1 })
        .lean();
    } else {
      // all - همه نظرات
      reviews = await Review.find({ event: eventId })
        .populate("user", "firstName lastName email profileImage")
        .populate("joinRequest", "status")
        .sort({ createdAt: -1 })
        .lean();
    }

    return NextResponse.json({
      success: true,
      reviews,
      total: reviews.length,
      filterInfo: {
        filter: statusFilter || "all",
        description: 
          statusFilter === "pending" ? "نظرات و پاسخ‌های در انتظار تایید" :
          statusFilter === "approved" ? "نظرات و پاسخ‌های تایید شده" :
          statusFilter === "rejected" ? "نظرات و پاسخ‌های رد شده" :
          "همه نظرات و پاسخ‌ها"
      }
    });
  } catch (error) {
    console.error("❌ Error fetching reviews for management:", error);
    return NextResponse.json(
      { error: "خطا در دریافت نظرات", details: error.message },
      { status: 500 }
    );
  }
}

