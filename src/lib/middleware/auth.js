/**
 * Authentication Middleware (با httpOnly Cookie)
 * میدلور احراز هویت
 */

import jwt from "jsonwebtoken";
import User from "@/lib/models/User.model";
import Role from "@/lib/models/Role.model";
import { logActivity } from "@/lib/models/ActivityLog.model";
import { getCookieFromRequest, validateCSRFToken } from "@/lib/utils/cookies";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

/**
 * Authentication برای Next.js App Router API Routes
 * استفاده از httpOnly Cookie به جای Authorization header
 * برمی‌گرداند: { success: boolean, user?: User, error?: string }
 */
export async function authenticate(request, options = {}) {
  const { requireCSRF = true } = options;

  console.log("🔐 [AUTHENTICATE] Starting authentication...");

  try {
    // CSRF Token Validation (برای state-changing requests)
    const method = request.method;
    const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    console.log(`   Method: ${method} | State-changing: ${isStateChanging}`);

    if (requireCSRF && isStateChanging) {
      console.log("   🔍 Checking CSRF token...");
      if (!validateCSRFToken(request)) {
        console.error("   ❌ CSRF token validation failed");
        return {
          success: false,
          error: "CSRF token نامعتبر است",
        };
      }
      console.log("   ✅ CSRF token validated");
    }

    // دریافت توکن از httpOnly Cookie
    console.log("   🍪 Checking for accessToken cookie...");
    const token = getCookieFromRequest(request, "accessToken");

    if (!token) {
      console.error("   ❌ No accessToken cookie found");
      console.log("   💡 All cookies:", request.cookies?.toString());
      return {
        success: false,
        error: "لطفاً وارد سیستم شوید",
      };
    }

    console.log("   ✅ Access token found:", token.substring(0, 20) + "...");

    // تایید توکن
    console.log("   🔍 Verifying JWT token...");
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log("   ✅ JWT token verified");
      console.log("   📋 Decoded token:", {
        phoneNumber: decoded.phoneNumber,
        exp: new Date(decoded.exp * 1000).toISOString(),
      });
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        console.error(
          "   ❌ Token expired:",
          new Date(err.expiredAt).toISOString()
        );
        return {
          success: false,
          error: "توکن منقضی شده است",
          code: "TOKEN_EXPIRED",
        };
      }
      console.error("   ❌ Invalid token:", err.message);
      return {
        success: false,
        error: "توکن نامعتبر است",
      };
    }

    // پیدا کردن کاربر
    console.log(`   🔍 Finding user: ${decoded.phoneNumber}...`);
    const user = await User.findByPhone(decoded.phoneNumber);

    if (!user) {
      console.error("   ❌ User not found in database");
      return {
        success: false,
        error: "کاربر یافت نشد",
      };
    }

    console.log(`   ✅ User found: ${user.phoneNumber}`);
    console.log(`   📋 User roles: [${user.roles?.join(", ") || "No roles"}]`);
    console.log(`   📋 User state: ${user.state}`);

    // چک کردن آیا کاربر staff است (بر اساس role های دیتابیس)
    let isStaff = false;
    if (user.roles && user.roles.length > 0) {
      // بررسی اینکه آیا حداقل یکی از role های کاربر isStaff: true دارد
      const staffRolesCount = await Role.countDocuments({
        slug: { $in: user.roles },
        isStaff: true,
      });
      isStaff = staffRolesCount > 0;
      console.log(`   📋 Is Staff: ${isStaff ? "✅ YES" : "❌ NO"}`);
    }

    // چک کردن وضعیت کاربر
    if (user.state === "deleted") {
      console.error("   ❌ User account deleted");
      return {
        success: false,
        error: "حساب کاربری حذف شده است",
      };
    }

    if (user.state === "suspended") {
      console.error("   ❌ User account suspended");
      return {
        success: false,
        error: "حساب کاربری مسدود شده است",
      };
    }

    // به‌روزرسانی lastLoginAt (اختیاری - فقط روزی یکبار)
    const now = new Date();
    const lastLogin = user.lastLoginAt || new Date(0);
    const hoursSinceLastLogin = (now - lastLogin) / (1000 * 60 * 60);

    if (hoursSinceLastLogin > 24) {
      user.lastLoginAt = now;
      await user.save();
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        phoneNumber: user.phoneNumber,
        roles: user.roles,
        isStaff, // 👈 اضافه شد: بر اساس role های دیتابیس
        state: user.state,
        userType: user.userType,
        displayName: user.displayName,
      },
    };
  } catch (error) {
    console.error("Auth middleware error:", error);
    return {
      success: false,
      error: "خطای سرور",
    };
  }
}

/**
 * Optional Authentication برای Next.js App Router API Routes
 * اگر توکن داشت، کاربر را لود می‌کند، اگر نه، null برمی‌گرداند
 * استفاده از httpOnly Cookie
 */
export async function optionalAuth(request) {
  try {
    const token = getCookieFromRequest(request, "accessToken");

    if (!token) {
      return {
        success: true,
        user: null,
      };
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPhone(decoded.phoneNumber);

      if (user && user.state !== "deleted" && user.state !== "suspended") {
        return {
          success: true,
          user: {
            phoneNumber: user.phoneNumber,
            roles: user.roles,
            state: user.state,
            userType: user.userType,
            displayName: user.displayName,
          },
        };
      } else {
        return {
          success: true,
          user: null,
        };
      }
    } catch (err) {
      return {
        success: true,
        user: null,
      };
    }
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    return {
      success: true,
      user: null,
    };
  }
}

/**
 * چک کردن نقش برای Next.js App Router API Routes
 * @param {object} user - User object from authenticate
 * @param {string|string[]} roles - نقش یا آرایه‌ای از نقش‌ها
 */
export async function requireRole(user, roles) {
  const roleArray = Array.isArray(roles) ? roles : [roles];

  if (!user) {
    return {
      success: false,
      error: "لطفاً وارد سیستم شوید",
    };
  }

  // ادمین به همه جا دسترسی دارد
  if (user.roles && user.roles.includes("admin")) {
    return { success: true };
  }

  // چک کردن نقش‌های مورد نیاز
  const hasRole = roleArray.some(
    (role) => user.roles && user.roles.includes(role)
  );

  if (!hasRole) {
    return {
      success: false,
      error: "شما دسترسی لازم را ندارید",
    };
  }

  return { success: true };
}

/**
 * چک کردن وضعیت verified برای Next.js App Router API Routes
 */
export async function requireVerified(user) {
  if (!user) {
    return {
      success: false,
      error: "لطفاً وارد سیستم شوید",
    };
  }

  const isVerified = user.status === "verified";
  const isAdmin = user.roles && user.roles.includes("admin");

  if (!isVerified && !isAdmin) {
    return {
      success: false,
      error: "حساب کاربری شما تایید نشده است",
    };
  }

  return { success: true };
}

/**
 * Helper: ساخت JWT token
 * Default: 1h (1 ساعت)
 */
export function generateToken(user, expiresIn = "1h") {
  return jwt.sign(
    {
      phoneNumber: user.phoneNumber,
      roles: user.roles,
      state: user.state,
    },
    JWT_SECRET,
    { expiresIn }
  );
}

/**
 * Helper: ساخت refresh token
 * Default: 7d (7 روز)
 */
export function generateRefreshToken(user) {
  return jwt.sign(
    {
      phoneNumber: user.phoneNumber,
      type: "refresh",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * Helper: تایید refresh token و ساخت توکن جدید
 */
export async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    if (decoded.type !== "refresh") {
      throw new Error("Invalid refresh token");
    }

    const user = await User.findByPhone(decoded.phoneNumber);

    if (!user || user.state === "deleted" || user.state === "suspended") {
      throw new Error("User not found or inactive");
    }

    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return {
      accessToken: newToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
}

/**
 * protectAPI - Helper برای احراز هویت سریع در API Routes
 * خروجی ساده: { authenticated, user, message }
 */
export async function protectAPI(request, options = {}) {
  const result = await authenticate(request, options);
  
  if (!result.success) {
    return {
      authenticated: false,
      user: null,
      message: result.error || "Authentication failed",
    };
  }
  
  return {
    authenticated: true,
    user: result.user,
    message: "Authenticated successfully",
  };
}

/**
 * Helper: Hash کردن رمز عبور
 */
export async function hashPassword(password) {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, 10);
}

/**
 * Helper: مقایسه رمز عبور
 */
export async function comparePassword(password, hash) {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, hash);
}
