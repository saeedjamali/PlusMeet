'use client';

import { useState, useEffect } from 'react';
import styles from './FormatModeModal.module.css';

const ICON_OPTIONS = [
  '📍', '🏢', '🌐', '💻', '🎥', '🎤', '📱', '🎧',
  '📺', '🎬', '🎭', '🏛️', '🏟️', '🎪', '🎨', '🎯',
  '🎓', '📚', '✈️', '🚀', '⚡', '🌟', '💡', '🔔',
];

export default function FormatModeModal({ mode, category, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    examples: [''],
    icon: '📍',
    isActive: true,
    isVisible: true,
    order: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && category) {
      setFormData({
        title: category.title || '',
        code: category.code || '',
        description: category.description || '',
        examples: category.examples && category.examples.length > 0 ? category.examples : [''],
        icon: category.icon || '📍',
        isActive: category.isActive !== undefined ? category.isActive : true,
        isVisible: category.isVisible !== undefined ? category.isVisible : true,
        order: category.order || 0,
      });
    }
  }, [mode, category]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleExampleChange = (index, value) => {
    const newExamples = [...formData.examples];
    newExamples[index] = value;
    setFormData((prev) => ({ ...prev, examples: newExamples }));
  };

  const addExample = () => {
    setFormData((prev) => ({ ...prev, examples: [...prev.examples, ''] }));
  };

  const removeExample = (index) => {
    const newExamples = formData.examples.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, examples: newExamples.length > 0 ? newExamples : [''] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // اعتبارسنجی
      if (!formData.title.trim()) {
        throw new Error('عنوان الزامی است');
      }

      if (!formData.code.trim()) {
        throw new Error('کد الزامی است');
      }

      // فیلتر کردن نمونه‌های خالی
      const cleanedExamples = formData.examples.filter(e => e.trim() !== '');

      const url = mode === 'edit' 
        ? `/api/dashboard/format_mode/${category._id}`
        : '/api/dashboard/format_mode';

      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          examples: cleanedExamples,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'خطا در انجام عملیات');
      }

      alert(data.message || 'عملیات با موفقیت انجام شد');
      onSuccess();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{mode === 'edit' ? 'ویرایش نوع برگزاری' : 'نوع برگزاری جدید'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.errorBox}>
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* عنوان و کد */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                عنوان نوع برگزاری <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="مثلاً: حضوری"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                کد <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                placeholder="مثلاً: IN_PERSON"
                required
                style={{ fontFamily: 'monospace' }}
              />
              <span className={styles.hint}>فقط حروف انگلیسی، اعداد و underscore</span>
            </div>
          </div>

          {/* آیکن */}
          <div className={styles.formGroup}>
            <label className={styles.label}>آیکن پیشنهادی</label>
            <div className={styles.iconSelector}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setShowIconPicker(!showIconPicker)}
              >
                <span className={styles.selectedIcon}>{formData.icon}</span>
                <span>تغییر آیکن</span>
              </button>

              {showIconPicker && (
                <div className={styles.iconPicker}>
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`${styles.iconOption} ${
                        formData.icon === icon ? styles.iconSelected : ''
                      }`}
                      onClick={() => {
                        handleChange('icon', icon);
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

          {/* توضیح */}
          <div className={styles.formGroup}>
            <label className={styles.label}>توضیح</label>
            <textarea
              className={styles.textarea}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="توضیحات تکمیلی درباره این نوع برگزاری..."
              rows={3}
            />
          </div>

          {/* نمونه‌ها */}
          <div className={styles.formGroup}>
            <label className={styles.label}>نمونه‌ها</label>
            {formData.examples.map((example, index) => (
              <div key={index} className={styles.exampleRow}>
                <input
                  type="text"
                  className={styles.input}
                  value={example}
                  onChange={(e) => handleExampleChange(index, e.target.value)}
                  placeholder={`نمونه ${index + 1}`}
                />
                {formData.examples.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeExampleBtn}
                    onClick={() => removeExample(index)}
                    title="حذف"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
            <button type="button" className={styles.addExampleBtn} onClick={addExample}>
              + افزودن نمونه
            </button>
          </div>

          {/* ترتیب */}
          <div className={styles.formGroup}>
            <label className={styles.label}>ترتیب نمایش</label>
            <input
              type="number"
              className={styles.input}
              value={formData.order}
              onChange={(e) => handleChange('order', parseInt(e.target.value) || 0)}
              min="0"
              style={{ width: '150px' }}
            />
            <span className={styles.hint}>عدد کوچکتر = اولویت بالاتر</span>
          </div>

          {/* فعال/غیرفعال و نمایش */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                />
                <span>فعال</span>
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.isVisible}
                  onChange={(e) => handleChange('isVisible', e.target.checked)}
                />
                <span>نمایش در لیست عمومی</span>
              </label>
            </div>
          </div>

          {/* دکمه‌ها */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              انصراف
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  در حال ذخیره...
                </>
              ) : (
                mode === 'edit' ? 'ذخیره تغییرات' : 'ایجاد'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

