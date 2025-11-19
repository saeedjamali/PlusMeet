import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import JoinRequest from "@/lib/models/JoinRequest.model";
import Wallet from "@/lib/models/Wallet.model";
import Event from "@/lib/models/Event.model";
import { JOIN_REQUEST_STATUS } from "@/lib/helpers/joinRequestStatus";
import { validateUserAction } from "@/lib/utils/joinRequestHelpers";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * POST /api/events/[id]/cancel-request
 * لغو درخواست پیوستن به رویداد توسط کاربر
 */
export async function POST(request, { params }) {
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

    // ═══════════════════════════════════════════════════════════
    // بررسی وجود درخواست
    // ═══════════════════════════════════════════════════════════
    const joinRequest = await JoinRequest.findOne({
      event: eventId,
      user: userId
    })
      .populate('event', 'title ticket owner');

    if (!joinRequest) {
      return NextResponse.json(
        { error: "درخواست پیوستن یافت نشد" },
        { status: 404 }
      );
    }

    const currentStatus = joinRequest.status;

    // ═══════════════════════════════════════════════════════════
    // اعتبارسنجی: آیا کاربر می‌تواند لغو کند؟
    // ═══════════════════════════════════════════════════════════
    const validation = validateUserAction(currentStatus, JOIN_REQUEST_STATUS.CANCELED);

    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: validation.reason,
          currentStatus: currentStatus,
          canCancel: false
        },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // اگر مبلغ رزرو شده بود، آزادسازی کنیم
    // ═══════════════════════════════════════════════════════════
    if (currentStatus === JOIN_REQUEST_STATUS.PAYMENT_RESERVED) {
      const reservedAmount = joinRequest.payment?.amount || 0;

      if (reservedAmount > 0) {
        const userWallet = await Wallet.findOne({ userId });

        if (userWallet) {
          await userWallet.releaseReservedAmount(reservedAmount, {
            type: 'event_cancel_release',
            description: `لغو درخواست و آزادسازی رزرو: ${joinRequest.event.title}`,
            eventId: eventId,
            joinRequestId: joinRequest._id
          });
        }
      }
    }

    // ═══════════════════════════════════════════════════════════
    // تغییر وضعیت به CANCELED
    // ═══════════════════════════════════════════════════════════
    const previousStatus = joinRequest.status;
    joinRequest.status = JOIN_REQUEST_STATUS.CANCELED;
    joinRequest.canceledAt = new Date();
    joinRequest.canceledBy = userId;

    // اضافه کردن به تاریخچه وضعیت‌ها
    if (!joinRequest.statusHistory) {
      joinRequest.statusHistory = [];
    }
    joinRequest.statusHistory.push({
      status: JOIN_REQUEST_STATUS.CANCELED,
      changedBy: userId,
      changedAt: new Date(),
      reason: 'لغو توسط کاربر',
      previousStatus
    });

    await joinRequest.save();

    // اگر قبلاً confirmed بود، تعداد ثبت‌نام را کم کنیم
    if (previousStatus === JOIN_REQUEST_STATUS.CONFIRMED) {
      await Event.findByIdAndUpdate(eventId, {
        $inc: { registeredCount: -1 }
      });
    }

    // لاگ فعالیت
    await logActivity(userId, 'event.cancel_request', {
      targetType: 'Event',
      targetId: eventId,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        eventTitle: joinRequest.event.title,
        previousStatus,
        newStatus: JOIN_REQUEST_STATUS.CANCELED,
      },
    });

    return NextResponse.json({
      success: true,
      message: "درخواست شما با موفقیت لغو شد",
      joinRequest: {
        _id: joinRequest._id,
        status: joinRequest.status,
        previousStatus: previousStatus,
        canceledAt: joinRequest.canceledAt,
      },
    });

  } catch (error) {
    console.error("❌ Error canceling request:", error);
    return NextResponse.json(
      { error: "خطا در لغو درخواست", details: error.message },
      { status: 500 }
    );
  }
}

