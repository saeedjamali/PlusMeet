/**
 * Roles Management Modal
 * مدال مدیریت نقش‌های کاربر
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/NewAuthContext";
import styles from "./RolesModal.module.css";

export default function RolesModal({ user, isOpen, onClose, onUpdate }) {
  const { fetchWithAuth } = useAuth();
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch available roles
  useEffect(() => {
    if (isOpen) {
      fetchAvailableRoles();
      setSelectedRoles(user?.roles || []);
    }
  }, [isOpen, user]);

  const fetchAvailableRoles = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchWithAuth("/api/admin/rbac/roles");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Roles fetched:", data);

      if (data.success && data.data) {
        // نقش‌ها از دیتابیس RBAC
        const roles = data.data.roles || [];
        // فقط نقش‌های فعال و قابل تخصیص (به جز guest)
        const assignableRoles = roles
          .filter((role) => role.isActive !== false && role.slug !== "guest")
          .map((role) => ({
            name: role.slug, // برای سازگاری با کد قبلی
            label: role.name, // نام فارسی برای نمایش
            description: role.description,
            color: role.color,
            icon: role.icon,
          }));
        console.log("📋 Assignable roles:", assignableRoles);
        setAvailableRoles(assignableRoles);
      } else {
        setError("خطا در دریافت نقش‌ها");
      }
    } catch (err) {
      console.error("❌ Error fetching roles:", err);
      setError("خطا در دریافت نقش‌ها");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = (roleName) => {
    if (selectedRoles.includes(roleName)) {
      // حذف نقش
      setSelectedRoles(selectedRoles.filter((r) => r !== roleName));
    } else {
      // اضافه کردن نقش
      setSelectedRoles([...selectedRoles, roleName]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const response = await fetchWithAuth(
        `/api/admin/users/${user._id}/roles`,
        {
          method: "PUT",
          body: JSON.stringify({ roles: selectedRoles }),
        }
      );

      const data = await response.json();

      if (data.success) {
        onUpdate(); // Refresh user list
        onClose();
      } else {
        // نمایش خطای دقیق از سرور
        let errorMessage = data.message || "خطا در ذخیره تغییرات";

        // خطاهای خاص
        if (response.status === 403) {
          errorMessage =
            data.code === "ACCESS_DENIED"
              ? "⛔ شما مجوز تغییر نقش کاربران را ندارید"
              : data.message;
        } else if (response.status === 401) {
          errorMessage = "🔒 لطفاً ابتدا وارد شوید";
        } else if (response.status === 400) {
          errorMessage =
            data.code === "INVALID_ROLES"
              ? `❌ نقش‌های نامعتبر: ${data.invalidRoles?.join(", ")}`
              : data.message;
        }

        console.error("❌ Failed to update roles:", {
          status: response.status,
          code: data.code,
          message: data.message,
        });

        setError(errorMessage);
      }
    } catch (err) {
      console.error("❌ Error saving roles:", err);
      setError("❌ خطای ناشناخته. لطفاً دوباره تلاش کنید.");
    } finally {
      setSaving(false);
    }
  };

  const getRolePersianName = (roleName) => {
    const roleNames = {
      guest: "مهمان",
      user: "کاربر",
      event_owner: "مالک رویداد",
      moderator: "ناظر",
      admin: "مدیر",
    };
    return roleNames[roleName] || roleName;
  };

  const getRoleIcon = (roleName) => {
    const icons = {
      guest: "👤",
      user: "👥",
      event_owner: "⭐",
      moderator: "🛡️",
      admin: "👑",
    };
    return icons[roleName] || "📋";
  };

  const getRoleDescription = (roleName) => {
    const descriptions = {
      guest: "دسترسی محدود به مشاهده",
      user: "کاربر عادی با دسترسی‌های پایه",
      event_owner: "مدیریت و ایجاد رویداد",
      moderator: "نظارت بر محتوا و گزارش‌ها",
      admin: "دسترسی کامل به سیستم",
    };
    return descriptions[roleName] || "";
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2>مدیریت نقش‌های کاربر</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* User Info */}
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user?.displayName?.[0] || "U"}
          </div>
          <div>
            <div className={styles.userName}>
              {user?.displayName || `${user?.firstName} ${user?.lastName}`}
            </div>
            <div className={styles.userPhone}>{user?.phoneNumber}</div>
          </div>
        </div>

        {/* Error */}
        {error && <div className={styles.error}>{error}</div>}

        {/* Roles List */}
        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>در حال بارگذاری...</p>
            </div>
          ) : availableRoles.length === 0 ? (
            <div className={styles.loading}>
              <p>هیچ نقشی یافت نشد</p>
            </div>
          ) : (
            <div className={styles.rolesList}>
              {availableRoles.map((role) => {
                const isBaseRole = role.name === "user"; // نقش پایه
                const isDisabled = isBaseRole;

                return (
                  <div
                    key={role.name}
                    className={`${styles.roleItem} ${
                      selectedRoles.includes(role.name) ? styles.selected : ""
                    } ${isDisabled ? styles.disabled : ""}`}
                    onClick={() => !isDisabled && handleToggleRole(role.name)}
                    title={
                      isBaseRole
                        ? "نقش پایه - همه کاربران باید این نقش را داشته باشند"
                        : ""
                    }
                  >
                    <div className={styles.roleCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.name)}
                        disabled={isDisabled}
                        onChange={() => {}}
                        className={styles.checkbox}
                      />
                    </div>
                    <div className={styles.roleIcon}>
                      {role.icon || getRoleIcon(role.name)}
                    </div>
                    <div className={styles.roleDetails}>
                      <div className={styles.roleName}>
                        {role.label || getRolePersianName(role.name)}
                        {isBaseRole && (
                          <span className={styles.baseRoleBadge}>پایه</span>
                        )}
                      </div>
                      <div className={styles.roleDescription}>
                        {role.description || getRoleDescription(role.name)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            انصراف
          </button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <span className={styles.btnSpinner}></span>
                در حال ذخیره...
              </>
            ) : (
              "ذخیره تغییرات"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
