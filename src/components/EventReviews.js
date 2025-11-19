"use client";

import { useState, useEffect } from "react";
import styles from "./EventReviews.module.css";
import "./EventReviewsDark.css";

export default function EventReviews({ eventId, isOwner = false, showStatsOnly = false, showReviewsOnly = false }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [submittingReply, setSubmittingReply] = useState({});

  useEffect(() => {
    if (eventId) {
      fetchReviews();
    }
  }, [eventId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/reviews`);
      const data = await response.json();

      if (data.success) {
        setReviews(data.reviews || []);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId) => {
    const text = replyText[reviewId];

    if (!text || !text.trim()) {
      alert("لطفاً متن پاسخ را وارد کنید");
      return;
    }

    try {
      setSubmittingReply({ ...submittingReply, [reviewId]: true });

      const response = await fetch(
        `/api/events/${eventId}/reviews/${reviewId}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reply: text }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در ثبت پاسخ");
      }

      alert(data.message || "پاسخ شما ثبت شد");
      setReplyText({ ...replyText, [reviewId]: "" });
      fetchReviews(); // بارگذاری مجدد نظرات
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingReply({ ...submittingReply, [reviewId]: false });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));
  };

  const renderStars = (rating, size = "medium") => {
    return (
      <div className={`${styles.stars} ${styles[size]}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? styles.filled : ""}>
            {star <= rating ? "⭐" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>در حال بارگذاری نظرات...</p>
      </div>
    );
  }

  // اگر showStatsOnly فعال است، فقط stats را نمایش بده
  if (showStatsOnly) {
    if (!stats || stats.totalReviews === 0) {
      return null; // چیزی نمایش نده
    }

    return (
      <div className={styles.statsOnlySection}>
        <h3 className={styles.statsTitle}>⭐ امتیاز کلی</h3>
        <div className={styles.statsCard}>
          <div className={styles.overallRating}>
            <div className={styles.ratingNumber}>
              {stats.averageRating?.toFixed(1) || "0.0"}
            </div>
            {renderStars(Math.round(stats.averageRating || 0), "large")}
            <div className={styles.totalReviews}>
              {stats.totalReviews || 0} نظر
            </div>
          </div>

          {/* نمودار توزیع امتیازات */}
          <div className={styles.ratingDistribution}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats[`rating${star}`] || 0;
              const percentage =
                stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

              return (
                <div key={star} className={styles.distRow}>
                  <span className={styles.distLabel}>{star} ستاره</span>
                  <div className={styles.distBar}>
                    <div
                      className={styles.distFill}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className={styles.distCount}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // اگر showReviewsOnly فعال است، فقط لیست نظرات را نمایش بده
  if (showReviewsOnly) {
    if (!reviews || reviews.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💬</div>
          <p>هنوز نظری ثبت نشده است</p>
        </div>
      );
    }

    return (
      <div className={styles.reviewsSection}>
        {/* عنوان بخش */}
        <h3 className={styles.sectionTitle}>
          💬 نظرات شرکت‌کنندگان ({reviews.length})
        </h3>

      {/* لیست نظرات */}
      <div className={styles.reviewsList}>
        {reviews.map((review) => (
          <div key={review._id} className={styles.reviewCard}>
            {/* هدر نظر */}
            <div className={styles.reviewHeader}>
              <div className={styles.userInfo}>
                <div className={styles.avatar}>
                  {review.user?.firstName?.charAt(0) || "؟"}
                </div>
                <div className={styles.userDetails}>
                  <div className={styles.userName}>
                    {review.user?.firstName} {review.user?.lastName}
                  </div>
                  <div className={styles.reviewDate}>
                    {formatDate(review.createdAt)}
                  </div>
                </div>
              </div>
              {renderStars(review.rating, "small")}
            </div>

            {/* متن نظر */}
            {review.comment && (
              <div className={styles.reviewText}>
                <p>{review.comment}</p>
              </div>
            )}

            {/* امتیازات جزئی */}
            {review.detailedRatings &&
              Object.keys(review.detailedRatings).some(
                (key) => review.detailedRatings[key]
              ) && (
                <div className={styles.detailedRatings}>
                  {review.detailedRatings.contentQuality && (
                    <div className={styles.detailBadge}>
                      📚 محتوا: {review.detailedRatings.contentQuality}/5
                    </div>
                  )}
                  {review.detailedRatings.presentationQuality && (
                    <div className={styles.detailBadge}>
                      🎤 ارائه: {review.detailedRatings.presentationQuality}/5
                    </div>
                  )}
                  {review.detailedRatings.organization && (
                    <div className={styles.detailBadge}>
                      📋 سازماندهی: {review.detailedRatings.organization}/5
                    </div>
                  )}
                  {review.detailedRatings.valueForMoney && (
                    <div className={styles.detailBadge}>
                      💰 ارزش: {review.detailedRatings.valueForMoney}/5
                    </div>
                  )}
                  {review.detailedRatings.recommendation && (
                    <div className={styles.detailBadge}>
                      👍 توصیه: {review.detailedRatings.recommendation}/5
                    </div>
                  )}
                </div>
              )}

            {/* پاسخ مالک - فقط پاسخ‌های تایید شده */}
            {review.ownerResponse?.text && 
             review.ownerResponse?.status === "approved" && (
              <div className={styles.ownerReply}>
                <div className={styles.replyHeader}>
                  <span className={styles.replyIcon}>💬</span>
                  <span>پاسخ برگزارکننده:</span>
                  <span className={styles.replyDate}>
                    {formatDate(review.ownerResponse.respondedAt)}
                  </span>
                </div>
                <p>{review.ownerResponse.text}</p>
              </div>
            )}

            {/* فرم پاسخ برای مالک رویداد */}
            {isOwner && 
             !review.ownerResponse?.text && (
              <div className={styles.replyForm}>
                <div className={styles.replyFormHeader}>
                  <span>💬</span>
                  <span>پاسخ شما به این نظر:</span>
                </div>
                <textarea
                  className={styles.replyInput}
                  placeholder="پاسخ خود را بنویسید... (پس از تایید مدیر نمایش داده خواهد شد)"
                  value={replyText[review._id] || ""}
                  onChange={(e) =>
                    setReplyText({ ...replyText, [review._id]: e.target.value })
                  }
                  rows={3}
                  maxLength={500}
                  disabled={submittingReply[review._id]}
                />
                <div className={styles.replyFormFooter}>
                  <span className={styles.charCount}>
                    {(replyText[review._id] || "").length} / 500 کاراکتر
                  </span>
                  <button
                    className={styles.replyBtn}
                    onClick={() => handleReply(review._id)}
                    disabled={submittingReply[review._id]}
                  >
                    {submittingReply[review._id] ? "در حال ارسال..." : "💬 ارسال پاسخ"}
                  </button>
                </div>
              </div>
            )}

            {/* اگر پاسخ منتظر تایید است، برای مالک نشان بده */}
            {isOwner && 
             review.ownerResponse?.text && 
             review.ownerResponse?.status === "pending" && (
              <div className={styles.pendingReply}>
                <div className={styles.pendingHeader}>
                  <span>⏳</span>
                  <span>پاسخ شما در انتظار تایید مدیر:</span>
                </div>
                <p>{review.ownerResponse.text}</p>
                <small className={styles.pendingNote}>
                  این پاسخ پس از تایید مدیر برای همه نمایش داده خواهد شد
                </small>
              </div>
            )}
          </div>
        ))}
      </div>
      </div>
    );
  }

  // حالت پیش‌فرض: نمایش کامل (stats + reviews)
  if (!reviews || reviews.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>💬</div>
        <p>هنوز نظری ثبت نشده است</p>
      </div>
    );
  }

  return (
    <div className={styles.reviewsSection}>
      {/* آمار نظرات */}
      {stats && (
        <div className={styles.statsHeader}>
          <div className={styles.overallRating}>
            <div className={styles.ratingNumber}>
              {stats.averageRating?.toFixed(1) || "0.0"}
            </div>
            {renderStars(Math.round(stats.averageRating || 0), "large")}
            <div className={styles.totalReviews}>
              {stats.totalReviews || 0} نظر
            </div>
          </div>

          {/* نمودار توزیع امتیازات */}
          <div className={styles.ratingDistribution}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats[`rating${star}`] || 0;
              const percentage =
                stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

              return (
                <div key={star} className={styles.distRow}>
                  <span className={styles.distLabel}>{star} ستاره</span>
                  <div className={styles.distBar}>
                    <div
                      className={styles.distFill}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className={styles.distCount}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* عنوان بخش */}
      <h3 className={styles.sectionTitle}>
        💬 نظرات شرکت‌کنندگان ({reviews.length})
      </h3>

      {/* لیست نظرات */}
      <div className={styles.reviewsList}>
        {reviews.map((review) => (
          <div key={review._id} className={styles.reviewCard}>
            {/* هدر نظر */}
            <div className={styles.reviewHeader}>
              <div className={styles.userInfo}>
                <div className={styles.avatar}>
                  {review.user?.firstName?.charAt(0) || "؟"}
                </div>
                <div className={styles.userDetails}>
                  <div className={styles.userName}>
                    {review.user?.firstName} {review.user?.lastName}
                  </div>
                  <div className={styles.reviewDate}>
                    {formatDate(review.createdAt)}
                  </div>
                </div>
              </div>
              {renderStars(review.rating, "small")}
            </div>

            {/* متن نظر */}
            {review.comment && (
              <div className={styles.reviewText}>
                <p>{review.comment}</p>
              </div>
            )}

            {/* امتیازات جزئی */}
            {review.detailedRatings &&
              Object.keys(review.detailedRatings).some(
                (key) => review.detailedRatings[key]
              ) && (
                <div className={styles.detailedRatings}>
                  {review.detailedRatings.contentQuality && (
                    <div className={styles.detailBadge}>
                      📚 محتوا: {review.detailedRatings.contentQuality}/5
                    </div>
                  )}
                  {review.detailedRatings.presentationQuality && (
                    <div className={styles.detailBadge}>
                      🎤 ارائه: {review.detailedRatings.presentationQuality}/5
                    </div>
                  )}
                  {review.detailedRatings.organizationQuality && (
                    <div className={styles.detailBadge}>
                      🎯 سازماندهی: {review.detailedRatings.organizationQuality}/5
                    </div>
                  )}
                  {review.detailedRatings.interactionQuality && (
                    <div className={styles.detailBadge}>
                      💬 تعامل: {review.detailedRatings.interactionQuality}/5
                    </div>
                  )}
                  {review.detailedRatings.venueQuality && (
                    <div className={styles.detailBadge}>
                      🏢 محیط: {review.detailedRatings.venueQuality}/5
                    </div>
                  )}
                </div>
              )}

            {/* پاسخ مالک - فقط پاسخ‌های تایید شده */}
            {review.ownerResponse?.text && 
             review.ownerResponse?.status === "approved" && (
              <div className={styles.ownerReply}>
                <div className={styles.replyHeader}>
                  <span className={styles.replyIcon}>💬</span>
                  <span>پاسخ برگزارکننده:</span>
                  <span className={styles.replyDate}>
                    {formatDate(review.ownerResponse.respondedAt)}
                  </span>
                </div>
                <p>{review.ownerResponse.text}</p>
              </div>
            )}

            {/* فرم پاسخ برای مالک رویداد */}
            {isOwner && 
             !review.ownerResponse?.text && (
              <div className={styles.replyForm}>
                <div className={styles.replyFormHeader}>
                  <span>💬</span>
                  <span>پاسخ شما به این نظر:</span>
                </div>
                <textarea
                  className={styles.replyInput}
                  placeholder="پاسخ خود را بنویسید... (پس از تایید مدیر نمایش داده خواهد شد)"
                  value={replyText[review._id] || ""}
                  onChange={(e) =>
                    setReplyText({ ...replyText, [review._id]: e.target.value })
                  }
                  rows={3}
                  maxLength={500}
                  disabled={submittingReply[review._id]}
                />
                <div className={styles.replyFormFooter}>
                  <span className={styles.charCount}>
                    {(replyText[review._id] || "").length} / 500 کاراکتر
                  </span>
                  <button
                    className={styles.replyBtn}
                    onClick={() => handleReply(review._id)}
                    disabled={submittingReply[review._id]}
                  >
                    {submittingReply[review._id] ? "در حال ارسال..." : "💬 ارسال پاسخ"}
                  </button>
                </div>
              </div>
            )}

            {/* اگر پاسخ منتظر تایید است، برای مالک نشان بده */}
            {isOwner && 
             review.ownerResponse?.text && 
             review.ownerResponse?.status === "pending" && (
              <div className={styles.pendingReply}>
                <div className={styles.pendingHeader}>
                  <span>⏳</span>
                  <span>پاسخ شما در انتظار تایید مدیر:</span>
                </div>
                <p>{review.ownerResponse.text}</p>
                <small className={styles.pendingNote}>
                  این پاسخ پس از تایید مدیر برای همه نمایش داده خواهد شد
                </small>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

