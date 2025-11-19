'use client';

import { useState, useEffect } from 'react';
import styles from '../shared/category.module.css';
import EmotionalModal from './EmotionalModal';

export default function EmotionalPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [filterVisible, setFilterVisible] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterActive !== 'all') params.append('isActive', filterActive === 'active');
      if (filterVisible !== 'all') params.append('isVisible', filterVisible === 'visible');

      const response = await fetch(`/api/dashboard/emotional?${params.toString()}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'خطا در دریافت لیست');
      }

      setCategories(data.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [filterActive, filterVisible]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== null) {
        fetchCategories();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleCreate = () => {
    setSelectedCategory(null);
    setModalMode('create');
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`آیا از حذف "${title}" اطمینان دارید؟`)) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/emotional/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'خطا در حذف');
      }

      alert(data.message || 'با موفقیت حذف شد');
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      alert(err.message);
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>💝</span>
            مدیریت دسته‌بندی احساسی / هدف‌محور
          </h1>
          <button className={styles.btnPrimary} onClick={handleCreate}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            دسته‌بندی جدید
          </button>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="جستجو..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>وضعیت:</label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className={styles.select}
            >
              <option value="all">همه</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>نمایش:</label>
            <select
              value={filterVisible}
              onChange={(e) => setFilterVisible(e.target.value)}
              className={styles.select}
            >
              <option value="all">همه</option>
              <option value="visible">نمایش</option>
              <option value="hidden">مخفی</option>
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div className={styles.error}>
          <p>❌ {error}</p>
          <button onClick={fetchCategories} className={styles.retryBtn}>
            تلاش مجدد
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>💝</div>
          <h3>هیچ دسته‌بندی یافت نشد</h3>
          <p>برای شروع، یک دسته‌بندی جدید ایجاد کنید</p>
          <button className={styles.btnPrimary} onClick={handleCreate}>
            ایجاد اولین دسته‌بندی
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {categories.map((category) => (
            <div key={category._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>{category.icon}</div>
                <div className={styles.cardTitle}>
                  <h3>{category.title}</h3>
                  <span className={styles.cardCode}>{category.code}</span>
                </div>
                <div className={styles.cardBadges}>
                  {!category.isActive && <span className={styles.badgeInactive}>غیرفعال</span>}
                  {!category.isVisible && <span className={styles.badgeHidden}>مخفی</span>}
                </div>
              </div>

              {category.description && (
                <p className={styles.cardDescription}>{category.description}</p>
              )}

              {category.examples && category.examples.length > 0 && (
                <div className={styles.cardExamples}>
                  <strong>نمونه‌ها:</strong>
                  <ul>
                    {category.examples.map((example, idx) => (
                      <li key={idx}>{example}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={styles.cardFooter}>
                <div className={styles.cardStats}>
                  <span>📊 {category.eventsCount} رویداد</span>
                  <span>🔢 ترتیب: {category.order}</span>
                </div>
                <div className={styles.cardActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleEdit(category)}
                    title="ویرایش"
                  >
                    ✏️
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={() => handleDelete(category._id, category.title)}
                    title="حذف"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <EmotionalModal
          mode={modalMode}
          category={modalMode === 'edit' ? selectedCategory : null}
          onClose={() => {
            setShowModal(false);
            setSelectedCategory(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setSelectedCategory(null);
            fetchCategories();
          }}
        />
      )}
    </div>
  );
}



