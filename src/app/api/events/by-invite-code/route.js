import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import Event from "@/lib/models/Event.model";

/**
 * GET /api/events/by-invite-code?code=INVITE_CODE
 * دریافت اطلاعات رویداد با کد دعوت
 */
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const inviteCode = searchParams.get("code");

    if (!inviteCode) {
      return NextResponse.json(
        { error: "کد دعوت الزامی است" },
        { status: 400 }
      );
    }

    // جستجوی رویداد با کد دعوت
    const event = await Event.findOne({
      "invitation.inviteCode": inviteCode,
      status: "approved", // فقط رویدادهای تایید شده
    })
      .populate("participationType", "code title")
      .populate("topicCategory", "title icon")
      .populate("formatMode", "title code icon")
      .select(
        "title description images schedule formatMode location capacity registeredCount ticket participationType topicCategory status"
      )
      .lean();

    if (!event) {
      return NextResponse.json(
        { error: "رویدادی با این کد دعوت یافت نشد" },
        { status: 404 }
      );
    }

    // Debug: چک کردن نوع participationType
    console.log("🔍 Event found:", {
      eventId: event._id,
      participationType: event.participationType,
      participationTypeCode: event.participationType?.code,
    });

    // چک کنیم که رویداد دعوتی باشد
    // پشتیبانی از هر دو فرمت: INVITE_ONLY و INVITEONLY
    const participationCode = event.participationType?.code?.toUpperCase();
    if (
      participationCode !== "INVITE_ONLY" &&
      participationCode !== "INVITEONLY"
    ) {
      console.log("❌ Not an invite-only event. Code:", participationCode);
      return NextResponse.json(
        {
          error: "این رویداد از نوع دعوتی نیست",
          debug: {
            receivedCode: participationCode,
            expectedCode: "INVITE_ONLY or INVITEONLY",
          },
        },
        { status: 400 }
      );
    }

    console.log("✅ Valid invite-only event");

    return NextResponse.json({
      success: true,
      event: {
        _id: event._id,
        title: event.title,
        description: event.description,
        images: event.images,
        schedule: event.schedule,
        formatMode: event.formatMode,
        location: event.location,
        capacity: event.capacity,
        registeredCount: event.registeredCount,
        ticket: event.ticket,
        participationType: event.participationType,
        topicCategory: event.topicCategory,
        status: event.status,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching event by invite code:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات رویداد", details: error.message },
      { status: 500 }
    );
  }
}

