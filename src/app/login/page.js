/**
 * User Login Page
 * صفحه ورود کاربران عادی
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/NewAuthContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Logo from "@/components/ui/Logo";
import styles from "./login.module.css";

export default function UserLoginPage() {
  const [activeTab, setActiveTab] = useState("otp"); // 'otp' or 'password'
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("user"); // 'user' or 'event_owner'
  const [autoSubmitBlocked, setAutoSubmitBlocked] = useState(false); // جلوگیری از لوپ auto-submit

  const router = useRouter();
  const { isAuthenticated, user, sendOTP, loginWithOTP, loginWithPassword } =
    useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      // گرفتن redirect URL از query params
      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get("redirect");

      if (redirectUrl) {
        // decode کردن و redirect
        router.push(decodeURIComponent(redirectUrl));
      } else {
        // چک کردن نقش کاربر برای redirect مناسب
        if (user && user.roles && user.roles.includes("admin")) {
          router.push("/dashboard");
        } else {
          router.push("/dashboard");
        }
      }
    }
  }, [isAuthenticated, user, router]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-submit when OTP is complete (5 digits)
  useEffect(() => {
    if (otp.length === 5 && !loading && otpSent && !autoSubmitBlocked) {
      // تاخیر کوچک برای UX بهتر (کاربر ببینه که آخرین رقم وارد شده)
      const timer = setTimeout(() => {
        handleVerifyOTP({ preventDefault: () => {} });
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, loading, otpSent, autoSubmitBlocked]);

  // Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await sendOTP(phoneNumber);

      if (result.success) {
        setOtpSent(true);
        setCountdown(result.expiresIn || 120);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("خطا در ارسال کد");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("📝 Sending OTP verification with role:", selectedRole);

      // همیشه role رو ارسال می‌کنیم (برای کاربران جدید استفاده می‌شه)
      const result = await loginWithOTP(phoneNumber, otp, selectedRole);

      console.log("✅ Login result:", result);

      if (result.success) {
        const userData = result.data.user;
        console.log("👤 User data:", userData);
        console.log("🎭 User roles:", userData.roles);

        // گرفتن redirect URL از query params
        const searchParams = new URLSearchParams(window.location.search);
        const redirectUrl = searchParams.get("redirect");

        if (redirectUrl) {
          // decode کردن و redirect
          console.log("🎯 Redirecting to:", decodeURIComponent(redirectUrl));
          router.push(decodeURIComponent(redirectUrl));
        } else {
          // Redirect to dashboard
          console.log("🎯 Redirecting to dashboard");
          router.push("/dashboard");
        }
      } else {
        // خطا رخ داده، auto-submit رو مسدود کن
        setAutoSubmitBlocked(true);
        setError(result.error);
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setAutoSubmitBlocked(true);
      setError("خطا در ورود");
    } finally {
      setLoading(false);
    }
  };

  // Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginWithPassword(phoneNumber, password);

      if (result.success) {
        // گرفتن redirect URL از query params
        const searchParams = new URLSearchParams(window.location.search);
        const redirectUrl = searchParams.get("redirect");

        if (redirectUrl) {
          // decode کردن و redirect
          router.push(decodeURIComponent(redirectUrl));
        } else {
          // چک کردن نقش کاربر برای redirect مناسب
          // Redirect to dashboard
          router.push("/dashboard");
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("خطا در ورود");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Theme Toggle */}
      <ThemeToggle variant="floating" />

      <div className={styles.loginBox}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <Logo
              type="vertical"
              width={80}
              height={100}
              priority={true}
              className={styles.logoImage}
            />
          </div>
          <h1 className={styles.title}>ورود به پلاس میت</h1>
          <p className={styles.subtitle}>با هم، بهتر</p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "otp" ? styles.tabActive : ""
            }`}
            onClick={() => {
              setActiveTab("otp");
              setError("");
              setOtpSent(false);
            }}
          >
            <svg
              className={styles.tabIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            ورود با کد یکبار مصرف
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "password" ? styles.tabActive : ""
            }`}
            onClick={() => {
              setActiveTab("password");
              setError("");
              setOtpSent(false);
            }}
          >
            <svg
              className={styles.tabIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            ورود با رمز عبور
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.error}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Forms */}
        <div className={styles.formContainer}>
          {/* OTP Form */}
          {activeTab === "otp" && (
            <div className={styles.form}>
              {!otpSent ? (
                <form onSubmit={handleSendOTP}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>شماره موبایل</label>
                    <input
                      type="tel"
                      className={styles.input}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="09123456789"
                      maxLength={11}
                      required
                    />
                  </div>

                  {/* انتخاب نوع حساب برای همه کاربران */}
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>نوع حساب کاربری</label>
                    <div className={styles.roleButtons}>
                      <button
                        type="button"
                        className={`${styles.roleButton} ${
                          selectedRole === "user" ? styles.roleButtonActive : ""
                        }`}
                        onClick={() => setSelectedRole("user")}
                      >
                        <span className={styles.roleIcon}>👤</span>
                        <span className={styles.roleTitle}>کاربر عادی</span>
                        <span className={styles.roleDesc}>
                          شرکت در رویدادها
                        </span>
                      </button>
                      <button
                        type="button"
                        className={`${styles.roleButton} ${
                          selectedRole === "event_owner"
                            ? styles.roleButtonActive
                            : ""
                        }`}
                        onClick={() => setSelectedRole("event_owner")}
                      >
                        <span className={styles.roleIcon}>⭐</span>
                        <span className={styles.roleTitle}>
                          مالک / مدیر رویداد
                        </span>
                        <span className={styles.roleDesc}>
                          ایجاد و مدیریت رویداد
                        </span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={phoneNumber.length !== 11 || loading}
                  >
                    {loading ? (
                      <span className={styles.spinner}></span>
                    ) : (
                      "دریافت کد تایید"
                    )}
                  </button>

                  <p className={styles.hint}>
                    با ورود و ثبت‌نام، شما{" "}
                    <a href="/terms" className={styles.link}>
                      قوانین و مقررات
                    </a>{" "}
                    پلاس میت را می‌پذیرید.
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP}>
                  <div className={styles.otpInfo}>
                    کد 5 رقمی به شماره <strong>{phoneNumber}</strong> ارسال شد
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>کد تایید</label>
                    <input
                      type="text"
                      className={`${styles.input} ${styles.otpInput}`}
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 5) {
                          setOtp(value);
                          // Reset auto-submit block وقتی کاربر کد رو عوض کرد
                          if (autoSubmitBlocked) {
                            setAutoSubmitBlocked(false);
                          }
                        }
                      }}
                      placeholder="• • • • •"
                      maxLength={5}
                      required
                    />
                    {countdown > 0 && (
                      <div className={styles.countdown}>
                        {Math.floor(countdown / 60)}:
                        {(countdown % 60).toString().padStart(2, "0")}
                      </div>
                    )}
                  </div>

                  <div className={styles.buttonGroup}>
                    <button
                      type="submit"
                      className={styles.submitBtn}
                      disabled={otp.length !== 5 || loading}
                    >
                      {loading ? (
                        <span className={styles.spinner}></span>
                      ) : (
                        "تایید و ورود"
                      )}
                    </button>
                    <button
                      type="button"
                      className={styles.backBtn}
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                        setCountdown(0);
                        setAutoSubmitBlocked(false); // Reset auto-submit block
                        setError(""); // پاک کردن خطا
                      }}
                    >
                      ویرایش شماره
                    </button>
                  </div>

                  {countdown === 0 && (
                    <button
                      type="button"
                      className={styles.resendBtn}
                      onClick={handleSendOTP}
                      disabled={loading}
                    >
                      ارسال مجدد کد
                    </button>
                  )}
                </form>
              )}
            </div>
          )}

          {/* Password Form */}
          {activeTab === "password" && (
            <div className={styles.form}>
              <form onSubmit={handlePasswordLogin}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>شماره موبایل</label>
                  <input
                    type="tel"
                    className={styles.input}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="09123456789"
                    maxLength={11}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>رمز عبور</label>
                  <div className={styles.passwordWrapper}>
                    <input
                      type={showPassword ? "text" : "password"}
                      className={styles.input}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="رمز عبور خود را وارد کنید"
                      required
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={
                    phoneNumber.length !== 11 || password.length < 6 || loading
                  }
                >
                  {loading ? <span className={styles.spinner}></span> : "ورود"}
                </button>

                <a href="/forgot-password" className={styles.forgotLink}>
                  رمز عبور خود را فراموش کرده‌اید؟
                </a>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <a href="/" className={styles.homeLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            بازگشت به صفحه اصلی
          </a>
          {/* <a href="/login" className={styles.adminLink}>
            ورود به پنل مدیریت
          </a> */}
        </div>
      </div>

      {/* Background Pattern */}
      <div className={styles.bgPattern}></div>
    </div>
  );
}










