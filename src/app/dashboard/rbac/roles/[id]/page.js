/**
 * Role Edit/Create Page
 * صفحه ویرایش/ایجاد نقش
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/NewAuthContext";
import MenuTreeView from "@/components/admin/MenuTreeView";
import ApiPermissionTree from "@/components/admin/ApiPermissionTree";
import styles from "./roleEdit.module.css";

export default function RoleEditPage() {
  const router = useRouter();
  const params = useParams();
  const { fetchWithAuth } = useAuth();
  const isNewRole = params.id === "new";

  // State
  const [loading, setLoading] = useState(!isNewRole);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic"); // basic | menus | apis

  // Role Data
  const [roleData, setRoleData] = useState({
    name: "",
    slug: "",
    description: "",
    isSystem: false,
    isActive: true, // Default active
    priority: 50, // Default priority
    menuPermissions: [], // [{ menuId, access: 'full'|'view' }]
    apiPermissions: [], // [{ path, methods: ['GET', 'POST', ...] }]
  });

  const [errors, setErrors] = useState({});
  const [menus, setMenus] = useState([]);
  const [apis, setApis] = useState({});

  // بارگذاری داده‌های نقش (در حالت ویرایش)
  useEffect(() => {
    if (!isNewRole) {
      fetchRole();
    }
  }, [params.id]);

  // بارگذاری منوها و API ها
  useEffect(() => {
    fetchMenus();
    fetchApis();
  }, []);

  const fetchRole = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(
        `/api/admin/rbac/roles/${params.id}`
      );
      const data = await response.json();

      if (data.success) {
        const role = data.data;
        // مطمئن شویم که permissions همیشه array هستند
        setRoleData({
          name: role.name || "",
          slug: role.slug || "",
          description: role.description || "",
          isSystem: role.isSystem || false,
          isActive: role.isActive !== undefined ? role.isActive : true,
          priority: role.priority || 50,
          menuPermissions: Array.isArray(role.menuPermissions)
            ? role.menuPermissions
            : [],
          apiPermissions: Array.isArray(role.apiPermissions)
            ? role.apiPermissions
            : [],
        });
      } else {
        alert(data.error || "خطا در بارگذاری نقش");
        router.push("/dashboard/rbac/roles");
      }
    } catch (error) {
      console.error("Error fetching role:", error);
      alert("خطا در بارگذاری نقش");
      router.push("/dashboard/rbac/roles");
    } finally {
      setLoading(false);
    }
  };

  const fetchMenus = async () => {
    try {
      const response = await fetchWithAuth("/api/admin/rbac/menus?asTree=true");
      const data = await response.json();

      console.log("📋 Menus response:", data);

      if (data.success) {
        setMenus(Array.isArray(data.data.menus) ? data.data.menus : []);
      } else {
        console.error("Failed to fetch menus:", data.error);
        setMenus([]);
      }
    } catch (error) {
      console.error("Error fetching menus:", error);
      setMenus([]);
    }
  };

  const fetchApis = async () => {
    try {
      const response = await fetchWithAuth("/api/admin/rbac/apis?grouped=true");
      const data = await response.json();

      console.log("🔌 APIs response:", data);

      if (data.success) {
        setApis(data.data.apis || {});
      } else {
        console.error("Failed to fetch APIs:", data.error);
        setApis({});
      }
    } catch (error) {
      console.error("Error fetching APIs:", error);
      setApis({});
    }
  };

  // Validation
  const validate = () => {
    const newErrors = {};

    if (!roleData.name.trim()) {
      newErrors.name = "نام نقش الزامی است";
    }

    if (!roleData.slug.trim()) {
      newErrors.slug = "شناسه نقش الزامی است";
    } else if (!/^[a-z0-9_]+$/.test(roleData.slug)) {
      newErrors.slug = "شناسه فقط می‌تواند شامل حروف کوچک، اعداد و _ باشد";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Auto-generate slug from name
  const handleNameChange = (e) => {
    const name = e.target.value;
    setRoleData((prev) => ({
      ...prev,
      name,
      // فقط در حالت ایجاد جدید slug رو auto-generate کن
      ...(isNewRole && {
        slug: name
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, ""),
      }),
    }));
  };

  // ذخیره نقش
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      setActiveTab("basic"); // برگشت به تب اول برای نمایش خطاها
      return;
    }

    try {
      setSaving(true);

      const url = isNewRole
        ? "/api/admin/rbac/roles"
        : `/api/admin/rbac/roles/${params.id}`;

      const method = isNewRole ? "POST" : "PUT";

      const response = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roleData),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          isNewRole ? "نقش با موفقیت ایجاد شد" : "نقش با موفقیت به‌روزرسانی شد"
        );
        router.push("/dashboard/rbac/roles");
      } else {
        alert(data.error || "خطا در ذخیره نقش");
      }
    } catch (error) {
      console.error("Error saving role:", error);
      alert("خطا در ذخیره نقش");
    } finally {
      setSaving(false);
    }
  };

  // Handle Menu Permissions Change
  const handleMenuPermissionsChange = (permissions) => {
    setRoleData((prev) => ({ ...prev, menuPermissions: permissions }));
  };

  // Handle API Permissions Change
  const handleApiPermissionsChange = (permissions) => {
    setRoleData((prev) => ({ ...prev, apiPermissions: permissions }));
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {isNewRole ? "ایجاد نقش جدید" : `ویرایش نقش: ${roleData.name}`}
          </h1>
          <p className={styles.subtitle}>
            {isNewRole
              ? "نقش جدید ایجاد کنید و دسترسی‌ها را تنظیم کنید"
              : "دسترسی‌های این نقش را مدیریت کنید"}
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/rbac/roles")}
          className={styles.backBtn}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          بازگشت
        </button>
      </div>

      {/* System Role Warning */}
      {roleData.isSystem && (
        <div className={styles.systemWarning}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          این یک نقش سیستمی است. تغییرات با احتیاط انجام دهید.
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "basic" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("basic")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          اطلاعات پایه
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "menus" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("menus")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          دسترسی به منوها
          {roleData.menuPermissions?.length > 0 && (
            <span className={styles.badge}>
              {roleData.menuPermissions.length}
            </span>
          )}
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "apis" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("apis")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          دسترسی به API
          {roleData.apiPermissions?.length > 0 && (
            <span className={styles.badge}>
              {roleData.apiPermissions.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Tab: Basic Info */}
        {activeTab === "basic" && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>اطلاعات پایه نقش</h2>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  نام نقش <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={roleData.name}
                  onChange={handleNameChange}
                  className={`${styles.input} ${
                    errors.name ? styles.error : ""
                  }`}
                  placeholder="مثال: مدیر محتوا"
                  disabled={roleData.isSystem}
                />
                {errors.name && (
                  <span className={styles.errorText}>{errors.name}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  شناسه (Slug) <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={roleData.slug}
                  onChange={(e) =>
                    setRoleData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  className={`${styles.input} ${
                    errors.slug ? styles.error : ""
                  }`}
                  placeholder="مثال: content_manager"
                  disabled={roleData.isSystem || !isNewRole}
                />
                {errors.slug && (
                  <span className={styles.errorText}>{errors.slug}</span>
                )}
                <span className={styles.hint}>
                  فقط حروف کوچک انگلیسی، اعداد و _ (در حالت ویرایش قابل تغییر
                  نیست)
                </span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>توضیحات</label>
              <textarea
                value={roleData.description}
                onChange={(e) =>
                  setRoleData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className={styles.textarea}
                placeholder="توضیحی کوتاه درباره این نقش..."
                rows={4}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  اولویت (Priority)
                  <span className={styles.hint} style={{ marginRight: "8px" }}>
                    (0-100، بالاتر = مهم‌تر)
                  </span>
                </label>
                <input
                  type="number"
                  value={roleData.priority}
                  onChange={(e) =>
                    setRoleData((prev) => ({
                      ...prev,
                      priority: parseInt(e.target.value) || 0,
                    }))
                  }
                  className={styles.input}
                  placeholder="50"
                  min="0"
                  max="100"
                />
                <span className={styles.hint}>
                  نقش‌های با اولویت بالاتر در لیست‌ها و گزینه‌ها زودتر نمایش
                  داده می‌شوند.
                </span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>وضعیت نقش</label>
                <div className={styles.toggleContainer}>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={roleData.isActive}
                      onChange={(e) =>
                        setRoleData((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                  <span className={styles.toggleLabel}>
                    {roleData.isActive ? (
                      <>
                        <span
                          style={{ color: "var(--status-success, #10b981)" }}
                        >
                          ✅ فعال
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={{ color: "var(--status-error, #ef4444)" }}>
                          ❌ غیرفعال
                        </span>
                      </>
                    )}
                  </span>
                </div>
                <span className={styles.hint}>
                  نقش‌های غیرفعال قابل استفاده نیستند و نمایش داده نمی‌شوند.
                </span>
              </div>
            </div>

            {isNewRole && (
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={roleData.isSystem}
                    onChange={(e) =>
                      setRoleData((prev) => ({
                        ...prev,
                        isSystem: e.target.checked,
                      }))
                    }
                    className={styles.checkbox}
                  />
                  <span>نقش سیستمی (قابل حذف نیست)</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Tab: Menu Permissions */}
        {activeTab === "menus" && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>دسترسی به منوها</h2>
            <p className={styles.cardDescription}>
              انتخاب کنید که این نقش به کدام منوها دسترسی داشته باشد
            </p>

            <MenuTreeView
              menus={menus}
              selectedPermissions={roleData.menuPermissions}
              onChange={handleMenuPermissionsChange}
            />
          </div>
        )}

        {/* Tab: API Permissions */}
        {activeTab === "apis" && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>دسترسی به API</h2>
            <p className={styles.cardDescription}>
              مشخص کنید که این نقش به کدام متدهای API دسترسی دارد
            </p>

            <ApiPermissionTree
              apis={apis}
              selectedPermissions={roleData.apiPermissions}
              onChange={handleApiPermissionsChange}
            />
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => router.push("/dashboard/rbac/roles")}
            className={styles.cancelBtn}
          >
            انصراف
          </button>
          <button type="submit" disabled={saving} className={styles.saveBtn}>
            {saving
              ? "در حال ذخیره..."
              : isNewRole
              ? "ایجاد نقش"
              : "ذخیره تغییرات"}
          </button>
        </div>
      </form>
    </div>
  );
}
