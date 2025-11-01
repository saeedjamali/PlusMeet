/**
 * Debug Menus Page
 * صفحه دیباگ ساختار منوها
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/NewAuthContext";
import styles from "./debug.module.css";

export default function DebugMenusPage() {
  const { fetchWithAuth } = useAuth();
  const [menus, setMenus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchWithAuth("/api/user/menus");
      const data = await response.json();

      if (data.success) {
        setMenus(data.menus);
      } else {
        setError(data.error || "خطا در دریافت منوها");
      }
    } catch (err) {
      console.error("Error fetching menus:", err);
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const renderTree = (items, level = 0) => {
    return items.map((item) => (
      <div key={item.menuId} className={styles.treeItem}>
        <div
          className={styles.treeNode}
          style={{ paddingRight: `${level * 2}rem` }}
        >
          <span className={styles.icon}>{item.icon || "📄"}</span>
          <strong>{item.menuId}</strong>: {item.title}
          {item.path && <code className={styles.path}>{item.path}</code>}
          {item.parentId && (
            <span className={styles.parent}>parent: {item.parentId}</span>
          )}
          <span className={styles.order}>order: {item.order}</span>
        </div>
        {item.children && item.children.length > 0 && (
          <div className={styles.children}>
            {renderTree(item.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🐛 Debug: Menu Structure</h1>
        <p className={styles.subtitle}>
          ساختار درختی منوها - برای بررسی سلسله مراتب
        </p>
        <button className={styles.refreshBtn} onClick={fetchMenus}>
          🔄 رفرش
        </button>
      </div>

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>در حال بارگذاری...</p>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <strong>❌ خطا:</strong> {error}
        </div>
      )}

      {menus && (
        <>
          <div className={styles.info}>
            <strong>تعداد کل منوهای root:</strong> {menus.length}
          </div>

          <div className={styles.tree}>
            <h2>🌳 ساختار درختی:</h2>
            {renderTree(menus)}
          </div>

          <div className={styles.json}>
            <h2>📝 JSON خام:</h2>
            <pre>{JSON.stringify(menus, null, 2)}</pre>
          </div>
        </>
      )}
    </div>
  );
}
