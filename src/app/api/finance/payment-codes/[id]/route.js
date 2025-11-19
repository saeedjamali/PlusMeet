import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import PaymentCode from "@/lib/models/PaymentCode.model";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET /api/finance/payment-codes/[id]
 * دریافت جزئیات یک کد پرداخت
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

    const code = await PaymentCode.findById(params.id)
      .populate("discountCodes", "code title discount expiryDate usage")
      .populate("allowedGateways", "title code")
      .lean();

    if (!code) {
      return NextResponse.json({ error: "کد پرداخت یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      paymentCode: code,
    });
  } catch (error) {
    console.error("❌ Error fetching payment code:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات کد پرداخت", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/finance/payment-codes/[id]
 * ویرایش کد پرداخت
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

    const code = await PaymentCode.findById(params.id);

    if (!code) {
      return NextResponse.json({ error: "کد پرداخت یافت نشد" }, { status: 404 });
    }

    // به‌روزرسانی فیلدها
    if (body.title) code.title = body.title;
    if (body.description !== undefined) code.description = body.description;
    if (body.isActive !== undefined) code.isActive = body.isActive;

    if (body.commission) {
      code.commission = {
        percentage: body.commission.percentage ?? code.commission.percentage,
        fixedAmount: body.commission.fixedAmount ?? code.commission.fixedAmount,
        type: body.commission.type || code.commission.type,
      };
    }

    if (body.discountCodes !== undefined) {
      code.discountCodes = body.discountCodes;
    }

    if (body.allowedGateways !== undefined) {
      code.allowedGateways = body.allowedGateways;
    }

    if (body.settings) {
      code.settings = {
        allowEventJoin: body.settings.allowEventJoin ?? code.settings.allowEventJoin,
        allowTicketPurchase: body.settings.allowTicketPurchase ?? code.settings.allowTicketPurchase,
        allowCourseEnrollment:
          body.settings.allowCourseEnrollment ?? code.settings.allowCourseEnrollment,
        minAmount: body.settings.minAmount ?? code.settings.minAmount,
        maxAmount: body.settings.maxAmount ?? code.settings.maxAmount,
      };
    }

    code.updatedBy = userId;
    await code.save();

    // ثبت فعالیت
    await logActivity(userId, "payment_code.update", {
      targetType: "PaymentCode",
      targetId: code._id,
      metadata: {
        code: code.code,
        title: code.title,
      },
    });

    return NextResponse.json({
      success: true,
      message: "کد پرداخت با موفقیت به‌روزرسانی شد",
      paymentCode: code,
    });
  } catch (error) {
    console.error("❌ Error updating payment code:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی کد پرداخت", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/finance/payment-codes/[id]
 * حذف کد پرداخت
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

    const code = await PaymentCode.findById(params.id);

    if (!code) {
      return NextResponse.json({ error: "کد پرداخت یافت نشد" }, { status: 404 });
    }

    const codeData = {
      code: code.code,
      title: code.title,
    };

    await code.deleteOne();

    // ثبت فعالیت
    await logActivity(userId, "payment_code.delete", {
      targetType: "PaymentCode",
      targetId: params.id,
      metadata: {
        code: codeData.code,
        title: codeData.title,
      },
    });

    return NextResponse.json({
      success: true,
      message: "کد پرداخت با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("❌ Error deleting payment code:", error);
    return NextResponse.json(
      { error: "خطا در حذف کد پرداخت", details: error.message },
      { status: 500 }
    );
  }
}

