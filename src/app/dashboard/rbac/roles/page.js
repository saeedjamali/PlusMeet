/**
 * RBAC Roles Management Page
 * صفحه مدیریت نقش‌ها
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/NewAuthContext";
import styles from "./roles.module.css";

export default function RolesPage() {
  const router = useRouter();
  const { user, fetchWithAuth } = useAuth();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | system | custom
  const [searchTerm, setSearchTerm] = useState("");

  // بارگذاری نقش‌ها
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching roles...");

      const response = await fetchWithAuth("/api/admin/rbac/roles");
      console.log("🔍 Response status:", response.status);

      const data = await response.json();
      console.log("🔍 Response data:", data);

      if (data.success) {
        console.log("✅ Roles fetched:", data.data.roles.length);
        setRoles(data.data.roles);
      } else {
        console.error("❌ Fetch failed:", data.error);
      }
    } catch (error) {
      console.error("❌ Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  // حذف نقش
  const handleDelete = async (roleId, roleName) => {
    if (
      !confirm(`آیا مطمئن هستید که می‌خواهید نقش "${roleName}" را حذف کنید؟`)
    ) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/admin/rbac/roles/${roleId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        alert("نقش با موفقیت حذف شد");
        fetchRoles();
      } else {
        alert(data.error || "خطا در حذف نقش");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      alert("خطا در حذف نقش");
    }
  };

  // فیلتر کردن نقش‌ها
  const filteredRoles = roles.filter((role) => {
    // فیلتر بر اساس نوع
    if (filter === "system" && !role.isSystem) return false;
    if (filter === "custom" && role.isSystem) return false;

    // فیلتر بر اساس جستجو
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        role.name.toLowerCase().includes(term) ||
        role.slug.toLowerCase().includes(term) ||
        role.description?.toLowerCase().includes(term)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>مدیریت نقش‌ها</h1>
          <p className={styles.subtitle}>
            ایجاد، ویرایش و مدیریت نقش‌ها و دسترسی‌های سیستم
          </p>
        </div>
        <button
          className={styles.createBtn}
          onClick={() => router.push("/dashboard/rbac/roles/new")}
        >
          <span>➕</span>
          ایجاد نقش جدید
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterButtons}>
          <button
            className={`${styles.filterBtn} ${
              filter === "all" ? styles.active : ""
            }`}
            onClick={() => setFilter("all")}
          >
            همه نقش‌ها ({roles.length})
          </button>
          <button
            className={`${styles.filterBtn} ${
              filter === "system" ? styles.active : ""
            }`}
            onClick={() => setFilter("system")}
          >
            سیستمی ({roles.filter((r) => r.isSystem).length})
          </button>
          <button
            className={`${styles.filterBtn} ${
              filter === "custom" ? styles.active : ""
            }`}
            onClick={() => setFilter("custom")}
          >
            سفارشی ({roles.filter((r) => !r.isSystem).length})
          </button>
        </div>

        <input
          type="text"
          placeholder="🔍 جستجو در نقش‌ها..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📊</span>
          <div>
            <div className={styles.statValue}>{roles.length}</div>
            <div className={styles.statLabel}>کل نقش‌ها</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🔐</span>
          <div>
            <div className={styles.statValue}>
              {roles.filter((r) => r.isSystem).length}
            </div>
            <div className={styles.statLabel}>نقش سیستمی</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>✨</span>
          <div>
            <div className={styles.statValue}>
              {roles.filter((r) => !r.isSystem).length}
            </div>
            <div className={styles.statLabel}>نقش سفارشی</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>✅</span>
          <div>
            <div className={styles.statValue}>
              {roles.filter((r) => r.isActive).length}
            </div>
            <div className={styles.statLabel}>فعال</div>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      <div className={styles.rolesGrid}>
        {filteredRoles.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔍</span>
            <p>نقشی یافت نشد</p>
          </div>
        ) : (
          filteredRoles.map((role) => (
            <div key={role.id} className={styles.roleCard}>
              {/* Badge for system role */}
              {role.isSystem && (
                <div className={styles.systemBadge}>سیستمی</div>
              )}

              {/* Icon & Info */}
              <div className={styles.roleHeader}>
                <span
                  className={styles.roleIcon}
                  style={{ backgroundColor: `${role.color}20` }}
                >
                  {role.icon}
                </span>
                <div className={styles.roleInfo}>
                  <h3 className={styles.roleName}>{role.name}</h3>
                  <p className={styles.roleSlug}>{role.slug}</p>
                </div>
              </div>

              {/* Description */}
              {role.description && (
                <p className={styles.roleDescription}>{role.description}</p>
              )}

              {/* Permissions Count */}
              <div className={styles.permissionsCounts}>
                <div className={styles.permissionCount}>
                  <span>📋</span>
                  <span>{role.menuPermissions?.length || 0} منو</span>
                </div>
                <div className={styles.permissionCount}>
                  <span>🔌</span>
                  <span>{role.apiPermissions?.length || 0} API</span>
                </div>
                <div className={styles.permissionCount}>
                  <span>👥</span>
                  <span>{role.userCount || 0} کاربر</span>
                </div>
              </div>

              {/* Status */}
              <div className={styles.roleStatus}>
                <span
                  className={`${styles.statusBadge} ${
                    role.isActive ? styles.active : styles.inactive
                  }`}
                >
                  {role.isActive ? "✅ فعال" : "❌ غیرفعال"}
                </span>
                {role.isStaff && (
                  <span
                    className={styles.statusBadge}
                    style={{
                      backgroundColor: "var(--status-info, #3b82f6)",
                      color: "white",
                    }}
                  >
                    🎧 کارشناس
                  </span>
                )}
                <span className={styles.priority}>اولویت: {role.priority}</span>
              </div>

              {/* Actions */}
              <div className={styles.roleActions}>
                <button
                  className={styles.editBtn}
                  onClick={() =>
                    router.push(`/dashboard/rbac/roles/${role.id}`)
                  }
                >
                  ✏️ ویرایش
                </button>
                {!role.isSystem && (
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(role.id, role.name)}
                  >
                    🗑️ حذف
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
