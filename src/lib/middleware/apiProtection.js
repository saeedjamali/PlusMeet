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
 * @param {boolean} options.isPublic - آیا API عمومی است (پیش‌فرض: false)
 * @param {boolean} options.requireCSRF - نیاز به CSRF token (پیش‌فرض: false)
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function protectAPI(request, options = {}) {
  const {
    allowedRoles = null,
    checkPermission = true,
    isPublic = false,
    requireCSRF = false, // Default false for API protection
  } = options;

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  console.log("\n" + "=".repeat(80));
  console.log(`🛡️ [API PROTECTION] ${method} ${path}`);
  console.log("=".repeat(80));

  try {
    // اگر API عمومی است، فقط لاگ می‌کنیم
    if (isPublic) {
      console.log("✅ [PUBLIC API] No authentication required");
      console.log("=".repeat(80) + "\n");
      return {
        success: true,
        user: null,
      };
    }

    // گام 1: احراز هویت
    console.log("🔐 Step 1: Authentication check...");
    const authResult = await authenticate(request, { requireCSRF });

    if (!authResult.success) {
      console.error("❌ Authentication failed:", authResult.error);
      console.log("=".repeat(80) + "\n");
      return {
        success: false,
        error: authResult.error,
        status: 401,
      };
    }

    const user = authResult.user;
  console.log("user--------->", user);
    console.log(
      `✅ User authenticated: ${user.phoneNumber} | Roles: [${user.roles?.join(
        ", "
      )}]`
    );

    // گام 2: بررسی مجوز API از دیتابیس (اگر فعال باشد)
    if (checkPermission) {
      console.log("🔍 Step 2: Checking API permission from database...");

      const permissionResult = await checkApiPermission(user, path, method);

      console.log(`   User ID: ${user.id || user._id}`);
      console.log(`   User Roles: ${user.roles?.join(", ") || "No roles"}`);
      console.log(
        `   Permission Check Result: ${
          permissionResult.success ? "✅ GRANTED" : "❌ DENIED"
        }`
      );

      if (permissionResult.success) {
        console.log(`✅ API permission granted via RBAC from database`);
        console.log("=".repeat(80) + "\n");
        return {
          success: true,
          user: user,
        };
      }

      // اگر permission check ناموفق بود، بررسی fallback
      console.warn(`⚠️ RBAC check failed: ${permissionResult.error}`);
      console.log("   Trying fallback to allowedRoles...");
    }

    // گام 3: Fallback به بررسی نقش (اگر مشخص شده باشد)
    if (allowedRoles && allowedRoles.length > 0) {
      console.log(
        `🔍 Step 3: Checking fallback allowedRoles: [${allowedRoles.join(
          ", "
        )}]`
      );
      const roleResult = await requireRole(request, allowedRoles);

      if (!roleResult.success) {
        console.error(`❌ Role check failed: ${roleResult.error}`);
        console.log("=".repeat(80) + "\n");
        return {
          success: false,
          error: roleResult.error,
          status: 403,
        };
      }

      console.log(
        `✅ API permission granted via allowedRoles: ${allowedRoles.join(", ")}`
      );
      console.log("=".repeat(80) + "\n");
      return {
        success: true,
        user: user,
      };
    }

    // اگر هیچکدام موفق نبود
    if (checkPermission) {
      console.error("❌ FINAL RESULT: Access Denied - No permission found");
      console.log("=".repeat(80) + "\n");
      return {
        success: false,
        error: "شما دسترسی لازم به این منبع را ندارید",
        status: 403,
      };
    }

    // موفق
    console.log("✅ FINAL RESULT: Access Granted");
    console.log("=".repeat(80) + "\n");
    return {
      success: true,
      user: user,
    };
  } catch (error) {
    console.error("❌ [API PROTECTION ERROR]:", error);
    console.error("Stack trace:", error.stack);
    console.log("=".repeat(80) + "\n");
    return {
      success: false,
      error: "خطای سرور",
      status: 500,
    };
  }
}

// Alias برای سازگاری با کدهای قدیمی
export const protectApi = protectAPI;

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
