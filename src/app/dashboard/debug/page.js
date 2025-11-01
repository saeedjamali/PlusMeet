"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/NewAuthContext";
import styles from "./debug.module.css";

export default function DebugPage() {
  const { user, fetchWithAuth, isAuthenticated } = useAuth();
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      fetchDebugInfo();
    }
  }, [isAuthenticated]);

  const fetchDebugInfo = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetchWithAuth("/api/debug/permissions");
      const data = await response.json();

      if (data.success) {
        setDebugInfo(data.debug);
      } else {
        setError(data.error || "خطا در دریافت اطلاعات");
      }
    } catch (err) {
      console.error("Error fetching debug info:", err);
      setError("خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <h1>🔒 لطفاً ابتدا وارد شوید</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <h1>⏳ در حال بارگذاری...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1>❌ خطا</h1>
        <p>{error}</p>
        <button onClick={fetchDebugInfo} className={styles.button}>
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>🔍 اطلاعات دیباگ دسترسی‌ها</h1>

      {debugInfo && (
        <>
          {/* اطلاعات کاربر */}
          <section className={styles.section}>
            <h2>👤 اطلاعات کاربر</h2>
            <div className={styles.card}>
              <p>
                <strong>شماره موبایل:</strong> {debugInfo.user.phoneNumber}
              </p>
              <p>
                <strong>نقش‌ها:</strong>{" "}
                {debugInfo.user.roles.join(", ") || "ندارد"}
              </p>
              <p>
                <strong>ID:</strong> {debugInfo.user._id}
              </p>
            </div>
          </section>

          {/* نقش‌ها در دیتابیس */}
          <section className={styles.section}>
            <h2>📋 نقش‌های موجود در دیتابیس</h2>
            {debugInfo.rolesInDatabase.length > 0 ? (
              <div className={styles.grid}>
                {debugInfo.rolesInDatabase.map((role) => (
                  <div key={role.slug} className={styles.card}>
                    <h3>
                      {role.name} ({role.slug})
                    </h3>
                    <p>
                      <strong>System:</strong> {role.isSystem ? "✅" : "❌"}
                    </p>
                    <p>
                      <strong>API Permissions:</strong>{" "}
                      {role.apiPermissionsCount}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.warning}>
                ⚠️ هیچ نقشی در دیتابیس پیدا نشد! لطفاً seed را اجرا کنید.
              </p>
            )}
          </section>

          {/* تست Endpoint */}
          <section className={styles.section}>
            <h2>🧪 تست Endpoint: PUT /api/admin/users/:id/roles</h2>
            <div
              className={`${styles.card} ${
                debugInfo.testEndpoint.permissionCheck.success
                  ? styles.success
                  : styles.error
              }`}
            >
              <p>
                <strong>وجود در دیتابیس:</strong>{" "}
                {debugInfo.testEndpoint.existsInDB ? "✅ بله" : "❌ خیر"}
              </p>
              <p>
                <strong>Default Roles:</strong>{" "}
                {debugInfo.testEndpoint.defaultRoles.join(", ") || "ندارد"}
              </p>
              <p>
                <strong>Available Methods:</strong>{" "}
                {debugInfo.testEndpoint.availableMethods.join(", ") || "ندارد"}
              </p>
              <p>
                <strong>نتیجه بررسی دسترسی:</strong>{" "}
                {debugInfo.testEndpoint.permissionCheck.success
                  ? "✅ دسترسی دارد"
                  : "❌ دسترسی ندارد"}
              </p>
              {!debugInfo.testEndpoint.permissionCheck.success && (
                <p className={styles.errorMsg}>
                  <strong>خطا:</strong>{" "}
                  {debugInfo.testEndpoint.permissionCheck.error}
                </p>
              )}
            </div>
          </section>

          {/* تمام دسترسی‌های API */}
          <section className={styles.section}>
            <h2>🔑 تمام دسترسی‌های API</h2>
            {debugInfo.allApiPermissions.length > 0 ? (
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>نقش</th>
                      <th>مسیر</th>
                      <th>متدها</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debugInfo.allApiPermissions.map((perm, index) => (
                      <tr key={index}>
                        <td>{perm.role}</td>
                        <td>{perm.path}</td>
                        <td>{perm.methods.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.warning}>
                ⚠️ هیچ دسترسی API تعریف نشده! لطفاً seed را اجرا کنید.
              </p>
            )}
          </section>

          {/* دکمه‌های اکشن */}
          <section className={styles.section}>
            <div className={styles.actions}>
              <button onClick={fetchDebugInfo} className={styles.button}>
                🔄 بروزرسانی
              </button>
              <a
                href="/dashboard/rbac/seed"
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                🌱 اجرای Seed
              </a>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
