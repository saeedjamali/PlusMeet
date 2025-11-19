'use client';

import { useState, useRef } from 'react';
import PersianDatePicker from '@/components/PersianDatePicker';
import styles from './eventCreate.module.css';

export default function Step4Details({ 
  formData, 
  handleChange,
  loading,
  error: parentError, 
  setError: setParentError,
  onNext, 
  onPrev 
}) {
  const [error, setError] = useState(null);
  const debounceTimerRef = useRef(null);

  const handleNestedChange = (parent, field, value) => {
    handleChange(parent, {
      ...(formData[parent] || {}),
      [field]: value,
    });
  };

  const handleDaysOfWeekToggle = (day) => {
    const currentDays = formData.schedule?.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    handleNestedChange('schedule', 'daysOfWeek', newDays);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // اعتبارسنجی
    if (!formData.schedule?.recurrence) {
      setError('لطفاً نوع تکرار رویداد را انتخاب کنید');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!formData.schedule?.startDate) {
      setError('لطفاً تاریخ شروع رویداد را انتخاب کنید');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (formData.schedule?.recurrence === 'one-time' && !formData.schedule?.endDate) {
      setError('لطفاً تاریخ پایان رویداد را انتخاب کنید');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // بررسی اینکه تاریخ پایان بعد از تاریخ شروع باشد
    if (formData.schedule?.startDate && formData.schedule?.endDate) {
      const startDate = new Date(formData.schedule.startDate);
      const endDate = new Date(formData.schedule.endDate);
      
      if (endDate <= startDate) {
        setError('تاریخ پایان باید بعد از تاریخ شروع باشد');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (formData.schedule?.recurrence === 'recurring' && (!formData.schedule?.daysOfWeek || formData.schedule.daysOfWeek.length === 0)) {
      setError('لطفاً حداقل یک روز از هفته را انتخاب کنید');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    onNext();
  };

  const isOneTime = formData.schedule?.recurrence === 'one-time';
  const isRecurring = formData.schedule?.recurrence === 'recurring';
  const isOngoing = formData.schedule?.recurrence === 'ongoing';

  const weekDays = [
    { value: 'saturday', label: 'شنبه', emoji: '🌙' },
    { value: 'sunday', label: 'یکشنبه', emoji: '☀️' },
    { value: 'monday', label: 'دوشنبه', emoji: '🌤️' },
    { value: 'tuesday', label: 'سه‌شنبه', emoji: '⭐' },
    { value: 'wednesday', label: 'چهارشنبه', emoji: '🌟' },
    { value: 'thursday', label: 'پنجشنبه', emoji: '✨' },
    { value: 'friday', label: 'جمعه', emoji: '🌺' },
  ];

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
          <span className={styles.sectionIcon}>📅</span>
          زمان برگزاری رویداد
        </h2>
        <p className={styles.sectionHint}>
          اطلاعات مربوط به زمان‌بندی و برنامه برگزاری رویداد را مشخص کنید
        </p>
      </section>

      {/* بازه زمانی برگزاری */}
      <section className={styles.section}>
        <h3 className={styles.subsectionTitle}>
          <span className={styles.sectionIcon}>⏰</span>
          بازه زمانی برگزاری
        </h3>
        <div className={styles.radioGroup}>
          <label className={styles.radioCard}>
            <input
              type="radio"
              name="eventDuration"
              value="day"
              checked={formData.schedule?.eventDuration === 'day'}
              onChange={(e) => handleNestedChange('schedule', 'eventDuration', e.target.value)}
            />
            <div className={styles.radioContent}>
              <span className={styles.radioIcon}>📆</span>
              <span className={styles.radioLabel}>یک روز</span>
              <span className={styles.radioHint}>رویداد در یک روز برگزار می‌شود</span>
            </div>
          </label>

          <label className={styles.radioCard}>
            <input
              type="radio"
              name="eventDuration"
              value="week"
              checked={formData.schedule?.eventDuration === 'week'}
              onChange={(e) => handleNestedChange('schedule', 'eventDuration', e.target.value)}
            />
            <div className={styles.radioContent}>
              <span className={styles.radioIcon}>📅</span>
              <span className={styles.radioLabel}>یک هفته</span>
              <span className={styles.radioHint}>رویداد در طول یک هفته برگزار می‌شود</span>
            </div>
          </label>

          <label className={styles.radioCard}>
            <input
              type="radio"
              name="eventDuration"
              value="month"
              checked={formData.schedule?.eventDuration === 'month'}
              onChange={(e) => handleNestedChange('schedule', 'eventDuration', e.target.value)}
            />
            <div className={styles.radioContent}>
              <span className={styles.radioIcon}>🗓️</span>
              <span className={styles.radioLabel}>یک ماه یا بیشتر</span>
              <span className={styles.radioHint}>رویداد در طول یک ماه یا بیشتر برگزار می‌شود</span>
            </div>
          </label>
        </div>
      </section>

      {/* تکرار شونده است؟ */}
      <section className={styles.section}>
        <h3 className={styles.subsectionTitle}>
          <span className={styles.sectionIcon}>🔄</span>
          تکرار شونده است؟ <span className={styles.required}>*</span>
        </h3>
        <div className={styles.radioGroup}>
          <label className={styles.radioCard}>
            <input
              type="radio"
              name="recurrence"
              value="one-time"
              checked={formData.schedule?.recurrence === 'one-time'}
              onChange={(e) => handleNestedChange('schedule', 'recurrence', e.target.value)}
              required
            />
            <div className={styles.radioContent}>
              <span className={styles.radioIcon}>🎯</span>
              <span className={styles.radioLabel}>یک‌باره</span>
              <span className={styles.radioHint}>رویداد فقط یک بار برگزار می‌شود</span>
            </div>
          </label>

          <label className={styles.radioCard}>
            <input
              type="radio"
              name="recurrence"
              value="recurring"
              checked={formData.schedule?.recurrence === 'recurring'}
              onChange={(e) => handleNestedChange('schedule', 'recurrence', e.target.value)}
            />
            <div className={styles.radioContent}>
              <span className={styles.radioIcon}>🔁</span>
              <span className={styles.radioLabel}>دوره‌ای</span>
              <span className={styles.radioHint}>رویداد به صورت تکراری برگزار می‌شود</span>
            </div>
          </label>

          <label className={styles.radioCard}>
            <input
              type="radio"
              name="recurrence"
              value="ongoing"
              checked={formData.schedule?.recurrence === 'ongoing'}
              onChange={(e) => handleNestedChange('schedule', 'recurrence', e.target.value)}
            />
            <div className={styles.radioContent}>
              <span className={styles.radioIcon}>♾️</span>
              <span className={styles.radioLabel}>مداوم</span>
              <span className={styles.radioHint}>رویداد بدون تاریخ پایان مشخص است</span>
            </div>
          </label>
        </div>
      </section>

      {/* تاریخ شروع و پایان */}
      <section className={styles.section}>
        <h3 className={styles.subsectionTitle}>
          <span className={styles.sectionIcon}>📆</span>
          تاریخ و زمان برگزاری
        </h3>

        {/* تاریخ شروع */}
        <PersianDatePicker
          label="تاریخ و ساعت شروع"
          value={formData.schedule?.startDate || ''}
          onChange={(date) => {
            // Debounce: فقط آخرین تغییر را ذخیره کن
            if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current);
            }
            
            debounceTimerRef.current = setTimeout(() => {
              // ذخیره به فرمت string فارسی - تبدیل در API انجام می‌شود
              if (date) {
                let dateString = date.format('YYYY-MM-DD HH:mm:ss');
                
                // تبدیل اعداد فارسی به انگلیسی
                const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
                const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
                persianNumbers.forEach((persian, index) => {
                  dateString = dateString.replace(new RegExp(persian, 'g'), englishNumbers[index]);
                });
                
                // فقط اگر تاریخ واقعاً تغییر کرده باشد، آپدیت کن
                if (dateString !== formData.schedule?.startDate) {
                  console.log('📅 تاریخ شروع انتخاب شده:', dateString);
                  handleNestedChange('schedule', 'startDate', dateString);
                }
              } else {
                handleNestedChange('schedule', 'startDate', '');
              }
            }, 300); // 300ms delay
          }}
          placeholder="انتخاب تاریخ و ساعت شروع"
          format="YYYY/MM/DD - HH:mm"
          timePicker={true}
          required={true}
          minDate={(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
          })()}
        />

        {/* تاریخ پایان - فقط برای یک‌باره و دوره‌ای */}
        {!isOngoing && (
          <PersianDatePicker
            label={`تاریخ و ساعت پایان${isOneTime ? ' (الزامی)' : ' (اختیاری)'}`}
            value={formData.schedule?.endDate || ''}
            onChange={(date) => {
              // Debounce: فقط آخرین تغییر را ذخیره کن
              if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
              }
              
              debounceTimerRef.current = setTimeout(() => {
                // ذخیره به فرمت string فارسی - تبدیل در API انجام می‌شود
                if (date) {
                  let dateString = date.format('YYYY-MM-DD HH:mm:ss');
                  
                  // تبدیل اعداد فارسی به انگلیسی
                  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
                  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
                  persianNumbers.forEach((persian, index) => {
                    dateString = dateString.replace(new RegExp(persian, 'g'), englishNumbers[index]);
                  });
                  
                  // فقط اگر تاریخ واقعاً تغییر کرده باشد، آپدیت کن
                  if (dateString !== formData.schedule?.endDate) {
                    console.log('📅 تاریخ پایان انتخاب شده:', dateString);
                    handleNestedChange('schedule', 'endDate', dateString);
                  }
                } else {
                  handleNestedChange('schedule', 'endDate', '');
                }
              }, 300); // 300ms delay
            }}
            placeholder="انتخاب تاریخ و ساعت پایان"
            format="YYYY/MM/DD - HH:mm"
            timePicker={true}
            required={isOneTime}
            minDate={formData.schedule?.startDate ? (() => {
              const startDate = new Date(formData.schedule.startDate);
              startDate.setHours(0, 0, 0, 0);
              return startDate;
            })() : (() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return today;
            })()}
          />
        )}
      </section>

      {/* روزهای هفته - فقط برای دوره‌ای */}
      {isRecurring && (
        <section className={styles.section}>
          <h3 className={styles.subsectionTitle}>
            <span className={styles.sectionIcon}>📋</span>
            چه روزهایی برگزار می‌شود؟ <span className={styles.required}>*</span>
          </h3>
          <p className={styles.hint}>
            روزهایی از هفته که رویداد برگزار می‌شود را انتخاب کنید
          </p>
          <div className={styles.daysOfWeekGrid}>
            {weekDays.map((day) => (
              <label
                key={day.value}
                className={`${styles.dayCard} ${
                  formData.schedule?.daysOfWeek?.includes(day.value) ? styles.dayCardSelected : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.schedule?.daysOfWeek?.includes(day.value) || false}
                  onChange={() => handleDaysOfWeekToggle(day.value)}
                  className={styles.dayCheckbox}
                />
                <span className={styles.dayEmoji}>{day.emoji}</span>
                <span className={styles.dayLabel}>{day.label}</span>
              </label>
            ))}
          </div>

          {/* مدت زمان هر نوبت */}
          <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
            <label className={styles.label}>مدت زمان هر نوبت (اختیاری)</label>
            <p className={styles.hint}>
              هر نوبت چند دقیقه طول می‌کشد؟ (مثلاً: 60، 90، 120 دقیقه)
            </p>
            <div className={styles.formRow}>
              <input
                type="number"
                min="15"
                step="15"
                className={styles.input}
                value={formData.schedule?.sessionDuration || ''}
                onChange={(e) => handleNestedChange('schedule', 'sessionDuration', parseInt(e.target.value) || 0)}
                placeholder="مثلاً: 60"
                style={{ flex: 1 }}
              />
              <span className={styles.inputAddon}>دقیقه</span>
            </div>
          </div>
        </section>
      )}

      {/* مدت زمان کلی */}
      <section className={styles.section}>
        <h3 className={styles.subsectionTitle}>
          <span className={styles.sectionIcon}>⏱️</span>
          مدت زمان کلی رویداد
        </h3>
        <div className={styles.radioGroup}>
          <label className={styles.radioCard}>
            <input
              type="radio"
              name="durationCategory"
              value="short"
              checked={formData.schedule?.durationCategory === 'short'}
              onChange={(e) => handleNestedChange('schedule', 'durationCategory', e.target.value)}
            />
            <div className={styles.radioContent}>
              <span className={styles.radioIcon}>⚡</span>
              <span className={styles.radioLabel}>کوتاه</span>
              <span className={styles.radioHint}>کمتر از 2 ساعت</span>
            </div>
          </label>

          <label className={styles.radioCard}>
            <input
              type="radio"
              name="durationCategory"
              value="medium"
              checked={formData.schedule?.durationCategory === 'medium'}
              onChange={(e) => handleNestedChange('schedule', 'durationCategory', e.target.value)}
            />
            <div className={styles.radioContent}>
              <span className={styles.radioIcon}>⏰</span>
              <span className={styles.radioLabel}>متوسط</span>
              <span className={styles.radioHint}>2 تا 6 ساعت</span>
            </div>
          </label>

          <label className={styles.radioCard}>
            <input
              type="radio"
              name="durationCategory"
              value="long"
              checked={formData.schedule?.durationCategory === 'long'}
              onChange={(e) => handleNestedChange('schedule', 'durationCategory', e.target.value)}
            />
            <div className={styles.radioContent}>
              <span className={styles.radioIcon}>🕰️</span>
              <span className={styles.radioLabel}>طولانی</span>
              <span className={styles.radioHint}>بیش از 6 ساعت</span>
            </div>
          </label>
        </div>
      </section>

      {/* دکمه‌های ناوبری */}
      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onPrev}>
          ← مرحله قبل
        </button>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'در حال پردازش...' : 'مرحله بعد →'}
        </button>
      </div>
    </form>
  );
}



