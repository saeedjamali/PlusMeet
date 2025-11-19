"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/NewAuthContext";
import styles from "./LocationBanner.module.css";

export default function LocationBanner() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  // اگر کاربر location دارد، banner نمایش داده نشود
  if (user?.location?.state && user?.location?.city) {
    return null;
  }

  const handleClick = () => {
    if (isAuthenticated) {
      router.push("/profile");
    } else {
      router.push("/login?returnUrl=" + encodeURIComponent(window.location.pathname));
    }
  };

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <span className={styles.icon}>📍</span>
        <div className={styles.text}>
          <strong className={styles.title}>
            {isAuthenticated
              ? "موقعیت پیش‌فرض خود را تنظیم کنید"
              : "برای تنظیم موقعیت پیش‌فرض وارد شوید"}
          </strong>
          <p className={styles.description}>
            {isAuthenticated
              ? "با تنظیم استان و شهر خود، رویدادهای نزدیک به شما را راحت‌تر پیدا کنید"
              : "با ورود به حساب کاربری، می‌توانید موقعیت پیش‌فرض خود را تنظیم کنید"}
          </p>
        </div>
        <button className={styles.button} onClick={handleClick}>
          {isAuthenticated ? "تنظیم موقعیت" : "ورود به سیستم"}
        </button>
      </div>
      <button
        className={styles.closeButton}
        onClick={(e) => {
          e.currentTarget.parentElement.style.display = "none";
        }}
        title="بستن"
      >
        ✕
      </button>
    </div>
  );
}

