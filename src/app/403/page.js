/**
 * 403 Forbidden Page
 * صفحه عدم دسترسی
 */

"use client";

import { useRouter } from "next/navigation";
import styles from "./forbidden.module.css";

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className={styles.icon}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h1 className={styles.title}>403</h1>
        <h2 className={styles.subtitle}>دسترسی غیرمجاز</h2>
        <p className={styles.message}>
          شما مجوز دسترسی به این صفحه را ندارید.
          <br />
          لطفاً با مدیر سیستم تماس بگیرید.
        </p>

        <div className={styles.actions}>
          <button
            className={styles.primaryBtn}
            onClick={() => router.push("/")}
          >
            بازگشت به خانه
          </button>
          <button className={styles.secondaryBtn} onClick={() => router.back()}>
            بازگشت به صفحه قبل
          </button>
        </div>
      </div>
    </div>
  );
}





