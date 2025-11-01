/**
 * Change Password Modal
 * Modal تغییر رمز عبور برای کاربر
 */

"use client";

import { useState } from "react";
import styles from "./ChangePasswordModal.module.css";

export default function ChangePasswordModal({ onClose, fetchWithAuth }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (newPassword.length < 6) {
      setError("رمز عبور جدید باید حداقل 6 کاراکتر باشد");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("رمز عبور جدید و تکرار آن یکسان نیستند");
      return;
    }

    if (currentPassword === newPassword) {
      setError("رمز عبور جدید نمی‌تواند با رمز فعلی یکسان باشد");
      return;
    }

    setLoading(true);

    try {
      const response = await fetchWithAuth("/api/user/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(data.message || "خطا در تغییر رمز عبور");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setError("خطا در تغییر رمز عبور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>تغییر رمز عبور</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {error && (
            <div className={styles.error}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.success}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              رمز عبور با موفقیت تغییر کرد!
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>رمز عبور فعلی</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPasswords ? "text" : "password"}
                    className={styles.input}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="رمز عبور فعلی خود را وارد کنید"
                  />
                  <button
                    type="button"
                    className={styles.toggleBtn}
                    onClick={() => setShowPasswords(!showPasswords)}
                    disabled={loading}
                  >
                    {showPasswords ? "👁" : "👁‍🗨"}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>رمز عبور جدید</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  className={styles.input}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  placeholder="حداقل 6 کاراکتر"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>تکرار رمز عبور جدید</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  className={styles.input}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  placeholder="رمز عبور جدید را تکرار کنید"
                />
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className={styles.strengthIndicator}>
                  <div className={styles.strengthBar}>
                    <div
                      className={`${styles.strengthFill} ${
                        newPassword.length < 6
                          ? styles.weak
                          : newPassword.length < 10
                          ? styles.medium
                          : styles.strong
                      }`}
                      style={{
                        width:
                          newPassword.length < 6
                            ? "33%"
                            : newPassword.length < 10
                            ? "66%"
                            : "100%",
                      }}
                    />
                  </div>
                  <span className={styles.strengthText}>
                    {newPassword.length < 6
                      ? "ضعیف"
                      : newPassword.length < 10
                      ? "متوسط"
                      : "قوی"}
                  </span>
                </div>
              )}

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={onClose}
                  disabled={loading}
                >
                  لغو
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={
                    loading ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner}></span>
                      در حال ذخیره...
                    </>
                  ) : (
                    "✓ تغییر رمز"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


