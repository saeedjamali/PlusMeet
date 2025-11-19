"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./Modal.module.css";
import reviewStyles from "./ReviewModal.module.css";
import "./ModalDark.css";
import "./ReviewModalDark.css";

const QUESTIONS = [
  {
    key: "contentQuality",
    label: "کیفیت محتوا",
    description: "محتوا و مطالب ارائه شده چقدر مفید و با کیفیت بود؟",
  },
  {
    key: "presentationQuality",
    label: "کیفیت ارائه",
    description: "نحوه ارائه و انتقال مطالب چطور بود؟",
  },
  {
    key: "organization",
    label: "سازماندهی",
    description: "برنامه‌ریزی و سازماندهی رویداد چطور بود؟",
  },
  {
    key: "valueForMoney",
    label: "ارزش در برابر هزینه",
    description: "آیا ارزش پرداختی را داشت؟",
  },
  {
    key: "recommendation",
    label: "توصیه به دیگران",
    description: "این رویداد را به دیگران توصیه می‌کنید؟",
  },
];

export default function ReviewModal({
  isOpen,
  onClose,
  eventTitle,
  onSubmit,
  joinRequestId,
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [detailedRatings, setDetailedRatings] = useState({});
  const [hoverDetailedRating, setHoverDetailedRating] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const modalContentRef = useRef(null);

  // مدیریت overflow صفحه و focus مدال
  useEffect(() => {
    if (isOpen) {
      // قفل کردن اسکرول صفحه اصلی
      document.body.style.overflow = "hidden";
      
      // focus کردن روی مدال برای دریافت keyboard events
      if (modalContentRef.current) {
        modalContentRef.current.focus();
      }
    } else {
      // بازگرداندن اسکرول صفحه اصلی
      document.body.style.overflow = "";
    }

    // cleanup function
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDetailedRatingChange = (key, value) => {
    setDetailedRatings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDetailedRatingHover = (key, value) => {
    setHoverDetailedRating((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("لطفاً امتیاز کلی را انتخاب کنید");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        rating,
        comment,
        detailedRatings,
        joinRequestId,
      });
      
      // Reset form
      setRating(0);
      setComment("");
      setDetailedRatings({});
      onClose();
    } catch (err) {
      setError(err.message || "خطا در ثبت نظر");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (currentRating, onRate, onHover, size = "large") => {
    const displayRating = onHover !== undefined && hoverRating > 0 ? hoverRating : currentRating;
    
    return (
      <div className={`${reviewStyles.stars} ${reviewStyles[size]}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${reviewStyles.star} ${
              star <= displayRating ? reviewStyles.active : ""
            }`}
            onClick={() => onRate(star)}
            onMouseEnter={() => onHover && onHover(star)}
            onMouseLeave={() => onHover && onHover(0)}
          >
            {star <= displayRating ? "⭐" : "☆"}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        ref={modalContentRef}
        className={`${styles.modalContent} ${reviewStyles.reviewModal}`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className={styles.modalHeader}>
          <h2>✍️ ثبت نظر</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {/* عنوان رویداد */}
            <div className={reviewStyles.eventInfo}>
              <span className={reviewStyles.eventIcon}>🎪</span>
              <span className={reviewStyles.eventTitle}>{eventTitle}</span>
            </div>

            {/* امتیاز کلی */}
            <div className={reviewStyles.section}>
              <label className={reviewStyles.sectionLabel}>
                <span className={reviewStyles.required}>*</span>
                امتیاز کلی شما
              </label>
              <p className={reviewStyles.sectionDesc}>
                نظر شما درباره این رویداد چیست؟
              </p>
              {renderStars(rating, setRating, setHoverRating, "large")}
              {rating > 0 && (
                <p className={reviewStyles.ratingText}>
                  {rating === 5 && "🎉 عالی!"}
                  {rating === 4 && "👍 خوب"}
                  {rating === 3 && "😐 متوسط"}
                  {rating === 2 && "👎 ضعیف"}
                  {rating === 1 && "😞 بسیار ضعیف"}
                </p>
              )}
            </div>

            {/* نظر متنی */}
            <div className={reviewStyles.section}>
              <label className={reviewStyles.sectionLabel}>
                نظر شما (اختیاری)
              </label>
              <textarea
                className={reviewStyles.textarea}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="تجربه خود را با دیگران به اشتراک بگذارید..."
                rows={4}
                maxLength={1000}
              />
              <div className={reviewStyles.charCount}>
                {comment.length} / 1000 کاراکتر
              </div>
            </div>

            {/* امتیازات جزئی */}
            <div className={reviewStyles.section}>
              <label className={reviewStyles.sectionLabel}>
                امتیازات جزئی (اختیاری)
              </label>
              <p className={reviewStyles.sectionDesc}>
                به هر بخش از رویداد امتیاز دهید
              </p>

              <div className={reviewStyles.detailedRatings}>
                {QUESTIONS.map((question) => (
                  <div key={question.key} className={reviewStyles.questionRow}>
                    <div className={reviewStyles.questionInfo}>
                      <div className={reviewStyles.questionLabel}>
                        {question.label}
                      </div>
                      <div className={reviewStyles.questionDesc}>
                        {question.description}
                      </div>
                    </div>
                    <div className={reviewStyles.questionRating}>
                      {[1, 2, 3, 4, 5].map((star) => {
                        const currentRating = detailedRatings[question.key] || 0;
                        const hoverValue = hoverDetailedRating[question.key] || 0;
                        const displayRating = hoverValue > 0 ? hoverValue : currentRating;
                        
                        return (
                          <button
                            key={star}
                            type="button"
                            className={`${reviewStyles.starBtn} ${
                              star <= displayRating ? reviewStyles.active : ""
                            }`}
                            onClick={() =>
                              handleDetailedRatingChange(question.key, star)
                            }
                            onMouseEnter={() =>
                              handleDetailedRatingHover(question.key, star)
                            }
                            onMouseLeave={() =>
                              handleDetailedRatingHover(question.key, 0)
                            }
                            title={`${star} ستاره`}
                          >
                            {star <= displayRating ? "⭐" : "☆"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <div className={reviewStyles.error}>{error}</div>}
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
              disabled={submitting}
            >
              لغو
            </button>
            <button
              type="submit"
              className={styles.confirmBtn}
              disabled={submitting || rating === 0}
            >
              {submitting ? "در حال ثبت..." : "ثبت نظر"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

