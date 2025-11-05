/**
 * usePermission Hook
 * برای بررسی دسترسی‌های کاربر بر اساس RBAC
 */

"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/NewAuthContext";
import {
  hasPermission,
  hasRouteAccess,
  isAdmin,
  isEventOwner,
  isModerator,
  getUserPermissions,
} from "@/lib/config/permissions.config";

export function usePermission() {
  const { user, isAuthenticated } = useAuth();

  const userRoles = useMemo(() => {
    return user?.roles || [];
  }, [user]);

  /**
   * بررسی اینکه آیا کاربر دسترسی به یک permission خاص داره یا نه
   * @param {string} permission - permission مورد نظر
   * @returns {boolean}
   */
  const can = useMemo(() => {
    return (permission) => {
      if (!isAuthenticated) return false;
      return hasPermission(userRoles, permission);
    };
  }, [userRoles, isAuthenticated]);

  /**
   * بررسی دسترسی به route
   * @param {string} route - مسیر مورد نظر
   * @returns {boolean}
   */
  const canAccessRoute = useMemo(() => {
    return (route) => {
      return hasRouteAccess(userRoles, route);
    };
  }, [userRoles]);

  /**
   * بررسی اینکه آیا کاربر Admin هست یا نه
   * @returns {boolean}
   */
  const isAdminUser = useMemo(() => {
    return isAdmin(userRoles);
  }, [userRoles]);

  /**
   * بررسی اینکه آیا کاربر Event Owner هست یا نه
   * @returns {boolean}
   */
  const isEventOwnerUser = useMemo(() => {
    return isEventOwner(userRoles);
  }, [userRoles]);

  /**
   * بررسی اینکه آیا کاربر Moderator هست یا نه
   * @returns {boolean}
   */
  const isModeratorUser = useMemo(() => {
    return isModerator(userRoles);
  }, [userRoles]);

  /**
   * گرفتن تمام permissions کاربر
   * @returns {string[]}
   */
  const allPermissions = useMemo(() => {
    return getUserPermissions(userRoles);
  }, [userRoles]);

  return {
    can,
    canAccessRoute,
    isAdmin: isAdminUser,
    isEventOwner: isEventOwnerUser,
    isModerator: isModeratorUser,
    permissions: allPermissions,
    roles: userRoles,
  };
}

/**
 * مثال استفاده:
 *
 * import { usePermission } from '@/hooks/usePermission';
 *
 * function MyComponent() {
 *   const { can, isAdmin, canAccessRoute } = usePermission();
 *
 *   return (
 *     <div>
 *       {can('users.edit') && <button>ویرایش کاربر</button>}
 *       {isAdmin && <AdminPanel />}
 *       {canAccessRoute('/admin') && <Link href="/admin">پنل ادمین</Link>}
 *     </div>
 *   );
 * }
 */


