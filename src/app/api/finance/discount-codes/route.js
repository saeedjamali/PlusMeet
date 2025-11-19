import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import DiscountCode from "@/lib/models/DiscountCode.model";
import Event from "@/lib/models/Event.model";
import TopicCategory from "@/lib/models/TopicCategory.model";
import PaymentGateway from "@/lib/models/PaymentGateway.model";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET /api/finance/discount-codes
 * دریافت لیست کدهای تخفیف
 */
export async function GET(request) {
  try {
    await dbConnect();

    const protection = await protectAPI(request, {
      allowedRoles: ["admin", "event_owner"],
    });

    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const search = searchParams.get("search");

    const query = {};

    if (activeOnly) {
      const now = new Date();
      query.isActive = true;
      query.startDate = { $lte: now };
      query.expiryDate = { $gt: now };
    }

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [codes, total] = await Promise.all([
      DiscountCode.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("paymentGateways", "title code")
        .populate("eventRestrictions.specificEvents", "title slug")
        .populate("eventRestrictions.specificCategories", "title icon")
        .lean(),
      DiscountCode.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      codes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching discount codes:", error);
    return NextResponse.json(
      { error: "خطا در دریافت کدهای تخفیف", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/finance/discount-codes
 * ایجاد کد تخفیف جدید
 */
export async function POST(request) {
  try {
    await dbConnect();

    const protection = await protectAPI(request, {
      allowedRoles: ["admin"],
    });

    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    const userId = protection.user.id;
    const body = await request.json();

    const {
      code,
      title,
      description,
      discount,
      commissionCalculation,
      isActive,
      startDate,
      expiryDate,
      usage,
      conditions,
      userRestrictions,
      eventRestrictions,
      paymentGateways,
    } = body;

    // اعتبارسنجی
    if (
      !code ||
      !title ||
      !discount?.type ||
      discount?.value === undefined ||
      !expiryDate
    ) {
      return NextResponse.json(
        { error: "اطلاعات الزامی وارد نشده است" },
        { status: 400 }
      );
    }

    // چک تکراری بودن کد
    const existingCode = await DiscountCode.findOne({
      code: code.toUpperCase(),
    });

    if (existingCode) {
      return NextResponse.json(
        { error: "این کد قبلاً ثبت شده است" },
        { status: 400 }
      );
    }

    // اعتبارسنجی تاریخ
    const start = new Date(startDate || Date.now());
    const expiry = new Date(expiryDate);

    if (expiry <= start) {
      return NextResponse.json(
        { error: "تاریخ انقضا باید بعد از تاریخ شروع باشد" },
        { status: 400 }
      );
    }

    // ایجاد کد تخفیف جدید
    const newCode = new DiscountCode({
      code: code.toUpperCase(),
      title,
      description,
      discount: {
        type: discount.type,
        value: discount.value,
        maxAmount: discount.maxAmount,
      },
      commissionCalculation: commissionCalculation || "beforeDiscount",
      isActive: isActive !== undefined ? isActive : true,
      startDate: start,
      expiryDate: expiry,
      usage: {
        maxUsage: usage?.maxUsage,
        maxUsagePerUser: usage?.maxUsagePerUser || 1,
        usedCount: 0,
      },
      conditions: {
        minPurchaseAmount: conditions?.minPurchaseAmount || 0,
        maxPurchaseAmount: conditions?.maxPurchaseAmount,
      },
      userRestrictions: {
        specificUsers: userRestrictions?.specificUsers || [],
        newUsersOnly: userRestrictions?.newUsersOnly || false,
        allowedRoles: userRestrictions?.allowedRoles || [],
      },
      eventRestrictions: {
        specificEvents: eventRestrictions?.specificEvents || [],
        specificCategories: eventRestrictions?.specificCategories || [],
      },
      paymentGateways: paymentGateways || [],
      createdBy: userId,
    });

    await newCode.save();

    // ثبت فعالیت
    await logActivity(userId, "discount_code.create", {
      targetType: "DiscountCode",
      targetId: newCode._id,
      metadata: {
        code: newCode.code,
        title: newCode.title,
        discountType: newCode.discount.type,
        discountValue: newCode.discount.value,
      },
    });

    return NextResponse.json({
      success: true,
      message: "کد تخفیف با موفقیت ایجاد شد",
      discountCode: newCode,
    });
  } catch (error) {
    console.error("❌ Error creating discount code:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد کد تخفیف", details: error.message },
      { status: 500 }
    );
  }
}
