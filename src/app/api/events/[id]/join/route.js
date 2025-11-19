import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import Event from "@/lib/models/Event.model";
import JoinRequest from "@/lib/models/JoinRequest.model";
import User from "@/lib/models/User.model";
import {
  PARTICIPATION_TYPES,
  determineInitialStatus,
} from "@/lib/utils/joinRequestHelpers";
import { JOIN_REQUEST_STATUS } from "@/lib/helpers/joinRequestStatus";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * POST /api/events/[id]/join
 * درخواست پیوستن به رویداد
 *
 * این API برای OPEN، APPROVAL_REQUIRED، و INVITE_ONLY استفاده می‌شود
 * برای TICKETED و APPROVAL_TICKETED از /join-with-payment استفاده کنید
 *
 * Body: { inviteCode?: string } - برای رویدادهای INVITE_ONLY
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
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    const userId = protection.user.id;
    const eventId = params.id;

    // دریافت body برای چک کردن کد دعوت
    const body = await request.json().catch(() => ({}));
    const inviteCode = body.inviteCode || null;

    // ═══════════════════════════════════════════════════════════
    // بررسی وجود رویداد
    // ═══════════════════════════════════════════════════════════
    const event = await Event.findById(eventId)
      .populate("participationType", "code title")
      .lean();

    if (!event) {
      return NextResponse.json({ error: "رویداد یافت نشد" }, { status: 404 });
    }

    // بررسی وضعیت رویداد
    if (event.status !== "approved") {
      return NextResponse.json(
        { error: "این رویداد هنوز تایید نشده است" },
        { status: 400 }
      );
    }

    // بررسی اینکه آیا رویداد منقضی شده
    if (
      event.schedule?.endDate &&
      new Date(event.schedule.endDate) < new Date()
    ) {
      return NextResponse.json(
        { error: "این رویداد به پایان رسیده است" },
        { status: 400 }
      );
    }

    const participationType =
      event.participationType?.code || PARTICIPATION_TYPES.APPROVAL_REQUIRED;

    // ═══════════════════════════════════════════════════════════
    // چک نوع رویداد
    // ═══════════════════════════════════════════════════════════

    // اگر رویداد TICKETED یا APPROVAL_TICKETED است، باید از API دیگر استفاده شود
    if (
      [
        PARTICIPATION_TYPES.TICKETED,
        PARTICIPATION_TYPES.APPROVAL_TICKETED,
      ].includes(participationType)
    ) {
      return NextResponse.json(
        {
          error:
            "این رویداد نیاز به پرداخت دارد. لطفاً از API /join-with-payment استفاده کنید",
          requiresPayment: true,
          ticketPrice: event.ticket?.price || 0,
        },
        { status: 400 }
      );
    }

    // اگر رویداد INVITE_ONLY است، چک کد دعوت
    if (participationType === PARTICIPATION_TYPES.INVITE_ONLY) {
      const eventInviteCode =
        event.inviteCode || event.access?.inviteCode || null;

      if (!eventInviteCode) {
        return NextResponse.json(
          { error: "این رویداد دعوتی است و کد دعوت تنظیم نشده است" },
          { status: 400 }
        );
      }

      if (!inviteCode || inviteCode !== eventInviteCode) {
        return NextResponse.json(
          {
            error:
              "کد دعوت نامعتبر است. این رویداد فقط با دعوت‌نامه قابل دسترسی است",
            requiresInviteCode: true,
          },
          { status: 403 }
        );
      }
    }

    // ═══════════════════════════════════════════════════════════
    // بررسی کاربر
    // ═══════════════════════════════════════════════════════════
    const user = await User.findById(userId)
      .select("state phoneNumber phoneVerified")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // ═══════════════════════════════════════════════════════════
    // بررسی eligibility (شرایط دسترسی)
    // ═══════════════════════════════════════════════════════════
    const eligibility = event.eligibility || [];

    // اگر رویداد eligibility مشخص کرده، چک کنیم
    if (eligibility.length > 0) {
      const userState = user.state || "active";

      // کاربران verified می‌توانند به رویدادهای active هم درخواست بدهند
      const hasAccess =
        (eligibility.includes("verified") && userState === "verified") ||
        (eligibility.includes("active") &&
          (userState === "active" || userState === "verified"));

      if (!hasAccess) {
        let message = "شما شرایط لازم برای ثبت‌نام در این رویداد را ندارید.";

        if (eligibility.includes("verified")) {
          message =
            "این رویداد فقط برای کاربران تایید شده است. لطفاً ابتدا حساب کاربری خود را تایید کنید.";
        } else if (eligibility.includes("active")) {
          if (
            userState === "unregistered" ||
            userState === "pending_verification"
          ) {
            message = "لطفاً ابتدا شماره موبایل خود را تایید کنید.";
          }
        }

        return NextResponse.json(
          {
            error: message,
            requiresVerification: eligibility.includes("verified"),
            requiresPhoneVerification:
              eligibility.includes("active") && !user.phoneVerified,
          },
          { status: 403 }
        );
      }
    }

    // ═══════════════════════════════════════════════════════════
    // بررسی درخواست قبلی
    // ═══════════════════════════════════════════════════════════
    const existingRequest = await JoinRequest.findOne({
      event: eventId,
      user: userId,
    });

    console.log(
      "🔍 Existing request:",
      existingRequest
        ? {
            _id: existingRequest._id,
            status: existingRequest.status,
            statusString: existingRequest.status,
            isCanceled: existingRequest.status === JOIN_REQUEST_STATUS.CANCELED,
            isCancelledWithTwoLs: existingRequest.status === "cancelled",
            CANCELED_VALUE: JOIN_REQUEST_STATUS.CANCELED,
          }
        : "null"
    );

    // اگر درخواست قبلی وجود داره و CANCELED نیست، خطا بده
    // چک می‌کنیم هم "canceled" (یک l) و هم "cancelled" (دو l) برای backward compatibility
    const isCanceled =
      existingRequest &&
      (existingRequest.status === JOIN_REQUEST_STATUS.CANCELED ||
        existingRequest.status === "cancelled"); // برای موارد قدیمی

    if (existingRequest && !isCanceled) {
      console.log(
        "❌ Blocking rejoin because status is:",
        existingRequest.status
      );
      return NextResponse.json(
        {
          error: "شما قبلاً برای این رویداد درخواست داده‌اید",
          existingStatus: existingRequest.status,
        },
        { status: 400 }
      );
    }

    console.log("✅ Allowing join/rejoin");

    // ═══════════════════════════════════════════════════════════
    // تعیین وضعیت اولیه بر اساس نوع رویداد
    // ═══════════════════════════════════════════════════════════

    let initialStatus;

    if (participationType === PARTICIPATION_TYPES.OPEN) {
      // رویداد آزاد: فوراً تایید می‌شود
      initialStatus = JOIN_REQUEST_STATUS.APPROVED;
    } else if (
      participationType === PARTICIPATION_TYPES.APPROVAL_REQUIRED ||
      participationType === PARTICIPATION_TYPES.INVITE_ONLY
    ) {
      // رویداد نیازمند تایید یا دعوتی: در انتظار تایید مالک
      initialStatus = JOIN_REQUEST_STATUS.PENDING;
    } else {
      // در غیر این صورت، از determineInitialStatus استفاده کنیم
      initialStatus = determineInitialStatus(event, !!inviteCode);
    }

    // ═══════════════════════════════════════════════════════════
    // ایجاد یا به‌روزرسانی درخواست
    // ═══════════════════════════════════════════════════════════
    let joinRequest;

    if (isCanceled) {
      // اگر درخواست قبلی CANCELED بود، آن را به‌روزرسانی کنیم (درخواست مجدد)
      existingRequest.status = initialStatus;
      existingRequest.requestedAt = new Date();
      if (inviteCode) {
        existingRequest.inviteCode = inviteCode;
      }

      // اضافه کردن به تاریخچه
      if (!existingRequest.statusHistory) {
        existingRequest.statusHistory = [];
      }
      existingRequest.statusHistory.push({
        status: initialStatus,
        changedBy: userId,
        changedAt: new Date(),
        reason: "درخواست مجدد بعد از لغو",
        previousStatus: JOIN_REQUEST_STATUS.CANCELED,
      });

      await existingRequest.save();
      joinRequest = existingRequest;
    } else {
      // ایجاد درخواست جدید
      joinRequest = new JoinRequest({
        event: eventId,
        user: userId,
        status: initialStatus,
        requestedAt: new Date(),
        inviteCode: inviteCode || undefined, // فقط برای INVITE_ONLY
      });

      await joinRequest.save();
    }

    // افزایش تعداد ثبت‌نام در رویداد
    if (
      initialStatus === JOIN_REQUEST_STATUS.APPROVED ||
      initialStatus === JOIN_REQUEST_STATUS.CONFIRMED
    ) {
      await Event.findByIdAndUpdate(eventId, {
        $inc: { registeredCount: 1 },
      });
    }

    // لاگ فعالیت
    await logActivity(userId, "event.join_request", {
      targetType: "Event",
      targetId: eventId,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: {
        eventTitle: event.title,
        initialStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: "درخواست شما با موفقیت ثبت شد",
      joinRequest: {
        _id: joinRequest._id,
        status: joinRequest.status,
        requestedAt: joinRequest.requestedAt,
      },
    });
  } catch (error) {
    console.error("❌ Error joining event:", error);
    return NextResponse.json(
      { error: "خطا در ثبت درخواست", details: error.message },
      { status: 500 }
    );
  }
}








