'use client';

import { useState, useEffect } from 'react';
import PersianDatePicker from '@/components/PersianDatePicker';
import styles from './eventCreate.module.css';

export default function Step3Details({ 
  formData, 
  handleChange,
  loading,
  error: parentError, 
  setError: setParentError,
  participationTypes,
  selectedParticipationType,
  setSelectedParticipationType,
  participationTypesLoading,
  onNext, 
  onPrev 
}) {
  const [error, setError] = useState(null);

  const handleParticipationTypeSelect = (type) => {
    if (!type.isActive) {
      setError(`نحوه شرکت "${type.title}" در حال حاضر غیرفعال است`);
      return;
    }
    console.log('✅ Participation Type Selected:', type);
    setSelectedParticipationType(type);
    handleChange('participationType', type._id);
    setError(null);
  };

  const handleNestedChange = (parent, field, value) => {
    handleChange(parent, {
      ...(formData[parent] || {}),
      [field]: value,
    });
  };

  const handleGenerateInviteLink = () => {
    // ✅ تولید توکن دعوت خصوصی (16 کاراکتر hex)
    const crypto = require('crypto');
    const inviteToken = Array.from({ length: 16 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    console.log('🔗 تولید توکن دعوت جدید:', inviteToken);
    
    // ✅ فقط inviteCode را ذخیره می‌کنیم، لینک بعد از ساخت رویداد تولید می‌شود
    handleChange('invitation', {
      ...(formData.invitation || {}),
      inviteLink: '', // لینک بعداً تولید می‌شود
      inviteCode: inviteToken,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedParticipationType) {
      setError('لطفاً نحوه شرکت را انتخاب کنید');
      return;
    }

    onNext();
  };

  // تشخیص نوع نحوه شرکت بر اساس code
  const isApprovalRequired = selectedParticipationType?.code?.toUpperCase().includes('APPROVAL') || 
                              selectedParticipationType?.code?.toUpperCase().includes('تایید');
  const isTicketBased = selectedParticipationType?.code?.toUpperCase().includes('TICKET') || 
                        selectedParticipationType?.code?.toUpperCase().includes('بلیت');
  const isInviteOnly = selectedParticipationType?.code?.toUpperCase().includes('INVITE') || 
                       selectedParticipationType?.code?.toUpperCase().includes('دعوت');

  console.log('🔍 Participation Type:', selectedParticipationType?.title, '| Code:', selectedParticipationType?.code);
  console.log('📋 isApprovalRequired:', isApprovalRequired, '| isTicketBased:', isTicketBased, '| isInviteOnly:', isInviteOnly);

  // تولید لینک و کد دعوت خودکار
  useEffect(() => {
    if (isInviteOnly && !formData.invitation?.inviteCode) {
      console.log('🎯 تولید خودکار لینک دعوت...');
      handleGenerateInviteLink();
    }
  }, [isInviteOnly]);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && (
        <div className={styles.errorBox}>
          <span>⚠️</span>
          {error}
        </div>
      )}

      {/* انتخاب نحوه شرکت */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🎫</span>
          نحوه شرکت در رویداد <span className={styles.required}>*</span>
        </h2>
        <p className={styles.sectionHint}>
          شرکت‌کنندگان چگونه می‌توانند در رویداد شرکت کنند؟
        </p>

        {participationTypesLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>در حال بارگذاری...</p>
          </div>
        ) : participationTypes.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🎫</span>
            <p>هیچ نحوه شرکتی فعال یافت نشد</p>
          </div>
        ) : (
          <>
            <div className={styles.compactCategoriesGrid}>
              {participationTypes.map((type) => (
                <div key={type._id} className={styles.categoryWrapper}>
                  <button
                    type="button"
                    className={`${styles.compactCategoryCard} ${
                      selectedParticipationType?._id === type._id ? styles.compactCategoryCardSelected : ''
                    } ${!type.isActive ? styles.compactCategoryCardDisabled : ''}`}
                    onClick={() => handleParticipationTypeSelect(type)}
                    disabled={!type.isActive}
                    title={!type.isActive ? 'این نحوه شرکت در حال حاضر غیرفعال است' : type.title}
                  >
                    <span className={styles.compactCategoryIcon}>{type.icon}</span>
                    <span className={styles.compactCategoryTitle}>{type.title}</span>
                    {!type.isActive && (
                      <span className={styles.disabledBadge}>غیرفعال</span>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* نمایش توضیحات نحوه شرکت انتخاب شده */}
            {selectedParticipationType && selectedParticipationType.description && (
              <div className={styles.categoryDetails}>
                <div className={styles.categoryDetailsHeader}>
                  <span className={styles.categoryDetailsIcon}>{selectedParticipationType.icon}</span>
                  <h3 className={styles.categoryDetailsTitle}>{selectedParticipationType.title}</h3>
                </div>
                <p className={styles.categoryDetailsDesc}>{selectedParticipationType.description}</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* فیلدهای نیازمند تایید */}
      {isApprovalRequired && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>✅</span>
            پیام‌های تایید
          </h2>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              پیام در انتظار تأیید <span className={styles.required}>*</span>
            </label>
            <p className={styles.hint}>
              پیامی که به کاربر نمایش داده می‌شود تا درخواستش تایید شود
            </p>
            <textarea
              className={styles.textarea}
              value={formData.approval?.pendingMessage || ''}
              onChange={(e) => handleNestedChange('approval', 'pendingMessage', e.target.value)}
              placeholder="مثلاً: درخواست شما ثبت شد و پس از بررسی، نتیجه به شما اطلاع داده می‌شود."
              rows={3}
              required={isApprovalRequired}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              پیام پس از تأیید <span className={styles.required}>*</span>
            </label>
            <p className={styles.hint}>
              پیامی که پس از تایید درخواست به کاربر ارسال می‌شود
            </p>
            <textarea
              className={styles.textarea}
              value={formData.approval?.approvedMessage || ''}
              onChange={(e) => handleNestedChange('approval', 'approvedMessage', e.target.value)}
              placeholder="مثلاً: تبریک! درخواست شما تایید شد. جزئیات رویداد به ایمیل شما ارسال شده است."
              rows={3}
              required={isApprovalRequired}
            />
          </div>
        </section>
      )}

      {/* فیلدهای بلیت‌محور */}
      {isTicketBased && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🎟️</span>
            اطلاعات بلیت
          </h2>

          {/* نوع بلیت */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              نوع بلیت <span className={styles.required}>*</span>
            </label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="ticketType"
                  value="free"
                  checked={formData.ticket?.type === 'free'}
                  onChange={(e) => handleNestedChange('ticket', 'type', e.target.value)}
                  required={isTicketBased}
                />
                <span>رایگان</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="ticketType"
                  value="paid"
                  checked={formData.ticket?.type === 'paid'}
                  onChange={(e) => handleNestedChange('ticket', 'type', e.target.value)}
                />
                <span>پولی</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="ticketType"
                  value="mixed"
                  checked={formData.ticket?.type === 'mixed'}
                  onChange={(e) => handleNestedChange('ticket', 'type', e.target.value)}
                />
                <span>ترکیبی (رایگان و پولی)</span>
              </label>
            </div>
          </div>

          {/* قیمت بلیت (فقط برای پولی) */}
          {(formData.ticket?.type === 'paid' || formData.ticket?.type === 'mixed') && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                قیمت بلیت (تومان) <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                min="0"
                className={styles.input}
                value={formData.ticket?.price || ''}
                onChange={(e) => handleNestedChange('ticket', 'price', parseInt(e.target.value) || 0)}
                placeholder="مثلاً: 50000"
                required
              />
            </div>
          )}

          {/* قابل بازگشت بودن */}
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.ticket?.refundable || false}
                onChange={(e) => handleNestedChange('ticket', 'refundable', e.target.checked)}
              />
              <span>در صورت لغو رویداد، مبلغ قابل بازگشت است</span>
            </label>
          </div>

          {/* تاریخ پایان فروش */}
          <PersianDatePicker
            label="تاریخ پایان فروش بلیت"
            value={formData.ticket?.saleEndDate || ''}
            onChange={(date) => {
              // ذخیره به فرمت string فارسی - تبدیل در API انجام می‌شود
              const dateString = date ? date.format('YYYY-MM-DD HH:mm:ss') : '';
              handleNestedChange('ticket', 'saleEndDate', dateString);
            }}
            placeholder="انتخاب تاریخ و ساعت"
            format="YYYY/MM/DD - HH:mm"
            timePicker={true}
            required={isTicketBased}
            minDate={new Date()} // نمیشه تاریخ گذشته انتخاب کرد
          />
        </section>
      )}

      {/* فیلدهای دعوتی */}
      {isInviteOnly && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>💌</span>
            اطلاعات دعوت
          </h2>

          {/* لینک دعوت */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              لینک دعوت (تولید خودکار)
              <button
                type="button"
                className={styles.addBtn}
                onClick={handleGenerateInviteLink}
                style={{ marginRight: '1rem', fontSize: '0.875rem' }}
              >
                🔄 تولید مجدد
              </button>
            </label>
            <p className={styles.hint}>
              💡 کاربران می‌توانند با کلیک روی این لینک در رویداد شرکت کنند
            </p>
            <div className={styles.copyableInput}>
              <input
                type="text"
                className={styles.input}
                value={
                  formData.invitation?.inviteCode 
                    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/events/join?code=${formData.invitation.inviteCode}`
                    : 'کلیک کنید تا تولید شود'
                }
                readOnly
              />
              <button
                type="button"
                className={styles.copyBtn}
                onClick={() => {
                  if (formData.invitation?.inviteCode) {
                    const inviteLink = `${window.location.origin}/events/join?code=${formData.invitation.inviteCode}`;
                    navigator.clipboard.writeText(inviteLink);
                    alert('✅ لینک دعوت کپی شد!');
                  }
                }}
                disabled={!formData.invitation?.inviteCode}
              >
                📋 کپی لینک
              </button>
            </div>
          </div>

          {/* کد دعوت */}
          <div className={styles.formGroup}>
            <label className={styles.label}>کد دعوت</label>
            <p className={styles.hint}>
              کاربران می‌توانند با وارد کردن این کد در رویداد شرکت کنند
            </p>
            <div className={styles.copyableInput}>
              <input
                type="text"
                className={styles.input}
                value={formData.invitation?.inviteCode || ''}
                onChange={(e) => handleNestedChange('invitation', 'inviteCode', e.target.value)}
                placeholder="مثلاً: SUMMIT2024"
              />
              <button
                type="button"
                className={styles.copyBtn}
                onClick={() => {
                  if (formData.invitation?.inviteCode) {
                    navigator.clipboard.writeText(formData.invitation.inviteCode);
                    alert('✅ کد دعوت کپی شد!');
                  }
                }}
                disabled={!formData.invitation?.inviteCode}
              >
                📋 کپی
              </button>
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

