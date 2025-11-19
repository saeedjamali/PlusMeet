import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import Event from "@/lib/models/Event.model";
import Wallet from "@/lib/models/Wallet.model";
import { PARTICIPATION_TYPES } from "@/lib/utils/joinRequestHelpers";

/**
 * GET /api/events/[id]/check-wallet
 * چک کردن موجودی کیف پول قبل از پیوستن به رویداد
 * برای رویدادهای TICKETED و APPROVAL_TICKETED
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

    // ═══════════════════════════════════════════════════════════
    // بررسی وجود رویداد
    // ═══════════════════════════════════════════════════════════
    const event = await Event.findById(eventId)
      .populate('participationType', 'code title')
      .lean();

    if (!event) {
      return NextResponse.json(
        { error: "رویداد یافت نشد" },
        { status: 404 }
      );
    }

    // چک کنیم که رویداد از نوع TICKETED یا APPROVAL_TICKETED باشد
    const participationType = event.participationType?.code || PARTICIPATION_TYPES.APPROVAL_REQUIRED;
    
    if (![PARTICIPATION_TYPES.TICKETED, PARTICIPATION_TYPES.APPROVAL_TICKETED].includes(participationType)) {
      return NextResponse.json(
        { error: "این رویداد نیاز به چک کیف پول ندارد" },
        { status: 400 }
      );
    }

    // دریافت قیمت بلیط
    const ticketPrice = event.ticket?.price || 0;

    if (ticketPrice <= 0) {
      return NextResponse.json(
        { 
          hasSufficientBalance: true,
          ticketPrice: 0,
          userBalance: 0,
          requiredAmount: 0,
          message: "این رویداد رایگان است"
        }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // دریافت کیف پول کاربر
    // ═══════════════════════════════════════════════════════════
    const wallet = await Wallet.findOrCreateForUser(userId);

    if (wallet.status !== 'active') {
      return NextResponse.json(
        { 
          error: "کیف پول شما فعال نیست. لطفاً با پشتیبانی تماس بگیرید",
          walletStatus: wallet.status
        },
        { status: 400 }
      );
    }

    // استفاده از availableBalance برای محاسبات پرداخت
    const availableBalance = wallet.availableBalance || 0;
    const hasSufficientBalance = availableBalance >= ticketPrice;
    const requiredAmount = hasSufficientBalance ? 0 : ticketPrice - availableBalance;

    return NextResponse.json({
      success: true,
      hasSufficientBalance,
      ticketPrice,
      userBalance: availableBalance, // موجودی قابل استفاده
      availableBalance: availableBalance,
      totalBalance: wallet.balance || 0, // کل موجودی (برای نمایش اطلاعات)
      reservedBalance: wallet.reservedBalance || 0,
      frozenBalance: wallet.frozenBalance || 0,
      requiredAmount,
      eventTitle: event.title,
      participationType: participationType,
      message: hasSufficientBalance 
        ? "موجودی قابل استفاده شما کافی است" 
        : `شما نیاز به شارژ ${requiredAmount.toLocaleString('fa-IR')} ریال دارید`,
    });

  } catch (error) {
    console.error("❌ Error checking wallet:", error);
    return NextResponse.json(
      { error: "خطا در بررسی کیف پول", details: error.message },
      { status: 500 }
    );
  }
}

