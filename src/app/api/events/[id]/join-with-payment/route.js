import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import Event from "@/lib/models/Event.model";
import JoinRequest from "@/lib/models/JoinRequest.model";
import User from "@/lib/models/User.model";
import Wallet from "@/lib/models/Wallet.model";
import PaymentCode from "@/lib/models/PaymentCode.model";
import DiscountCode from "@/lib/models/DiscountCode.model";
import DiscountUsage from "@/lib/models/DiscountUsage.model";
import { JOIN_REQUEST_STATUS } from "@/lib/helpers/joinRequestStatus";
import { PARTICIPATION_TYPES } from "@/lib/utils/joinRequestHelpers";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * POST /api/events/[id]/join-with-payment
 * پیوستن به رویداد با پرداخت (TICKETED & APPROVAL_TICKETED)
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

    // دریافت body (برای کد تخفیف)
    const body = await request.json().catch(() => ({}));
    const discountCodeInput = body.discountCode || null;

    // ═══════════════════════════════════════════════════════════
    // بررسی وجود رویداد
    // ═══════════════════════════════════════════════════════════
    const event = await Event.findById(eventId)
      .populate('participationType', 'code title');

    if (!event) {
      return NextResponse.json(
        { error: "رویداد یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی وضعیت رویداد
    if (event.status !== 'approved') {
      return NextResponse.json(
        { error: "این رویداد هنوز تایید نشده است" },
        { status: 400 }
      );
    }

    const participationType = event.participationType?.code || PARTICIPATION_TYPES.APPROVAL_REQUIRED;

    // چک کنیم که رویداد از نوع TICKETED یا APPROVAL_TICKETED باشد
    if (![PARTICIPATION_TYPES.TICKETED, PARTICIPATION_TYPES.APPROVAL_TICKETED].includes(participationType)) {
      return NextResponse.json(
        { error: "این رویداد نیاز به پرداخت ندارد" },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // بررسی کاربر
    // ═══════════════════════════════════════════════════════════
    const user = await User.findById(userId).select('state phoneNumber phoneVerified');

    if (!user) {
      return NextResponse.json(
        { error: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // چک eligibility
    const eligibility = event.eligibility || [];
    
    if (eligibility.length > 0) {
      const userState = user.state || 'active';
      
      const hasAccess = 
        eligibility.includes('verified') && userState === 'verified' ||
        eligibility.includes('active') && (userState === 'active' || userState === 'verified');

      if (!hasAccess) {
        let message = "شما شرایط لازم برای ثبت‌نام در این رویداد را ندارید.";
        
        if (eligibility.includes('verified')) {
          message = "این رویداد فقط برای کاربران تایید شده است.";
        } else if (eligibility.includes('active')) {
          if (userState === 'unregistered' || userState === 'pending_verification') {
            message = "لطفاً ابتدا شماره موبایل خود را تایید کنید.";
          }
        }

        return NextResponse.json(
          { error: message },
          { status: 403 }
        );
      }
    }

    // ═══════════════════════════════════════════════════════════
    // بررسی درخواست قبلی
    // ═══════════════════════════════════════════════════════════
    const existingRequest = await JoinRequest.findOne({
      event: eventId,
      user: userId
    });

    console.log('🔍 [Payment] Existing request:', existingRequest ? {
      _id: existingRequest._id,
      status: existingRequest.status,
      isCanceled: existingRequest.status === JOIN_REQUEST_STATUS.CANCELED,
      isCancelledWithTwoLs: existingRequest.status === 'cancelled'
    } : 'null');

    // اگر درخواست قبلی وجود داره و CANCELED نیست، خطا بده
    // چک می‌کنیم هم "canceled" (یک l) و هم "cancelled" (دو l) برای backward compatibility
    const isCanceled = existingRequest && (
      existingRequest.status === JOIN_REQUEST_STATUS.CANCELED ||
      existingRequest.status === 'cancelled' // برای موارد قدیمی
    );

    if (existingRequest && !isCanceled) {
      console.log('❌ [Payment] Blocking rejoin because status is:', existingRequest.status);
      return NextResponse.json(
        { 
          error: "شما قبلاً برای این رویداد درخواست داده‌اید",
          existingStatus: existingRequest.status
        },
        { status: 400 }
      );
    }

    console.log('✅ [Payment] Allowing join/rejoin');

    // ═══════════════════════════════════════════════════════════
    // بررسی قیمت بلیط
    // ═══════════════════════════════════════════════════════════
    const ticketPrice = event.ticket?.price || 0;

    if (ticketPrice <= 0) {
      return NextResponse.json(
        { error: "قیمت بلیط معتبر نیست" },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // اعمال کد تخفیف (اختیاری)
    // ═══════════════════════════════════════════════════════════
    let discountCodeDoc = null;
    let discountAmount = 0;
    let finalTicketPrice = ticketPrice;

    if (discountCodeInput) {
      // اعتبارسنجی کد تخفیف
      const validation = await DiscountCode.validateCode(
        discountCodeInput,
        userId,
        eventId,
        ticketPrice
      );

      if (!validation.valid) {
        return NextResponse.json(
          { error: `کد تخفیف نامعتبر: ${validation.message}` },
          { status: 400 }
        );
      }

      discountCodeDoc = validation.discountCode;

      // محاسبه مقدار تخفیف
      if (discountCodeDoc.discount.type === "percentage") {
        discountAmount = Math.floor(
          (ticketPrice * discountCodeDoc.discount.value) / 100
        );

        // بررسی حداکثر مبلغ تخفیف
        if (
          discountCodeDoc.discount.maxAmount &&
          discountAmount > discountCodeDoc.discount.maxAmount
        ) {
          discountAmount = discountCodeDoc.discount.maxAmount;
        }
      } else {
        // تخفیف مبلغ ثابت
        discountAmount = Math.min(discountCodeDoc.discount.value, ticketPrice);
      }

      finalTicketPrice = Math.max(0, ticketPrice - discountAmount);

      console.log("🎫 [Discount] Applied:", {
        code: discountCodeInput,
        originalPrice: ticketPrice,
        discountAmount,
        finalPrice: finalTicketPrice,
      });
    }

    // ═══════════════════════════════════════════════════════════
    // بررسی کیف پول کاربر
    // ═══════════════════════════════════════════════════════════
    const userWallet = await Wallet.findOne({ userId });

    if (!userWallet) {
      return NextResponse.json(
        { error: "کیف پول شما یافت نشد" },
        { status: 404 }
      );
    }

    if (userWallet.status !== 'active') {
      return NextResponse.json(
        { error: "کیف پول شما فعال نیست" },
        { status: 400 }
      );
    }

    // استفاده از availableBalance برای چک موجودی (بر اساس مبلغ نهایی)
    const availableBalance = userWallet.availableBalance || 0;
    if (availableBalance < finalTicketPrice) {
      const required = finalTicketPrice - availableBalance;
      return NextResponse.json(
        { 
          error: `موجودی قابل استفاده کافی نیست. شما نیاز به ${required.toLocaleString('fa-IR')} ریال شارژ دارید`,
          insufficientBalance: true,
          availableBalance,
          ticketPrice: finalTicketPrice,
          requiredAmount: required
        },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // دریافت کد پرداخت JTE و محاسبه کمیسیون
    // ═══════════════════════════════════════════════════════════
    const paymentCode = await PaymentCode.findOne({ 
      code: 'JTE',
      'settings.allowEventJoin': true,
      isActive: true
    });

    if (!paymentCode) {
      return NextResponse.json(
        { error: "کد پرداخت JTE یافت نشد" },
        { status: 500 }
      );
    }

    const commissionPercentage = paymentCode.commission?.percentage || 0;

    // محاسبه کمیسیون براساس commissionCalculation کد تخفیف
    let commissionAmount;
    let commissionBaseAmount;

    if (
      discountCodeDoc &&
      discountCodeDoc.commissionCalculation === "afterDiscount"
    ) {
      // کمیسیون از مبلغ بعد از تخفیف
      commissionBaseAmount = finalTicketPrice;
      commissionAmount = Math.round(
        (finalTicketPrice * commissionPercentage) / 100
      );
      console.log(
        "💰 [Commission] Calculated AFTER discount:",
        commissionAmount
      );
    } else {
      // کمیسیون از مبلغ اصلی (قبل از تخفیف) - پیش‌فرض
      commissionBaseAmount = ticketPrice;
      commissionAmount = Math.round((ticketPrice * commissionPercentage) / 100);
      console.log(
        "💰 [Commission] Calculated BEFORE discount:",
        commissionAmount
      );
    }

    const ownerReceiveAmount = finalTicketPrice - commissionAmount;

    // ═══════════════════════════════════════════════════════════
    // فرآیند پرداخت بر اساس نوع رویداد
    // ═══════════════════════════════════════════════════════════
    
    let initialStatus;
    let joinRequest;

    if (participationType === PARTICIPATION_TYPES.TICKETED) {
      // 🎫 TICKETED: پرداخت فوری و تایید نهایی
      
      // کسر مبلغ از کیف پول کاربر (مبلغ نهایی بعد از تخفیف)
      await userWallet.deductAmount(finalTicketPrice, {
        type: 'event_ticket_purchase',
        description: `خرید بلیط رویداد: ${event.title}${
          discountAmount > 0 ? ` (با تخفیف ${discountAmount.toLocaleString("fa-IR")} ریال)` : ""
        }`,
        eventId: eventId,
        ticketPrice: finalTicketPrice,
        originalPrice: ticketPrice,
        discountAmount,
        commissionAmount,
        ownerReceiveAmount
      });

      // افزایش موجودی مالک رویداد (creator)
      console.log('🔍 Event creator:', event.creator);
      console.log('🔍 Event creator type:', typeof event.creator);
      console.log('🔍 Event creator string:', event.creator?.toString());
      
      if (!event.creator) {
        throw new Error('مالک رویداد یافت نشد');
      }
      
      const ownerWallet = await Wallet.findOrCreateForUser(event.creator.toString());
      
      // ابتدا به availableBalance اضافه می‌کنیم
      await ownerWallet.addAmount(ownerReceiveAmount, {
        type: 'event_ticket_income',
        description: `درآمد بلیط رویداد: ${event.title}`,
        eventId: eventId,
        ticketPrice,
        commissionAmount,
        buyerId: userId
      });
      
      // سپس فریز می‌کنیم تا زمان پایان رویداد
      await ownerWallet.freezeAmount(ownerReceiveAmount, {
        description: `فریز درآمد رویداد تا پایان: ${event.title}`,
        eventId: eventId,
      });

      // ثبت کمیسیون سایت (می‌توانیم یک سیستم حسابداری داشته باشیم)
      // TODO: ثبت کمیسیون در جایی مثل یک کیف پول اصلی سایت

      initialStatus = JOIN_REQUEST_STATUS.CONFIRMED;

      // ایجاد یا به‌روزرسانی درخواست
      if (isCanceled) {
        // درخواست مجدد: به‌روزرسانی درخواست قدیمی
        existingRequest.status = initialStatus;
        existingRequest.requestedAt = new Date();
        existingRequest.payment = {
          amount: finalTicketPrice,
          originalAmount: ticketPrice,
          discountAmount: discountAmount,
          discountCode: discountCodeDoc ? discountCodeDoc._id : null,
          commission: commissionAmount,
          ownerAmount: ownerReceiveAmount,
          paidAmount: finalTicketPrice,
          paymentCode: paymentCode._id,
          paidAt: new Date()
        };
        
        // اضافه کردن به تاریخچه
        if (!existingRequest.statusHistory) {
          existingRequest.statusHistory = [];
        }
        existingRequest.statusHistory.push({
          status: initialStatus,
          changedBy: userId,
          changedAt: new Date(),
          reason: "درخواست مجدد با پرداخت بعد از لغو",
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
          payment: {
            amount: finalTicketPrice,
            originalAmount: ticketPrice,
            discountAmount: discountAmount,
            discountCode: discountCodeDoc ? discountCodeDoc._id : null,
            commission: commissionAmount,
            ownerAmount: ownerReceiveAmount,
            paidAmount: finalTicketPrice,
            paymentCode: paymentCode._id,
            paidAt: new Date()
          }
        });

        await joinRequest.save();
      }

      // افزایش تعداد ثبت‌نام
      await Event.findByIdAndUpdate(eventId, {
        $inc: { registeredCount: 1 }
      });

    } else if (participationType === PARTICIPATION_TYPES.APPROVAL_TICKETED) {
      // 🎫+✅ APPROVAL_TICKETED: رزرو مبلغ و منتظر تایید مالک
      
      // رزرو مبلغ در کیف پول کاربر (مبلغ نهایی بعد از تخفیف)
      await userWallet.reserveAmount(finalTicketPrice, {
        type: 'event_ticket_reserve',
        description: `رزرو بلیط رویداد: ${event.title}${
          discountAmount > 0 ? ` (با تخفیف ${discountAmount.toLocaleString("fa-IR")} ریال)` : ""
        }`,
        eventId: eventId,
        ticketPrice: finalTicketPrice,
        originalPrice: ticketPrice,
        discountAmount,
        commissionAmount,
        ownerReceiveAmount
      });

      initialStatus = JOIN_REQUEST_STATUS.PAYMENT_RESERVED;

      // ایجاد یا به‌روزرسانی درخواست
      if (isCanceled) {
        // درخواست مجدد: به‌روزرسانی درخواست قدیمی
        existingRequest.status = initialStatus;
        existingRequest.requestedAt = new Date();
        existingRequest.payment = {
          amount: finalTicketPrice,
          originalAmount: ticketPrice,
          discountAmount: discountAmount,
          discountCode: discountCodeDoc ? discountCodeDoc._id : null,
          commission: commissionAmount,
          ownerAmount: ownerReceiveAmount,
          reservedAmount: finalTicketPrice,
          paymentCode: paymentCode._id,
          reservedAt: new Date()
        };
        
        // اضافه کردن به تاریخچه
        if (!existingRequest.statusHistory) {
          existingRequest.statusHistory = [];
        }
        existingRequest.statusHistory.push({
          status: initialStatus,
          changedBy: userId,
          changedAt: new Date(),
          reason: "درخواست مجدد با رزرو مبلغ بعد از لغو",
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
          payment: {
            amount: finalTicketPrice,
            originalAmount: ticketPrice,
            discountAmount: discountAmount,
            discountCode: discountCodeDoc ? discountCodeDoc._id : null,
            commission: commissionAmount,
            ownerAmount: ownerReceiveAmount,
            reservedAmount: finalTicketPrice,
            paymentCode: paymentCode._id,
            reservedAt: new Date()
          }
        });

        await joinRequest.save();
      }
    }

    // ═══════════════════════════════════════════════════════════
    // ثبت استفاده از کد تخفیف
    // ═══════════════════════════════════════════════════════════
    if (discountCodeDoc && joinRequest) {
      try {
        // افزایش تعداد استفاده کد تخفیف
        discountCodeDoc.usage.usedCount = (discountCodeDoc.usage.usedCount || 0) + 1;
        await discountCodeDoc.save();

        // ثبت در DiscountUsage
        const discountUsage = new DiscountUsage({
          discountCode: discountCodeDoc._id,
          user: userId,
          event: eventId,
          joinRequest: joinRequest._id,
          originalAmount: ticketPrice,
          discountAmount: discountAmount,
          finalAmount: finalTicketPrice,
          usedAt: new Date(),
        });
        await discountUsage.save();

        console.log("✅ [Discount] Usage recorded:", {
          code: discountCodeDoc.code,
          usage: discountUsage._id,
        });
      } catch (err) {
        console.error("❌ Error recording discount usage:", err);
        // Don't fail the whole request if discount usage recording fails
      }
    }

    // لاگ فعالیت
    await logActivity(userId, 'event.join_with_payment', {
      targetType: 'Event',
      targetId: eventId,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        eventTitle: event.title,
        participationType,
        initialStatus,
        ticketPrice,
        commissionAmount,
        ownerReceiveAmount,
      },
    });

    return NextResponse.json({
      success: true,
      message: participationType === PARTICIPATION_TYPES.TICKETED 
        ? "پرداخت با موفقیت انجام شد. شما در رویداد ثبت‌نام شدید" 
        : "مبلغ رزرو شد. منتظر تایید مالک رویداد باشید",
      joinRequest: {
        _id: joinRequest._id,
        status: joinRequest.status,
        requestedAt: joinRequest.requestedAt,
      },
      payment: {
        ticketPrice,
        commissionAmount,
        ownerReceiveAmount,
        commissionPercentage
      },
      wallet: {
        balance: userWallet.balance,
        availableBalance: userWallet.availableBalance,
        reservedBalance: userWallet.reservedBalance
      }
    });

  } catch (error) {
    console.error("❌ Error joining event with payment:", error);
    return NextResponse.json(
      { error: "خطا در ثبت درخواست", details: error.message },
      { status: 500 }
    );
  }
}

