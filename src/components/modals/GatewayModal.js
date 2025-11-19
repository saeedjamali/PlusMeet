"use client";

import { useState, useEffect } from "react";
import styles from "./Modal.module.css";
import "./ModalDark.css";

export default function GatewayModal({ show, onClose, onSave, editing }) {
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    description: "",
    isActive: true,
    isDefault: false,
    commission: {
      type: "percentage",
      percentage: 0,
      fixedAmount: 0,
    },
    gateway: {
      provider: "zarinpal",
      apiKey: "",
      merchantId: "",
      environment: "sandbox",
    },
    limits: {
      minAmount: 1000,
      maxAmount: 50000000,
    },
    settings: {
      callbackUrl: "",
      timeout: 900,
      enableLogging: true,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editing) {
      setFormData({
        title: editing.title || "",
        code: editing.code || "",
        description: editing.description || "",
        isActive: editing.isActive !== undefined ? editing.isActive : true,
        isDefault: editing.isDefault || false,
        commission: {
          type: editing.commission?.type || "percentage",
          percentage: editing.commission?.percentage || 0,
          fixedAmount: editing.commission?.fixedAmount || 0,
        },
        gateway: {
          provider: editing.gateway?.provider || "zarinpal",
          apiKey: editing.gateway?.apiKey || "",
          merchantId: editing.gateway?.merchantId || "",
          environment: editing.gateway?.environment || "sandbox",
        },
        limits: {
          minAmount: editing.limits?.minAmount || 1000,
          maxAmount: editing.limits?.maxAmount || 50000000,
        },
        settings: {
          callbackUrl: editing.settings?.callbackUrl || "",
          timeout: editing.settings?.timeout || 900,
          enableLogging: editing.settings?.enableLogging !== false,
        },
      });
    } else {
      // Reset form for new gateway
      setFormData({
        title: "",
        code: "",
        description: "",
        isActive: true,
        isDefault: false,
        commission: {
          type: "percentage",
          percentage: 0,
          fixedAmount: 0,
        },
        gateway: {
          provider: "zarinpal",
          apiKey: "",
          merchantId: "",
          environment: "sandbox",
        },
        limits: {
          minAmount: 1000,
          maxAmount: 50000000,
        },
        settings: {
          callbackUrl: "",
          timeout: 900,
          enableLogging: true,
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
        ? `/api/finance/payment-gateways/${editing._id}`
        : "/api/finance/payment-gateways";

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
      console.error("Error saving gateway:", err);
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
          <h2>{editing ? "ویرایش درگاه پرداخت" : "افزودن درگاه پرداخت"}</h2>
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
                <label>عنوان *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  placeholder="مثال: زرین‌پال اصلی"
                />
              </div>

              <div className={styles.formGroup}>
                <label>کد *</label>
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
                  placeholder="مثال: ZP01"
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
                placeholder="توضیحات درباره این درگاه..."
              />
            </div>

            <div className={styles.formRow}>
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

              <div className={styles.formGroup}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) =>
                      setFormData({ ...formData, isDefault: e.target.checked })
                    }
                  />
                  <span>درگاه پیش‌فرض</span>
                </label>
              </div>
            </div>
          </div>

          {/* تنظیمات کارمزد */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>کارمزد</h3>

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

          {/* تنظیمات درگاه */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>تنظیمات درگاه</h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>نوع درگاه *</label>
                <select
                  value={formData.gateway.provider}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gateway: { ...formData.gateway, provider: e.target.value },
                    })
                  }
                  required
                >
                  <option value="zarinpal">زرین‌پال</option>
                  <option value="idpay">آیدی‌پی</option>
                  <option value="parsian">پارسیان</option>
                  <option value="mellat">ملت</option>
                  <option value="saman">سامان</option>
                  <option value="pasargad">پاسارگاد</option>
                  <option value="other">سایر</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>محیط</label>
                <select
                  value={formData.gateway.environment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gateway: {
                        ...formData.gateway,
                        environment: e.target.value,
                      },
                    })
                  }
                >
                  <option value="sandbox">آزمایشی</option>
                  <option value="production">عملیاتی</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>API Key *</label>
              <input
                type="text"
                value={formData.gateway.apiKey}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gateway: { ...formData.gateway, apiKey: e.target.value },
                  })
                }
                required
                placeholder="کلید API درگاه"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Merchant ID</label>
              <input
                type="text"
                value={formData.gateway.merchantId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gateway: { ...formData.gateway, merchantId: e.target.value },
                  })
                }
                placeholder="شناسه پذیرنده (اختیاری)"
              />
            </div>
          </div>

          {/* محدودیت‌ها */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>محدودیت‌های مبلغ</h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>حداقل مبلغ (تومان)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.limits.minAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      limits: {
                        ...formData.limits,
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
                  value={formData.limits.maxAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      limits: {
                        ...formData.limits,
                        maxAmount: parseInt(e.target.value) || 0,
                      },
                    })
                  }
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

