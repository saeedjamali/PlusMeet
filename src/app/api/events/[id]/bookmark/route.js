import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import EventBookmark from "@/lib/models/EventBookmark.model";
import Event from "@/lib/models/Event.model";
import { protectApi } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * POST /api/events/[id]/bookmark
 * نشان کردن رویداد
 */
export async function POST(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectApi(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    const userId = protection.user.id;
    const eventId = params.id;

    // بررسی وجود رویداد
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "رویداد یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی وجود bookmark قبلی
    const existingBookmark = await EventBookmark.findOne({
      user: userId,
      event: eventId,
    });

    if (existingBookmark) {
      return NextResponse.json(
        { error: "این رویداد قبلاً نشان شده است" },
        { status: 400 }
      );
    }

    // ایجاد bookmark
    const bookmark = await EventBookmark.create({
      user: userId,
      event: eventId,
    });

    // لاگ فعالیت
    await logActivity(userId, "event.bookmark", {
      targetType: "Event",
      targetId: eventId,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: { eventTitle: event.title },
    });

    return NextResponse.json({
      success: true,
      message: "رویداد با موفقیت نشان شد",
      data: {
        ...bookmark.toObject(),
        _id: bookmark._id.toString(),
      },
    });
  } catch (error) {
    console.error("❌ Error bookmarking event:", error);
    return NextResponse.json(
      { error: "خطا در نشان کردن رویداد", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]/bookmark
 * حذف نشان رویداد
 */
export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectApi(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    const userId = protection.user.id;
    const eventId = params.id;

    // حذف bookmark
    const result = await EventBookmark.findOneAndDelete({
      user: userId,
      event: eventId,
    });

    if (!result) {
      return NextResponse.json(
        { error: "نشان یافت نشد" },
        { status: 404 }
      );
    }

    // لاگ فعالیت
    await logActivity(userId, "event.unbookmark", {
      targetType: "Event",
      targetId: eventId,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      message: "نشان رویداد حذف شد",
    });
  } catch (error) {
    console.error("❌ Error removing bookmark:", error);
    return NextResponse.json(
      { error: "خطا در حذف نشان", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/events/[id]/bookmark
 * بررسی نشان بودن رویداد
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectApi(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    const userId = protection.user.id;
    const eventId = params.id;

    const bookmark = await EventBookmark.findOne({
      user: userId,
      event: eventId,
    });

    return NextResponse.json({
      success: true,
      isBookmarked: !!bookmark,
    });
  } catch (error) {
    console.error("❌ Error checking bookmark:", error);
    return NextResponse.json(
      { error: "خطا در بررسی نشان", details: error.message },
      { status: 500 }
    );
  }
}


