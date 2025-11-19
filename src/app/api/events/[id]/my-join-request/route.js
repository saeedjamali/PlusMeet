import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import JoinRequest from "@/lib/models/JoinRequest.model";

/**
 * GET /api/events/[id]/my-join-request
 * دریافت اطلاعات درخواست پیوستن کاربر به رویداد
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();

    // احراز هویت الزامی
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { 
          error: "لطفاً وارد سیستم شوید",
          requiresAuth: true
        },
        { status: 401 }
      );
    }

    const userId = protection.user.id;
    const eventId = params.id;

    // بررسی وجود درخواست
    const joinRequest = await JoinRequest.findOne({
      event: eventId,
      user: userId
    })
      .select('status requestedAt canceledAt payment')
      .lean();

    if (!joinRequest) {
      return NextResponse.json(
        { error: "درخواست پیوستن یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      joinRequest: {
        _id: joinRequest._id,
        status: joinRequest.status,
        requestedAt: joinRequest.requestedAt,
        canceledAt: joinRequest.canceledAt,
        payment: joinRequest.payment,
      },
    });

  } catch (error) {
    console.error("❌ Error getting join request:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات درخواست", details: error.message },
      { status: 500 }
    );
  }
}

