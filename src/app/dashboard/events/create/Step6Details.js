'use client';

import { useState, useEffect } from 'react';
import styles from './eventCreate.module.css';

export default function Step6Details({ 
  formData, 
  handleChange,
  loading,
  error: parentError, 
  setError: setParentError,
  onPrev, 
  onNext 
}) {
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState({
    intent: [],
    emotional: [],
    audienceType: [],
    socialDynamics: [],
    impactPurpose: [],
  });
  const [loadingStates, setLoadingStates] = useState({
    intent: false,
    emotional: false,
    audienceType: false,
    socialDynamics: false,
    impactPurpose: false,
  });

  const [selectedCategories, setSelectedCategories] = useState({
    intent: null,
    emotional: null,
    audienceType: null,
    socialDynamics: null,
    impactPurpose: null,
  });

  // دریافت دسته‌بندی‌ها
  useEffect(() => {
    fetchAllCategories();
  }, []);

  const fetchAllCategories = async () => {
    await Promise.all([
      fetchCategories('intent', '/api/dashboard/intent'),
      fetchCategories('emotional', '/api/dashboard/emotional'),
      fetchCategories('audienceType', '/api/dashboard/audienceType'),
      fetchCategories('socialDynamics', '/api/dashboard/socialDynamics'),
      fetchCategories('impactPurpose', '/api/dashboard/impactPurpose'),
    ]);
  };

  const fetchCategories = async (key, endpoint) => {
    try {
      setLoadingStates(prev => ({ ...prev, [key]: true }));
      const response = await fetch(endpoint, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `خطا در دریافت ${getCategoryTitle(key)}`);
      }

      setCategories(prev => ({ ...prev, [key]: data.data || [] }));

      // اگر قبلا انتخاب شده، از formData بگیر
      if (formData[key]) {
        const selected = (data.data || []).find(cat => cat._id === formData[key]);
        if (selected) {
          setSelectedCategories(prev => ({ ...prev, [key]: selected }));
        }
      }
    } catch (err) {
      console.error(`Error fetching ${key}:`, err);
      setError(err.message);
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const getCategoryTitle = (key) => {
    const titles = {
      intent: 'نوع تعامل یا هدف',
      emotional: 'دسته‌بندی احساسی / هدف‌محور',
      audienceType: 'دسته‌بندی مخاطب',
      socialDynamics: 'دسته‌بندی تعامل اجتماعی',
      impactPurpose: 'دسته‌بندی تأثیر و ارزش',
    };
    return titles[key] || key;
  };

  const getCategoryIcon = (key) => {
    const icons = {
      intent: '🎯',
      emotional: '❤️',
      audienceType: '👥',
      socialDynamics: '🤝',
      impactPurpose: '✨',
    };
    return icons[key] || '📂';
  };

  const handleCategorySelect = (key, category) => {
    if (!category.isActive) {
      setError(`دسته "${category.title}" در حال حاضر غیرفعال است`);
      return;
    }

    setSelectedCategories(prev => ({ ...prev, [key]: category }));
    handleChange(key, category._id);
    setError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // بررسی که همه دسته‌بندی‌ها انتخاب شده باشند (الزامی)
    const requiredCategories = ['intent', 'emotional', 'audienceType', 'socialDynamics', 'impactPurpose'];
    
    for (const key of requiredCategories) {
      if (!selectedCategories[key]) {
        setError(`لطفاً ${getCategoryTitle(key)} را انتخاب کنید`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      // بررسی کنیم که انتخاب شده فعال باشد
      if (!selectedCategories[key].isActive) {
        setError(`دسته "${selectedCategories[key].title}" در ${getCategoryTitle(key)} غیرفعال است`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // رفتن به مرحله بعد (پیش‌نمایش)
    onNext();
  };

  const renderCategorySection = (key) => {
    const categoryList = categories[key] || [];
    const selected = selectedCategories[key];
    const isLoading = loadingStates[key];

    return (
      <section className={styles.section} key={key}>
        <h3 className={styles.subsectionTitle}>
          <span className={styles.sectionIcon}>{getCategoryIcon(key)}</span>
          {getCategoryTitle(key)}
          <span className={styles.required}>*</span>
        </h3>
        {selected && selected.description && (
          <div className={styles.selectedCategoryDescription}>
            <strong>📝 توضیحات:</strong> {selected.description}
          </div>
        )}

        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>در حال بارگذاری...</p>
          </div>
        ) : categoryList.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📂</span>
            <p>هیچ دسته‌بندی فعالی یافت نشد</p>
          </div>
        ) : (
          <div className={styles.compactCategoriesGrid}>
            {categoryList.map((category) => (
              <div key={category._id} className={styles.categoryWrapper}>
                <button
                  type="button"
                  className={`${styles.compactCategoryCard} ${
                    selected?._id === category._id ? styles.compactCategoryCardSelected : ''
                  } ${!category.isActive ? styles.compactCategoryCardDisabled : ''}`}
                  onClick={() => handleCategorySelect(key, category)}
                  disabled={!category.isActive}
                  title={!category.isActive ? 'این دسته در حال حاضر غیرفعال است' : category.title}
                >
                  <span className={styles.compactCategoryIcon}>{category.icon}</span>
                  <span className={styles.compactCategoryTitle}>{category.title}</span>
                  {!category.isActive && (
                    <span className={styles.disabledBadge}>غیرفعال</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && (
        <div className={styles.errorBox}>
          <span>⚠️</span>
          {error}
        </div>
      )}

      {/* عنوان مرحله */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🏷️</span>
          سایر دسته‌بندی‌ها
        </h2>
        <p className={styles.sectionHint}>
          این دسته‌بندی‌ها به کاربران کمک می‌کنند تا رویداد شما را بهتر کشف کنند. <strong>انتخاب همه دسته‌بندی‌ها الزامی است.</strong>
        </p>
      </section>

      {/* رندر همه دسته‌بندی‌ها */}
      {renderCategorySection('intent')}
      {renderCategorySection('emotional')}
      {renderCategorySection('audienceType')}
      {renderCategorySection('socialDynamics')}
      {renderCategorySection('impactPurpose')}

      {/* دکمه‌های ناوبری */}
      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onPrev}>
          ← مرحله قبل
        </button>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          مرحله بعد (پیش‌نمایش) →
        </button>
      </div>
    </form>
  );
}

