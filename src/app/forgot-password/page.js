/**
 * Forgot Password Page
 * صفحه فراموشی رمز عبور
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/NewAuthContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
import styles from "./forgot-password.module.css";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isAuthenticated, sendOTP } = useAuth();

  // State
  const [step, setStep] = useState(1); // 1: شماره، 2: OTP، 3: رمز جدید
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Step 1: ارسال OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await sendOTP(phoneNumber);

      if (result.success) {
        setStep(2);
        setCountdown(120); // 2 minutes
      } else {
        setError(result.error || "خطا در ارسال کد تایید");
      }
    } catch (err) {
      setError("خطا در ارسال کد تایید");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: تایید OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp-forgot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          code: otp,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep(3);
      } else {
        setError(data.message || "کد تایید نامعتبر است");
      }
    } catch (err) {
      setError("خطا در تایید کد");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: تنظیم رمز جدید
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!password || password.length < 6) {
      setError("رمز عبور باید حداقل 6 کاراکتر باشد");
      return;
    }

    if (password !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          code: otp,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(data.message || "خطا در تنظیم رمز عبور");
      }
    } catch (err) {
      setError("خطا در تنظیم رمز عبور");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setError("");
    setLoading(true);

    try {
      const result = await sendOTP(phoneNumber);

      if (result.success) {
        setCountdown(120);
      } else {
        setError(result.error || "خطا در ارسال مجدد کد");
      }
    } catch (err) {
      setError("خطا در ارسال مجدد کد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <ThemeToggle variant="floating" />

      <div className={styles.forgotBox}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🔑</span>
            <h1>بازیابی رمز عبور</h1>
          </div>
          <p className={styles.subtitle}>
            {step === 1 && "شماره موبایل خود را وارد کنید"}
            {step === 2 && "کد تایید ارسال شده را وارد کنید"}
            {step === 3 && "رمز عبور جدید خود را تنظیم کنید"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className={styles.steps}>
          <div
            className={`${styles.stepItem} ${step >= 1 ? styles.active : ""}`}
          >
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepLabel}>شماره موبایل</div>
          </div>
          <div className={styles.stepLine}></div>
          <div
            className={`${styles.stepItem} ${step >= 2 ? styles.active : ""}`}
          >
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepLabel}>تایید کد</div>
          </div>
          <div className={styles.stepLine}></div>
          <div
            className={`${styles.stepItem} ${step >= 3 ? styles.active : ""}`}
          >
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepLabel}>رمز جدید</div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.error}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className={styles.success}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            رمز عبور با موفقیت تغییر کرد! در حال انتقال به صفحه ورود...
          </div>
        )}

        {/* Step 1: Phone Number */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className={styles.form}>
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
                disabled={loading}
              />
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
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>کد تایید</label>
              <input
                type="text"
                className={styles.input}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="------"
                maxLength={6}
                required
                disabled={loading}
              />
              <p className={styles.hint}>
                کد 6 رقمی به شماره {phoneNumber} ارسال شد
              </p>
            </div>

            {countdown > 0 ? (
              <p className={styles.countdown}>
                ارسال مجدد کد در {Math.floor(countdown / 60)}:
                {(countdown % 60).toString().padStart(2, "0")}
              </p>
            ) : (
              <button
                type="button"
                className={styles.resendBtn}
                onClick={handleResendOTP}
                disabled={loading}
              >
                ارسال مجدد کد
              </button>
            )}

            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setStep(1)}
                disabled={loading}
              >
                بازگشت
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={otp.length !== 5 || loading}
              >
                {loading ? (
                  <span className={styles.spinner}></span>
                ) : (
                  "تایید کد"
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>رمز عبور جدید</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل 6 کاراکتر"
                  minLength={6}
                  required
                  disabled={loading || success}
                />
                <button
                  type="button"
                  className={styles.toggleBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || success}
                >
                  {showPassword ? "👁" : "👁‍🗨"}
                </button>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>تکرار رمز عبور</label>
              <input
                type={showPassword ? "text" : "password"}
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="تکرار رمز عبور"
                minLength={6}
                required
                disabled={loading || success}
              />
            </div>

            <div className={styles.strengthIndicator}>
              <div className={styles.strengthBar}>
                <div
                  className={`${styles.strengthFill} ${
                    password.length === 0
                      ? ""
                      : password.length < 6
                      ? styles.weak
                      : password.length < 10
                      ? styles.medium
                      : styles.strong
                  }`}
                  style={{
                    width:
                      password.length === 0
                        ? "0%"
                        : password.length < 6
                        ? "33%"
                        : password.length < 10
                        ? "66%"
                        : "100%",
                  }}
                />
              </div>
              <span className={styles.strengthText}>
                {password.length === 0
                  ? "قدرت رمز"
                  : password.length < 6
                  ? "ضعیف"
                  : password.length < 10
                  ? "متوسط"
                  : "قوی"}
              </span>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || success || !password || !confirmPassword}
            >
              {loading ? (
                <span className={styles.spinner}></span>
              ) : success ? (
                "✅ تغییر یافت"
              ) : (
                "تنظیم رمز جدید"
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <p>
            رمز عبور خود را به خاطر آوردید؟{" "}
            <a href="/login" className={styles.link}>
              ورود به حساب
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
