'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './cat_topic.module.css';

export default function DraggableTreeItem({
  category,
  level = 0,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onCreate,
  renderChildren,
}) {
  const hasChildren = category.children && category.children.length > 0;

  // Sortable setup (برای هم drag و هم drop)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: category._id,
    data: {
      category,
      level,
      parentId: category.parentId,
    },
  });

  const style = {
    paddingRight: `${level * 2}rem`,
    borderRight: `4px solid ${category.baseColor}`,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isOver ? 'rgba(244, 163, 37, 0.1)' : undefined,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div className={styles.treeItem}>
      <div
        ref={setNodeRef}
        className={`${styles.treeItemContent} ${!category.isActive ? styles.inactive : ''} ${
          isDragging ? styles.dragging : ''
        } ${isOver ? styles.dragOver : ''}`}
        style={style}
      >
        {/* Drag Handle */}
        <span
          className={styles.dragHandle}
          {...attributes}
          {...listeners}
          title="برای جابجایی درگ کنید"
        >
          ⋮⋮
        </span>

        {/* Toggle Button */}
        {hasChildren && (
          <button
            className={styles.toggleBtn}
            onClick={() => onToggleExpand(category._id)}
            aria-label={isExpanded ? 'بستن' : 'باز کردن'}
          >
            {isExpanded ? '▼' : '◀'}
          </button>
        )}

        {!hasChildren && <span className={styles.togglePlaceholder}></span>}

        {/* Icon */}
        <span className={styles.categoryIcon}>{category.icon}</span>

        {/* عنوان و اطلاعات */}
        <div className={styles.categoryInfo}>
          <div className={styles.categoryTitle}>
            {category.title}
            {category.code && <span className={styles.categoryCode}>{category.code}</span>}
            <span className={styles.categoryLevel}>سطح {category.level}</span>
            {!category.isActive && <span className={styles.badge}>غیرفعال</span>}
            {!category.isVisible && <span className={styles.badge}>مخفی</span>}
          </div>
          {category.description && (
            <div className={styles.categoryDescription}>{category.description}</div>
          )}
          <div className={styles.categoryMeta}>
            <span className={styles.metaItem}>🎭 {category.mood}</span>
            {category.gradient && <span className={styles.metaItem}>🎨 گرادیانت</span>}
            <span className={styles.metaItem}>
              📊 {category.metadata?.eventsCount || 0} رویداد
            </span>
          </div>
        </div>

        {/* دکمه‌های عملیات */}
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => onCreate(category)}
            title="افزودن زیردسته"
          >
            ➕
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => onEdit(category)}
            title="ویرایش"
          >
            ✏️
          </button>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={() => onDelete(category._id, category.title)}
            title="حذف"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* زیردسته‌ها */}
      {hasChildren && isExpanded && renderChildren && (
        <div className={styles.treeChildren}>{renderChildren()}</div>
      )}
    </div>
  );
}

