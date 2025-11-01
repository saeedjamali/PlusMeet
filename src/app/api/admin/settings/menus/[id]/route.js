/**
 * API Route: Single Menu Operations (GET, PUT, DELETE)
 * عملیات روی منوی خاص
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Menu from "@/lib/models/Menu.model";
import { protectApi } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET - دریافت اطلاعات یک منوی خاص
 */
export async function GET(request, { params }) {
  try {
    // محافظت API
    const protection = await protectApi(request, {
      allowedRoles: ["admin"],
      checkPermission: true,
    });

    if (!protection.success) {
      return NextResponse.json(
        { success: false, error: protection.error },
        { status: protection.status }
      );
    }

    await connectDB();

    const { id } = params;

    const menu = await Menu.findById(id).lean();

    if (!menu) {
      return NextResponse.json(
        { success: false, error: "منو یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: menu,
    });
  } catch (error) {
    console.error("Error fetching menu:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT - ویرایش منو
 */
export async function PUT(request, { params }) {
  try {
    // محافظت API
    const protection = await protectApi(request, {
      allowedRoles: ["admin"],
      checkPermission: true,
    });

    if (!protection.success) {
      return NextResponse.json(
        { success: false, error: protection.error },
        { status: protection.status }
      );
    }

    await connectDB();

    const { id } = params;
    const body = await request.json();

    const menu = await Menu.findById(id);

    if (!menu) {
      return NextResponse.json(
        { success: false, error: "منو یافت نشد" },
        { status: 404 }
      );
    }

    // ذخیره مقادیر قبلی برای لاگ
    const oldValues = { ...menu.toObject() };

    // آپدیت فیلدها
    const allowedFields = [
      "title",
      "titleEn",
      "path",
      "parentId",
      "icon",
      "order",
      "defaultRoles",
      "isActive",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        // تبدیل parentId خالی به null
        if (field === "parentId") {
          menu[field] =
            body[field] === "" || body[field] === null ? null : body[field];
        }
        // تبدیل path خالی به null
        else if (field === "path") {
          menu[field] = body[field] === "" ? null : body[field];
        } else {
          menu[field] = body[field];
        }
      }
    });

    await menu.save();

    // ثبت لاگ
    await logActivity(protection.user.phoneNumber, "menu.update", {
      targetType: "Menu",
      targetId: menu._id,
      metadata: {
        menuId: menu.menuId,
        oldValues,
        newValues: menu.toObject(),
      },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: "منو با موفقیت ویرایش شد",
      data: menu,
    });
  } catch (error) {
    console.error("Error updating menu:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - حذف منو
 */
export async function DELETE(request, { params }) {
  try {
    // محافظت API
    const protection = await protectApi(request, {
      allowedRoles: ["admin"],
      checkPermission: true,
    });

    if (!protection.success) {
      return NextResponse.json(
        { success: false, error: protection.error },
        { status: protection.status }
      );
    }

    await connectDB();

    const { id } = params;

    const menu = await Menu.findById(id);

    if (!menu) {
      return NextResponse.json(
        { success: false, error: "منو یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی اینکه آیا منو، والد منوهای دیگر است؟
    const childMenus = await Menu.find({ parentId: menu.menuId });
    if (childMenus.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "این منو دارای زیرمنو است و نمی‌توان آن را حذف کرد",
          code: "HAS_CHILDREN",
          data: {
            childCount: childMenus.length,
          },
        },
        { status: 400 }
      );
    }

    // ذخیره اطلاعات برای لاگ
    const menuData = menu.toObject();

    await Menu.findByIdAndDelete(id);

    // ثبت لاگ
    await logActivity(protection.user.phoneNumber, "menu.delete", {
      targetType: "Menu",
      targetId: id,
      metadata: {
        menuId: menuData.menuId,
        title: menuData.title,
        path: menuData.path,
      },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: "منو با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("Error deleting menu:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور", details: error.message },
      { status: 500 }
    );
  }
}
