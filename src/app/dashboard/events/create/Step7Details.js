'use client';

import { useState } from 'react';
import styles from './eventCreate.module.css';

export default function Step7Details({ 
  formData, 
  loading,
  error: parentError, 
  setError: setParentError,
  selectedCategory,
  selectedSubcategory,
  selectedFormatMode,
  selectedParticipationType,
  onPrev, 
  onSubmit 
}) {
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
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
          <span className={styles.sectionIcon}>👁️</span>
          پیش‌نمایش و ثبت نهایی
        </h2>
        <p className={styles.sectionHint}>
          لطفاً اطلاعات رویداد خود را بررسی کنید. در صورت نیاز می‌توانید به مراحل قبل بازگردید و تغییرات را اعمال کنید.
        </p>
      </section>

      {/* مرحله 1: اطلاعات عمومی */}
      <section className={styles.previewSection}>
        <h3 className={styles.previewSectionTitle}>
          <span className={styles.previewStepNumber}>1</span>
          اطلاعات عمومی
        </h3>
        <div className={styles.previewContent}>
          <div className={styles.previewRow}>
            <span className={styles.previewLabel}>دسته‌بندی موضوع:</span>
            <span className={styles.previewValue}>
              {selectedCategory?.icon} {selectedCategory?.title}
              {selectedSubcategory && ` > ${selectedSubcategory.icon} ${selectedSubcategory.title}`}
            </span>
          </div>
          <div className={styles.previewRow}>
            <span className={styles.previewLabel}>عنوان رویداد:</span>
            <span className={styles.previewValue}>{formData.title}</span>
          </div>
          <div className={styles.previewRow}>
            <span className={styles.previewLabel}>توضیحات:</span>
            <span className={styles.previewValue}>{formData.description}</span>
          </div>
          {formData.images && formData.images.length > 0 && (
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>تصاویر:</span>
              <div className={styles.previewImages}>
                {formData.images.slice(0, 3).map((img, index) => (
                  <img
                    key={index}
                    src={img.url}
                    alt={img.alt}
                    className={styles.previewImageThumbnail}
                  />
                ))}
                {formData.images.length > 3 && (
                  <span className={styles.previewImagesMore}>
                    +{formData.images.length - 3} تصویر دیگر
                  </span>
                )}
              </div>
            </div>
          )}
          {formData.coverImage && (
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>تصویر کاور:</span>
              <img src={formData.coverImage} alt="Cover" className={styles.previewCoverImage} />
            </div>
          )}
        </div>
      </section>

      {/* مرحله 2: نوع برگزاری */}
      <section className={styles.previewSection}>
        <h3 className={styles.previewSectionTitle}>
          <span className={styles.previewStepNumber}>2</span>
          نوع برگزاری
        </h3>
        <div className={styles.previewContent}>
          <div className={styles.previewRow}>
            <span className={styles.previewLabel}>نوع برگزاری:</span>
            <span className={styles.previewValue}>
              {selectedFormatMode?.icon} {selectedFormatMode?.title}
            </span>
          </div>
          {formData.location?.venue && (
            <>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>مکان:</span>
                <span className={styles.previewValue}>
                  {formData.location.venue}, {formData.location.city}, {formData.location.province}
                </span>
              </div>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>آدرس:</span>
                <span className={styles.previewValue}>{formData.location.address}</span>
              </div>
            </>
          )}
          {formData.onlinePlatform && (
            <>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>پلتفرم:</span>
                <span className={styles.previewValue}>{formData.onlinePlatform}</span>
              </div>
              {formData.onlineLink && (
                <div className={styles.previewRow}>
                  <span className={styles.previewLabel}>لینک:</span>
                  <span className={styles.previewValue}>{formData.onlineLink}</span>
                </div>
              )}
            </>
          )}
          {formData.capacity && (
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>ظرفیت:</span>
              <span className={styles.previewValue}>{formData.capacity} نفر</span>
            </div>
          )}
        </div>
      </section>

      {/* مرحله 3: نحوه شرکت */}
      <section className={styles.previewSection}>
        <h3 className={styles.previewSectionTitle}>
          <span className={styles.previewStepNumber}>3</span>
          نحوه شرکت
        </h3>
        <div className={styles.previewContent}>
          <div className={styles.previewRow}>
            <span className={styles.previewLabel}>نحوه شرکت:</span>
            <span className={styles.previewValue}>
              {selectedParticipationType?.icon} {selectedParticipationType?.title}
            </span>
          </div>
          {formData.ticket?.type && (
            <>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>نوع بلیت:</span>
                <span className={styles.previewValue}>
                  {formData.ticket.type === 'free' ? '🆓 رایگان' : 
                   formData.ticket.type === 'paid' ? '💰 پولی' : '🎟️ ترکیبی'}
                </span>
              </div>
              {formData.ticket.price > 0 && (
                <div className={styles.previewRow}>
                  <span className={styles.previewLabel}>قیمت:</span>
                  <span className={styles.previewValue}>{formData.ticket.price.toLocaleString()} تومان</span>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* مرحله 4: زمان برگزاری */}
      <section className={styles.previewSection}>
        <h3 className={styles.previewSectionTitle}>
          <span className={styles.previewStepNumber}>4</span>
          زمان برگزاری
        </h3>
        <div className={styles.previewContent}>
          <div className={styles.previewRow}>
            <span className={styles.previewLabel}>بازه زمانی:</span>
            <span className={styles.previewValue}>
              {formData.schedule?.eventDuration === 'day' ? '📆 یک روز' :
               formData.schedule?.eventDuration === 'week' ? '📅 یک هفته' : '🗓️ یک ماه یا بیشتر'}
            </span>
          </div>
          <div className={styles.previewRow}>
            <span className={styles.previewLabel}>نوع تکرار:</span>
            <span className={styles.previewValue}>
              {formData.schedule?.recurrence === 'one-time' ? '🎯 یک‌باره' :
               formData.schedule?.recurrence === 'recurring' ? '🔁 دوره‌ای' : '♾️ مداوم'}
            </span>
          </div>
          {formData.schedule?.startDate && (
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>تاریخ شروع:</span>
              <span className={styles.previewValue}>{formData.schedule.startDate}</span>
            </div>
          )}
          {formData.schedule?.endDate && (
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>تاریخ پایان:</span>
              <span className={styles.previewValue}>{formData.schedule.endDate}</span>
            </div>
          )}
        </div>
      </section>

      {/* مرحله 5: نمایش و دسترسی */}
      <section className={styles.previewSection}>
        <h3 className={styles.previewSectionTitle}>
          <span className={styles.previewStepNumber}>5</span>
          نمایش و دسترسی
        </h3>
        <div className={styles.previewContent}>
          <div className={styles.previewRow}>
            <span className={styles.previewLabel}>سطح نمایش:</span>
            <span className={styles.previewValue}>
              {formData.visibility?.level === 'public' ? '🌍 عمومی' :
               formData.visibility?.level === 'unlisted' ? '🔗 نیمه‌خصوصی' : '🔒 خصوصی'}
            </span>
          </div>
          <div className={styles.previewRow}>
            <span className={styles.previewLabel}>واجد شرایط:</span>
            <span className={styles.previewValue}>
              {formData.eligibility?.includes('verified') ? '🎖️ کاربران تأیید شده' : '✅ کاربران فعال'}
            </span>
          </div>
          {formData.targetAudience?.gender && formData.targetAudience.gender !== 'all' && (
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>جنسیت:</span>
              <span className={styles.previewValue}>
                {formData.targetAudience.gender === 'male' ? '👨 مرد' : '👩 زن'}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* سخنران‌ها و اطلاعات تماس */}
      {((formData.speakers && formData.speakers.length > 0) || 
        (formData.contactInfo?.phone || formData.contactInfo?.email)) && (
        <section className={styles.previewSection}>
          <h3 className={styles.previewSectionTitle}>
            <span className={styles.previewStepNumber}>📞</span>
            اطلاعات تکمیلی
          </h3>
          <div className={styles.previewContent}>
            {/* سخنران‌ها */}
            {formData.speakers && formData.speakers.length > 0 && (
              <div className={styles.previewFullWidth}>
                <span className={styles.previewLabel}>🎤 سخنران‌ها / منتورها / مجری‌ها:</span>
                <div className={styles.speakersPreviewList}>
                  {formData.speakers.map((speaker, index) => (
                    <div key={index} className={styles.speakerPreviewCard}>
                      {speaker.image && (
                        <img 
                          src={speaker.image} 
                          alt={speaker.name} 
                          className={styles.speakerPreviewImage}
                        />
                      )}
                      <div className={styles.speakerPreviewInfo}>
                        <div className={styles.speakerPreviewHeader}>
                          <strong className={styles.speakerPreviewName}>{speaker.name}</strong>
                          {speaker.role && (
                            <span className={styles.speakerPreviewRole}>{speaker.role}</span>
                          )}
                        </div>
                        {speaker.bio && (
                          <p className={styles.speakerPreviewBio}>{speaker.bio}</p>
                        )}
                        {speaker.socialLinks && Object.keys(speaker.socialLinks).length > 0 && (
                          <div className={styles.speakerPreviewSocial}>
                            {speaker.socialLinks.twitter && (
                              <a href={speaker.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                                🐦 Twitter
                              </a>
                            )}
                            {speaker.socialLinks.linkedin && (
                              <a href={speaker.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                                💼 LinkedIn
                              </a>
                            )}
                            {speaker.socialLinks.github && (
                              <a href={speaker.socialLinks.github} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                                💻 GitHub
                              </a>
                            )}
                            {speaker.socialLinks.website && (
                              <a href={speaker.socialLinks.website} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                                🌐 وبسایت
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* اطلاعات تماس */}
            {formData.contactInfo?.phone && (
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>📱 شماره تماس:</span>
                <span className={styles.previewValue}>
                  {formData.contactInfo.phone}
                  {formData.contactInfo.showPhone ? (
                    <span className={styles.publicBadge}>✅ نمایش عمومی</span>
                  ) : (
                    <span className={styles.privateBadge}>🔒 خصوصی</span>
                  )}
                </span>
              </div>
            )}
            {formData.contactInfo?.email && (
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>📧 ایمیل تماس:</span>
                <span className={styles.previewValue}>
                  {formData.contactInfo.email}
                  {formData.contactInfo.showEmail !== false ? (
                    <span className={styles.publicBadge}>✅ نمایش عمومی</span>
                  ) : (
                    <span className={styles.privateBadge}>🔒 خصوصی</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* گروه چت و گواهی‌نامه */}
      {(formData.createGroupChat || formData.hasCertificate) && (
        <section className={styles.previewSection}>
          <h3 className={styles.previewSectionTitle}>
            <span className={styles.previewStepNumber}>⚙️</span>
            تنظیمات پیشرفته
          </h3>
          <div className={styles.previewContent}>
            {/* گروه چت */}
            {formData.createGroupChat && (
              <div className={styles.previewFeatureBox}>
                <div className={styles.previewFeatureIcon}>💬</div>
                <div className={styles.previewFeatureContent}>
                  <strong>گروه چت رویداد</strong>
                  <p>گروه چت بعد از تایید رویداد به صورت خودکار ساخته می‌شود و تمام شرکت‌کنندگان فعال می‌توانند در آن عضو شوند.</p>
                </div>
              </div>
            )}
            
            {/* گواهی‌نامه */}
            {formData.hasCertificate && (
              <div className={styles.previewFeatureBox}>
                <div className={styles.previewFeatureIcon}>🏆</div>
                <div className={styles.previewFeatureContent}>
                  <strong>صدور گواهی‌نامه</strong>
                  <div className={styles.certificateDetails}>
                    <p className={styles.certificateMainInfo}>
                      شرکت‌کنندگان واجد شرایط، گواهی‌نامه دریافت می‌کنند.
                    </p>
                    <div className={styles.certificateSettings}>
                      {formData.certificateSettings?.title && (
                        <div className={styles.certificateSettingItem}>
                          <span className={styles.certificateSettingLabel}>📜 عنوان:</span>
                          <span className={styles.certificateSettingValue}>
                            {formData.certificateSettings.title}
                          </span>
                        </div>
                      )}
                      {formData.certificateSettings?.issuerName && (
                        <div className={styles.certificateSettingItem}>
                          <span className={styles.certificateSettingLabel}>🏢 صادرکننده:</span>
                          <span className={styles.certificateSettingValue}>
                            {formData.certificateSettings.issuerName}
                          </span>
                        </div>
                      )}
                      <div className={styles.certificateSettingItem}>
                        <span className={styles.certificateSettingLabel}>📊 حداقل حضور:</span>
                        <span className={styles.certificateSettingValue}>
                          {formData.certificateSettings?.minAttendancePercent || 80}%
                        </span>
                      </div>
                      <div className={styles.certificateSettingItem}>
                        <span className={styles.certificateSettingLabel}>✅ نیاز به اتمام رویداد:</span>
                        <span className={styles.certificateSettingValue}>
                          {formData.certificateSettings?.requiresCompletion !== false ? 'بله' : 'خیر'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* مرحله 6: سایر دسته‌بندی‌ها */}
      <section className={styles.previewSection}>
        <h3 className={styles.previewSectionTitle}>
          <span className={styles.previewStepNumber}>6</span>
          سایر دسته‌بندی‌ها
        </h3>
        <div className={styles.previewContent}>
          <div className={styles.previewCategoriesGrid}>
            {formData.intent && (
              <div className={styles.previewCategoryBadge}>
                🎯 نوع تعامل
              </div>
            )}
            {formData.emotional && (
              <div className={styles.previewCategoryBadge}>
                ❤️ احساسی / هدف‌محور
              </div>
            )}
            {formData.audienceType && (
              <div className={styles.previewCategoryBadge}>
                👥 مخاطب
              </div>
            )}
            {formData.socialDynamics && (
              <div className={styles.previewCategoryBadge}>
                🤝 تعامل اجتماعی
              </div>
            )}
            {formData.impactPurpose && (
              <div className={styles.previewCategoryBadge}>
                ✨ تأثیر و ارزش
              </div>
            )}
          </div>
        </div>
      </section>

      {/* هشدار وضعیت */}
      <div className={styles.infoBox}>
        <span className={styles.infoIcon}>ℹ️</span>
        <div>
          <strong>توجه:</strong> بعد از ثبت نهایی، رویداد شما با وضعیت <strong>"در انتظار تایید"</strong> ثبت می‌شود 
          و پس از بررسی توسط مدیریت، منتشر خواهد شد.
        </div>
      </div>

      {/* دکمه‌های ناوبری */}
      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onPrev}>
          ← مرحله قبل
        </button>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? (
            <>
              <span className={styles.spinner}></span>
              در حال ذخیره...
            </>
          ) : (
            <>
              ✅ ثبت نهایی رویداد
            </>
          )}
        </button>
      </div>
    </form>
  );
}


