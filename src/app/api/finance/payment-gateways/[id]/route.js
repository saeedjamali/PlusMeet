import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import PaymentGateway from "@/lib/models/PaymentGateway.model";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET /api/finance/payment-gateways/[id]
 * دریافت جزئیات یک درگاه پرداخت
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectAPI(request, {
      allowedRoles: ["admin"],
    });

    if (!protection.success) {
      return NextResponse.json({ error: protection.error }, { status: protection.status });
    }

    const gateway = await PaymentGateway.findById(params.id)
      .select("-gateway.apiKey -gateway.merchantId")
      .lean();

    if (!gateway) {
      return NextResponse.json({ error: "درگاه پرداخت یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      gateway,
    });
  } catch (error) {
    console.error("❌ Error fetching payment gateway:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات درگاه پرداخت", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/finance/payment-gateways/[id]
 * ویرایش درگاه پرداخت
 */
export async function PUT(request, { params }) {
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

    const gateway = await PaymentGateway.findById(params.id);

    if (!gateway) {
      return NextResponse.json({ error: "درگاه پرداخت یافت نشد" }, { status: 404 });
    }

    // اگر قرار است این درگاه پیش‌فرض شود
    if (body.isDefault && !gateway.isDefault) {
      await PaymentGateway.updateMany({ isDefault: true }, { isDefault: false });
    }

    // به‌روزرسانی فیلدها
    if (body.title) gateway.title = body.title;
    if (body.description !== undefined) gateway.description = body.description;
    if (body.isActive !== undefined) gateway.isActive = body.isActive;
    if (body.isDefault !== undefined) gateway.isDefault = body.isDefault;

    if (body.commission) {
      gateway.commission = {
        percentage: body.commission.percentage ?? gateway.commission.percentage,
        fixedAmount: body.commission.fixedAmount ?? gateway.commission.fixedAmount,
        type: body.commission.type || gateway.commission.type,
      };
    }

    if (body.limits) {
      gateway.limits = {
        minAmount: body.limits.minAmount ?? gateway.limits.minAmount,
        maxAmount: body.limits.maxAmount ?? gateway.limits.maxAmount,
      };
    }

    if (body.settings) {
      gateway.settings = {
        callbackUrl: body.settings.callbackUrl ?? gateway.settings.callbackUrl,
        timeout: body.settings.timeout ?? gateway.settings.timeout,
        enableLogging: body.settings.enableLogging ?? gateway.settings.enableLogging,
      };
    }

    if (body.gateway) {
      if (body.gateway.apiKey) gateway.gateway.apiKey = body.gateway.apiKey;
      if (body.gateway.merchantId) gateway.gateway.merchantId = body.gateway.merchantId;
      if (body.gateway.environment) gateway.gateway.environment = body.gateway.environment;
    }

    gateway.updatedBy = userId;
    await gateway.save();

    // ثبت فعالیت
    await logActivity(userId, "payment_gateway.update", {
      targetType: "PaymentGateway",
      targetId: gateway._id,
      metadata: {
        gatewayCode: gateway.code,
        gatewayTitle: gateway.title,
      },
    });

    return NextResponse.json({
      success: true,
      message: "درگاه پرداخت با موفقیت به‌روزرسانی شد",
      gateway: {
        ...gateway.toObject(),
        gateway: {
          provider: gateway.gateway.provider,
          environment: gateway.gateway.environment,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error updating payment gateway:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی درگاه پرداخت", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/finance/payment-gateways/[id]
 * حذف درگاه پرداخت
 */
export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectAPI(request, {
      allowedRoles: ["admin"],
    });

    if (!protection.success) {
      return NextResponse.json({ error: protection.error }, { status: protection.status });
    }

    const userId = protection.user.id;

    const gateway = await PaymentGateway.findById(params.id);

    if (!gateway) {
      return NextResponse.json({ error: "درگاه پرداخت یافت نشد" }, { status: 404 });
    }

    // نمی‌توان درگاه پیش‌فرض را حذف کرد
    if (gateway.isDefault) {
      return NextResponse.json(
        { error: "نمی‌توانید درگاه پیش‌فرض را حذف کنید" },
        { status: 400 }
      );
    }

    const gatewayData = {
      code: gateway.code,
      title: gateway.title,
    };

    await gateway.deleteOne();

    // ثبت فعالیت
    await logActivity(userId, "payment_gateway.delete", {
      targetType: "PaymentGateway",
      targetId: params.id,
      metadata: {
        gatewayCode: gatewayData.code,
        gatewayTitle: gatewayData.title,
      },
    });

    return NextResponse.json({
      success: true,
      message: "درگاه پرداخت با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("❌ Error deleting payment gateway:", error);
    return NextResponse.json(
      { error: "خطا در حذف درگاه پرداخت", details: error.message },
      { status: 500 }
    );
  }
}

