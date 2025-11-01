/**
 * API Route: Menu Management (CRUD)
 * مدیریت منوها - ایجاد، خواندن، ویرایش، حذف
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Menu from "@/lib/models/Menu.model";
import { protectApi } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET - لیست تمام منوها (به صورت درختی)
 */
export async function GET(request) {
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

    // دریافت تمام منوها
    const menus = await Menu.find().sort({ order: 1 }).lean();

    // ساخت ساختار درختی
    const buildTree = (parentId = null) => {
      return menus
        .filter((menu) => {
          if (parentId === null) {
            return !menu.parentId;
          }
          return menu.parentId === parentId;
        })
        .map((menu) => ({
          ...menu,
          children: buildTree(menu.menuId),
        }));
    };

    const tree = buildTree();

    // ثبت لاگ
    await logActivity(protection.user.phoneNumber, "settings.menus.list", {
      targetType: "Menu",
      metadata: {
        count: menus.length,
      },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      data: {
        menus: tree,
        totalCount: menus.length,
      },
    });
  } catch (error) {
    console.error("Error fetching menus:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - ایجاد منوی جدید
 */
export async function POST(request) {
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

    const body = await request.json();
    const {
      menuId,
      title,
      titleEn,
      path,
      parentId,
      icon,
      order,
      defaultRoles,
      isActive,
    } = body;

    // Validation
    if (!menuId || !title) {
      return NextResponse.json(
        {
          success: false,
          error: "menuId و title الزامی هستند",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // بررسی تکراری بودن menuId
    const existingMenu = await Menu.findOne({ menuId });
    if (existingMenu) {
      return NextResponse.json(
        {
          success: false,
          error: "این menuId قبلاً استفاده شده است",
          code: "DUPLICATE_MENU_ID",
        },
        { status: 400 }
      );
    }

    // ایجاد منوی جدید
    const newMenu = await Menu.create({
      menuId,
      title,
      titleEn: titleEn || title,
      path: path || null,
      parentId: parentId || null,
      icon: icon || null,
      order: order || 999,
      defaultRoles: defaultRoles || [],
      isActive: isActive !== false, // default true
    });

    // ثبت لاگ
    await logActivity(protection.user.phoneNumber, "menu.create", {
      targetType: "Menu",
      targetId: newMenu._id,
      metadata: {
        menuId: newMenu.menuId,
        title: newMenu.title,
        path: newMenu.path,
      },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: "منو با موفقیت ایجاد شد",
      data: newMenu,
    });
  } catch (error) {
    console.error("Error creating menu:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور", details: error.message },
      { status: 500 }
    );
  }
}

