import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import ParticipationTypeCategory from "@/lib/models/ParticipationTypeCategory.model";
import { authenticate } from "@/lib/middleware/auth";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { checkPermission } from "@/lib/middleware/rbac";

// GET - لیست نحوه شرکت در رویداد (عمومی - بدون نیاز به احراز هویت)
export async function GET(request) {
  try {
    // API Protection با isPublic = true (بدون نیاز به authentication)
    const protection = await protectAPI(request, { isPublic: true });

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");
    const isVisible = searchParams.get("isVisible");

    let query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (isVisible !== null && isVisible !== undefined) {
      query.isVisible = isVisible === "true";
    }

    const categories = await ParticipationTypeCategory.find(query)
      .sort({ order: 1, title: 1 })
      .populate("createdBy", "firstName lastName email phoneNumber")
      .populate("updatedBy", "firstName lastName email phoneNumber");

    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    console.error("❌ Error fetching participation type categories:", error);
    return NextResponse.json(
      {
        error: "خطا در دریافت نحوه شرکت در رویداد",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - ایجاد نحوه شرکت در رویداد جدید
export async function POST(request) {
  try {
    await dbConnect();

    const authResult = await authenticate(request, { requireCSRF: false });
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "لطفا وارد شوید" },
        { status: 401 }
      );
    }

    const hasPermission = await checkPermission(
      authResult.user.id,
      "participation_type_categories",
      "create"
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "شما دسترسی به ایجاد نحوه شرکت در رویداد ندارید" },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.title || body.title.trim() === "") {
      return NextResponse.json({ error: "عنوان الزامی است" }, { status: 400 });
    }

    if (!body.code || body.code.trim() === "") {
      return NextResponse.json({ error: "کد الزامی است" }, { status: 400 });
    }

    const existingCode = await ParticipationTypeCategory.findOne({
      code: body.code.toUpperCase().trim(),
    });

    if (existingCode) {
      return NextResponse.json(
        { error: "این کد قبلاً استفاده شده است" },
        { status: 400 }
      );
    }

    const categoryData = {
      title: body.title.trim(),
      code: body.code.toUpperCase().trim(),
      description: body.description?.trim() || "",
      examples: Array.isArray(body.examples)
        ? body.examples.filter((e) => e?.trim())
        : [],
      icon: body.icon || "🎫",
      isActive: body.isActive !== undefined ? body.isActive : true,
      isVisible: body.isVisible !== undefined ? body.isVisible : true,
      order: body.order || 0,
      createdBy: authResult.user.id,
    };

    const newCategory = new ParticipationTypeCategory(categoryData);
    await newCategory.save();

    await newCategory.populate(
      "createdBy",
      "firstName lastName email phoneNumber"
    );

    return NextResponse.json(
      {
        success: true,
        message: "نحوه شرکت در رویداد با موفقیت ایجاد شد",
        data: newCategory,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating participation type category:", error);

    if (error.code === 11000) {
      return NextResponse.json({ error: "کد تکراری است" }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "خطا در ایجاد نحوه شرکت در رویداد",
        details: error.message,
      },
      { status: 500 }
    );
  }
}













