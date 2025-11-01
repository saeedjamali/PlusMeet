/**
 * Dynamic RBAC Middleware
 * مدیریت دسترسی‌ها براساس نقش‌ها و مجوزات دینامیک
 */

import Role from "@/lib/models/Role.model";
import Menu from "@/lib/models/Menu.model";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * بررسی دسترسی کاربر به API endpoint
 * @param {Object} user - کاربر احراز هویت شده
 * @param {string} path - مسیر API (مثلاً /api/admin/users)
 * @param {string} method - متد HTTP (GET, POST, PUT, DELETE)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function checkApiPermission(user, path, method) {
  try {
    console.log(`🔍 [RBAC] Checking API permission: ${method} ${path}`);
    console.log(
      `🔍 [RBAC] User: ${user.phoneNumber}, Roles: ${user.roles?.join(", ")}`
    );

    // Admin همیشه دسترسی کامل داره
    if (user.roles && user.roles.includes("admin")) {
      console.log("✅ [RBAC] Admin access - granted");
      return { success: true };
    }

    // گرفتن نقش‌های کاربر
    const userRoles = user.roles || [];

    if (userRoles.length === 0) {
      console.log("❌ [RBAC] No roles assigned");
      return {
        success: false,
        error: "هیچ نقشی تعریف نشده است",
      };
    }

    // گرفتن نقش‌ها از دیتابیس با apiPermissions
    const roles = await Role.find({
      slug: { $in: userRoles },
      isActive: true,
    }).select("name slug apiPermissions");

    console.log(`🔍 [RBAC] Found ${roles.length} roles in database`);

    if (roles.length === 0) {
      console.log("❌ [RBAC] No valid roles found in database");
      return {
        success: false,
        error: "نقش‌های معتبری یافت نشد",
      };
    }

    // چک کردن دسترسی در apiPermissions نقش‌ها
    for (const role of roles) {
      console.log(
        `🔍 [RBAC] Checking role: ${role.slug}, API permissions count: ${
          role.apiPermissions?.length || 0
        }`
      );

      // نمایش تمام apiPermissions این نقش برای debugging
      if (role.apiPermissions && role.apiPermissions.length > 0) {
        role.apiPermissions.forEach((perm) => {
          console.log(`   - ${perm.path}: [${perm.methods.join(", ")}]`);
        });
      }

      if (role.hasApiAccess(path, method)) {
        console.log(`✅ [RBAC] Access granted via role: ${role.slug}`);

        // ثبت لاگ موفق (اختیاری)
        try {
          await logActivity(user.phoneNumber, "api_access_granted", {
            targetType: "ApiEndpoint",
            metadata: {
              endpoint: path,
              method,
              role: role.slug,
            },
          });
        } catch (logError) {
          console.warn("⚠️ Warning: Failed to log activity:", logError.message);
        }

        return { success: true };
      }
    }

    // دسترسی رد شد
    console.log("❌ [RBAC] Access denied - no matching permissions found");
    console.log(`❌ [RBAC] Required: ${method} ${path}`);
    console.log(
      `❌ [RBAC] Solution: Add this permission to one of your roles:`
    );
    console.log(`   Path: ${path}`);
    console.log(`   Methods: [${method}]`);

    try {
      await logActivity(user.phoneNumber, "api_access_denied", {
        targetType: "ApiEndpoint",
        metadata: {
          endpoint: path,
          method,
          userRoles,
        },
        status: "failed",
      });
    } catch (logError) {
      console.warn("⚠️ Warning: Failed to log activity:", logError.message);
    }

    return {
      success: false,
      error: "شما دسترسی لازم به این منبع را ندارید",
    };
  } catch (error) {
    console.error("❌ [RBAC] Error checking API permission:", error);
    return {
      success: false,
      error: "خطا در بررسی دسترسی",
    };
  }
}

/**
 * بررسی دسترسی کاربر به منو
 */
export async function checkMenuPermission(user, menuId) {
  try {
    if (user.roles && user.roles.includes("admin")) {
      return { success: true };
    }

    const userRoles = user.roles || [];
    const roles = await Role.find({
      slug: { $in: userRoles },
      isActive: true,
    });

    for (const role of roles) {
      const menuPerm = role.menuPermissions.find((p) => p.menuId === menuId);
      if (menuPerm && menuPerm.access) {
        return { success: true, access: menuPerm.access };
      }
    }

    return { success: false, error: "Access denied" };
  } catch (error) {
    console.error("Error checking menu permission:", error);
    return { success: false, error: "Permission check failed" };
  }
}

/**
 * دریافت تمام منوهای مجاز برای کاربر
 */
export async function getAllowedMenus(userRoles) {
  try {
    if (!Array.isArray(userRoles) || userRoles.length === 0) {
      return [];
    }

    // Admin همه منوها رو می‌بینه
    if (userRoles.includes("admin")) {
      const allMenus = await Menu.find({ isActive: true }).select("menuId");
      return allMenus.map((m) => m.menuId);
    }

    // گرفتن نقش‌ها از دیتابیس
    const roles = await Role.find({
      slug: { $in: userRoles },
      isActive: true,
    }).select("menuPermissions");

    const allowedMenuIds = new Set();

    roles.forEach((role) => {
      role.menuPermissions.forEach((perm) => {
        // access می‌تونه "view" یا "full" باشه - هر دو دسترسی دارند
        if (perm.access) {
          allowedMenuIds.add(perm.menuId);
        }
      });
    });

    return Array.from(allowedMenuIds);
  } catch (error) {
    console.error("Error getting allowed menus:", error);
    return [];
  }
}

/**
 * دریافت تمام API های مجاز برای کاربر
 */
export async function getAllowedApis(userRoles) {
  try {
    if (!Array.isArray(userRoles) || userRoles.length === 0) {
      return {};
    }

    // Admin به همه API ها دسترسی داره
    if (userRoles.includes("admin")) {
      return { "*": ["GET", "POST", "PUT", "DELETE"] };
    }

    const roles = await Role.find({
      slug: { $in: userRoles },
      isActive: true,
    }).select("apiPermissions");

    const apiPermissionsMap = new Map();

    roles.forEach((role) => {
      role.apiPermissions.forEach((perm) => {
        // استفاده از path به جای endpoint (schema جدید)
        const apiPath = perm.path;
        if (apiPermissionsMap.has(apiPath)) {
          // Merge methods
          const existing = apiPermissionsMap.get(apiPath);
          const mergedMethods = [...new Set([...existing, ...perm.methods])];
          apiPermissionsMap.set(apiPath, mergedMethods);
        } else {
          apiPermissionsMap.set(apiPath, [...perm.methods]);
        }
      });
    });

    // تبدیل Map به Object
    const result = {};
    apiPermissionsMap.forEach((methods, path) => {
      result[path] = methods;
    });

    return result;
  } catch (error) {
    console.error("Error getting allowed APIs:", error);
    return {};
  }
}
