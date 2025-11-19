'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ProvinceCity from '@/components/ProvinceCity';
import styles from './eventCreate.module.css';

// Dynamic import برای Leaflet (به دلیل SSR)
const MapPicker = dynamic(() => import('./MapPicker'), {
  ssr: false,
  loading: () => (
    <div className={styles.mapPlaceholder}>
      <div className={styles.spinner}></div>
      <p>در حال بارگذاری نقشه...</p>
    </div>
  ),
});

export default function Step2Details({ 
  formData, 
  handleChange,
  loading,
  error: parentError, 
  setError: setParentError,
  formatModes,
  selectedFormatMode,
  setSelectedFormatMode,
  formatModesLoading,
  onNext, 
  onPrev 
}) {
  const [error, setError] = useState(null);

  // Debug: لاگ تغییرات formData.location
  useEffect(() => {
    console.log('🔄 formData.location updated:', formData.location);
    console.log('🏙️ formData.location.city:', formData.location?.city);
  }, [formData.location]);

  const handleFormatModeSelect = (mode) => {
    if (!mode.isActive) {
      setError(`نوع برگزاری "${mode.title}" در حال حاضر غیرفعال است`);
      return;
    }
    console.log('✅ Format Mode Selected:', mode);
    console.log('📋 Code:', mode.code);
    setSelectedFormatMode(mode);
    handleChange('formatMode', mode._id);
    setError(null);
  };

  const handleNestedChange = (parent, field, value) => {
    handleChange(parent, {
      ...(formData[parent] || {}),
      [field]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedFormatMode) {
      setError('لطفاً نوع برگزاری را انتخاب کنید');
      return;
    }

    onNext();
  };

  const isInPerson = selectedFormatMode?.code?.toUpperCase().includes('PERSON') || 
                      selectedFormatMode?.code?.toUpperCase().includes('PRESENCE') ||
                      selectedFormatMode?.code?.toUpperCase().includes('حضوری');
  const isOnline = selectedFormatMode?.code?.toUpperCase().includes('ONLINE') || 
                   selectedFormatMode?.code?.toUpperCase().includes('آنلاین');
  const isHybrid = selectedFormatMode?.code?.toUpperCase().includes('HYBRID') || 
                   selectedFormatMode?.code?.toUpperCase().includes('ترکیبی');
  
  console.log('🔍 Selected Mode:', selectedFormatMode?.title, '| Code:', selectedFormatMode?.code);
  console.log('📍 isInPerson:', isInPerson, '| isOnline:', isOnline, '| isHybrid:', isHybrid);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && (
        <div className={styles.errorBox}>
          <span>⚠️</span>
          {error}
        </div>
      )}

      {/* انتخاب نوع برگزاری */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📊</span>
          نوع برگزاری رویداد <span className={styles.required}>*</span>
        </h2>
        <p className={styles.sectionHint}>
          رویداد به چه صورتی برگزار می‌شود؟
        </p>

        {formatModesLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>در حال بارگذاری...</p>
          </div>
        ) : formatModes.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📊</span>
            <p>هیچ نوع برگزاری فعالی یافت نشد</p>
          </div>
        ) : (
          <div className={styles.compactCategoriesGrid}>
            {formatModes.map((mode) => (
              <div key={mode._id} className={styles.categoryWrapper}>
                <button
                  type="button"
                  className={`${styles.compactCategoryCard} ${
                    selectedFormatMode?._id === mode._id ? styles.compactCategoryCardSelected : ''
                  } ${!mode.isActive ? styles.compactCategoryCardDisabled : ''}`}
                  onClick={() => handleFormatModeSelect(mode)}
                  disabled={!mode.isActive}
                  title={!mode.isActive ? 'این نوع برگزاری در حال حاضر غیرفعال است' : mode.title}
                >
                  <span className={styles.compactCategoryIcon}>{mode.icon}</span>
                  <span className={styles.compactCategoryTitle}>{mode.title}</span>
                  {!mode.isActive && (
                    <span className={styles.disabledBadge}>غیرفعال</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* فیلدهای دینامیک بر اساس نوع برگزاری */}
      {(isInPerson || isHybrid) && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>📍</span>
            اطلاعات رویداد حضوری
          </h2>

          {/* استان و شهر */}
          <ProvinceCity
            province={formData.location?.province || ''}
            city={formData.location?.city || ''}
            onProvinceChange={(provinceData) => {
              console.log('🗺️ Province changed:', provinceData);
              if (provinceData) {
                const newLocation = {
                  ...formData.location,
                  province: provinceData.province_name,
                  province_code: provinceData.province_code,
                  // ذخیره مختصات استان (موقت تا شهر انتخاب شود)
                  latitude: provinceData.latitude,
                  longitude: provinceData.longitude,
                  coordinates: [provinceData.longitude, provinceData.latitude], // [lng, lat]
                  // Reset city
                  city: '',
                  city_code: ''
                };
                console.log('📍 Province location set:', newLocation);
                handleChange('location', newLocation);
              }
            }}
            onCityChange={(cityData) => {
              console.log('🏙️ City changed:', cityData);
              if (cityData) {
                const newLocation = {
                  ...formData.location,
                  city: cityData.city_name,
                  city_code: cityData.city_code,
                  latitude: cityData.latitude,
                  longitude: cityData.longitude,
                  coordinates: [cityData.longitude, cityData.latitude] // [lng, lat] برای MongoDB GeoJSON
                };
                console.log('📍 New location data:', newLocation);
                
                // Update formData.location
                handleChange('location', newLocation);
              }
            }}
            returnData={true}
            provinceRequired={isInPerson && !isHybrid}
            cityRequired={isInPerson && !isHybrid}
            showLabels={true}
          />

          {/* عنوان مکان */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              عنوان مکان (Venue Name) <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={styles.input}
              value={formData.location?.venue || ''}
              onChange={(e) => handleNestedChange('location', 'venue', e.target.value)}
              placeholder="مثلاً: کافه گالری آفتاب"
              required={isInPerson && !isHybrid}
            />
          </div>

          {/* آدرس دقیق */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              آدرس دقیق <span className={styles.required}>*</span>
            </label>
            <textarea
              className={styles.textarea}
              value={formData.location?.address || ''}
              onChange={(e) => handleNestedChange('location', 'address', e.target.value)}
              placeholder="آدرس کامل شامل خیابان، پلاک..."
              rows={3}
              required={isInPerson && !isHybrid}
            />
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.location?.hideAddressUntilApproved || false}
                onChange={(e) =>
                  handleNestedChange('location', 'hideAddressUntilApproved', e.target.checked)
                }
              />
              <span>آدرس دقیق فقط برای افراد تایید شده نمایش داده شود</span>
            </label>
          </div>

          {/* موقعیت روی نقشه */}
          <div className={styles.formGroup}>
            <label className={styles.label}>موقعیت روی نقشه</label>
            <p className={styles.hint}>
              {formData.location?.city ? 
                `نقشه روی شهر ${formData.location.city} تنظیم شده. روی نقشه کلیک کنید تا موقعیت دقیق و آدرس را دریافت کنید.` :
                formData.location?.province ?
                `نقشه روی استان ${formData.location.province} تنظیم شده. برای دقت بیشتر، شهر را انتخاب کنید.` :
                'ابتدا استان را انتخاب کنید تا نقشه روی آن تنظیم شود.'
              }
            </p>
            <MapPicker
              value={
                formData.location?.coordinates 
                  ? [formData.location.coordinates[1], formData.location.coordinates[0]] // تبدیل [lng, lat] به [lat, lng] برای Leaflet
                  : formData.location?.latitude && formData.location?.longitude
                  ? [formData.location.latitude, formData.location.longitude]
                  : [35.6892, 51.3890] // تهران (پیش‌فرض)
              }
              onChange={(coords) => {
                console.log('🎯 MapPicker onChange called:', coords);
                // تبدیل [lat, lng] به [lng, lat] برای MongoDB GeoJSON و ذخیره کامل
                const newLocation = {
                  ...formData.location,
                  coordinates: [coords[1], coords[0]], // [lng, lat]
                  latitude: coords[0],
                  longitude: coords[1]
                };
                handleChange('location', newLocation);
              }}
              selectedProvince={formData.location?.province}
              selectedCity={formData.location?.city}
              onAddressSelect={(address) => {
                console.log('📍 selectedCity prop passed to MapPicker:', formData.location?.city);
                console.log('📮 آدرس دریافت شده:', address);
                // آدرس دریافتی رو در فیلد آدرس قرار بده
                const newLocation = {
                  ...formData.location,
                  address: address
                };
                handleChange('location', newLocation);
              }}
            />
          </div>

          {/* ظرفیت */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              ظرفیت (Capacity) <span className={styles.required}>*</span>
            </label>
            <input
              type="number"
              min="1"
              className={styles.input}
              value={formData.capacity || ''}
              onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 0)}
              placeholder="حداکثر تعداد شرکت‌کننده"
              required={isInPerson && !isHybrid}
            />
          </div>

          {/* دسترسی / پارکینگ */}
          <div className={styles.formGroup}>
            <label className={styles.label}>دسترسی و امکانات</label>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" />
                <span>پارکینگ</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" />
                <span>آسانسور</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" />
                <span>مترو</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" />
                <span>دسترسی معلولین</span>
              </label>
            </div>
          </div>

          {/* موارد مورد نیاز */}
          <div className={styles.formGroup}>
            <label className={styles.label}>موارد مورد نیاز شرکت‌کنندگان</label>
            <textarea
              className={styles.textarea}
              placeholder="مثلاً: لپ‌تاپ، وسایل ورزشی، پوشش مناسب..."
              rows={3}
            />
          </div>

          {/* پروتکل‌های ایمنی */}
          <div className={styles.formGroup}>
            <label className={styles.label}>پروتکل‌های بهداشتی و ایمنی</label>
            <textarea
              className={styles.textarea}
              placeholder="نکات بهداشتی، ایمنی، یا قوانین محل..."
              rows={3}
            />
          </div>
        </section>
      )}

      {(isOnline || isHybrid) && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>💻</span>
            اطلاعات رویداد آنلاین
          </h2>

          {/* پلتفرم */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              پلتفرم برگزاری <span className={styles.required}>*</span>
            </label>
            <select
              className={styles.input}
              value={formData.onlinePlatform || ''}
              onChange={(e) => handleChange('onlinePlatform', e.target.value)}
              required={isOnline && !isHybrid}
            >
              <option value="">انتخاب کنید...</option>
              <option value="zoom">Zoom</option>
              <option value="google_meet">Google Meet</option>
              <option value="microsoft_teams">Microsoft Teams</option>
              <option value="instagram_live">Instagram Live</option>
              <option value="custom">سایر</option>
            </select>
          </div>

          {/* لینک دسترسی */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              لینک دسترسی (URL) <span className={styles.required}>*</span>
            </label>
            <input
              type="url"
              className={styles.input}
              value={formData.onlineLink || ''}
              onChange={(e) => handleChange('onlineLink', e.target.value)}
              placeholder="https://zoom.us/j/..."
              required={isOnline && !isHybrid}
            />
          </div>

          {/* ظرفیت آنلاین */}
          <div className={styles.formGroup}>
            <label className={styles.label}>ظرفیت</label>
            <div className={styles.formRow}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="onlineCapacityType"
                  checked={!formData.capacity}
                  onChange={() => handleChange('capacity', null)}
                />
                <span>نامحدود</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="onlineCapacityType"
                  checked={!!formData.capacity}
                  onChange={() => handleChange('capacity', 100)}
                />
                <span>محدود</span>
              </label>
            </div>
            {formData.capacity && (
              <input
                type="number"
                min="1"
                className={styles.input}
                value={formData.capacity || ''}
                onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 0)}
                placeholder="حداکثر تعداد"
              />
            )}
          </div>

          {/* رمز ورود */}
          <div className={styles.formGroup}>
            <label className={styles.label}>رمز ورود (اختیاری)</label>
            <input
              type="text"
              className={styles.input}
              placeholder="در صورت محافظت شدن جلسه"
            />
          </div>

          {/* پشتیبان فنی */}
          <div className={styles.formGroup}>
            <label className={styles.label}>پشتیبان فنی</label>
            <input
              type="email"
              className={styles.input}
              placeholder="ایمیل یا شماره تماس پشتیبانی"
            />
          </div>

          {/* نوع محتوا */}
          <div className={styles.formGroup}>
            <label className={styles.label}>نوع محتوا</label>
            <div className={styles.formRow}>
              <label className={styles.radioLabel}>
                <input type="radio" name="contentType" defaultChecked />
                <span>پخش زنده (Live)</span>
              </label>
              <label className={styles.radioLabel}>
                <input type="radio" name="contentType" />
                <span>ضبط شده (Recorded)</span>
              </label>
            </div>
          </div>
        </section>
      )}

      {/* دکمه‌های ناوبری */}
      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onPrev}>
          ← مرحله قبل
        </button>
        <button type="submit" className={styles.submitBtn}>
          مرحله بعد →
        </button>
      </div>
    </form>
  );
}

