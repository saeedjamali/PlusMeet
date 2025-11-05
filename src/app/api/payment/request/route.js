import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import Wallet from "@/lib/models/Wallet.model";
import Transaction from "@/lib/models/Transaction.model";
import { authenticate } from "@/lib/middleware/auth";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";
import { requestPayment } from "@/lib/services/zarinpal.service";

/**
 * POST /api/payment/request
 * درخواست پرداخت برای شارژ کیف پول
 */
export async function POST(request) {
  try {
    // API Protection
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    await dbConnect();

    // احراز هویت
    const authResult = await authenticate(request, { requireCSRF: false });
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "لطفا وارد شوید" },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;
    const body = await request.json();
    const { amount, description } = body;

    // اعتبارسنجی
    if (!amount || amount < 1000) {
      return NextResponse.json(
        { error: "مبلغ باید حداقل 1000 ریال باشد" },
        { status: 400 }
      );
    }

    if (amount > 100000000) {
      // حداکثر 100 میلیون ریال
      return NextResponse.json(
        { error: "مبلغ نباید بیشتر از 100 میلیون ریال باشد" },
        { status: 400 }
      );
    }

    // پیدا کردن یا ایجاد کیف پول
    const wallet = await Wallet.findOrCreateForUser(userId);

    // ایجاد تراکنش pending
    const transaction = await Transaction.createDeposit({
      userId,
      walletId: wallet._id,
      amount,
      paymentMethod: "zarinpal",
      description: description || `شارژ کیف پول ${amount} ریال`,
      metadata: {
        requestedAt: new Date(),
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
      },
    });

    // درخواست پرداخت از زرین‌پال
    const paymentResult = await requestPayment({
      amount,
      description: `شارژ کیف پول - ${authResult.user.phoneNumber || "کاربر"}`,
      mobile: authResult.user.phoneNumber,
      email: authResult.user.email,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/verify`,
      metadata: {
        transactionId: transaction._id.toString(),
        userId: userId,
      },
    });

    if (!paymentResult.success) {
      // شکست تراکنش
      await transaction.fail(paymentResult.error);

      return NextResponse.json(
        {
          success: false,
          error: paymentResult.error,
        },
        { status: 400 }
      );
    }

    // به‌روزرسانی تراکنش با authority
    transaction.authority = paymentResult.authority;
    transaction.status = "processing";
    transaction.processedAt = new Date();
    await transaction.save();

    return NextResponse.json({
      success: true,
      data: {
        authority: paymentResult.authority,
        paymentUrl: paymentResult.paymentUrl,
        transactionId: transaction._id,
      },
      message: "درخواست پرداخت با موفقیت ایجاد شد",
    });
  } catch (error) {
    console.error("❌ Error creating payment request:", error);
    return NextResponse.json(
      {
        success: false,
        error: "خطا در ایجاد درخواست پرداخت",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
