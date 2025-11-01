"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/NewAuthContext";
import styles from "./debug.module.css";

export default function DebugPermissionsPage() {
  const { user, fetchWithAuth, isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetchWithAuth("/api/debug/user-permissions");
      const result = await response.json();

      if (result.success) {
        setData(result);
      } else {
        setError(result.error || "خطا در دریافت اطلاعات");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
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
        <button onClick={fetchData} className={styles.button}>
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>🔍 دسترسی‌های من</h1>

      {data && (
        <>
          {/* اطلاعات کاربر */}
          <section className={styles.section}>
            <h2>👤 اطلاعات کاربر</h2>
            <div className={styles.card}>
              <p>
                <strong>شماره موبایل:</strong> {data.user.phoneNumber}
              </p>
              <p>
                <strong>نقش‌ها:</strong> {data.user.roles.join(", ")}
              </p>
            </div>
          </section>

          {/* نقش‌ها و دسترسی‌ها */}
          {data.roles.map((role) => (
            <section key={role.slug} className={styles.section}>
              <h2>
                📋 نقش: {role.name} ({role.slug})
              </h2>

              {/* دسترسی‌های API */}
              <div className={styles.subsection}>
                <h3>🔌 دسترسی‌های API ({role.apiPermissions.length})</h3>
                {role.apiPermissions.length > 0 ? (
                  <div className={styles.table}>
                    <table>
                      <thead>
                        <tr>
                          <th>مسیر (Path)</th>
                          <th>متدها (Methods)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {role.apiPermissions.map((perm, index) => (
                          <tr key={index}>
                            <td>
                              <code>{perm.path}</code>
                            </td>
                            <td>
                              {perm.methods.map((method) => (
                                <span key={method} className={styles.badge}>
                                  {method}
                                </span>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className={styles.warning}>
                    ⚠️ هیچ دسترسی API تعریف نشده!
                  </p>
                )}
              </div>

              {/* دسترسی‌های منو */}
              <div className={styles.subsection}>
                <h3>📁 دسترسی‌های منو ({role.menuPermissions.length})</h3>
                {role.menuPermissions.length > 0 ? (
                  <div className={styles.grid}>
                    {role.menuPermissions.map((perm, index) => (
                      <div key={index} className={styles.menuCard}>
                        <div>
                          <strong>{perm.menuId}</strong>
                        </div>
                        <div>
                          <span
                            className={`${styles.badge} ${
                              perm.access === "full"
                                ? styles.badgeFull
                                : styles.badgeView
                            }`}
                          >
                            {perm.access}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.warning}>
                    ⚠️ هیچ دسترسی منو تعریف نشده!
                  </p>
                )}
              </div>
            </section>
          ))}

          {/* دکمه‌ها */}
          <section className={styles.section}>
            <div className={styles.actions}>
              <button onClick={fetchData} className={styles.button}>
                🔄 بروزرسانی
              </button>
              <a
                href="/dashboard/rbac/roles"
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                ⚙️ مدیریت نقش‌ها
              </a>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
