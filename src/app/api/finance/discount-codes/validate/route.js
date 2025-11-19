import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import DiscountCode from "@/lib/models/DiscountCode.model";

/**
 * POST /api/finance/discount-codes/validate
 * اعتبارسنجی کد تخفیف برای یک پرداخت
 */
export async function POST(request) {
  try {
    await dbConnect();

    // این API برای همه قابل دسترسی است (حتی کاربران غیر لاگین)
    const protection = await protectAPI(request, { isPublic: true });
    
    const userId = protection.success ? protection.user.id : null;
    const body = await request.json();

    const { code, amount, eventId, gatewayId } = body;

    // اعتبارسنجی ورودی
    if (!code || !amount) {
      return NextResponse.json(
        { error: "کد تخفیف و مبلغ الزامی است" },
        { status: 400 }
      );
    }

    // جستجوی کد تخفیف
    const result = await DiscountCode.validateCode(code, userId, eventId, amount);

    if (!result.valid) {
      return NextResponse.json(
        { 
          valid: false, 
          message: result.message 
        },
        { status: 400 }
      );
    }

    // چک محدودیت رویداد
    if (eventId && !result.discountCode.isValidForEvent(eventId)) {
      return NextResponse.json(
        { 
          valid: false, 
          message: "این کد تخفیف برای این رویداد قابل استفاده نیست" 
        },
        { status: 400 }
      );
    }

    // چک محدودیت درگاه پرداخت
    if (gatewayId && !result.discountCode.isValidForGateway(gatewayId)) {
      return NextResponse.json(
        { 
          valid: false, 
          message: "این کد تخفیف برای این درگاه پرداخت قابل استفاده نیست" 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      message: "کد تخفیف معتبر است",
      discount: {
        code: result.discountCode.code,
        title: result.discountCode.title,
        type: result.discountCode.discount.type,
        value: result.discountCode.discount.value,
        discountAmount: result.discountAmount,
        originalAmount: amount,
        finalAmount: result.finalAmount,
      },
    });
  } catch (error) {
    console.error("❌ Error validating discount code:", error);
    return NextResponse.json(
      { error: "خطا در اعتبارسنجی کد تخفیف", details: error.message },
      { status: 500 }
    );
  }
}

