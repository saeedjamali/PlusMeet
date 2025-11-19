/**
 * Not Found Page (404)
 * صفحه 404 - صفحه پیدا نشد
 */

import Link from "next/link";
import styles from "@/styles/NotFound.module.css";

export const metadata = {
  title: "صفحه پیدا نشد - PlusMeet",
  description: "متأسفانه صفحه مورد نظر یافت نشد",
};

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          <span className={styles.number}>404</span>
        </h1>

        <h2 className={styles.subtitle}>صفحه پیدا نشد</h2>

        <p className={styles.message}>
          متأسفانه صفحه‌ای که دنبالش می‌گردید وجود ندارد یا حذف شده است.
        </p>

        <div className={styles.illustration}>🔍</div>

        <div className={styles.actions}>
          <Link href="/" className={styles.homeButton}>
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );
}







