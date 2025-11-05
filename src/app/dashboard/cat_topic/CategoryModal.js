"use client";

import { useState, useEffect } from "react";
import styles from "./CategoryModal.module.css";

const MOOD_OPTIONS = [
  "احساس",
  "آرامش",
  "انرژی",
  "شور",
  "جوانی",
  "خلاقیت",
  "ظراقت",
  "تمرکز",
  "تفکر",
  "نقد",
  "الهام",
  "دانش",
  "هیجان",
  "تعامل",
];

const GRADIENT_DIRECTIONS = [
  { value: "to-right", label: "راست به چپ" },
  { value: "to-left", label: "چپ به راست" },
  { value: "to-top", label: "پایین به بالا" },
  { value: "to-bottom", label: "بالا به پایین" },
  { value: "to-top-right", label: "مورب (راست-بالا)" },
  { value: "to-bottom-right", label: "مورب (راست-پایین)" },
];

const COMMON_ICONS = [
  "📁",
  "📂",
  "📚",
  "🎭",
  "🎨",
  "🎵",
  "🎬",
  "🏛️",
  "🎪",
  "🎤",
  "🎧",
  "🎸",
  "🎹",
  "🎺",
  "🎻",
  "🥁",
  "🖼️",
  "🎟️",
  "🎫",
  "🏆",
  "🎖️",
  "🏅",
  "⚽",
  "🏀",
  "🎮",
  "🎯",
  "🎲",
  "🎰",
  "🧩",
  "🃏",
  "🀄",
  "🎴",
  "🌍",
  "🌎",
  "🌏",
  "🗺️",
  "🧭",
  "⛰️",
  "🏔️",
  "🗻",
  "🏕️",
  "🏖️",
  "🏜️",
  "🏝️",
  "🏞️",
  "🏟️",
  "🏛️",
  "🏗️",
  "💼",
  "📊",
  "📈",
  "📉",
  "🔬",
  "🔭",
  "🎓",
  "📚",
  "✨",
  "🌟",
  "💫",
  "⭐",
  "🌠",
  "🎆",
  "🎇",
  "🎉",
];

export default function CategoryModal({
  mode,
  category,
  parentCategory,
  onClose,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    description: "",
    parentId: parentCategory?._id || "",
    icon: "📁",
    baseColor: "#F4A325",
    useGradient: false,
    gradientStart: "#F4A325",
    gradientEnd: "#F59E0B",
    gradientDirection: "to-right",
    mood: "خلاقیت",
    usage: "",
    isActive: true,
    isVisible: true,
    order: 0,
    tags: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [availableParents, setAvailableParents] = useState([]);
  const [tagInput, setTagInput] = useState("");

  // بارگذاری اطلاعات برای ویرایش
  useEffect(() => {
    if (mode === "edit" && category) {
      setFormData({
        title: category.title || "",
        code: category.code || "",
        description: category.description || "",
        parentId: category.parentId?._id || category.parentId || "",
        icon: category.icon || "📁",
        baseColor: category.baseColor || "#F4A325",
        useGradient: !!category.gradient,
        gradientStart:
          category.gradient?.start || category.baseColor || "#F4A325",
        gradientEnd: category.gradient?.end || "#F59E0B",
        gradientDirection: category.gradient?.direction || "to-right",
        mood: category.mood || "خلاقیت",
        usage: category.usage || "",
        isActive: category.isActive !== undefined ? category.isActive : true,
        isVisible: category.isVisible !== undefined ? category.isVisible : true,
        order: category.order || 0,
        tags: category.metadata?.tags || [],
      });
    }
  }, [mode, category]);

  const fetchAvailableParents = async () => {
    try {
      const response = await fetch("/api/dashboard/cat_topic?view=flat", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        // فیلتر کردن خود دسته‌بندی و فرزندانش در حالت ویرایش
        let filtered = data.data;
        if (mode === "edit" && category) {
          filtered = data.data.filter((cat) => cat._id !== category._id);
          // TODO: فیلتر کردن فرزندان
        }
        setAvailableParents(filtered);
      }
    } catch (err) {
      // Error fetching parents
    }
  };

  // دریافت لیست parent های ممکن
  useEffect(() => {
    fetchAvailableParents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleChange("tags", [...formData.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag) => {
    handleChange(
      "tags",
      formData.tags.filter((t) => t !== tag)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ساخت body درخواست
      const body = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        parentId: formData.parentId || null,
        icon: formData.icon,
        baseColor: formData.baseColor,
        mood: formData.mood,
        usage: formData.usage.trim(),
        isActive: formData.isActive,
        isVisible: formData.isVisible,
        order: parseInt(formData.order) || 0,
        tags: formData.tags,
        code: formData.code?.trim() || null, // اضافه کردن code
      };

      // گرادیانت
      if (formData.useGradient) {
        body.gradient = {
          start: formData.gradientStart,
          end: formData.gradientEnd,
          direction: formData.gradientDirection,
        };
      } else {
        body.gradient = null;
      }

      const url =
        mode === "create"
          ? "/api/dashboard/cat_topic"
          : `/api/dashboard/cat_topic/${category._id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در ذخیره دسته‌بندی");
      }

      alert(data.message || "دسته‌بندی با موفقیت ذخیره شد");
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {mode === "create" ? (
              <>
                <span>➕</span>
                ایجاد دسته‌بندی جدید
              </>
            ) : (
              <>
                <span>✏️</span>
                ویرایش دسته‌بندی
              </>
            )}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} title="بستن">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              <span>❌</span>
              {error}
            </div>
          )}

          {/* عنوان */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              عنوان <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="عنوان دسته‌بندی"
              className={styles.input}
              required
            />
          </div>

          {/* کد */}
          <div className={styles.formGroup}>
            <label className={styles.label}>کد (اختیاری)</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                handleChange("code", e.target.value.toUpperCase())
              }
              placeholder="مثلاً: TECH_EVENT (اگر خالی بگذارید، خودکار تولید می‌شود)"
              className={styles.input}
              style={{ fontFamily: "monospace" }}
            />
            <span className={styles.hint}>
              فقط حروف انگلیسی، اعداد و _ - اگر خالی باشد، از عنوان تولید می‌شود
            </span>
          </div>

          {/* توضیح */}
          <div className={styles.formGroup}>
            <label className={styles.label}>توضیح (اختیاری)</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="توضیح مختصری درباره این دسته‌بندی"
              className={styles.textarea}
              rows="3"
            />
          </div>

          {/* والد */}
          <div className={styles.formGroup}>
            <label className={styles.label}>دسته‌بندی والد</label>
            <select
              value={formData.parentId}
              onChange={(e) => handleChange("parentId", e.target.value)}
              className={styles.select}
            >
              <option value="">بدون والد (سطح اول)</option>
              {availableParents.map((parent) => (
                <option key={parent._id} value={parent._id}>
                  {"└─".repeat(parent.level - 1)} {parent.title} (سطح{" "}
                  {parent.level})
                </option>
              ))}
            </select>
          </div>

          {/* آیکن */}
          <div className={styles.formGroup}>
            <label className={styles.label}>آیکن</label>
            <div className={styles.iconPickerWrapper}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setShowIconPicker(!showIconPicker)}
              >
                <span className={styles.selectedIcon}>{formData.icon}</span>
                <span>انتخاب آیکن</span>
              </button>
              {showIconPicker && (
                <div className={styles.iconPicker}>
                  {COMMON_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`${styles.iconOption} ${
                        formData.icon === icon ? styles.iconOptionActive : ""
                      }`}
                      onClick={() => {
                        handleChange("icon", icon);
                        setShowIconPicker(false);
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* رنگ پایه */}
          <div className={styles.formGroup}>
            <label className={styles.label}>رنگ پایه</label>
            <div className={styles.colorPickerWrapper}>
              <input
                type="color"
                value={formData.baseColor}
                onChange={(e) => handleChange("baseColor", e.target.value)}
                className={styles.colorInput}
              />
              <input
                type="text"
                value={formData.baseColor}
                onChange={(e) => handleChange("baseColor", e.target.value)}
                placeholder="#F4A325"
                className={styles.input}
                pattern="^#[0-9A-Fa-f]{6}$"
              />
              <div
                className={styles.colorPreview}
                style={{ background: formData.baseColor }}
              />
            </div>
          </div>

          {/* گرادیانت */}
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.useGradient}
                onChange={(e) => handleChange("useGradient", e.target.checked)}
                className={styles.checkbox}
              />
              استفاده از گرادیانت
            </label>
          </div>

          {formData.useGradient && (
            <div className={styles.gradientSection}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>رنگ شروع</label>
                  <div className={styles.colorPickerWrapper}>
                    <input
                      type="color"
                      value={formData.gradientStart}
                      onChange={(e) =>
                        handleChange("gradientStart", e.target.value)
                      }
                      className={styles.colorInput}
                    />
                    <input
                      type="text"
                      value={formData.gradientStart}
                      onChange={(e) =>
                        handleChange("gradientStart", e.target.value)
                      }
                      className={styles.input}
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>رنگ پایان</label>
                  <div className={styles.colorPickerWrapper}>
                    <input
                      type="color"
                      value={formData.gradientEnd}
                      onChange={(e) =>
                        handleChange("gradientEnd", e.target.value)
                      }
                      className={styles.colorInput}
                    />
                    <input
                      type="text"
                      value={formData.gradientEnd}
                      onChange={(e) =>
                        handleChange("gradientEnd", e.target.value)
                      }
                      className={styles.input}
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>جهت گرادیانت</label>
                <select
                  value={formData.gradientDirection}
                  onChange={(e) =>
                    handleChange("gradientDirection", e.target.value)
                  }
                  className={styles.select}
                >
                  {GRADIENT_DIRECTIONS.map((dir) => (
                    <option key={dir.value} value={dir.value}>
                      {dir.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Preview گرادیانت */}
              <div className={styles.gradientPreview}>
                <div
                  className={styles.gradientPreviewBox}
                  style={{
                    background: `linear-gradient(${formData.gradientDirection}, ${formData.gradientStart}, ${formData.gradientEnd})`,
                  }}
                >
                  <span>{formData.icon}</span>
                </div>
              </div>
            </div>
          )}

          {/* حس و کاربرد */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>حس و کاربرد</label>
              <select
                value={formData.mood}
                onChange={(e) => handleChange("mood", e.target.value)}
                className={styles.select}
              >
                {MOOD_OPTIONS.map((mood) => (
                  <option key={mood} value={mood}>
                    {mood}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>کاربرد (اختیاری)</label>
              <input
                type="text"
                value={formData.usage}
                onChange={(e) => handleChange("usage", e.target.value)}
                placeholder="مثال: رویدادهای فرهنگی"
                className={styles.input}
              />
            </div>
          </div>

          {/* ترتیب */}
          <div className={styles.formGroup}>
            <label className={styles.label}>ترتیب نمایش</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => handleChange("order", e.target.value)}
              placeholder="0"
              className={styles.input}
              min="0"
            />
            <small className={styles.hint}>
              عدد کمتر، اولویت بیشتر (0 = بالاترین اولویت)
            </small>
          </div>

          {/* تگ‌ها */}
          <div className={styles.formGroup}>
            <label className={styles.label}>تگ‌ها (اختیاری)</label>
            <div className={styles.tagInput}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="تگ جدید..."
                className={styles.input}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className={styles.addTagBtn}
              >
                افزودن
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className={styles.tags}>
                {formData.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className={styles.removeTag}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* توگل‌ها */}
          <div className={styles.toggleGroup}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.toggleText}>فعال</span>
            </label>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={formData.isVisible}
                onChange={(e) => handleChange("isVisible", e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.toggleText}>نمایش در فهرست</span>
            </label>
          </div>

          {/* دکمه‌های عملیات */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnCancel}
              disabled={loading}
            >
              انصراف
            </button>
            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  در حال ذخیره...
                </>
              ) : mode === "create" ? (
                "ایجاد دسته‌بندی"
              ) : (
                "ذخیره تغییرات"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
