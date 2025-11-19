'use client';

import { useState } from 'react';
import styles from './MultiSelectFilter.module.css';

export default function MultiSelectFilter({
  label,
  options,
  selectedValues = [],
  onChange,
  placeholder = 'انتخاب کنید...',
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      
      <div className={styles.selectWrapper}>
        <button
          type="button"
          className={styles.selectButton}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={styles.selectText}>
            {selectedValues.length > 0
              ? `${selectedValues.length} مورد انتخاب شده`
              : placeholder}
          </span>
          <span className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`}>
            ▼
          </span>
        </button>

        {isOpen && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownHeader}>
              <span className={styles.dropdownTitle}>
                {selectedValues.length} مورد انتخاب شده
              </span>
              {selectedValues.length > 0 && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={handleClear}
                >
                  پاک کردن همه
                </button>
              )}
            </div>

            <div className={styles.optionsList}>
              {options.length === 0 ? (
                <div className={styles.emptyMessage}>موردی یافت نشد</div>
              ) : (
                options.map((option) => {
                  const value = option.value || option._id || option.code || option;
                  const displayLabel = option.label || option.title || option.name || option;
                  const isSelected = selectedValues.includes(value);

                  return (
                    <label
                      key={value}
                      className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(value)}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkmark}>
                        {isSelected && '✓'}
                      </span>
                      <span className={styles.optionLabel}>{displayLabel}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

