/**
 * Error Component
 * کامپوننت خطا برای مدیریت خطاهای رخ داده
 */

"use client";

import { useEffect } from "react";
import styles from "@/styles/Error.module.css";

export default function Error({ error, reset }) {
  useEffect(() => {
    // لاگ کردن خطا برای debugging
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>⚠️</div>
        <h1 className={styles.title}>مشکلی پیش آمده!</h1>
        <p className={styles.message}>
          متأسفانه خطایی رخ داده است. لطفاً دوباره تلاش کنید.
        </p>

        {process.env.NODE_ENV === "development" && (
          <details className={styles.details}>
            <summary>جزئیات خطا (فقط در حالت توسعه)</summary>
            <pre className={styles.errorText}>
              {error.message || "خطای ناشناخته"}
            </pre>
          </details>
        )}

        <div className={styles.actions}>
          <button onClick={reset} className={styles.retryButton}>
            تلاش مجدد
          </button>
          <a href="/" className={styles.homeButton}>
            بازگشت به صفحه اصلی
          </a>
        </div>
      </div>
    </div>
  );
}



