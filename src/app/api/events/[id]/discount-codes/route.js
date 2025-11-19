import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import DiscountCode from "@/lib/models/DiscountCode.model";
import Event from "@/lib/models/Event.model";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET /api/events/[id]/discount-codes
 * دریافت کدهای تخفیف یک رویداد خاص
 */
export async function GET(request, { params }) {
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

    const { id: eventId } = params;
    const userId = protection.user.id;

    // بررسی وجود رویداد و مالکیت
    const event = await Event.findById(eventId).select("creator status");

    if (!event) {
      return NextResponse.json(
        { error: "رویداد یافت نشد" },
        { status: 404 }
      );
    }

    // فقط مالک رویداد یا admin میتونه کدهای تخفیف رو ببینه
    const isOwner = event.creator.toString() === userId;
    const isAdmin = protection.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "شما مجاز به مشاهده کدهای تخفیف این رویداد نیستید" },
        { status: 403 }
      );
    }

    // دریافت کدهای تخفیف این رویداد
    const discountCodes = await DiscountCode.find({
      "eventRestrictions.specificEvents": eventId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      discountCodes,
      count: discountCodes.length,
    });
  } catch (error) {
    console.error("❌ Error fetching event discount codes:", error);
    return NextResponse.json(
      { error: "خطا در دریافت کدهای تخفیف", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/[id]/discount-codes
 * ایجاد کد تخفیف جدید برای یک رویداد خاص
 */
export async function POST(request, { params }) {
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

    const { id: eventId } = params;
    const userId = protection.user.id;
    const body = await request.json();

    // بررسی وجود رویداد و مالکیت
    const event = await Event.findById(eventId).select("creator status title");

    if (!event) {
      return NextResponse.json(
        { error: "رویداد یافت نشد" },
        { status: 404 }
      );
    }

    // فقط مالک رویداد یا admin میتونه کد تخفیف بسازه
    const isOwner = event.creator.toString() === userId;
    const isAdmin = protection.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "شما مجاز به ایجاد کد تخفیف برای این رویداد نیستید" },
        { status: 403 }
      );
    }

    // بررسی وضعیت رویداد
    if (event.status !== "approved") {
      return NextResponse.json(
        { error: "فقط رویدادهای تایید شده می‌توانند کد تخفیف داشته باشند" },
        { status: 400 }
      );
    }

    const { code, title, description, discount, isActive, startDate, expiryDate, usage } =
      body;

    // اعتبارسنجی
    if (!code || !title || !discount?.type || discount?.value === undefined || !expiryDate) {
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
      // کمیسیون همیشه از قیمت اصلی محاسبه می‌شود (قبل از تخفیف)
      commissionCalculation: "beforeDiscount",
      isActive: isActive !== undefined ? isActive : true,
      startDate: start,
      expiryDate: expiry,
      usage: {
        maxUsage: usage?.maxUsage,
        maxUsagePerUser: usage?.maxUsagePerUser || 1,
        usedCount: 0,
      },
      // شرایط پیش‌فرض صفر (بدون محدودیت مبلغ)
      conditions: {
        minPurchaseAmount: 0,
        maxPurchaseAmount: null,
      },
      // محدودیت به این رویداد خاص
      eventRestrictions: {
        specificEvents: [eventId],
        specificCategories: [],
      },
      userRestrictions: {
        specificUsers: [],
        newUsersOnly: false,
        allowedRoles: [],
      },
      paymentGateways: [],
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
        eventId: eventId,
        eventTitle: event.title,
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
    console.error("❌ Error creating event discount code:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد کد تخفیف", details: error.message },
      { status: 500 }
    );
  }
}

