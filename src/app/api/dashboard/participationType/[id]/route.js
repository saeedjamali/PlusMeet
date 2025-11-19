import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import ParticipationTypeCategory from "@/lib/models/ParticipationTypeCategory.model";
import { authenticate } from "@/lib/middleware/auth";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { checkPermission } from "@/lib/middleware/rbac";

export async function GET(request, { params }) {
  try {
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    await dbConnect();

    const { id } = params;

    const category = await ParticipationTypeCategory.findById(id)
      .populate("createdBy", "firstName lastName email phoneNumber")
      .populate("updatedBy", "firstName lastName email phoneNumber");

    if (!category) {
      return NextResponse.json(
        { error: "نحوه شرکت در رویداد یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("❌ Error fetching participation type category:", error);
    return NextResponse.json(
      {
        error: "خطا در دریافت نحوه شرکت در رویداد",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
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
      "update"
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "شما دسترسی به ویرایش نحوه شرکت در رویداد ندارید" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    const category = await ParticipationTypeCategory.findById(id);

    if (!category) {
      return NextResponse.json(
        { error: "نحوه شرکت در رویداد یافت نشد" },
        { status: 404 }
      );
    }

    if (body.code && body.code.toUpperCase().trim() !== category.code) {
      const existingCode = await ParticipationTypeCategory.findOne({
        code: body.code.toUpperCase().trim(),
        _id: { $ne: id },
      });

      if (existingCode) {
        return NextResponse.json(
          { error: "این کد قبلاً استفاده شده است" },
          { status: 400 }
        );
      }
    }

    if (body.title !== undefined) category.title = body.title.trim();
    if (body.code !== undefined) category.code = body.code.toUpperCase().trim();
    if (body.description !== undefined)
      category.description = body.description.trim();
    if (body.examples !== undefined) {
      category.examples = Array.isArray(body.examples)
        ? body.examples.filter((e) => e?.trim())
        : [];
    }
    if (body.icon !== undefined) category.icon = body.icon;
    if (body.isActive !== undefined) category.isActive = body.isActive;
    if (body.isVisible !== undefined) category.isVisible = body.isVisible;
    if (body.order !== undefined) category.order = body.order;

    category.updatedBy = authResult.user.id;
    await category.save();

    await category.populate(
      "createdBy",
      "firstName lastName email phoneNumber"
    );
    await category.populate(
      "updatedBy",
      "firstName lastName email phoneNumber"
    );

    return NextResponse.json({
      success: true,
      message: "نحوه شرکت در رویداد با موفقیت به‌روزرسانی شد",
      data: category,
    });
  } catch (error) {
    console.error("❌ Error updating participation type category:", error);

    if (error.code === 11000) {
      return NextResponse.json({ error: "کد تکراری است" }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "خطا در به‌روزرسانی نحوه شرکت در رویداد",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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
      "delete"
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "شما دسترسی به حذف نحوه شرکت در رویداد ندارید" },
        { status: 403 }
      );
    }

    const { id } = params;

    const category = await ParticipationTypeCategory.findById(id);

    if (!category) {
      return NextResponse.json(
        { error: "نحوه شرکت در رویداد یافت نشد" },
        { status: 404 }
      );
    }

    if (category.eventsCount > 0) {
      return NextResponse.json(
        {
          error: `این نحوه شرکت در ${category.eventsCount} رویداد استفاده شده است و نمی‌توان آن را حذف کرد`,
        },
        { status: 400 }
      );
    }

    await ParticipationTypeCategory.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "نحوه شرکت در رویداد با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("❌ Error deleting participation type category:", error);
    return NextResponse.json(
      {
        error: "خطا در حذف نحوه شرکت در رویداد",
        details: error.message,
      },
      { status: 500 }
    );
  }
}


