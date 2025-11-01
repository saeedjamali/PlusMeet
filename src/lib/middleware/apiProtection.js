/**
 * API Protection Middleware
 * محافظت از API routes با استفاده از RBAC دینامیک
 */

import { NextResponse } from "next/server";
import { authenticate, requireRole } from "./auth";
import { checkApiPermission } from "./dynamicRbac";

/**
 * محافظت از API با احراز هویت و بررسی مجوز
 * @param {Request} request - Next.js request object
 * @param {object} options - تنظیمات
 * @param {string[]} options.allowedRoles - نقش‌های مجاز (اختیاری)
 * @param {boolean} options.checkPermission - بررسی مجوز از دیتابیس (پیش‌فرض: true)
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function protectApi(request, options = {}) {
  const { allowedRoles = null, checkPermission = true } = options;

  try {
    // گام 1: احراز هویت
    const authResult = await authenticate(request);

    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
        status: 401,
      };
    }

    const user = authResult.user;

    // گام 2: بررسی مجوز API از دیتابیس (اگر فعال باشد)
    if (checkPermission) {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      console.log(
        `🔍 Checking API permission: ${method} ${path} for user:`,
        user.phoneNumber
      );

      const permissionResult = await checkApiPermission(user, path, method);

      if (permissionResult.success) {
        console.log(`✅ API permission granted via RBAC`);
        return {
          success: true,
          user: user,
        };
      }

      // اگر permission check ناموفق بود، بررسی fallback
      console.log(`⚠️ RBAC check failed: ${permissionResult.error}`);
    }

    // گام 3: Fallback به بررسی نقش (اگر مشخص شده باشد)
    if (allowedRoles && allowedRoles.length > 0) {
      const roleResult = await requireRole(request, allowedRoles);

      if (!roleResult.success) {
        return {
          success: false,
          error: roleResult.error,
          status: 403,
        };
      }

      console.log(
        `✅ API permission granted via allowedRoles: ${allowedRoles.join(", ")}`
      );
      return {
        success: true,
        user: user,
      };
    }

    // اگر هیچکدام موفق نبود
    if (checkPermission) {
      return {
        success: false,
        error: "شما دسترسی لازم به این منبع را ندارید",
        status: 403,
      };
    }

    // موفق
    return {
      success: true,
      user: user,
    };
  } catch (error) {
    console.error("Error in protectApi:", error);
    return {
      success: false,
      error: "خطای سرور",
      status: 500,
    };
  }
}

/**
 * Helper برای پاسخ خطا
 */
export function unauthorizedResponse(error = "دسترسی غیرمجاز") {
  return NextResponse.json({ success: false, error }, { status: 401 });
}

export function forbiddenResponse(
  error = "شما مجوز دسترسی به این منبع را ندارید"
) {
  return NextResponse.json({ success: false, error }, { status: 403 });
}

export function serverErrorResponse(error = "خطای سرور") {
  return NextResponse.json({ success: false, error }, { status: 500 });
}

/**
 * مثال استفاده:
 *
 * import { protectApi, forbiddenResponse } from "@/lib/middleware/apiProtection";
 *
 * export async function GET(request) {
 *   // محافظت با RBAC دینامیک
 *   const protection = await protectApi(request);
 *
 *   if (!protection.success) {
 *     return NextResponse.json(
 *       { error: protection.error },
 *       { status: protection.status }
 *     );
 *   }
 *
 *   const user = protection.user;
 *
 *   // کد اصلی API...
 *   return NextResponse.json({ success: true, data: "..." });
 * }
 *
 * // یا با نقش‌های خاص:
 * const protection = await protectApi(request, {
 *   allowedRoles: ["admin", "moderator"],
 *   checkPermission: true // بررسی مجوز از دیتابیس
 * });
 */
