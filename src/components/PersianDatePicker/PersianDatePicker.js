'use client';

import { useState, useEffect } from 'react';
import DatePicker from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/colors/yellow.css";
import styles from './PersianDatePicker.module.css';

export default function PersianDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  format = "YYYY/MM/DD HH:mm",
  timePicker = true,
  disabled = false,
  minDate = null,
  maxDate = null,
  required = false,
  label = null,
}) {
  const [mounted, setMounted] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // برای نمایش initial value در صفحه ویرایش (فقط یکبار)
  useEffect(() => {
    if (value && !hasInitialized) {
      setDisplayValue(value);
      setHasInitialized(true);
    }
  }, [value, hasInitialized]);

  if (!mounted) {
    return (
      <div className={styles.placeholder}>
        <input
          type="text"
          className={styles.input}
          placeholder={placeholder}
          disabled
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <DatePicker
        value={displayValue || ''}
        onChange={(date) => {
          setDisplayValue(date);
          if (onChange) {
            onChange(date);
          }
        }}
        calendar={persian}
        locale={persian_fa}
        format={format}
        placeholder={placeholder}
        calendarPosition="bottom-right"
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        className="yellow"
        containerClassName={styles.datePickerContainer}
        inputClass={styles.dateInput}
        plugins={timePicker ? [<TimePicker position="bottom" />] : []}
        editable={false}
      />
    </div>
  );
}











