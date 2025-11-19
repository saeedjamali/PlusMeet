import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import EventBookmark from "@/lib/models/EventBookmark.model";
import { protectApi } from "@/lib/middleware/apiProtection";

// Import models برای populate
import "@/lib/models/User.model";
import "@/lib/models/Event.model";
import "@/lib/models/TopicCategory.model";

/**
 * GET /api/dashboard/eventsBookmark
 * دریافت لیست رویدادهای نشان شده توسط کاربر
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

    const userId = protection.user.id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    // دریافت bookmarks
    const bookmarks = await EventBookmark.find({ user: userId })
      .populate({
        path: "event",
        populate: [
          {
            path: "creator",
            select: "firstName lastName displayName avatar",
          },
          {
            path: "topicCategory",
            select: "title code icon",
          },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await EventBookmark.countDocuments({ user: userId });

    // فیلتر کردن bookmarks که رویدادشان حذف شده
    const validBookmarks = bookmarks.filter(
      (bookmark) => bookmark.event && bookmark.event.status !== "deleted"
    );

    // تبدیل _id به string
    const bookmarksData = validBookmarks.map((bookmark) => ({
      ...bookmark,
      _id: bookmark._id.toString(),
      event: bookmark.event
        ? {
            ...bookmark.event,
            _id: bookmark.event._id.toString(),
            creator: bookmark.event.creator
              ? {
                  ...bookmark.event.creator,
                  _id: bookmark.event.creator._id.toString(),
                }
              : null,
            topicCategory: bookmark.event.topicCategory
              ? {
                  ...bookmark.event.topicCategory,
                  _id: bookmark.event.topicCategory._id.toString(),
                }
              : null,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: bookmarksData,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching bookmarks:", error);
    return NextResponse.json(
      { error: "خطا در دریافت نشان‌ها", details: error.message },
      { status: 500 }
    );
  }
}


