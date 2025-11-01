"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/NewAuthContext";
import styles from "./sync.module.css";

export default function SyncApisPage() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSync = async () => {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      const response = await fetchWithAuth("/api/admin/sync-apis", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "خطا در همگام‌سازی");
      }
    } catch (err) {
      console.error("Error syncing APIs:", err);
      setError("خطا در همگام‌سازی");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>🔄 همگام‌سازی API Endpoints</h1>

      <div className={styles.card}>
        <h2>📖 توضیحات</h2>
        <p>
          این ابزار تمام API route های پروژه رو پیدا می‌کنه و به collection
          <code>ApiEndpoint</code> اضافه می‌کنه.
        </p>

        <h3>چه کاری انجام میده؟</h3>
        <ul>
          <li>
            ✅ تمام فایل‌های <code>route.js</code> رو اسکن می‌کنه
          </li>
          <li>✅ متدهای HTTP (GET, POST, PUT, DELETE) رو تشخیص میده</li>
          <li>✅ به دیتابیس اضافه یا آپدیت می‌کنه</li>
          <li>✅ برای هر endpoint مشخص می‌کنه که کدوم نقش‌ها دسترسی دارند</li>
        </ul>

        <div className={styles.warning}>
          <strong>⚠️ توجه:</strong> این عملیات فقط به collection ApiEndpoint
          اضافه می‌کنه. برای دادن دسترسی به نقش‌ها، باید از صفحه مدیریت نقش‌ها
          استفاده کنی.
        </div>
      </div>

      <div className={styles.actionCard}>
        <button
          onClick={handleSync}
          disabled={loading}
          className={`${styles.button} ${styles.buttonPrimary}`}
        >
          {loading ? "⏳ در حال همگام‌سازی..." : "🚀 شروع همگام‌سازی"}
        </button>

        {error && (
          <div className={styles.error}>
            <strong>❌ خطا:</strong> {error}
          </div>
        )}

        {result && (
          <div className={styles.success}>
            <h3>✅ همگام‌سازی موفق!</h3>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <div className={styles.statValue}>{result.stats.total}</div>
                <div className={styles.statLabel}>کل Endpoint ها</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>{result.stats.added}</div>
                <div className={styles.statLabel}>اضافه شده</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>{result.stats.updated}</div>
                <div className={styles.statLabel}>آپدیت شده</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>{result.stats.skipped}</div>
                <div className={styles.statLabel}>بدون تغییر</div>
              </div>
            </div>

            <h3>📋 لیست Endpoint ها:</h3>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>مسیر</th>
                    <th>متدها</th>
                  </tr>
                </thead>
                <tbody>
                  {result.endpoints.map((endpoint, index) => (
                    <tr key={index}>
                      <td>
                        <code>{endpoint.path}</code>
                      </td>
                      <td>
                        {endpoint.methods.map((method) => (
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
          </div>
        )}
      </div>

      <div className={styles.card}>
        <h3>🔧 راهنما:</h3>
        <ol>
          <li>روی دکمه "شروع همگام‌سازی" کلیک کن</li>
          <li>صبر کن تا اسکن و همگام‌سازی کامل بشه</li>
          <li>لیست endpoint ها رو بررسی کن</li>
          <li>
            برو به <a href="/dashboard/rbac/roles">مدیریت نقش‌ها</a> و دسترسی‌ها رو
            تنظیم کن
          </li>
        </ol>

        <div className={styles.info}>
          <strong>💡 نکته:</strong> این ابزار رو هر بار که API جدید اضافه کردی
          اجرا کن تا لیست به‌روز بشه!
        </div>
      </div>
    </div>
  );
}
