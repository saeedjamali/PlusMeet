/**
 * Component: NotificationForm
 * فرم ایجاد/ویرایش اعلان
 */

"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/colors/green.css";
import styles from "./notifManager.module.css";

export default function NotificationForm({ notification, onClose }) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    priority: "medium",
    targetRoles: [],
    actionUrl: "",
    actionText: "",
    scheduledAt: "",
    expiresAt: "",
    status: "draft",
    pinned: false,
    showOnHomepage: false,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [scheduledDate, setScheduledDate] = useState(null);
  const [expiryDate, setExpiryDate] = useState(null);

  // دریافت لیست نقش‌ها از API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch("/api/admin/roles", {
          credentials: "include",
        });
        const data = await response.json();
        if (data.success) {
          // ذخیره کل اطلاعات نقش (slug + name + icon)
          setRoles(
            data.data.roles.map((r) => ({
              code: r.slug,
              displayName: r.name,
              icon: r.icon || "👤",
            }))
          );
        } else {
          console.error("Error fetching roles:", data.error);
          // Fallback to default roles
          setRoles([
            { code: "admin", displayName: "مدیر سیستم", icon: "👑" },
            { code: "moderator", displayName: "ناظر", icon: "🛡️" },
            { code: "event_owner", displayName: "مالک رویداد", icon: "🎯" },
            { code: "user", displayName: "کاربر عادی", icon: "👤" },
            { code: "guest", displayName: "مهمان", icon: "🚪" },
            { code: "content_manager", displayName: "مدیر محتوا", icon: "📝" },
          ]);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        // Fallback to default roles
        setRoles([
          { code: "admin", displayName: "مدیر سیستم", icon: "👑" },
          { code: "moderator", displayName: "ناظر", icon: "🛡️" },
          { code: "event_owner", displayName: "مالک رویداد", icon: "🎯" },
          { code: "user", displayName: "کاربر عادی", icon: "👤" },
          { code: "guest", displayName: "مهمان", icon: "🚪" },
          { code: "content_manager", displayName: "مدیر محتوا", icon: "📝" },
        ]);
      } finally {
        setRolesLoading(false);
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    if (notification) {
      setFormData({
        title: notification.title || "",
        message: notification.message || "",
        type: notification.type || "info",
        priority: notification.priority || "medium",
        targetRoles: notification.targetRoles || [],
        actionUrl: notification.actionUrl || "",
        actionText: notification.actionText || "",
        scheduledAt: notification.scheduledAt || "",
        expiresAt: notification.expiresAt || "",
        status: notification.status || "draft",
        pinned: notification.pinned || false,
        showOnHomepage: notification.showOnHomepage || false,
      });
      if (notification.image) {
        setImagePreview(notification.image);
      }
      // Set Persian date picker values
      if (notification.scheduledAt) {
        setScheduledDate(new Date(notification.scheduledAt));
      }
      if (notification.expiresAt) {
        setExpiryDate(new Date(notification.expiresAt));
      }
    }
  }, [notification]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRoleChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const selectedRoles = selectedOptions.map((option) => option.value);
    setFormData((prev) => ({
      ...prev,
      targetRoles: selectedRoles,
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("لطفاً یک فایل تصویری انتخاب کنید");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleScheduledDateChange = (date) => {
    setScheduledDate(date);
    if (date) {
      setFormData((prev) => ({
        ...prev,
        scheduledAt: date.toDate().toISOString(),
      }));
    } else {
      setFormData((prev) => ({ ...prev, scheduledAt: "" }));
    }
  };

  const handleExpiryDateChange = (date) => {
    setExpiryDate(date);
    if (date) {
      setFormData((prev) => ({
        ...prev,
        expiresAt: date.toDate().toISOString(),
      }));
    } else {
      setFormData((prev) => ({ ...prev, expiresAt: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        image: imagePreview,
        scheduledAt: formData.scheduledAt || null,
        expiresAt: formData.expiresAt || null,
      };

      const url = notification
        ? `/api/admin/notifications/${notification._id}`
        : "/api/admin/notifications";

      const response = await fetch(url, {
        method: notification ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message || "اعلان با موفقیت ذخیره شد");
        onClose(true); // Refresh list
      } else {
        setError(data.error || "خطا در ذخیره اعلان");
      }
    } catch (error) {
      console.error("Error saving notification:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={() => onClose(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{notification ? "ویرایش اعلان" : "ایجاد اعلان جدید"}</h2>
          <button onClick={() => onClose(false)} className={styles.closeBtn}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          {/* عنوان */}
          <div className={styles.formGroup}>
            <label>عنوان *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={200}
              placeholder="عنوان اعلان..."
            />
          </div>

          {/* متن */}
          <div className={styles.formGroup}>
            <label>متن *</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={4}
              placeholder="متن کامل اعلان..."
            />
          </div>

          <div className={styles.formRow}>
            {/* نوع */}
            <div className={styles.formGroup}>
              <label>نوع</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="info">اطلاعیه</option>
                <option value="success">موفقیت</option>
                <option value="warning">هشدار</option>
                <option value="error">خطا</option>
                <option value="announcement">اعلامیه</option>
              </select>
            </div>

            {/* اولویت */}
            <div className={styles.formGroup}>
              <label>اولویت</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="low">کم</option>
                <option value="medium">متوسط</option>
                <option value="high">زیاد</option>
                <option value="urgent">فوری</option>
              </select>
            </div>

            {/* وضعیت */}
            <div className={styles.formGroup}>
              <label>وضعیت</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="draft">پیش‌نویس</option>
                <option value="scheduled">زمان‌بندی شده</option>
                <option value="published">منتشر شده</option>
                <option value="cancelled">لغو شده</option>
              </select>
            </div>
          </div>

          {/* تصویر */}
          <div className={styles.formGroup}>
            <label>تصویر</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {imagePreview && (
              <div className={styles.imagePreview}>
                <img src={imagePreview} alt="Preview" />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className={styles.removeImage}
                >
                  حذف تصویر
                </button>
              </div>
            )}
          </div>

          {/* نقش‌های هدف */}
          <div className={styles.formGroup}>
            <label>نقش‌های هدف (خالی = همه)</label>
            <select
              multiple
              value={formData.targetRoles}
              onChange={handleRoleChange}
              className={styles.multiSelect}
              disabled={rolesLoading}
              size={Math.min(roles.length + 1, 6)}
            >
              {rolesLoading ? (
                <option disabled>در حال بارگذاری...</option>
              ) : (
                <>
                  <option value="" disabled className={styles.selectPlaceholder}>
                    Ctrl + کلیک برای انتخاب چند مورد
                  </option>
                  {roles.map((role) => (
                    <option key={role.code} value={role.code}>
                      {role.icon} {role.displayName} ({role.code})
                    </option>
                  ))}
                </>
              )}
            </select>
            {formData.targetRoles.length > 0 && (
              <div className={styles.selectedRoles}>
                <span className={styles.selectedLabel}>انتخاب شده:</span>
                {formData.targetRoles.map((roleCode) => {
                  const role = roles.find((r) => r.code === roleCode);
                  return (
                    <span key={roleCode} className={styles.selectedRoleTag}>
                      <span className={styles.roleTagContent}>
                        {role?.icon} {role?.displayName || roleCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            targetRoles: prev.targetRoles.filter(
                              (r) => r !== roleCode
                            ),
                          }));
                        }}
                        className={styles.removeRoleTag}
                        aria-label={`حذف ${role?.displayName}`}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* لینک عملیات */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>لینک عملیات</label>
              <input
                type="url"
                name="actionUrl"
                value={formData.actionUrl}
                onChange={handleChange}
                placeholder="/dashboard/..."
              />
            </div>
            <div className={styles.formGroup}>
              <label>متن دکمه</label>
              <input
                type="text"
                name="actionText"
                value={formData.actionText}
                onChange={handleChange}
                placeholder="مشاهده جزئیات"
              />
            </div>
          </div>

          {/* زمان‌بندی */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>زمان انتشار</label>
              <DatePicker
                value={scheduledDate}
                onChange={handleScheduledDateChange}
                calendar={persian}
                locale={persian_fa}
                format="YYYY/MM/DD HH:mm"
                plugins={[]}
                calendarPosition="bottom-right"
                className="green"
                inputClass={styles.dateInput}
                containerClassName={styles.datePickerContainer}
                placeholder="انتخاب تاریخ و زمان"
                timePicker
              />
            </div>
            <div className={styles.formGroup}>
              <label>تاریخ انقضا</label>
              <DatePicker
                value={expiryDate}
                onChange={handleExpiryDateChange}
                calendar={persian}
                locale={persian_fa}
                format="YYYY/MM/DD HH:mm"
                plugins={[]}
                calendarPosition="bottom-right"
                className="green"
                inputClass={styles.dateInput}
                containerClassName={styles.datePickerContainer}
                placeholder="انتخاب تاریخ و زمان"
                timePicker
              />
            </div>
          </div>

          {/* Pin */}
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="pinned"
                checked={formData.pinned}
                onChange={handleChange}
              />
              <span>پین کردن در بالای لیست</span>
            </label>
          </div>

          {/* نمایش در صفحه اصلی */}
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="showOnHomepage"
                checked={formData.showOnHomepage}
                onChange={handleChange}
              />
              <span>🏠 نمایش در صفحه اصلی (اعلان عمومی)</span>
            </label>
            {formData.showOnHomepage && (
              <p className={styles.helperText}>
                ⚠️ این اعلان برای تمام بازدیدکنندگان صفحه اصلی (حتی مهمان‌ها) نمایش داده خواهد شد
              </p>
            )}
          </div>

          {/* Actions */}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => onClose(false)}
              className={styles.cancelBtn}
            >
              لغو
            </button>
            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? "در حال ذخیره..." : notification ? "بروزرسانی" : "ایجاد اعلان"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

