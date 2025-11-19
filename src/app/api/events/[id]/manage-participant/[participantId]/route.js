import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import Event from "@/lib/models/Event.model";
import JoinRequest from "@/lib/models/JoinRequest.model";
import Wallet from "@/lib/models/Wallet.model";
import PaymentCode from "@/lib/models/PaymentCode.model";
import { JOIN_REQUEST_STATUS } from "@/lib/helpers/joinRequestStatus";
import {
  PARTICIPATION_TYPES,
  canUserChangeStatus,
} from "@/lib/utils/joinRequestHelpers";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * PUT /api/events/[id]/manage-participant/[participantId]
 * تغییر وضعیت شرکت‌کننده توسط مالک رویداد
 *
 * Body: { newStatus: string, reason?: string }
 */
export async function PUT(request, { params }) {
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

    const ownerId = protection.user.id;
    const eventId = params.id;
    const participantId = params.participantId;

    const body = await request.json();
    const { newStatus, reason } = body;

    if (!newStatus) {
      return NextResponse.json(
        { error: "وضعیت جدید الزامی است" },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // بررسی وجود رویداد و مالکیت
    // ═══════════════════════════════════════════════════════════
    const event = await Event.findById(eventId).populate(
      "participationType",
      "code title"
    );

    if (!event) {
      return NextResponse.json({ error: "رویداد یافت نشد" }, { status: 404 });
    }

    if (event.creator.toString() !== ownerId) {
      return NextResponse.json(
        { error: "شما مالک این رویداد نیستید" },
        { status: 403 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // بررسی وجود درخواست شرکت‌کننده
    // ═══════════════════════════════════════════════════════════
    const joinRequest = await JoinRequest.findById(participantId).populate(
      "user",
      "fullName email phoneNumber"
    );

    if (!joinRequest) {
      return NextResponse.json(
        { error: "شرکت‌کننده یافت نشد" },
        { status: 404 }
      );
    }

    if (joinRequest.event.toString() !== eventId) {
      return NextResponse.json(
        { error: "این شرکت‌کننده متعلق به این رویداد نیست" },
        { status: 400 }
      );
    }

    const currentStatus = joinRequest.status;
    const participationType =
      event.participationType?.code || PARTICIPATION_TYPES.APPROVAL_REQUIRED;

    // ═══════════════════════════════════════════════════════════
    // اعتبارسنجی: آیا مالک می‌تواند این تغییر را انجام دهد؟
    // ═══════════════════════════════════════════════════════════
    const validation = canUserChangeStatus(
      participationType,
      currentStatus,
      newStatus,
      "owner"
    );

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.reason,
          currentStatus: currentStatus,
          newStatus: newStatus,
          canChange: false,
        },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // منطق خاص برای هر نوع تغییر وضعیت
    // ═══════════════════════════════════════════════════════════

    let responseMessage = `وضعیت شرکت‌کننده به ${newStatus} تغییر یافت`;

    // ──────────────────────────────────────────────────────────
    // REJECTED: رد درخواست
    // ──────────────────────────────────────────────────────────
    if (newStatus === JOIN_REQUEST_STATUS.REJECTED) {
      // اگر مبلغ رزرو شده بود، آزاد کنیم
      if (currentStatus === JOIN_REQUEST_STATUS.PAYMENT_RESERVED) {
        const reservedAmount = joinRequest.payment?.amount || 0;
        if (reservedAmount > 0) {
          const userWallet = await Wallet.findOne({
            userId: joinRequest.user._id,
          });
          if (userWallet) {
            await userWallet.releaseReservedAmount(reservedAmount, {
              type: "event_reject_release",
              description: `رد درخواست و آزادسازی رزرو: ${event.title}`,
              eventId: eventId,
              joinRequestId: participantId,
            });
            responseMessage += ". مبلغ رزرو شده آزاد شد";
          }
        }
      }
    }

    // ──────────────────────────────────────────────────────────
    // APPROVED: تایید درخواست (برای APPROVAL_TICKETED)
    // ──────────────────────────────────────────────────────────
    else if (newStatus === JOIN_REQUEST_STATUS.APPROVED) {
      // اگر رویداد APPROVAL_TICKETED است و مبلغ رزرو شده، کسر کنیم
      if (
        participationType === PARTICIPATION_TYPES.APPROVAL_TICKETED &&
        currentStatus === JOIN_REQUEST_STATUS.PAYMENT_RESERVED
      ) {
        const reservedAmount = joinRequest.payment?.amount || 0;
        const commissionAmount = joinRequest.payment?.commission || 0;
        const ownerReceiveAmount = joinRequest.payment?.ownerAmount || 0;

        console.log("💰 Payment Info:", {
          reservedAmount,
          commissionAmount,
          ownerReceiveAmount,
          paymentObject: joinRequest.payment,
        });

        if (reservedAmount > 0) {
          // کسر از رزرو کاربر - خواندن wallet با populate کامل
          let userWallet = await Wallet.findOne({
            userId: joinRequest.user._id,
          });

          if (!userWallet) {
            throw new Error("کیف پول کاربر یافت نشد");
          }

          console.log("💰 Wallet Status Before:", {
            reservedBalance: userWallet.reservedBalance,
            availableBalance: userWallet.availableBalance,
            balance: userWallet.balance,
            reservedAmount: reservedAmount,
            totalAvailable:
              userWallet.reservedBalance + userWallet.availableBalance,
          });

          // بررسی موجودی کل (reserved + available)
          const totalAvailable =
            (userWallet.reservedBalance || 0) +
            (userWallet.availableBalance || 0);

          if (totalAvailable < reservedAmount) {
            return NextResponse.json(
              {
                error: `موجودی کیف پول کاربر کافی نیست`,
                details: {
                  availableBalance: userWallet.availableBalance,
                  reservedBalance: userWallet.reservedBalance,
                  totalAvailable,
                  requiredAmount: reservedAmount,
                  shortfall: reservedAmount - totalAvailable,
                },
                suggestion:
                  "کاربر باید کیف پول خود را شارژ کند یا درخواست را رد کنید تا مبلغ رزرو شده (در صورت وجود) آزاد شود",
              },
              { status: 400 }
            );
          }

          // اول سعی می‌کنیم از reservedBalance کسر کنیم
          if (userWallet.reservedBalance >= reservedAmount) {
            console.log("✅ Deducting from reserved balance");
            await userWallet.deductReservedAmount(reservedAmount, {
              type: "event_ticket_approved",
              description: `تایید و کسر بلیط رویداد: ${event.title}`,
              eventId: eventId,
              joinRequestId: participantId,
            });
          } else if (userWallet.reservedBalance > 0) {
            // اگر قسمتی رزرو شده، اول آن را کسر کنیم و بقیه از available
            console.log(
              "⚠️ Partial reserved balance, using both reserved and available"
            );
            const fromReserved = userWallet.reservedBalance;
            const fromAvailable = reservedAmount - fromReserved;

            await userWallet.deductReservedAmount(fromReserved, {
              type: "event_ticket_approved",
              description: `تایید و کسر (قسمت رزرو) بلیط رویداد: ${event.title}`,
              eventId: eventId,
              joinRequestId: participantId,
            });

            await userWallet.deductAmount(fromAvailable, {
              type: "event_ticket_approved",
              description: `تایید و کسر (قسمت باقیمانده) بلیط رویداد: ${event.title}`,
              eventId: eventId,
              joinRequestId: participantId,
            });
          } else {
            // هیچ چیز رزرو نشده، از available کسر می‌کنیم
            console.warn(
              "⚠️ No reserved balance, using available balance only"
            );
            await userWallet.deductAmount(reservedAmount, {
              type: "event_ticket_approved",
              description: `تایید و کسر بلیط رویداد: ${event.title}`,
              eventId: eventId,
              joinRequestId: participantId,
            });
          }

          console.log("✅ Payment deducted successfully");

          // افزایش موجودی مالک و فریز کردن آن تا پایان رویداد
          if (ownerReceiveAmount > 0) {
            const ownerWallet = await Wallet.findOrCreateForUser(ownerId);

            console.log("💰 Adding to owner wallet:", ownerReceiveAmount);

            // ابتدا به availableBalance اضافه می‌کنیم
            await ownerWallet.addAmount(ownerReceiveAmount, {
              type: "event_ticket_income",
              description: `درآمد بلیط رویداد: ${event.title}`,
              eventId: eventId,
              ticketPrice: reservedAmount,
              commissionAmount,
              buyerId: joinRequest.user._id,
            });

            // سپس فریز می‌کنیم تا زمان پایان رویداد
            await ownerWallet.freezeAmount(ownerReceiveAmount, {
              description: `فریز درآمد رویداد تا پایان: ${event.title}`,
              eventId: eventId,
              joinRequestId: participantId,
            });

            responseMessage +=
              ". پرداخت تکمیل و در کیف پول مالک فریز شد تا پایان رویداد";
          } else {
            console.warn(
              "⚠️ ownerReceiveAmount is 0, skipping wallet operations"
            );
            responseMessage += ". پرداخت تکمیل شد (مبلغ مالک صفر است)";
          }

          // به‌روزرسانی اطلاعات پرداخت
          joinRequest.payment.paidAt = new Date();
        }
      }

      // افزایش تعداد ثبت‌نام
      await Event.findByIdAndUpdate(eventId, {
        $inc: { registeredCount: 1 },
      });
    }

    // ──────────────────────────────────────────────────────────
    // REFUNDED: بازپرداخت
    // ──────────────────────────────────────────────────────────
    else if (newStatus === JOIN_REQUEST_STATUS.REFUNDED) {
      const refundAmount = joinRequest.payment?.amount || 0;
      const commissionAmount = joinRequest.payment?.commission || 0;
      const refundToUser = refundAmount - commissionAmount; // منهای کمیسیون

      if (refundAmount > 0) {
        // بازگشت به کیف پول کاربر (منهای کمیسیون)
        const userWallet = await Wallet.findOne({
          userId: joinRequest.user._id,
        });
        if (userWallet) {
          await userWallet.addAmount(refundToUser, {
            type: "event_refund",
            description: `بازپرداخت بلیط رویداد: ${event.title}`,
            eventId: eventId,
            joinRequestId: participantId,
            originalAmount: refundAmount,
            commissionDeducted: commissionAmount,
          });
        }

        // کسر از frozenBalance کیف پول مالک
        const ownerWallet = await Wallet.findOne({ userId: ownerId });
        if (ownerWallet) {
          const ownerReceived = joinRequest.payment?.ownerAmount || 0;

          // سعی می‌کنیم از frozenBalance کسر کنیم
          try {
            await ownerWallet.deductFromFrozen(ownerReceived, {
              description: `بازپرداخت از موجودی فریز شده: ${event.title}`,
              eventId: eventId,
              joinRequestId: participantId,
              refundToUser,
            });
            responseMessage += " (کسر از موجودی فریز شده مالک)";
          } catch (err) {
            // اگر frozenBalance کافی نبود، از availableBalance کسر می‌کنیم
            console.warn(
              "frozenBalance insufficient, using availableBalance:",
              err.message
            );
            await ownerWallet.deductAmount(ownerReceived, {
              type: "event_refund_deduct",
              description: `بازپرداخت بلیط رویداد: ${event.title}`,
              eventId: eventId,
              joinRequestId: participantId,
              refundToUser,
            });
            responseMessage += " (کسر از موجودی قابل استفاده مالک)";
          }
        }

        // به‌روزرسانی اطلاعات پرداخت
        joinRequest.payment.refundedAt = new Date();
        joinRequest.payment.refundAmount = refundToUser;

        responseMessage += `. مبلغ ${refundToUser.toLocaleString(
          "fa-IR"
        )} ریال (منهای کمیسیون) به کاربر بازگردانده شد`;
      }

      // کاهش تعداد ثبت‌نام
      await Event.findByIdAndUpdate(eventId, {
        $inc: { registeredCount: -1 },
      });
    }

    // ──────────────────────────────────────────────────────────
    // CONFIRMED: تایید نهایی
    // ──────────────────────────────────────────────────────────
    else if (newStatus === JOIN_REQUEST_STATUS.CONFIRMED) {
      // افزایش تعداد ثبت‌نام (اگر قبلاً APPROVED نبود)
      if (currentStatus !== JOIN_REQUEST_STATUS.APPROVED) {
        await Event.findByIdAndUpdate(eventId, {
          $inc: { registeredCount: 1 },
        });
      }
    }

    // ──────────────────────────────────────────────────────────
    // REVOKED: لغو توسط مالک
    // ──────────────────────────────────────────────────────────
    else if (newStatus === JOIN_REQUEST_STATUS.REVOKED) {
      // کاهش تعداد ثبت‌نام (اگر قبلاً confirmed بود)
      if (
        [JOIN_REQUEST_STATUS.CONFIRMED, JOIN_REQUEST_STATUS.APPROVED].includes(
          currentStatus
        )
      ) {
        await Event.findByIdAndUpdate(eventId, {
          $inc: { registeredCount: -1 },
        });
      }
    }

    // ═══════════════════════════════════════════════════════════
    // به‌روزرسانی وضعیت
    // ═══════════════════════════════════════════════════════════
    const previousStatus = joinRequest.status;
    joinRequest.status = newStatus;

    // اضافه کردن به تاریخچه وضعیت‌ها
    if (!joinRequest.statusHistory) {
      joinRequest.statusHistory = [];
    }
    joinRequest.statusHistory.push({
      status: newStatus,
      changedBy: ownerId,
      changedAt: new Date(),
      reason: reason || `تغییر وضعیت توسط مالک`,
      previousStatus,
    });

    await joinRequest.save();

    // لاگ فعالیت
    await logActivity(ownerId, "event.manage_participant", {
      targetType: "Event",
      targetId: eventId,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: {
        eventTitle: event.title,
        participantId: participantId,
        participantName: joinRequest.user.fullName,
        previousStatus,
        newStatus,
        reason,
      },
    });

    return NextResponse.json({
      success: true,
      message: responseMessage,
      joinRequest: {
        _id: joinRequest._id,
        status: joinRequest.status,
        previousStatus: previousStatus,
        user: {
          _id: joinRequest.user._id,
          fullName: joinRequest.user.fullName,
          email: joinRequest.user.email,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error managing participant:", error);
    return NextResponse.json(
      { error: "خطا در تغییر وضعیت شرکت‌کننده", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/events/[id]/manage-participant/[participantId]
 * دریافت اطلاعات شرکت‌کننده برای مالک
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: "لطفاً وارد سیستم شوید" },
        { status: 401 }
      );
    }

    const ownerId = protection.user.id;
    const eventId = params.id;
    const participantId = params.participantId;

    // بررسی مالکیت رویداد
    const event = await Event.findById(eventId)
      .select("creator participationType")
      .populate("participationType", "code");

    if (!event) {
      return NextResponse.json({ error: "رویداد یافت نشد" }, { status: 404 });
    }

    if (event.creator.toString() !== ownerId) {
      return NextResponse.json(
        { error: "شما مالک این رویداد نیستید" },
        { status: 403 }
      );
    }

    // دریافت اطلاعات شرکت‌کننده
    const joinRequest = await JoinRequest.findById(participantId)
      .populate("user", "fullName email phoneNumber profileImage state")
      .lean();

    if (!joinRequest) {
      return NextResponse.json(
        { error: "شرکت‌کننده یافت نشد" },
        { status: 404 }
      );
    }

    if (joinRequest.event.toString() !== eventId) {
      return NextResponse.json(
        { error: "این شرکت‌کننده متعلق به این رویداد نیست" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      participant: joinRequest,
      eventParticipationType: event.participationType?.code,
    });
  } catch (error) {
    console.error("❌ Error getting participant:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات شرکت‌کننده", details: error.message },
      { status: 500 }
    );
  }
}
