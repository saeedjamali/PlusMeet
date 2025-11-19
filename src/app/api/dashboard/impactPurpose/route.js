import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import ImpactPurposeCategory from "@/lib/models/ImpactPurposeCategory.model";
import { authenticate } from "@/lib/middleware/auth";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";
import { checkPermission } from "@/lib/middleware/rbac";

// GET - لیست دسته‌بندی تأثیر و ارزش
export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");
    const isVisible = searchParams.get("isVisible");

    let query = {};

    // جستجو
    if (search) {
      query.$text = { $search: search };
    }

    // فیلتر وضعیت
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // فیلتر نمایش
    if (isVisible !== null && isVisible !== undefined) {
      query.isVisible = isVisible === "true";
    }

    const categories = await ImpactPurposeCategory.find(query)
      .sort({ order: 1, title: 1 })
      .populate("createdBy", "firstName lastName email phoneNumber")
      .populate("updatedBy", "firstName lastName email phoneNumber");

    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    console.error("❌ Error fetching impact/purpose categories:", error);
    return NextResponse.json(
      {
        error: "خطا در دریافت دسته‌بندی تأثیر و ارزش",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - ایجاد دسته‌بندی جدید
export async function POST(request) {
  try {
    await dbConnect();

    // بررسی احراز هویت
    const authResult = await authenticate(request, { requireCSRF: false });
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "لطفا وارد شوید" },
        { status: 401 }
      );
    }

    // بررسی دسترسی
    const hasPermission = await checkPermission(
      authResult.user.id,
      "impact_purpose_categories",
      "create"
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "شما دسترسی به ایجاد دسته‌بندی تأثیر و ارزش ندارید" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // اعتبارسنجی
    if (!body.title || body.title.trim() === "") {
      return NextResponse.json({ error: "عنوان الزامی است" }, { status: 400 });
    }

    if (!body.code || body.code.trim() === "") {
      return NextResponse.json({ error: "کد الزامی است" }, { status: 400 });
    }

    // بررسی یکتا بودن کد
    const existingCode = await ImpactPurposeCategory.findOne({
      code: body.code.toUpperCase().trim(),
    });

    if (existingCode) {
      return NextResponse.json(
        { error: "این کد قبلاً استفاده شده است" },
        { status: 400 }
      );
    }

    // ایجاد دسته‌بندی جدید
    const categoryData = {
      title: body.title.trim(),
      code: body.code.toUpperCase().trim(),
      description: body.description?.trim() || "",
      examples: Array.isArray(body.examples)
        ? body.examples.filter((e) => e?.trim())
        : [],
      icon: body.icon || "🎯",
      isActive: body.isActive !== undefined ? body.isActive : true,
      isVisible: body.isVisible !== undefined ? body.isVisible : true,
      order: body.order || 0,
      createdBy: authResult.user.id,
    };

    const newCategory = new ImpactPurposeCategory(categoryData);
    await newCategory.save();

    // Populate برای نمایش
    await newCategory.populate(
      "createdBy",
      "firstName lastName email phoneNumber"
    );

    return NextResponse.json(
      {
        success: true,
        message: "دسته‌بندی تأثیر و ارزش با موفقیت ایجاد شد",
        data: newCategory,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating impact/purpose category:", error);

    if (error.code === 11000) {
      return NextResponse.json({ error: "کد تکراری است" }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "خطا در ایجاد دسته‌بندی تأثیر و ارزش",
        details: error.message,
      },
      { status: 500 }
    );
  }
}



