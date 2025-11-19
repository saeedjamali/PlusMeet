import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import PaymentCode from "@/lib/models/PaymentCode.model";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET /api/finance/payment-codes
 * دریافت لیست کدهای پرداخت
 */
export async function GET(request) {
  try {
    await dbConnect();

    const protection = await protectAPI(request, {
      allowedRoles: ["admin"],
    });

    if (!protection.success) {
      return NextResponse.json({ error: protection.error }, { status: protection.status });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const query = activeOnly ? { isActive: true } : {};

    const codes = await PaymentCode.find(query)
      .sort({ code: 1 })
      .populate("discountCodes", "code title discount")
      .populate("allowedGateways", "title code")
      .lean();

    return NextResponse.json({
      success: true,
      codes,
      count: codes.length,
    });
  } catch (error) {
    console.error("❌ Error fetching payment codes:", error);
    return NextResponse.json(
      { error: "خطا در دریافت کدهای پرداخت", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/finance/payment-codes
 * ایجاد کد پرداخت جدید
 */
export async function POST(request) {
  try {
    await dbConnect();

    const protection = await protectAPI(request, {
      allowedRoles: ["admin"],
    });

    if (!protection.success) {
      return NextResponse.json({ error: protection.error }, { status: protection.status });
    }

    const userId = protection.user.id;
    const body = await request.json();

    const { code, title, description, isActive, commission, discountCodes, allowedGateways, settings } =
      body;

    // اعتبارسنجی
    if (!code || !title) {
      return NextResponse.json({ error: "کد و عنوان الزامی است" }, { status: 400 });
    }

    // چک تکراری بودن کد
    const existingCode = await PaymentCode.findOne({
      code: code.toUpperCase(),
    });

    if (existingCode) {
      return NextResponse.json({ error: "این کد قبلاً ثبت شده است" }, { status: 400 });
    }

    // ایجاد کد پرداخت جدید
    const newCode = new PaymentCode({
      code: code.toUpperCase(),
      title,
      description,
      isActive: isActive !== undefined ? isActive : true,
      commission: {
        percentage: commission?.percentage || 0,
        fixedAmount: commission?.fixedAmount || 0,
        type: commission?.type || "percentage",
      },
      discountCodes: discountCodes || [],
      allowedGateways: allowedGateways || [],
      settings: {
        allowEventJoin: settings?.allowEventJoin !== false,
        allowTicketPurchase: settings?.allowTicketPurchase || false,
        allowCourseEnrollment: settings?.allowCourseEnrollment || false,
        minAmount: settings?.minAmount || 0,
        maxAmount: settings?.maxAmount,
      },
      createdBy: userId,
    });

    await newCode.save();

    // ثبت فعالیت
    await logActivity(userId, "payment_code.create", {
      targetType: "PaymentCode",
      targetId: newCode._id,
      metadata: {
        code: newCode.code,
        title: newCode.title,
      },
    });

    return NextResponse.json({
      success: true,
      message: "کد پرداخت با موفقیت ایجاد شد",
      paymentCode: newCode,
    });
  } catch (error) {
    console.error("❌ Error creating payment code:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد کد پرداخت", details: error.message },
      { status: 500 }
    );
  }
}

