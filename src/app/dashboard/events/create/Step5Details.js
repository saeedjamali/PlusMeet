'use client';

import { useState } from 'react';
import styles from './eventCreate.module.css';

export default function Step5Details({ 
  formData, 
  handleChange,
  loading,
  error: parentError, 
  setError: setParentError,
  selectedParticipationType,
  onPrev, 
  onNext 
}) {
  const [error, setError] = useState(null);
  
  // چک کردن اینکه آیا نحوه شرکت "دعوتی" است یا نه
  const isInviteOnly = selectedParticipationType?.code?.toUpperCase().includes('INVITE');

  const handleNestedChange = (parent, field, value) => {
    handleChange(parent, {
      ...(formData[parent] || {}),
      [field]: value,
    });
  };

  const handleArrayToggle = (parent, field, value) => {
    const currentArray = formData[parent]?.[field] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    handleNestedChange(parent, field, newArray);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // اعتبارسنجی
    if (!formData.visibility?.level) {
      setError('لطفاً سطح نمایش رویداد را انتخاب کنید');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!formData.eligibility || formData.eligibility.length === 0) {
      setError('لطفاً حداقل یک گروه کاربری مجاز را انتخاب کنید');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // رفتن به مرحله بعد
    onNext();
  };

  const visibilityLevels = [
    {
      value: 'public',
      icon: '🌍',
      title: 'عمومی (Public)',
      description: 'رویداد در همه جستجوها، نقشه و فید نمایش داده می‌شود',
      audience: 'همه کاربران (حتی مهمان‌ها)',
    },
    {
      value: 'unlisted',
      icon: '🔗',
      title: 'نیمه‌خصوصی (Unlisted)',
      description: 'در جستجو ظاهر نمی‌شود ولی با لینک مستقیم قابل مشاهده است',
      audience: 'فقط دارندگان لینک',
    },
    {
      value: 'private',
      icon: '🔒',
      title: 'خصوصی (Invite-only)',
      description: 'فقط دعوت‌شدگان رویداد را در لیست و فید خود می‌بینند',
      audience: 'افراد دارای لینک دعوت خصوصی',
    },
  ];

  const eligibilityOptions = [
    {
      value: 'active',
      icon: '✅',
      title: 'کاربران فعال (Active)',
      description: 'کاربرانی که حساب فعال دارند',
      badge: 'پایه',
    },
    {
      value: 'verified',
      icon: '🎖️',
      title: 'کاربران تأیید شده (Verified)',
      description: 'کاربرانی که هویت‌شان تأیید شده است (شامل فعال‌ها)',
      badge: 'محدود',
    },
  ];

  const genderOptions = [
    { value: 'all', label: 'همه', icon: '👥' },
    { value: 'male', label: 'مرد', icon: '👨' },
    { value: 'female', label: 'زن', icon: '👩' },
  ];

  const ageRanges = [
    { value: 'all', label: 'همه سنین', icon: '🎂' },
    { value: '0-17', label: '۰-۱۷ (نوجوان)', icon: '🧒' },
    { value: '18-25', label: '۱۸-۲۵ (جوان)', icon: '🧑' },
    { value: '26-35', label: '۲۶-۳۵ (بزرگسال)', icon: '👤' },
    { value: '36-50', label: '۳۶-۵۰ (میانسال)', icon: '👔' },
    { value: '51+', label: '۵۱+ (مسن)', icon: '👴' },
  ];

  const educationLevels = [
    { value: 'all', label: 'همه سطوح', icon: '📚' },
    { value: 'diploma', label: 'دیپلم و پایین‌تر', icon: '📖' },
    { value: 'associate', label: 'فوق دیپلم / کاردانی', icon: '📘' },
    { value: 'bachelor', label: 'لیسانس', icon: '🎓' },
    { value: 'master', label: 'فوق لیسانس', icon: '🎓' },
    { value: 'phd', label: 'دکتری', icon: '🎓' },
  ];

  const skillLevels = [
    { value: 'all', label: 'همه سطوح', icon: '⭐' },
    { value: 'beginner', label: 'مبتدی', icon: '🌱' },
    { value: 'intermediate', label: 'متوسط', icon: '🌿' },
    { value: 'advanced', label: 'پیشرفته', icon: '🌳' },
    { value: 'expert', label: 'حرفه‌ای / متخصص', icon: '🏆' },
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
          <span className={styles.sectionIcon}>🔐</span>
          نمایش و دسترسی
        </h2>
        <p className={styles.sectionHint}>
          مشخص کنید رویداد برای چه افرادی نمایش داده شود و چه کسانی می‌توانند در آن شرکت کنند
        </p>
      </section>

      {/* سطح نمایش رویداد */}
      <section className={styles.section}>
        <h3 className={styles.subsectionTitle}>
          <span className={styles.sectionIcon}>👁️</span>
          سطح نمایش رویداد <span className={styles.required}>*</span>
        </h3>
        <p className={styles.hint}>
          رویداد برای چه کسانی قابل مشاهده است؟
        </p>
        
        {!isInviteOnly && (
          <div className={styles.warningBox}>
            <span>ℹ️</span>
            <span>
              گزینه "خصوصی" فقط زمانی قابل انتخاب است که نحوه شرکت در مرحله ۳ بصورت "دعوتی" انتخاب شده باشد.
            </span>
          </div>
        )}

        <div className={styles.visibilityCardsGrid}>
          {visibilityLevels.map((level) => {
            // گزینه "خصوصی" فقط برای نحوه شرکت "دعوتی" فعال است
            const isDisabled = level.value === 'private' && !isInviteOnly;
            
            return (
              <label
                key={level.value}
                className={`${styles.visibilityCard} ${
                  formData.visibility?.level === level.value ? styles.visibilityCardSelected : ''
                } ${isDisabled ? styles.visibilityCardDisabled : ''}`}
                title={isDisabled ? 'این گزینه فقط برای رویدادهای دعوتی قابل انتخاب است' : ''}
              >
                <input
                  type="radio"
                  name="visibilityLevel"
                  value={level.value}
                  checked={formData.visibility?.level === level.value}
                  onChange={(e) => handleNestedChange('visibility', 'level', e.target.value)}
                  required
                  disabled={isDisabled}
                  className={styles.hiddenRadio}
                />
                <div className={styles.visibilityCardHeader}>
                  <span className={styles.visibilityIcon}>{level.icon}</span>
                  <h4 className={styles.visibilityTitle}>{level.title}</h4>
                  {isDisabled && (
                    <span className={styles.disabledBadge}>🔒</span>
                  )}
                </div>
                <p className={styles.visibilityDescription}>{level.description}</p>
                <div className={styles.visibilityAudience}>
                  <span className={styles.audienceIcon}>👤</span>
                  <span className={styles.audienceText}>{level.audience}</span>
                </div>
                {isDisabled && (
                  <div className={styles.disabledReason}>
                    برای فعال‌سازی، نحوه شرکت را در مرحله ۳ "دعوتی" انتخاب کنید
                  </div>
                )}
              </label>
            );
          })}
        </div>
      </section>

      {/* چه افرادی میتوانند درخواست بدهند */}
      <section className={styles.section}>
        <h3 className={styles.subsectionTitle}>
          <span className={styles.sectionIcon}>🎟️</span>
          چه افرادی می‌توانند درخواست شرکت بدهند؟ <span className={styles.required}>*</span>
        </h3>
        <p className={styles.hint}>
          حداقل یک گروه کاربری را انتخاب کنید
        </p>

        <div className={styles.eligibilityGrid}>
          {eligibilityOptions.map((option) => (
            <label
              key={option.value}
              className={`${styles.eligibilityCard} ${
                formData.eligibility?.includes(option.value) ? styles.eligibilityCardSelected : ''
              }`}
            >
              <input
                type="checkbox"
                checked={formData.eligibility?.includes(option.value) || false}
                onChange={() => {
                  const currentEligibility = formData.eligibility || [];
                  const newEligibility = currentEligibility.includes(option.value)
                    ? currentEligibility.filter(item => item !== option.value)
                    : [...currentEligibility, option.value];
                  handleChange('eligibility', newEligibility);
                }}
                className={styles.hiddenCheckbox}
              />
              <div className={styles.eligibilityCardHeader}>
                <span className={styles.eligibilityIcon}>{option.icon}</span>
                <div className={styles.eligibilityBadge}>{option.badge}</div>
              </div>
              <h4 className={styles.eligibilityTitle}>{option.title}</h4>
              <p className={styles.eligibilityDescription}>{option.description}</p>
            </label>
          ))}
        </div>
      </section>

      {/* مشخصات شرکت‌کنندگان (توصیه‌ای) */}
      <section className={styles.section}>
        <h3 className={styles.subsectionTitle}>
          <span className={styles.sectionIcon}>👥</span>
          مشخصات پیشنهادی شرکت‌کنندگان
          <span className={styles.optionalBadge}>اختیاری</span>
        </h3>
        <p className={styles.hint}>
          این اطلاعات به کاربران کمک می‌کند تا بدانند آیا این رویداد برای آن‌ها مناسب است یا خیر
        </p>

        {/* جنسیت */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <span className={styles.labelIcon}>⚧️</span>
            جنسیت
          </label>
          <div className={styles.compactGrid}>
            {genderOptions.map((option) => (
              <label
                key={option.value}
                className={`${styles.compactCard} ${
                  formData.targetAudience?.gender === option.value ? styles.compactCardSelected : ''
                }`}
              >
                <input
                  type="radio"
                  name="targetGender"
                  value={option.value}
                  checked={formData.targetAudience?.gender === option.value}
                  onChange={(e) => handleNestedChange('targetAudience', 'gender', e.target.value)}
                  className={styles.hiddenRadio}
                />
                <span className={styles.compactIcon}>{option.icon}</span>
                <span className={styles.compactLabel}>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* بازه سنی */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <span className={styles.labelIcon}>🎂</span>
            بازه سنی
          </label>
          <div className={styles.checkboxCardsGrid}>
            {ageRanges.map((range) => (
              <label
                key={range.value}
                className={`${styles.checkboxCard} ${
                  formData.targetAudience?.ageRanges?.includes(range.value) ? styles.checkboxCardSelected : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.targetAudience?.ageRanges?.includes(range.value) || false}
                  onChange={() => handleArrayToggle('targetAudience', 'ageRanges', range.value)}
                  className={styles.hiddenCheckbox}
                />
                <span className={styles.checkboxIcon}>{range.icon}</span>
                <span className={styles.checkboxLabel}>{range.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* سطح تحصیلات */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <span className={styles.labelIcon}>🎓</span>
            سطح تحصیلات
          </label>
          <div className={styles.checkboxCardsGrid}>
            {educationLevels.map((level) => (
              <label
                key={level.value}
                className={`${styles.checkboxCard} ${
                  formData.targetAudience?.educationLevels?.includes(level.value) ? styles.checkboxCardSelected : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.targetAudience?.educationLevels?.includes(level.value) || false}
                  onChange={() => handleArrayToggle('targetAudience', 'educationLevels', level.value)}
                  className={styles.hiddenCheckbox}
                />
                <span className={styles.checkboxIcon}>{level.icon}</span>
                <span className={styles.checkboxLabel}>{level.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* سطح مهارت */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <span className={styles.labelIcon}>🏅</span>
            سطح مهارت
          </label>
          <p className={styles.hint}>
            سطح دانش یا مهارت مورد نیاز برای شرکت در این رویداد
          </p>
          <div className={styles.checkboxCardsGrid}>
            {skillLevels.map((level) => (
              <label
                key={level.value}
                className={`${styles.checkboxCard} ${
                  formData.targetAudience?.skillLevels?.includes(level.value) ? styles.checkboxCardSelected : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.targetAudience?.skillLevels?.includes(level.value) || false}
                  onChange={() => handleArrayToggle('targetAudience', 'skillLevels', level.value)}
                  className={styles.hiddenCheckbox}
                />
                <span className={styles.checkboxIcon}>{level.icon}</span>
                <span className={styles.checkboxLabel}>{level.label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* اطلاعات تماس */}
      <section className={styles.section}>
        <h3 className={styles.subsectionTitle}>
          <span className={styles.sectionIcon}>📞</span>
          اطلاعات تماس
        </h3>
        <p className={styles.hint}>
          شماره تماس و ایمیلی که برای شرکت‌کنندگان نمایش داده می‌شود (اختیاری)
        </p>

        <div className={styles.formGroup}>
          <label className={styles.label}>شماره تماس</label>
          <input
            type="tel"
            className={styles.input}
            value={formData.contactInfo?.phone || ''}
            onChange={(e) => handleNestedChange('contactInfo', 'phone', e.target.value)}
            placeholder="09123456789"
            pattern="[0-9]{11}"
            maxLength={11}
          />
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={formData.contactInfo?.showPhone || false}
              onChange={(e) => handleNestedChange('contactInfo', 'showPhone', e.target.checked)}
            />
            <span>نمایش شماره تماس به صورت عمومی</span>
          </label>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>ایمیل تماس</label>
          <input
            type="email"
            className={styles.input}
            value={formData.contactInfo?.email || ''}
            onChange={(e) => handleNestedChange('contactInfo', 'email', e.target.value)}
            placeholder="contact@example.com"
          />
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={formData.contactInfo?.showEmail !== false} // پیش‌فرض true
              onChange={(e) => handleNestedChange('contactInfo', 'showEmail', e.target.checked)}
            />
            <span>نمایش ایمیل به صورت عمومی</span>
          </label>
        </div>
      </section>

      {/* تنظیمات گروه چت */}
      <section className={styles.section}>
        <h3 className={styles.subsectionTitle}>
          <span className={styles.sectionIcon}>💬</span>
          گروه چت رویداد
          <span className={styles.optional}>(اختیاری)</span>
        </h3>
        <p className={styles.hint}>
          ایجاد گروه چت برای تعامل شرکت‌کنندگان و مدیریت بهتر رویداد
        </p>

        <div className={styles.groupChatOption}>
          <label className={styles.groupChatLabel}>
            <input
              type="checkbox"
              checked={formData.createGroupChat || false}
              onChange={(e) => handleChange('createGroupChat', e.target.checked)}
              className={styles.groupChatCheckbox}
            />
            <div className={styles.groupChatContent}>
              <div className={styles.groupChatTitle}>
                <span className={styles.groupChatIcon}>💬</span>
                <span>ایجاد گروه چت برای این رویداد</span>
              </div>
              <p className={styles.groupChatDescription}>
                با فعال کردن این گزینه، یک گروه چت اختصاصی برای رویداد شما ایجاد می‌شود. 
                شرکت‌کنندگان می‌توانند در این گروه با یکدیگر و با شما به عنوان مدیر گفتگو کنند.
              </p>
            </div>
          </label>

          {formData.createGroupChat && (
            <div className={styles.groupChatInfo}>
              <div className={styles.infoBox}>
                <span className={styles.infoIcon}>ℹ️</span>
                <div className={styles.infoContent}>
                  <strong>نکته:</strong> گروه چت بعد از تایید رویداد توسط مدیر سایت ساخته می‌شود. 
                  شما به عنوان مالک رویداد، مدیر کامل گروه خواهید بود و می‌توانید:
                  <ul>
                    <li>گروه را عمومی یا خصوصی کنید</li>
                    <li>اعضا را مدیریت کنید (افزودن، حذف، مسدود کردن)</li>
                    <li>گروه را در هر زمان ببندید یا باز کنید</li>
                    <li>پیام‌ها را پین یا حذف کنید</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* تنظیمات گواهی‌نامه */}
      <section className={styles.section}>
        <h3 className={styles.subsectionTitle}>
          <span className={styles.sectionIcon}>🏆</span>
          گواهی‌نامه شرکت در رویداد
          <span className={styles.optional}>(اختیاری)</span>
        </h3>
        <p className={styles.hint}>
          صدور گواهی‌نامه دیجیتال برای شرکت‌کنندگان پس از اتمام رویداد
        </p>

        <div className={styles.groupChatOption}>
          <label className={styles.groupChatLabel}>
            <input
              type="checkbox"
              checked={formData.hasCertificate || false}
              onChange={(e) => handleChange('hasCertificate', e.target.checked)}
              className={styles.groupChatCheckbox}
            />
            <div className={styles.groupChatContent}>
              <div className={styles.groupChatTitle}>
                <span className={styles.groupChatIcon}>🏆</span>
                <span>صدور گواهی‌نامه برای شرکت‌کنندگان</span>
              </div>
              <p className={styles.groupChatDescription}>
                با فعال کردن این گزینه، شرکت‌کنندگانی که در رویداد حضور داشته‌اند می‌توانند 
                گواهی‌نامه دیجیتال دریافت کنند. این گواهی‌نامه شامل اطلاعات رویداد و شرکت‌کننده خواهد بود.
              </p>
            </div>
          </label>

          {formData.hasCertificate && (
            <div className={styles.groupChatInfo}>
              <div className={styles.certificateSettings}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    عنوان گواهی‌نامه
                    <span className={styles.optional}>(اختیاری)</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.certificateSettings?.title || ''}
                    onChange={(e) => handleNestedChange('certificateSettings', 'title', e.target.value)}
                    placeholder="مثلاً: گواهی شرکت در کارگاه آموزشی React"
                  />
                  <p className={styles.inputHint}>
                    اگر خالی بگذارید، به صورت خودکار از عنوان رویداد استفاده می‌شود
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    نام صادرکننده
                    <span className={styles.optional}>(اختیاری)</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.certificateSettings?.issuerName || ''}
                    onChange={(e) => handleNestedChange('certificateSettings', 'issuerName', e.target.value)}
                    placeholder="مثلاً: موسسه آموزشی پلاس میت"
                  />
                  <p className={styles.inputHint}>
                    نام سازمان یا موسسه صادرکننده گواهی‌نامه
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    حداقل درصد حضور برای دریافت گواهی
                  </label>
                  <div className={styles.rangeGroup}>
                    <input
                      type="range"
                      className={styles.rangeInput}
                      min="0"
                      max="100"
                      step="5"
                      value={formData.certificateSettings?.minAttendancePercent || 80}
                      onChange={(e) => handleNestedChange('certificateSettings', 'minAttendancePercent', parseInt(e.target.value))}
                    />
                    <span className={styles.rangeValue}>
                      {formData.certificateSettings?.minAttendancePercent || 80}%
                    </span>
                  </div>
                  <p className={styles.inputHint}>
                    شرکت‌کنندگان باید حداقل این درصد از جلسات را حضور داشته باشند
                  </p>
                </div>

                <div className={styles.checkboxOption}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.certificateSettings?.requiresCompletion !== false}
                      onChange={(e) => handleNestedChange('certificateSettings', 'requiresCompletion', e.target.checked)}
                    />
                    <span>
                      فقط بعد از اتمام کامل رویداد گواهی‌نامه صادر شود
                    </span>
                  </label>
                </div>
              </div>

              <div className={styles.infoBox}>
                <span className={styles.infoIcon}>ℹ️</span>
                <div className={styles.infoContent}>
                  <strong>نکته:</strong> گواهی‌نامه به صورت خودکار برای شرکت‌کنندگان واجد شرایط صادر می‌شود. 
                  شرایط دریافت گواهی‌نامه:
                  <ul>
                    <li>وضعیت شرکت‌کننده: "شرکت کرده" (ATTENDED) یا "تکمیل شده" (COMPLETED)</li>
                    <li>حضور حداقل {formData.certificateSettings?.minAttendancePercent || 80}% جلسات</li>
                    <li>
                      {formData.certificateSettings?.requiresCompletion !== false 
                        ? 'رویداد به صورت کامل پایان یافته باشد' 
                        : 'بدون نیاز به اتمام کامل رویداد'}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* دکمه‌های ناوبری */}
      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onPrev}>
          ← مرحله قبل
        </button>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          مرحله بعد →
        </button>
      </div>
    </form>
  );
}

