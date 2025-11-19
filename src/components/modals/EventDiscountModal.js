"use client";

import { useState, useEffect } from "react";
import styles from "./Modal.module.css";
import "./ModalDark.css";
import dynamic from "next/dynamic";

const DatePicker = dynamic(() => import("react-multi-date-picker"), {
  ssr: false,
});
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DateObject from "react-date-object";
import { parsePersianDate } from "@/lib/utils/dateConverter";

/**
 * مودال ایجاد کد تخفیف برای یک رویداد خاص
 * (نسخه ساده‌شده برای استفاده توسط مالک رویداد)
 */
export default function EventDiscountModal({
  show,
  onClose,
  onSave,
  editing,
  eventId,
}) {
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    isActive: true,
    discount: {
      type: "percentage",
      value: 0,
      maxAmount: null,
    },
    commissionCalculation: "beforeDiscount", // همیشه قبل از تخفیف برای مالک رویداد
    startDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    usage: {
      maxUsage: null,
      maxUsagePerUser: 1,
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
        discount: {
          type: editing.discount?.type || "percentage",
          value: editing.discount?.value || 0,
          maxAmount: editing.discount?.maxAmount || null,
        },
        commissionCalculation: "beforeDiscount", // همیشه قبل از تخفیف برای مالک رویداد
        startDate: editing.startDate
          ? new Date(editing.startDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        expiryDate: editing.expiryDate
          ? new Date(editing.expiryDate).toISOString().split("T")[0]
          : "",
        usage: {
          maxUsage: editing.usage?.maxUsage || null,
          maxUsagePerUser: editing.usage?.maxUsagePerUser || 1,
        },
      });
    } else {
      // Reset form
      setFormData({
        code: "",
        title: "",
        description: "",
        isActive: true,
        discount: {
          type: "percentage",
          value: 0,
          maxAmount: null,
        },
        commissionCalculation: "beforeDiscount", // همیشه قبل از تخفیف برای مالک رویداد
        startDate: new Date().toISOString().split("T")[0],
        expiryDate: "",
        usage: {
          maxUsage: null,
          maxUsagePerUser: 1,
        },
      });
    }
    setError(null);
  }, [editing, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // اعتبارسنجی تاریخ
    if (new Date(formData.expiryDate) <= new Date(formData.startDate)) {
      setError("تاریخ انقضا باید بعد از تاریخ شروع باشد");
      setLoading(false);
      return;
    }

    try {
      const url = editing
        ? `/api/events/${eventId}/discount-codes/${editing._id}`
        : `/api/events/${eventId}/discount-codes`;

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
      console.error("Error saving discount code:", err);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "600px" }}
      >
        <div className={styles.modalHeader}>
          <h2>{editing ? "ویرایش کد تخفیف" : "افزودن کد تخفیف"}</h2>
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
                <label>کد تخفیف *</label>
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
                  placeholder="مثال: SUMMER2024"
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
                  placeholder="مثال: تخفیف تابستانه"
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
                rows={2}
                placeholder="توضیحات درباره این کد تخفیف..."
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

          {/* تنظیمات تخفیف */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>تنظیمات تخفیف</h3>

            <div className={styles.formGroup}>
              <label>نوع تخفیف *</label>
              <select
                value={formData.discount.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount: { ...formData.discount, type: e.target.value },
                  })
                }
                required
              >
                <option value="percentage">درصدی</option>
                <option value="fixed">مبلغ ثابت</option>
              </select>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>
                  {formData.discount.type === "percentage"
                    ? "درصد تخفیف (%)"
                    : "مبلغ تخفیف (تومان)"}{" "}
                  *
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.discount.type === "percentage" ? "100" : undefined}
                  step={formData.discount.type === "percentage" ? "0.1" : "1"}
                  value={formData.discount.value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount: {
                        ...formData.discount,
                        value: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  required
                />
              </div>

              {formData.discount.type === "percentage" && (
                <div className={styles.formGroup}>
                  <label>حداکثر مبلغ تخفیف (تومان)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.discount.maxAmount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount: {
                          ...formData.discount,
                          maxAmount: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        },
                      })
                    }
                    placeholder="نامحدود"
                  />
                </div>
              )}
            </div>
          </div>

          {/* تاریخ اعتبار */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>تاریخ اعتبار</h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>تاریخ شروع</label>
                <DatePicker
                  value={
                    formData.startDate
                      ? new DateObject(new Date(formData.startDate))
                          .convert(persian, persian_fa)
                      : ""
                  }
                  onChange={(date) => {
                    if (date) {
                      try {
                        // تبدیل تاریخ فارسی به میلادی
                        const persianDateString = `${date.year}-${String(date.month.number).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
                        const gregorianDate = parsePersianDate(persianDateString);
                        if (gregorianDate) {
                          setFormData({
                            ...formData,
                            startDate: gregorianDate.toISOString().split("T")[0],
                          });
                        }
                      } catch (err) {
                        console.error("Error parsing start date:", err);
                      }
                    }
                  }}
                  calendar={persian}
                  locale={persian_fa}
                  format="YYYY/MM/DD"
                  placeholder="انتخاب تاریخ شروع"
                  inputClass={styles.dateInput}
                  containerClassName={styles.datePickerContainer}
                  calendarPosition="bottom-right"
                />
              </div>

              <div className={styles.formGroup}>
                <label>تاریخ انقضا *</label>
                <DatePicker
                  value={
                    formData.expiryDate
                      ? new DateObject(new Date(formData.expiryDate))
                          .convert(persian, persian_fa)
                      : ""
                  }
                  onChange={(date) => {
                    if (date) {
                      try {
                        // تبدیل تاریخ فارسی به میلادی
                        const persianDateString = `${date.year}-${String(date.month.number).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
                        const gregorianDate = parsePersianDate(persianDateString);
                        if (gregorianDate) {
                          setFormData({
                            ...formData,
                            expiryDate: gregorianDate.toISOString().split("T")[0],
                          });
                        }
                      } catch (err) {
                        console.error("Error parsing expiry date:", err);
                      }
                    }
                  }}
                  calendar={persian}
                  locale={persian_fa}
                  format="YYYY/MM/DD"
                  placeholder="انتخاب تاریخ انقضا *"
                  inputClass={styles.dateInput}
                  containerClassName={styles.datePickerContainer}
                  calendarPosition="bottom-right"
                  required
                />
              </div>
            </div>
          </div>

          {/* محدودیت استفاده */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>محدودیت استفاده</h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>حداکثر تعداد استفاده (کل)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.usage.maxUsage || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usage: {
                        ...formData.usage,
                        maxUsage: e.target.value ? parseInt(e.target.value) : null,
                      },
                    })
                  }
                  placeholder="نامحدود"
                />
              </div>

              <div className={styles.formGroup}>
                <label>حداکثر استفاده هر کاربر</label>
                <input
                  type="number"
                  min="1"
                  value={formData.usage.maxUsagePerUser}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usage: {
                        ...formData.usage,
                        maxUsagePerUser: parseInt(e.target.value) || 1,
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <p className={styles.hint}>
                💡 این کد تخفیف فقط برای این رویداد قابل استفاده است.
              </p>
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

