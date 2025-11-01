/**
 * Password Management Modal
 * مدال تنظیم/تغییر رمز کاربر
 */

"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/NewAuthContext";
import styles from "./PasswordModal.module.css";

export default function PasswordModal({ user, isOpen, onClose, onUpdate }) {
  const { fetchWithAuth } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError("");
    setSuccess(false);

    // Validation
    if (!password || password.length < 6) {
      setError("رمز عبور باید حداقل 6 کاراکتر باشد");
      return;
    }

    if (password !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند");
      return;
    }

    setSaving(true);

    try {
      const response = await fetchWithAuth(
        `/api/admin/users/${user._id}/password`,
        {
          method: "PUT",
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setPassword("");
        setConfirmPassword("");

        // بستن Modal بعد از 2 ثانیه
        setTimeout(() => {
          onUpdate();
          onClose();
        }, 2000);
      } else {
        setError(data.message || "خطا در تنظیم رمز عبور");
      }
    } catch (err) {
      console.error("❌ Error setting password:", err);
      setError("خطا در تنظیم رمز عبور");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2>تنظیم رمز عبور</h2>
          <button className={styles.closeBtn} onClick={handleClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* User Info */}
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user?.displayName?.[0] || "U"}
          </div>
          <div>
            <div className={styles.userName}>
              {user?.displayName || `${user?.firstName} ${user?.lastName}`}
            </div>
            <div className={styles.userPhone}>{user?.phoneNumber}</div>
          </div>
        </div>

        {/* Error */}
        {error && <div className={styles.error}>{error}</div>}

        {/* Success */}
        {success && (
          <div className={styles.success}>✅ رمز عبور با موفقیت تنظیم شد</div>
        )}

        {/* Body */}
        <div className={styles.modalBody}>
          <div className={styles.infoBox}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>
              رمز عبور جدید برای کاربر تنظیم می‌شود. کاربر می‌تواند با این رمز
              وارد حساب خود شود.
            </p>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>رمز عبور جدید</label>
            <div className={styles.inputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="حداقل 6 کاراکتر"
                minLength={6}
                disabled={saving || success}
              />
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
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

          <div className={styles.inputGroup}>
            <label className={styles.label}>تکرار رمز عبور</label>
            <input
              type={showPassword ? "text" : "password"}
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="تکرار رمز عبور"
              minLength={6}
              disabled={saving || success}
            />
          </div>

          <div className={styles.strengthIndicator}>
            <div className={styles.strengthLabel}>قدرت رمز:</div>
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
            <div className={styles.strengthText}>
              {password.length === 0
                ? ""
                : password.length < 6
                ? "ضعیف"
                : password.length < 10
                ? "متوسط"
                : "قوی"}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            className={styles.cancelBtn}
            onClick={handleClose}
            disabled={saving}
          >
            انصراف
          </button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || success || !password || !confirmPassword}
          >
            {saving ? (
              <>
                <span className={styles.btnSpinner}></span>
                در حال ذخیره...
              </>
            ) : success ? (
              "✅ ذخیره شد"
            ) : (
              "تنظیم رمز عبور"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
