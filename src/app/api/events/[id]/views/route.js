import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectApi } from "@/lib/middleware/apiProtection";
import Event from "@/lib/models/Event.model";

/**
 * POST /api/events/[id]/views
 * افزایش شمارنده بازدید
 */
export async function POST(request, { params }) {
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

    // افزایش شمارنده بازدید
    const event = await Event.findByIdAndUpdate(
      eventId,
      { $inc: { views: 1 } },
      { new: true, select: "views" }
    );

    if (!event) {
      return NextResponse.json({ error: "رویداد یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      views: event.views,
    });
  } catch (error) {
    console.error("❌ Error incrementing views:", error);
    return NextResponse.json(
      { error: "خطا در افزایش بازدید", details: error.message },
      { status: 500 }
    );
  }
}


