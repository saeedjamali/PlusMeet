/**
 * RBAC Seed Page
 * صفحه اجرای seed داده‌های اولیه
 */

"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/NewAuthContext";
import styles from "./seed.module.css";

export default function SeedPage() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSeed = async () => {
    if (
      !confirm(
        "آیا مطمئن هستید؟ این عمل تمام داده‌های RBAC فعلی را پاک می‌کند!"
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetchWithAuth("/api/admin/rbac/seed", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("خطا در اجرای seed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>🌱 ایجاد داده‌های اولیه RBAC</h1>

        <div className={styles.warning}>
          <span className={styles.warningIcon}>⚠️</span>
          <div>
            <strong>هشدار:</strong> این عمل تمام داده‌های موجود در Roles، Menus
            و API Endpoints را پاک می‌کند و داده‌های پیش‌فرض را ایجاد می‌کند.
          </div>
        </div>

        <div className={styles.info}>
          <h3>📊 داده‌های ایجاد شده:</h3>
          <ul>
            <li>✅ 13 منو (ساختار درختی)</li>
            <li>✅ 12 API Endpoint (گروه‌بندی شده)</li>
            <li>✅ 3 نقش سیستمی (Admin, Event Owner, User)</li>
          </ul>
        </div>

        <button
          className={styles.seedBtn}
          onClick={handleSeed}
          disabled={loading}
        >
          {loading ? "در حال اجرا..." : "🚀 اجرای Seed"}
        </button>

        {result && (
          <div className={styles.success}>
            <span className={styles.successIcon}>✅</span>
            <div>
              <strong>موفق!</strong>
              <div className={styles.resultStats}>
                <span>منوها: {result.menus}</span>
                <span>API Endpoints: {result.apiEndpoints}</span>
                <span>نقش‌ها: {result.roles}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <span className={styles.errorIcon}>❌</span>
            <div>
              <strong>خطا!</strong>
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
