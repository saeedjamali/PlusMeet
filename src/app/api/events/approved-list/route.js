import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import Event from "@/lib/models/Event.model";

/**
 * GET /api/events/approved-list
 * دریافت لیست رویدادهای تایید شده (فقط id و title)
 * برای استفاده در فیلدهای select و dropdown
 */
export async function GET(request) {
  try {
    await dbConnect();

    // دریافت query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    // ساخت query
    const query = {
      status: "approved",
    };

    // اگر جستجو وجود داشت
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    // دریافت رویدادها
    const events = await Event.find(query)
      .select("_id title slug schedule.startDate")
      .sort({ "schedule.startDate": -1, createdAt: -1 })
      .limit(100) // حداکثر 100 رویداد
      .lean();

    return NextResponse.json({
      success: true,
      events: events.map((event) => ({
        _id: event._id,
        title: event.title,
        slug: event.slug,
        startDate: event.schedule?.startDate,
      })),
      count: events.length,
    });
  } catch (error) {
    console.error("❌ Error fetching approved events:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لیست رویدادها", details: error.message },
      { status: 500 }
    );
  }
}

