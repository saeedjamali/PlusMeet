import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import DiscountCode from "@/lib/models/DiscountCode.model";
import DiscountUsage from "@/lib/models/DiscountUsage.model";
import Event from "@/lib/models/Event.model";

/**
 * GET /api/events/[id]/validate-discount?code=XXXXX
 * اعتبارسنجی کد تخفیف برای یک رویداد خاص
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    const { id: eventId } = params;
    const userId = protection.user.id;

    // دریافت کد تخفیف از query
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "کد تخفیف الزامی است" },
        { status: 400 }
      );
    }

    // دریافت اطلاعات رویداد
    const event = await Event.findById(eventId).select("ticket");
    if (!event) {
      return NextResponse.json({ error: "رویداد یافت نشد" }, { status: 404 });
    }

    if (!event.ticket || !event.ticket.price) {
      return NextResponse.json(
        { error: "این رویداد بلیط ندارد" },
        { status: 400 }
      );
    }

    const ticketPrice = event.ticket.price;

    // اعتبارسنجی کد تخفیف
    const validation = await DiscountCode.validateCode(
      code,
      userId,
      eventId,
      ticketPrice
    );

    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    const discountCode = validation.discountCode;

    // محاسبه مقدار تخفیف
    let discountAmount = 0;
    let discountText = "";

    if (discountCode.discount.type === "percentage") {
      // تخفیف درصدی
      discountAmount = Math.floor(
        (ticketPrice * discountCode.discount.value) / 100
      );

      // بررسی حداکثر مبلغ تخفیف
      if (
        discountCode.discount.maxAmount &&
        discountAmount > discountCode.discount.maxAmount
      ) {
        discountAmount = discountCode.discount.maxAmount;
      }

      discountText = `${discountCode.discount.value}%`;
    } else {
      // تخفیف مبلغ ثابت
      discountAmount = Math.min(discountCode.discount.value, ticketPrice);
      discountText = `${discountAmount.toLocaleString("fa-IR")} ریال`;
    }

    const finalPrice = Math.max(0, ticketPrice - discountAmount);

    return NextResponse.json({
      success: true,
      code: discountCode.code,
      title: discountCode.title,
      description: discountCode.description,
      originalPrice: ticketPrice,
      discountAmount,
      discountText,
      finalPrice,
      discountType: discountCode.discount.type,
      discountValue: discountCode.discount.value,
      commissionCalculation: discountCode.commissionCalculation,
    });
  } catch (error) {
    console.error("❌ Error validating discount code:", error);
    return NextResponse.json(
      { error: "خطا در اعتبارسنجی کد تخفیف", details: error.message },
      { status: 500 }
    );
  }
}
