'use client';

import { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors,
  pointerWithin,
  rectIntersection
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import styles from './cat_topic.module.css';
import CategoryModal from './CategoryModal';
import ExcelUploadModal from './ExcelUploadModal';
import DraggableTreeItem from './DraggableTreeItem';

export default function TopicCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('tree'); // tree, flat, table
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // all, active, inactive
  const [filterVisible, setFilterVisible] = useState('all'); // all, visible, hidden
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create, edit
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px حرکت برای شروع drag
      },
    })
  );

  // دریافت دسته‌بندی‌ها
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        view,
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filterActive !== 'all') params.append('isActive', filterActive === 'active');
      if (filterVisible !== 'all') params.append('isVisible', filterVisible === 'visible');

      const response = await fetch(`/api/dashboard/cat_topic?${params.toString()}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'خطا در دریافت دسته‌بندی‌ها');
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
  }, [view, filterActive, filterVisible]);

  // جستجو با تاخیر
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== null) {
        fetchCategories();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Toggle expand/collapse
  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // باز کردن مودال برای ایجاد
  const handleCreate = (parentCategory = null) => {
    setSelectedCategory(parentCategory);
    setModalMode('create');
    setShowModal(true);
  };

  // باز کردن مودال برای ویرایش
  const handleEdit = (category) => {
    setSelectedCategory(category);
    setModalMode('edit');
    setShowModal(true);
  };

  // حذف دسته‌بندی
  const handleDelete = async (id, title) => {
    if (!confirm(`آیا از حذف دسته‌بندی "${title}" اطمینان دارید؟`)) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/cat_topic/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'خطا در حذف دسته‌بندی');
      }

      alert(data.message || 'دسته‌بندی با موفقیت حذف شد');
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      alert(err.message);
    }
  };

  // یافتن یک دسته‌بندی به همراه index و parentId در tree
  const findCategoryInTree = (categories, id, parentId = null) => {
    for (let i = 0; i < categories.length; i++) {
      if (categories[i]._id === id) {
        return { category: categories[i], index: i, parentId };
      }
      if (categories[i].children && categories[i].children.length > 0) {
        const found = findCategoryInTree(categories[i].children, id, categories[i]._id);
        if (found) return found;
      }
    }
    return null;
  };

  // Drag & Drop handlers
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    setIsDragging(true);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);

    if (!over || active.id === over.id) {
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    // جلوگیری از drop روی خودش
    if (active.id === over.id) {
      return;
    }

    try {
      // بررسی اینکه آیا در یک سطح هستند (reorder)
      const isSameParent = activeData?.parentId === overData?.parentId;

      if (isSameParent) {
        // *** REORDER در همان سطح ***
        const activeInfo = findCategoryInTree(categories, active.id);
        const overInfo = findCategoryInTree(categories, over.id);

        if (activeInfo && overInfo) {
          const response = await fetch('/api/dashboard/cat_topic/reorder', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              categoryId: active.id,
              newParentId: activeData.parentId || null,
              newOrder: overInfo.index,
              action: 'reorder',
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'خطا در تغییر ترتیب');
          }

          // به‌روزرسانی لیست
          await fetchCategories();
        }
      } else {
        // *** MOVE به parent جدید ***
        const draggedId = active.id;
        const newParentId = over.id;

        // جلوگیری از drop روی خودش
        if (draggedId === newParentId) {
          alert('دسته‌بندی نمی‌تواند والد خودش باشد');
          return;
        }

        const response = await fetch('/api/dashboard/cat_topic/reorder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            categoryId: draggedId,
            newParentId: newParentId,
            action: 'move',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'خطا در جابجایی دسته‌بندی');
        }

        // به‌روزرسانی لیست
        await fetchCategories();
      }
    } catch (err) {
      console.error('Error in drag and drop:', err);
      alert(err.message);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setIsDragging(false);
  };

  // Migration codes برای دسته‌های قدیمی
  const handleMigrateCodes = async () => {
    if (!confirm('آیا می‌خواهید کد را برای تمام دسته‌بندی‌های قدیمی ایجاد کنید؟')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/cat_topic/migrate-codes', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'خطا در migration');
      }

      alert(data.message + '\n\n' + 
        `✅ موفق: ${data.results.updated}\n` +
        `❌ ناموفق: ${data.results.failed}`
      );
      
      // Refresh لیست
      await fetchCategories();
    } catch (err) {
      console.error('Error in migration:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // رندر یک آیتم در tree view با drag & drop
  const renderTreeItem = (category, level = 0) => {
    const isExpanded = expandedItems.has(category._id);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <DraggableTreeItem
        key={category._id}
        category={category}
        level={level}
        isExpanded={isExpanded}
        onToggleExpand={toggleExpand}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        renderChildren={
          hasChildren && isExpanded
            ? () => (
                <SortableContext
                  items={category.children.map((c) => c._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {category.children.map((child) => renderTreeItem(child, level + 1))}
                </SortableContext>
              )
            : null
        }
      />
    );
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
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>📂</span>
            مدیریت دسته‌بندی موضوعات
          </h1>
          <div className={styles.headerActions}>
            <button
              className={styles.btnExcel}
              onClick={() => setShowExcelModal(true)}
              title="آپلود از Excel"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              آپلود Excel
            </button>
            <button
              className={styles.btnMigrate}
              onClick={handleMigrateCodes}
              title="ایجاد کد برای دسته‌های قدیمی"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7h16M10 11v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              تولید کدها
            </button>
            <button className={styles.btnPrimary} onClick={() => handleCreate()}>
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
        </div>

        {/* فیلترها و جستجو */}
        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="جستجو در دسته‌بندی‌ها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>نمایش:</label>
            <select
              value={view}
              onChange={(e) => setView(e.target.value)}
              className={styles.select}
            >
              <option value="tree">درختی</option>
              <option value="flat">صاف</option>
            </select>
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

      {/* محتوا */}
      {error ? (
        <div className={styles.error}>
          <p>❌ {error}</p>
          <button onClick={fetchCategories} className={styles.retryBtn}>
            تلاش مجدد
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📂</div>
          <h3>هیچ دسته‌بندی یافت نشد</h3>
          <p>برای شروع، یک دسته‌بندی جدید ایجاد کنید</p>
          <button className={styles.btnPrimary} onClick={() => handleCreate()}>
            ایجاد اولین دسته‌بندی
          </button>
        </div>
      ) : (
        <div className={styles.content}>
          {view === 'tree' ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext
                items={categories.map((c) => c._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className={styles.treeView}>
                  {categories.map((category) => renderTreeItem(category))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeId ? (
                  <div className={styles.dragOverlay}>
                    <span className={styles.dragOverlayText}>در حال جابجایی...</span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className={styles.flatView}>
              {categories.map((category) => (
                <div key={category._id} className={styles.flatItem}>
                  <span className={styles.categoryIcon}>{category.icon}</span>
                  <div className={styles.categoryInfo}>
                    <div className={styles.categoryTitle}>{category.title}</div>
                    <div className={styles.categoryMeta}>
                      سطح {category.level} • {category.mood}
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button onClick={() => handleEdit(category)}>ویرایش</button>
                    <button onClick={() => handleDelete(category._id, category.title)}>
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal ها */}
      {showModal && (
        <CategoryModal
          mode={modalMode}
          category={modalMode === 'edit' ? selectedCategory : null}
          parentCategory={modalMode === 'create' ? selectedCategory : null}
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

      {showExcelModal && (
        <ExcelUploadModal
          onClose={() => setShowExcelModal(false)}
          onSuccess={fetchCategories}
        />
      )}
    </div>
  );
}

