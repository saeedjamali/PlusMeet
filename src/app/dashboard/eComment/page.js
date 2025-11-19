"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./comment.module.css";
import "./commentDark.css";

export default function EventCommentsPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // all | pending | approved | rejected
  const [submittingReplyStatus, setSubmittingReplyStatus] = useState({});

  useEffect(() => {
    fetchMyEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchReviews(selectedEvent._id);
    }
  }, [selectedEvent, filter]);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      // دریافت همه رویدادهای پایان یافته و منقضی شده (برای مدیر بخش نظرات)
      // این API محافظت شده است و دسترسی آن توسط RBAC کنترل می‌شود
      const response = await fetch("/api/events/my?status=finished,expired", {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresAuth) {
          router.push("/login");
          return;
        }
        throw new Error(data.error || "خطا در دریافت رویدادها");
      }

      setEvents(data.events || []);
      
      // انتخاب خودکار اولین رویداد
      if (data.events && data.events.length > 0) {
        setSelectedEvent(data.events[0]);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (eventId) => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("status", filter);
      }

      const response = await fetch(
        `/api/events/${eventId}/reviews/manage?${params.toString()}`,
        { credentials: "include" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در دریافت نظرات");
      }

      setReviews(data.reviews || []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  const handleStatusChange = async (reviewId, newStatus) => {
    if (!confirm(`آیا مطمئن هستید که می‌خواهید این نظر را ${newStatus === "approved" ? "تایید" : "رد"} کنید؟`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/events/${selectedEvent._id}/reviews/${reviewId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در تغییر وضعیت");
      }

      // پیام موفقیت با توضیح فیلتر
      let message = data.message;
      if (filter !== "all") {
        if (newStatus === "approved") {
          message += "\n\n💡 این نظر اکنون در فیلتر '✅ تایید شده' قابل مشاهده است.";
        } else if (newStatus === "rejected") {
          message += "\n\n💡 این نظر اکنون در فیلتر '❌ رد شده' قابل مشاهده است.";
        }
      }

      alert(message);
      
      // بارگذاری مجدد نظرات
      await fetchReviews(selectedEvent._id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReplyStatusChange = async (reviewId, newStatus) => {
    if (!confirm(`آیا مطمئن هستید که می‌خواهید این پاسخ را ${newStatus === "approved" ? "تایید" : "رد"} کنید؟`)) {
      return;
    }

    try {
      setSubmittingReplyStatus({ ...submittingReplyStatus, [reviewId]: true });

      const response = await fetch(
        `/api/events/${selectedEvent._id}/reviews/${reviewId}/reply/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در تغییر وضعیت پاسخ");
      }

      // پیام موفقیت با توضیح فیلتر
      let message = data.message;
      if (filter !== "all") {
        if (newStatus === "approved") {
          message += "\n\n💡 این نظر اکنون در فیلتر '✅ تایید شده' قابل مشاهده است.";
        } else if (newStatus === "rejected") {
          message += "\n\n💡 این نظر اکنون در فیلتر '❌ رد شده' قابل مشاهده است.";
        }
      }
      
      alert(message);
      
      // بارگذاری مجدد نظرات
      await fetchReviews(selectedEvent._id);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingReplyStatus({ ...submittingReplyStatus, [reviewId]: false });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const renderStars = (rating) => {
    return (
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? styles.filled : ""}>
            {star <= rating ? "⭐" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: "در انتظار تایید", color: "orange" },
      approved: { label: "تایید شده", color: "green" },
      rejected: { label: "رد شده", color: "red" },
    };
    
    const badge = badges[status] || badges.pending;
    
    return (
      <span className={styles.badge} data-status={badge.color}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>در حال بارگذاری...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🎪</div>
        <h3>رویدادی یافت نشد</h3>
        <p>شما رویداد پایان یافته یا منقضی شده‌ای ندارید</p>
        <p className={styles.emptyNote}>
          فقط رویدادهایی که وضعیت آنها <strong>پایان یافته (finished)</strong> یا <strong>منقضی شده (expired)</strong> است در این صفحه نمایش داده می‌شوند، زیرا فقط برای این رویدادها می‌توان نظر ثبت کرد.
        </p>
        <button onClick={() => router.push("/dashboard")}>
          🔙 بازگشت به داشبورد
        </button>
      </div>
    );
  }

  return (
    <div className={styles.commentPage}>
      {/* هدر */}
      <div className={styles.header}>
        <h1>💬 مدیریت نظرات</h1>
        <p>مشاهده و مدیریت نظرات رویدادهای شما</p>
      </div>

      {/* انتخاب رویداد */}
      <div className={styles.eventSelector}>
        <label>رویداد:</label>
        <select
          value={selectedEvent?._id || ""}
          onChange={(e) => {
            const event = events.find((ev) => ev._id === e.target.value);
            setSelectedEvent(event);
          }}
          className={styles.select}
        >
          {events.map((event) => (
            <option key={event._id} value={event._id}>
              {event.title} - {event.status === "finished" ? "پایان یافته" : "منقضی شده"} ({event.reviewCount || 0} نظر)
            </option>
          ))}
        </select>
      </div>

      {/* فیلترها */}
      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
          onClick={() => setFilter("all")}
        >
          همه
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "pending" ? styles.active : ""}`}
          onClick={() => setFilter("pending")}
        >
          ⏳ در انتظار تایید
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "approved" ? styles.active : ""}`}
          onClick={() => setFilter("approved")}
        >
          ✅ تایید شده
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "rejected" ? styles.active : ""}`}
          onClick={() => setFilter("rejected")}
        >
          ❌ رد شده
        </button>
      </div>

      {/* توضیح فیلتر */}
      {filter !== "all" && reviews.length > 0 && (
        <div className={styles.filterNote}>
          💡 توجه: پس از تغییر وضعیت، نظر به فیلتر مربوطه منتقل می‌شود
        </div>
      )}

      {/* لیست نظرات */}
      <div className={styles.reviewsList}>
        {reviews.length === 0 ? (
          <div className={styles.emptyReviews}>
            <p>نظری یافت نشد</p>
          </div>
        ) : (
          reviews.map((review) => (
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
                {getStatusBadge(review.status)}
              </div>

              {/* امتیاز */}
              <div className={styles.rating}>
                {renderStars(review.rating)}
                <span className={styles.ratingText}>
                  {review.rating} از 5
                </span>
              </div>

              {/* نظر */}
              {review.comment && (
                <div className={styles.comment}>
                  <p>{review.comment}</p>
                </div>
              )}

              {/* امتیازات جزئی */}
              {review.detailedRatings && Object.keys(review.detailedRatings).length > 0 && (
                <div className={styles.detailedRatings}>
                  <h4>امتیازات جزئی:</h4>
                  <div className={styles.detailsGrid}>
                    {review.detailedRatings.contentQuality && (
                      <div className={styles.detailItem}>
                        کیفیت محتوا: {review.detailedRatings.contentQuality}/5
                      </div>
                    )}
                    {review.detailedRatings.presentationQuality && (
                      <div className={styles.detailItem}>
                        کیفیت ارائه: {review.detailedRatings.presentationQuality}/5
                      </div>
                    )}
                    {review.detailedRatings.organization && (
                      <div className={styles.detailItem}>
                        سازماندهی: {review.detailedRatings.organization}/5
                      </div>
                    )}
                    {review.detailedRatings.valueForMoney && (
                      <div className={styles.detailItem}>
                        ارزش هزینه: {review.detailedRatings.valueForMoney}/5
                      </div>
                    )}
                    {review.detailedRatings.recommendation && (
                      <div className={styles.detailItem}>
                        توصیه: {review.detailedRatings.recommendation}/5
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* پاسخ مالک (اگر وجود دارد) */}
              {review.ownerResponse?.text && (
                <div className={styles.ownerResponse}>
                  <div className={styles.responseHeader}>
                    <span className={styles.responseIcon}>💬</span>
                    <span>پاسخ مالک رویداد:</span>
                    {getStatusBadge(review.ownerResponse.status || "pending")}
                    <span className={styles.responseDate}>
                      {formatDate(review.ownerResponse.respondedAt)}
                    </span>
                  </div>
                  <p>{review.ownerResponse.text}</p>
                  
                  {/* دکمه‌های تایید/رد/ویرایش وضعیت پاسخ */}
                  <div className={styles.replyActions}>
                    <h5 className={styles.actionTitle}>💬 مدیریت پاسخ:</h5>
                    <div className={styles.statusActions}>
                      {review.ownerResponse.status === "pending" ? (
                        <>
                          <button
                            className={styles.approveBtn}
                            onClick={() => handleReplyStatusChange(review._id, "approved")}
                            disabled={submittingReplyStatus[review._id]}
                          >
                            ✅ تایید پاسخ
                          </button>
                          <button
                            className={styles.rejectBtn}
                            onClick={() => handleReplyStatusChange(review._id, "rejected")}
                            disabled={submittingReplyStatus[review._id]}
                          >
                            ❌ رد پاسخ
                          </button>
                        </>
                      ) : (
                        <>
                          <span className={styles.currentStatus}>
                            وضعیت فعلی پاسخ: {getStatusBadge(review.ownerResponse.status)}
                          </span>
                          <button
                            className={styles.changeStatusBtn}
                            onClick={() => {
                              const newStatus = review.ownerResponse.status === "approved" ? "rejected" : "approved";
                              handleReplyStatusChange(review._id, newStatus);
                            }}
                            disabled={submittingReplyStatus[review._id]}
                          >
                            🔄 تغییر به {review.ownerResponse.status === "approved" ? "رد شده" : "تایید شده"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* اقدامات */}
              <div className={styles.actions}>
                {/* دکمه‌های تایید/رد/ویرایش وضعیت نظر */}
                <div className={styles.reviewActions}>
                  <h4 className={styles.actionTitle}>🔍 مدیریت نظر:</h4>
                  <div className={styles.statusActions}>
                    {review.status === "pending" ? (
                      <>
                        <button
                          className={styles.approveBtn}
                          onClick={() => handleStatusChange(review._id, "approved")}
                        >
                          ✅ تایید نظر
                        </button>
                        <button
                          className={styles.rejectBtn}
                          onClick={() => handleStatusChange(review._id, "rejected")}
                        >
                          ❌ رد نظر
                        </button>
                      </>
                    ) : (
                      <>
                        <span className={styles.currentStatus}>
                          وضعیت فعلی: {getStatusBadge(review.status)}
                        </span>
                        <button
                          className={styles.changeStatusBtn}
                          onClick={() => {
                            const newStatus = review.status === "approved" ? "rejected" : "approved";
                            handleStatusChange(review._id, newStatus);
                          }}
                        >
                          🔄 تغییر به {review.status === "approved" ? "رد شده" : "تایید شده"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* یادآوری: مالک رویداد از صفحه عمومی پاسخ می‌دهد، نه اینجا */}
                {review.status === "approved" && !review.ownerResponse?.text && (
                  <div className={styles.infoNote}>
                    💡 مالک رویداد می‌تواند در صفحه جزئیات رویداد به این نظر پاسخ دهد.
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* دکمه بازگشت */}
      <div className={styles.backBtn}>
        <button onClick={() => router.push("/dashboard")}>
          🔙 بازگشت به داشبورد
        </button>
      </div>
    </div>
  );
}

