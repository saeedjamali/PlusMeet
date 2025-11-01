/**
 * Protected Route Component
 * محافظت از route ها بر اساس RBAC
 */

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/NewAuthContext";
import { usePermission } from "@/hooks/usePermission";

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requiredRoles = [],
  requiredPermissions = [],
  fallback = null,
  redirectTo = "/login",
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const { can, roles } = usePermission();

  useEffect(() => {
    if (loading) return;

    // اگر نیاز به لاگین داره ولی کاربر لاگین نیست
    if (requireAuth && !isAuthenticated) {
      router.push(`${redirectTo}?redirect=${pathname}`);
      return;
    }

    // بررسی نقش‌ها
    if (requiredRoles.length > 0 && isAuthenticated) {
      const hasRequiredRole = requiredRoles.some((role) =>
        roles.includes(role)
      );

      if (!hasRequiredRole) {
        router.push("/403"); // Forbidden
        return;
      }
    }

    // بررسی permissions
    if (requiredPermissions.length > 0 && isAuthenticated) {
      const hasAllPermissions = requiredPermissions.every((permission) =>
        can(permission)
      );

      if (!hasAllPermissions) {
        router.push("/403"); // Forbidden
        return;
      }
    }
  }, [
    isAuthenticated,
    loading,
    requireAuth,
    requiredRoles,
    requiredPermissions,
    roles,
    can,
    router,
    pathname,
    redirectTo,
  ]);

  // نمایش loading
  if (loading) {
    return (
      fallback || (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
          }}
        >
          <div>در حال بارگذاری...</div>
        </div>
      )
    );
  }

  // اگر نیاز به auth داره و کاربر لاگین نیست
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // بررسی نقش‌ها
  if (requiredRoles.length > 0 && isAuthenticated) {
    const hasRequiredRole = requiredRoles.some((role) => roles.includes(role));
    if (!hasRequiredRole) {
      return null;
    }
  }

  // بررسی permissions
  if (requiredPermissions.length > 0 && isAuthenticated) {
    const hasAllPermissions = requiredPermissions.every((permission) =>
      can(permission)
    );
    if (!hasAllPermissions) {
      return null;
    }
  }

  return <>{children}</>;
}

/**
 * مثال استفاده:
 *
 * // استفاده در Layout
 * import ProtectedRoute from '@/components/auth/ProtectedRoute';
 *
 * export default function AdminLayout({ children }) {
 *   return (
 *     <ProtectedRoute
 *       requireAuth={true}
 *       requiredRoles={['admin']}
 *       redirectTo="/admin/login"
 *     >
 *       {children}
 *     </ProtectedRoute>
 *   );
 * }
 *
 * // استفاده در Page
 * export default function UserManagementPage() {
 *   return (
 *     <ProtectedRoute
 *       requiredPermissions={['users.view', 'users.edit']}
 *     >
 *       <UserManagementContent />
 *     </ProtectedRoute>
 *   );
 * }
 */

