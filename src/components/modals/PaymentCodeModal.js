"use client";

import { useState, useEffect } from "react";
import styles from "./Modal.module.css";
import "./ModalDark.css";

export default function PaymentCodeModal({ show, onClose, onSave, editing }) {
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    isActive: true,
    commission: {
      type: "percentage",
      percentage: 0,
      fixedAmount: 0,
    },
    settings: {
      allowEventJoin: true,
      allowTicketPurchase: false,
      allowCourseEnrollment: false,
      minAmount: 0,
      maxAmount: null,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editing) {
      setFormData({
        code: editing.code || "",
        title: editing.title || "",
        description: editing.description || "",
        isActive: editing.isActive !== undefined ? editing.isActive : true,
        commission: {
          type: editing.commission?.type || "percentage",
          percentage: editing.commission?.percentage || 0,
          fixedAmount: editing.commission?.fixedAmount || 0,
        },
        settings: {
          allowEventJoin: editing.settings?.allowEventJoin !== false,
          allowTicketPurchase: editing.settings?.allowTicketPurchase || false,
          allowCourseEnrollment: editing.settings?.allowCourseEnrollment || false,
          minAmount: editing.settings?.minAmount || 0,
          maxAmount: editing.settings?.maxAmount || null,
        },
      });
    } else {
      // Reset form
      setFormData({
        code: "",
        title: "",
        description: "",
        isActive: true,
        commission: {
          type: "percentage",
          percentage: 0,
          fixedAmount: 0,
        },
        settings: {
          allowEventJoin: true,
          allowTicketPurchase: false,
          allowCourseEnrollment: false,
          minAmount: 0,
          maxAmount: null,
        },
      });
    }
    setError(null);
  }, [editing, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editing
        ? `/api/finance/payment-codes/${editing._id}`
        : "/api/finance/payment-codes";

      const method = editing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${data.message || "عملیات با موفقیت انجام شد"}`);
        onSave();
        onClose();
      } else {
        setError(data.error || "خطا در انجام عملیات");
      }
    } catch (err) {
      console.error("Error saving payment code:", err);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{editing ? "ویرایش کد پرداخت" : "افزودن کد پرداخت"}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {/* اطلاعات اصلی */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>اطلاعات اصلی</h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>کد پرداخت *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  required
                  disabled={editing}
                  placeholder="مثال: PC11"
                />
              </div>

              <div className={styles.formGroup}>
                <label>عنوان *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  placeholder="مثال: پیوستن به رویداد"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>توضیحات</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                placeholder="توضیحات درباره این کد پرداخت..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
                <span>فعال</span>
              </label>
            </div>
          </div>

          {/* کارمزد سایت */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>کارمزد سایت</h3>

            <div className={styles.formGroup}>
              <label>نوع کارمزد</label>
              <select
                value={formData.commission.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    commission: { ...formData.commission, type: e.target.value },
                  })
                }
              >
                <option value="percentage">درصدی</option>
                <option value="fixed">مبلغ ثابت</option>
                <option value="both">هر دو</option>
              </select>
            </div>

            <div className={styles.formRow}>
              {(formData.commission.type === "percentage" ||
                formData.commission.type === "both") && (
                <div className={styles.formGroup}>
                  <label>درصد کارمزد (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.commission.percentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        commission: {
                          ...formData.commission,
                          percentage: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
              )}

              {(formData.commission.type === "fixed" ||
                formData.commission.type === "both") && (
                <div className={styles.formGroup}>
                  <label>مبلغ ثابت (تومان)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.commission.fixedAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        commission: {
                          ...formData.commission,
                          fixedAmount: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* تنظیمات کاربرد */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>کاربردها</h3>

            <div className={styles.formGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.settings.allowEventJoin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        allowEventJoin: e.target.checked,
                      },
                    })
                  }
                />
                <span>پیوستن به رویداد</span>
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.settings.allowTicketPurchase}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        allowTicketPurchase: e.target.checked,
                      },
                    })
                  }
                />
                <span>خرید بلیط</span>
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.settings.allowCourseEnrollment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        allowCourseEnrollment: e.target.checked,
                      },
                    })
                  }
                />
                <span>ثبت‌نام دوره</span>
              </label>
            </div>
          </div>

          {/* محدودیت‌های مبلغ */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>محدودیت‌های مبلغ (اختیاری)</h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>حداقل مبلغ (تومان)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.settings.minAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        minAmount: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>حداکثر مبلغ (تومان)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.settings.maxAmount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        maxAmount: e.target.value ? parseInt(e.target.value) : null,
                      },
                    })
                  }
                  placeholder="نامحدود"
                />
              </div>
            </div>
          </div>

          {/* دکمه‌ها */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
              disabled={loading}
            >
              لغو
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading
                ? "در حال ذخیره..."
                : editing
                ? "به‌روزرسانی"
                : "افزودن"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

