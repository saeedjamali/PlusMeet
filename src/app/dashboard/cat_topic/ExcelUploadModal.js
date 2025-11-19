'use client';

import { useState } from 'react';
import styles from './ExcelUploadModal.module.css';

export default function ExcelUploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    // بررسی فرمت فایل
    const fileName = selectedFile.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      setError('فقط فایل‌های Excel (.xlsx, .xls) مجاز هستند');
      return;
    }

    // بررسی حجم فایل (حداکثر 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('حجم فایل نباید بیشتر از 5 مگابایت باشد');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('لطفاً یک فایل انتخاب کنید');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/dashboard/cat_topic/upload-excel', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'خطا در آپلود فایل');
      }

      setUploadResult(data.results);
      
      // بستن مودال و رفرش لیست بعد از 2 ثانیه
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/dashboard/cat_topic/upload-excel', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('خطا در دانلود template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'topic-categories-template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <span>📤</span>
            آپلود دسته‌بندی‌ها از Excel
          </h2>
          <button className={styles.closeBtn} onClick={onClose} title="بستن">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* راهنما */}
          <div className={styles.infoBox}>
            <div className={styles.infoIcon}>ℹ️</div>
            <div>
              <h4>نحوه استفاده:</h4>
              <ol>
                <li>ابتدا فایل template را دانلود کنید</li>
                <li>دسته‌بندی‌های خود را در فایل Excel وارد کنید</li>
                <li>فایل را آپلود کنید</li>
              </ol>
            </div>
          </div>

          {/* دکمه دانلود Template */}
          <button
            className={styles.btnTemplate}
            onClick={handleDownloadTemplate}
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            دانلود فایل نمونه (Template)
          </button>

          {/* Drop Zone */}
          <div
            className={`${styles.dropZone} ${isDragging ? styles.dropZoneDragging : ''} ${
              file ? styles.dropZoneHasFile : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="excelFile"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className={styles.fileInput}
            />

            {file ? (
              <div className={styles.fileInfo}>
                <div className={styles.fileIcon}>📄</div>
                <div className={styles.fileDetails}>
                  <div className={styles.fileName}>{file.name}</div>
                  <div className={styles.fileSize}>{formatFileSize(file.size)}</div>
                </div>
                <button
                  className={styles.removeFileBtn}
                  onClick={() => {
                    setFile(null);
                    setError(null);
                  }}
                  type="button"
                  title="حذف فایل"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label htmlFor="excelFile" className={styles.dropZoneLabel}>
                <div className={styles.uploadIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className={styles.dropZoneText}>
                  <p className={styles.dropZonePrimary}>
                    فایل Excel را اینجا بکشید یا کلیک کنید
                  </p>
                  <p className={styles.dropZoneSecondary}>
                    فرمت‌های مجاز: .xlsx, .xls (حداکثر 5 مگابایت)
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className={styles.error}>
              <span>❌</span>
              {error}
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className={styles.result}>
              <div className={styles.resultHeader}>
                <span className={styles.resultIcon}>✅</span>
                <h4>نتیجه آپلود</h4>
              </div>
              <div className={styles.resultStats}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{uploadResult.success}</span>
                  <span className={styles.statLabel}>موفق</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{uploadResult.failed}</span>
                  <span className={styles.statLabel}>ناموفق</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>
                    {uploadResult.success + uploadResult.failed}
                  </span>
                  <span className={styles.statLabel}>کل</span>
                </div>
              </div>

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className={styles.errorsList}>
                  <h5>خطاها:</h5>
                  <ul>
                    {uploadResult.errors.map((err, index) => (
                      <li key={index}>
                        <strong>{err.row}:</strong> {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            className={styles.btnCancel}
            disabled={loading}
          >
            {uploadResult ? 'بستن' : 'انصراف'}
          </button>
          {!uploadResult && (
            <button
              type="button"
              onClick={handleUpload}
              className={styles.btnUpload}
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  در حال آپلود...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  آپلود و ایجاد
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}




