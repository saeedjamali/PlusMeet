/**
 * API Route: Get Allowed Menus
 * دریافت منوهای مجاز برای کاربر براساس نقش‌هایش
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { authenticate } from "@/lib/middleware/auth";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { getAllowedMenus } from "@/lib/middleware/dynamicRbac";
import Menu from "@/lib/models/Menu.model";

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

    await connectDB();

    const user = authResult.user;

    console.log(
      "🔍 Fetching menus for user:",
      user.phoneNumber,
      "roles:",
      user.roles
    );

    // دریافت منوهای مجاز براساس نقش‌های کاربر
    const allowedMenuIds = await getAllowedMenus(user.roles);

    console.log("✅ Allowed menu IDs:", allowedMenuIds);

    // دریافت اطلاعات کامل منوها از دیتابیس
    let menus = await Menu.find({
      menuId: { $in: allowedMenuIds },
      isActive: true,
    })
      .select("menuId title titleEn path parentId icon order")
      .sort({ order: 1 })
      .lean();

    console.log("✅ Found menus:", menus.length);

    // اضافه کردن parent های missing به صورت recursive (با محدودیت depth)
    const addMissingParents = async (
      currentMenus,
      depth = 0,
      maxDepth = 10
    ) => {
      // ⚠️ جلوگیری از infinite loop با محدود کردن depth
      if (depth >= maxDepth) {
        console.warn("⚠️ Max depth reached, stopping recursion");
        return currentMenus;
      }

      const parentIds = new Set();
      currentMenus.forEach((menu) => {
        if (menu.parentId) {
          parentIds.add(menu.parentId);
        }
      });

      const existingParentIds = currentMenus.map((m) => m.menuId);
      const missingParentIds = [...parentIds].filter(
        (id) => !existingParentIds.includes(id)
      );

      if (missingParentIds.length === 0) {
        console.log(`✅ No missing parents at depth ${depth}`);
        return currentMenus; // ✅ No missing parents
      }

      console.log(
        `🔍 [Depth ${depth}] Looking for missing parents:`,
        missingParentIds
      );

      const parentMenus = await Menu.find({
        menuId: { $in: missingParentIds },
        isActive: true,
      })
        .select("menuId title titleEn path parentId icon order")
        .lean();

      console.log(
        `✅ [Depth ${depth}] Added missing parents: ${parentMenus.length}`
      );

      // ⚠️ اگر parent پیدا نشد، دیگه recursive نشو (جلوگیری از infinite loop)
      if (parentMenus.length === 0) {
        console.warn(
          "⚠️ Some parent menus not found in database:",
          missingParentIds
        );
        return currentMenus;
      }

      const updatedMenus = [...currentMenus, ...parentMenus];

      // Recursive: check if these parents also have missing parents
      return await addMissingParents(updatedMenus, depth + 1, maxDepth);
    };

    menus = await addMissingParents(menus);
    menus.sort((a, b) => a.order - b.order);

    // تبدیل به ساختار درختی (Tree Structure)
    const buildTree = (parentId = null) => {
      return menus
        .filter((menu) => {
          if (parentId === null) {
            return !menu.parentId || menu.parentId === null;
          }
          return menu.parentId === parentId;
        })
        .map((menu) => ({
          ...menu,
          children: buildTree(menu.menuId),
        }));
    };

    const treeMenus = buildTree();

    console.log("🌳 Tree menus:", JSON.stringify(treeMenus, null, 2));

    return NextResponse.json({
      success: true,
      menus: treeMenus,
    });
  } catch (error) {
    console.error("Error fetching allowed menus:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}
