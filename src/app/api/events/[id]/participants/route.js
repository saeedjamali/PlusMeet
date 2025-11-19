import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectApi } from "@/lib/middleware/apiProtection";
import Event from "@/lib/models/Event.model";
import JoinRequest from "@/lib/models/JoinRequest.model";
import "@/lib/models/User.model";

/**
 * GET /api/events/[id]/participants
 * دریافت لیست شرکت‌کنندگان یک رویداد
 */
export async function GET(request, { params }) {
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
    const userId = protection.user.id;

    // چک کردن مالکیت رویداد
    const event = await Event.findById(eventId).lean();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.creator.toString() !== userId) {
      return NextResponse.json(
        { error: "Only event owner can view participants" },
        { status: 403 }
      );
    }

    // دریافت شرکت‌کنندگان
    const participants = await JoinRequest.find({ event: eventId })
      .populate("user", "firstName lastName username email avatar")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      participants,
      total: participants.length,
    });
  } catch (error) {
    console.error("❌ Error fetching participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants", details: error.message },
      { status: 500 }
    );
  }
}


