import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import DiscountCode from "@/lib/models/DiscountCode.model";
import Event from "@/lib/models/Event.model";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * PUT /api/events/[id]/discount-codes/[codeId]
 * ویرایش کد تخفیف یک رویداد خاص
 */
export async function PUT(request, { params }) {
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

    const { id: eventId, codeId } = params;
    const userId = protection.user.id;
    const body = await request.json();

    // بررسی وجود رویداد و مالکیت
    const event = await Event.findById(eventId).select("creator status");

    if (!event) {
      return NextResponse.json(
        { error: "رویداد یافت نشد" },
        { status: 404 }
      );
    }

    const isOwner = event.creator.toString() === userId;
    const isAdmin = protection.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "شما مجاز به ویرایش کد تخفیف این رویداد نیستید" },
        { status: 403 }
      );
    }

    // پیدا کردن کد تخفیف
    const code = await DiscountCode.findById(codeId);

    if (!code) {
      return NextResponse.json(
        { error: "کد تخفیف یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی اینکه این کد مربوط به این رویداد هست
    const isEventCode = code.eventRestrictions?.specificEvents?.some(
      (ev) => ev.toString() === eventId
    );

    if (!isEventCode) {
      return NextResponse.json(
        { error: "این کد تخفیف مربوط به این رویداد نیست" },
        { status: 403 }
      );
    }

    // به‌روزرسانی فیلدها
    if (body.title) code.title = body.title;
    if (body.description !== undefined) code.description = body.description;
    if (body.isActive !== undefined) code.isActive = body.isActive;

    if (body.discount) {
      code.discount = {
        type: body.discount.type ?? code.discount.type,
        value: body.discount.value ?? code.discount.value,
        maxAmount: body.discount.maxAmount ?? code.discount.maxAmount,
      };
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

    code.updatedBy = userId;
    await code.save();

    // ثبت فعالیت
    await logActivity(userId, "discount_code.update", {
      targetType: "DiscountCode",
      targetId: code._id,
      metadata: {
        code: code.code,
        title: code.title,
        eventId: eventId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "کد تخفیف با موفقیت به‌روزرسانی شد",
      discountCode: code,
    });
  } catch (error) {
    console.error("❌ Error updating event discount code:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی کد تخفیف", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]/discount-codes/[codeId]
 * حذف کد تخفیف یک رویداد خاص
 */
export async function DELETE(request, { params }) {
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

    const { id: eventId, codeId } = params;
    const userId = protection.user.id;

    // بررسی وجود رویداد و مالکیت
    const event = await Event.findById(eventId).select("creator");

    if (!event) {
      return NextResponse.json(
        { error: "رویداد یافت نشد" },
        { status: 404 }
      );
    }

    const isOwner = event.creator.toString() === userId;
    const isAdmin = protection.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "شما مجاز به حذف کد تخفیف این رویداد نیستید" },
        { status: 403 }
      );
    }

    // پیدا کردن کد تخفیف
    const code = await DiscountCode.findById(codeId);

    if (!code) {
      return NextResponse.json(
        { error: "کد تخفیف یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی اینکه این کد مربوط به این رویداد هست
    const isEventCode = code.eventRestrictions?.specificEvents?.some(
      (ev) => ev.toString() === eventId
    );

    if (!isEventCode) {
      return NextResponse.json(
        { error: "این کد تخفیف مربوط به این رویداد نیست" },
        { status: 403 }
      );
    }

    // ثبت فعالیت قبل از حذف
    await logActivity(userId, "discount_code.delete", {
      targetType: "DiscountCode",
      targetId: code._id,
      metadata: {
        code: code.code,
        title: code.title,
        eventId: eventId,
      },
    });

    await DiscountCode.findByIdAndDelete(codeId);

    return NextResponse.json({
      success: true,
      message: "کد تخفیف با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("❌ Error deleting event discount code:", error);
    return NextResponse.json(
      { error: "خطا در حذف کد تخفیف", details: error.message },
      { status: 500 }
    );
  }
}

