/**
 * API Route: Menus Management
 * مدیریت منوها (دریافت ساختار درختی)
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Menu from "@/lib/models/Menu.model";
import { authenticate } from "@/lib/middleware/auth";
import { protectAPI } from "@/lib/middleware/apiProtection";

/**
 * GET - دریافت ساختار درختی منوها
 */
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

    // Authentication
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    // Authorization - فقط admin
    if (!authResult.user.roles?.includes("admin")) {
      return NextResponse.json(
        { success: false, error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    await connectDB();

    // گرفتن query params
    const { searchParams } = new URL(request.url);
    const asTree = searchParams.get("asTree") === "true";
    const format = searchParams.get("format") || (asTree ? "tree" : "tree"); // tree | flat

    if (format === "flat") {
      // لیست صاف (برای select dropdown)
      const menus = await Menu.find({ isActive: true })
        .sort({ order: 1 })
        .lean();

      return NextResponse.json({
        success: true,
        data: {
          menus: menus.map((m) => ({
            id: m._id,
            menuId: m.menuId,
            title: m.title,
            titleEn: m.titleEn,
            path: m.path,
            parentId: m.parentId,
            icon: m.icon,
            order: m.order,
          })),
          total: menus.length,
        },
      });
    }

    // ساختار درختی (default)
    const tree = await Menu.getTreeStructure();

    return NextResponse.json({
      success: true,
      data: {
        menus: tree,
        total: tree.length,
      },
    });
  } catch (error) {
    console.error("Error fetching menus:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}

/**
 * POST - ایجاد منوی جدید (آینده)
 * فعلاً منوها از طریق seed script اضافه می‌شن
 */
export async function POST(request) {
  try {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    if (!authResult.user.roles?.includes("admin")) {
      return NextResponse.json(
        { success: false, error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { menuId, title, titleEn, path, parentId, icon, order, description } =
      body;

    // Validation
    if (!menuId || !title) {
      return NextResponse.json(
        { success: false, error: "شناسه و عنوان منو الزامی است" },
        { status: 400 }
      );
    }

    await connectDB();

    // بررسی تکراری بودن menuId
    const existingMenu = await Menu.findOne({ menuId });
    if (existingMenu) {
      return NextResponse.json(
        { success: false, error: "شناسه منو تکراری است" },
        { status: 400 }
      );
    }

    const menu = new Menu({
      menuId,
      title,
      titleEn,
      path,
      parentId: parentId || null,
      icon: icon || "📄",
      order: order || 0,
      description,
    });

    await menu.save();

    return NextResponse.json(
      {
        success: true,
        message: "منو با موفقیت ایجاد شد",
        data: { menu: menu.toPublicJSON() },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating menu:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}
