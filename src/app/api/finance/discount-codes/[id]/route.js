import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import DiscountCode from "@/lib/models/DiscountCode.model";
import Event from "@/lib/models/Event.model";
import TopicCategory from "@/lib/models/TopicCategory.model";
import PaymentGateway from "@/lib/models/PaymentGateway.model";
import User from "@/lib/models/User.model";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET /api/finance/discount-codes/[id]
 * دریافت جزئیات یک کد تخفیف
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectAPI(request, {
      allowedRoles: ["admin", "event_owner"],
    });

    if (!protection.success) {
      return NextResponse.json({ error: protection.error }, { status: protection.status });
    }

    const code = await DiscountCode.findById(params.id)
      .populate("paymentGateways", "title code")
      .populate("eventRestrictions.specificEvents", "title slug")
      .populate("eventRestrictions.specificCategories", "title icon")
      .populate("userRestrictions.specificUsers", "displayName phoneNumber")
      .lean();

    if (!code) {
      return NextResponse.json({ error: "کد تخفیف یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      discountCode: code,
    });
  } catch (error) {
    console.error("❌ Error fetching discount code:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات کد تخفیف", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/finance/discount-codes/[id]
 * ویرایش کد تخفیف
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

    const code = await DiscountCode.findById(params.id);

    if (!code) {
      return NextResponse.json({ error: "کد تخفیف یافت نشد" }, { status: 404 });
    }

    // به‌روزرسانی فیلدها
    if (body.title) code.title = body.title;
    if (body.description !== undefined) code.description = body.description;
    if (body.isActive !== undefined) code.isActive = body.isActive;

    if (body.discount) {
      code.discount = {
        type: body.discount.type || code.discount.type,
        value: body.discount.value ?? code.discount.value,
        maxAmount: body.discount.maxAmount ?? code.discount.maxAmount,
      };
    }

    if (body.commissionCalculation !== undefined) {
      code.commissionCalculation = body.commissionCalculation;
    }

    if (body.startDate) code.startDate = new Date(body.startDate);
    if (body.expiryDate) {
      const newExpiry = new Date(body.expiryDate);
      if (newExpiry <= code.startDate) {
        return NextResponse.json(
          { error: "تاریخ انقضا باید بعد از تاریخ شروع باشد" },
          { status: 400 }
        );
      }
      code.expiryDate = newExpiry;
    }

    if (body.usage) {
      code.usage = {
        maxUsage: body.usage.maxUsage ?? code.usage.maxUsage,
        maxUsagePerUser: body.usage.maxUsagePerUser ?? code.usage.maxUsagePerUser,
        usedCount: code.usage.usedCount, // نباید تغییر کند
      };
    }

    if (body.conditions) {
      code.conditions = {
        minPurchaseAmount: body.conditions.minPurchaseAmount ?? code.conditions.minPurchaseAmount,
        maxPurchaseAmount: body.conditions.maxPurchaseAmount ?? code.conditions.maxPurchaseAmount,
      };
    }

    if (body.userRestrictions) {
      code.userRestrictions = {
        specificUsers: body.userRestrictions.specificUsers ?? code.userRestrictions.specificUsers,
        newUsersOnly: body.userRestrictions.newUsersOnly ?? code.userRestrictions.newUsersOnly,
        allowedRoles: body.userRestrictions.allowedRoles ?? code.userRestrictions.allowedRoles,
      };
    }

    if (body.eventRestrictions) {
      code.eventRestrictions = {
        specificEvents: body.eventRestrictions.specificEvents ?? code.eventRestrictions.specificEvents,
        specificCategories: body.eventRestrictions.specificCategories ?? code.eventRestrictions.specificCategories,
      };
    }

    if (body.paymentGateways) {
      code.paymentGateways = body.paymentGateways;
    }

    code.updatedBy = userId;
    await code.save();

    // ثبت فعالیت
    await logActivity(userId, "discount_code.update", {
      targetType: "DiscountCode",
      targetId: code._id,
      metadata: {
        code: code.code,
        title: code.title,
      },
    });

    return NextResponse.json({
      success: true,
      message: "کد تخفیف با موفقیت به‌روزرسانی شد",
      discountCode: code,
    });
  } catch (error) {
    console.error("❌ Error updating discount code:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی کد تخفیف", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/finance/discount-codes/[id]
 * حذف کد تخفیف
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

    const code = await DiscountCode.findById(params.id);

    if (!code) {
      return NextResponse.json({ error: "کد تخفیف یافت نشد" }, { status: 404 });
    }

    const codeData = {
      code: code.code,
      title: code.title,
    };

    await code.deleteOne();

    // ثبت فعالیت
    await logActivity(userId, "discount_code.delete", {
      targetType: "DiscountCode",
      targetId: params.id,
      metadata: {
        code: codeData.code,
        title: codeData.title,
      },
    });

    return NextResponse.json({
      success: true,
      message: "کد تخفیف با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("❌ Error deleting discount code:", error);
    return NextResponse.json(
      { error: "خطا در حذف کد تخفیف", details: error.message },
      { status: 500 }
    );
  }
}

