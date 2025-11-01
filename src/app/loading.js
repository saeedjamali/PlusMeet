/**
 * Loading Component
 * کامپوننت Loading برای زمان بارگذاری صفحات
 */

import styles from "@/styles/Loading.module.css";

export default function Loading() {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}>
        <div className={styles.logo}>PM</div>
      </div>
      <p className={styles.text}>در حال بارگذاری...</p>
    </div>
  );
}



