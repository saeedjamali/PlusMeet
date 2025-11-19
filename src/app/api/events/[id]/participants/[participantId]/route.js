import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectApi } from "@/lib/middleware/apiProtection";
import Event from "@/lib/models/Event.model";
import JoinRequest from "@/lib/models/JoinRequest.model";
import { logActivity } from "@/lib/models/ActivityLog.model";
import { JOIN_REQUEST_STATUS } from "@/lib/helpers/joinRequestStatus";

/**
 * PUT /api/events/[id]/participants/[participantId]
 * به‌روزرسانی وضعیت یک شرکت‌کننده
 */
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectApi(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error || "Unauthorized" },
        { status: protection.status || 401 }
      );
    }

    const { id: eventId, participantId } = params;
    const userId = protection.user.id;
    const body = await request.json();
    const { status, notes } = body;

    // اعتبارسنجی وضعیت
    if (!status || !Object.values(JOIN_REQUEST_STATUS).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // چک کردن مالکیت رویداد
    const event = await Event.findById(eventId).lean();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.creator.toString() !== userId) {
      return NextResponse.json(
        { error: "Only event owner can update participant status" },
        { status: 403 }
      );
    }

    // یافتن و به‌روزرسانی JoinRequest
    const joinRequest = await JoinRequest.findOne({
      _id: participantId,
      event: eventId,
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    const oldStatus = joinRequest.status;

    // به‌روزرسانی وضعیت
    joinRequest.status = status;
    if (notes) {
      joinRequest.notes = notes;
    }

    // اگر وضعیت به APPROVED تغییر کرد، زمان تایید را ثبت کن
    if (
      status === JOIN_REQUEST_STATUS.APPROVED &&
      oldStatus !== JOIN_REQUEST_STATUS.APPROVED
    ) {
      joinRequest.approvedAt = new Date();
      joinRequest.approvedBy = userId;
    }

    // اگر وضعیت به REJECTED تغییر کرد، زمان رد را ثبت کن
    if (
      status === JOIN_REQUEST_STATUS.REJECTED &&
      oldStatus !== JOIN_REQUEST_STATUS.REJECTED
    ) {
      joinRequest.rejectedAt = new Date();
      joinRequest.rejectedBy = userId;
    }

    await joinRequest.save();

    // لاگ فعالیت
    await logActivity({
      user: userId,
      action: "participant.status.update",
      category: "events",
      targetModel: "JoinRequest",
      targetId: participantId,
      details: {
        eventId,
        eventTitle: event.title,
        oldStatus,
        newStatus: status,
      },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      message: "Participant status updated successfully",
      participant: joinRequest,
    });
  } catch (error) {
    console.error("❌ Error updating participant status:", error);
    return NextResponse.json(
      { error: "Failed to update participant status", details: error.message },
      { status: 500 }
    );
  }
}


