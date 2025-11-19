import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import PaymentGateway from "@/lib/models/PaymentGateway.model";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET /api/finance/payment-gateways
 * دریافت لیست درگاه‌های پرداخت
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

    const gateways = await PaymentGateway.find(query)
      .sort({ isDefault: -1, title: 1 })
      .select("-gateway.apiKey -gateway.merchantId") // حذف اطلاعات حساس
      .lean();

    return NextResponse.json({
      success: true,
      gateways,
      count: gateways.length,
    });
  } catch (error) {
    console.error("❌ Error fetching payment gateways:", error);
    return NextResponse.json(
      { error: "خطا در دریافت درگاه‌های پرداخت", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/finance/payment-gateways
 * ایجاد درگاه پرداخت جدید
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

    const {
      title,
      code,
      description,
      isActive,
      isDefault,
      commission,
      gateway,
      limits,
      settings,
    } = body;

    // اعتبارسنجی
    if (!title || !code || !gateway?.provider || !gateway?.apiKey) {
      return NextResponse.json(
        { error: "اطلاعات الزامی وارد نشده است" },
        { status: 400 }
      );
    }

    // چک تکراری بودن کد
    const existingGateway = await PaymentGateway.findOne({
      code: code.toUpperCase(),
    });

    if (existingGateway) {
      return NextResponse.json({ error: "این کد قبلاً ثبت شده است" }, { status: 400 });
    }

    // اگر این درگاه پیش‌فرض است، باید دیگر درگاه‌ها را غیر پیش‌فرض کنیم
    if (isDefault) {
      await PaymentGateway.updateMany({ isDefault: true }, { isDefault: false });
    }

    // ایجاد درگاه جدید
    const newGateway = new PaymentGateway({
      title,
      code: code.toUpperCase(),
      description,
      isActive: isActive !== undefined ? isActive : true,
      isDefault: isDefault || false,
      commission: {
        percentage: commission?.percentage || 0,
        fixedAmount: commission?.fixedAmount || 0,
        type: commission?.type || "percentage",
      },
      gateway: {
        provider: gateway.provider,
        apiKey: gateway.apiKey, // TODO: باید رمزنگاری شود
        merchantId: gateway.merchantId,
        environment: gateway.environment || "sandbox",
      },
      limits: {
        minAmount: limits?.minAmount || 1000,
        maxAmount: limits?.maxAmount || 50000000,
      },
      settings: {
        callbackUrl: settings?.callbackUrl,
        timeout: settings?.timeout || 900,
        enableLogging: settings?.enableLogging !== false,
      },
      createdBy: userId,
    });

    await newGateway.save();

    // ثبت فعالیت
    await logActivity(userId, "payment_gateway.create", {
      targetType: "PaymentGateway",
      targetId: newGateway._id,
      metadata: {
        gatewayCode: newGateway.code,
        gatewayTitle: newGateway.title,
      },
    });

    return NextResponse.json({
      success: true,
      message: "درگاه پرداخت با موفقیت ایجاد شد",
      gateway: {
        ...newGateway.toObject(),
        gateway: {
          provider: newGateway.gateway.provider,
          environment: newGateway.gateway.environment,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error creating payment gateway:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد درگاه پرداخت", details: error.message },
      { status: 500 }
    );
  }
}

