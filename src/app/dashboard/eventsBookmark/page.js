"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./eventsBookmark.module.css";
import "./eventsBookmarkDark.css";
import { getTheme, applyTheme, toggleTheme, THEME } from "@/lib/utils/themeManager";

export default function EventsBookmarkPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // تنظیم تم
  useEffect(() => {
    const currentTheme = getTheme();
    const isDark = currentTheme === THEME.DARK;
    setDarkMode(isDark);
    applyTheme(currentTheme);
  }, []);

  const handleToggleTheme = () => {
    const currentTheme = darkMode ? THEME.DARK : THEME.LIGHT;
    const newTheme = toggleTheme(currentTheme);
    setDarkMode(newTheme === THEME.DARK);
  };

  // دریافت bookmarks
  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
      });

      const response = await fetch(`/api/dashboard/eventsBookmark?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("خطا در دریافت نشان‌ها");
      }

      const data = await response.json();
      setBookmarks(data.data || []);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      alert("خطا در دریافت نشان‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [currentPage]);

  // حذف bookmark (toggle)
  const handleRemoveBookmark = async (bookmarkId, eventId) => {
    if (!confirm("آیا از حذف این نشان اطمینان دارید؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/bookmark`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        alert("✅ نشان با موفقیت حذف شد");
        fetchBookmarks(); // بارگذاری مجدد لیست
      } else {
        alert("خطا در حذف نشان");
      }
    } catch (error) {
      console.error("Error removing bookmark:", error);
      alert("خطا در حذف نشان");
    }
  };

  // تبدیل تاریخ به شمسی
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch (error) {
      return "-";
    }
  };

  return (
    <div className="eventsBookmarkPage">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>رویدادهای نشان شده</h1>
            <p className={styles.subtitle}>
              {total} رویداد نشان شده توسط شما
            </p>
          </div>
          <button
            className={styles.themeToggle}
            onClick={handleToggleTheme}
            title={darkMode ? "حالت روشن" : "حالت تاریک"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        {/* لیست Bookmarks */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>در حال بارگذاری...</p>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🔖</span>
            <h3>هیچ رویدادی نشان نشده است</h3>
            <p>رویدادهایی که نشان می‌کنید اینجا نمایش داده می‌شوند</p>
            <button
              className={styles.exploreBtn}
              onClick={() => router.push("/events")}
            >
              مشاهده رویدادها
            </button>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {bookmarks.map((bookmark) => {
                const event = bookmark.event;
                if (!event) return null;

                return (
                  <div key={bookmark._id} className={styles.card}>
                    {/* تصویر رویداد */}
                    {event.images && event.images.length > 0 && (
                      <div className={styles.cardImage}>
                        <img
                          src={event.images[0]?.url || event.images[0]}
                          alt={event.title}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                        {event.visibility?.level === "private" && (
                          <span className={styles.privateBadge}>🔒 خصوصی</span>
                        )}
                      </div>
                    )}

                    {/* محتوا */}
                    <div className={styles.cardContent}>
                      <h3 className={styles.cardTitle}>{event.title}</h3>
                      
                      <div className={styles.cardMeta}>
                        {event.topicCategory && (
                          <div className={styles.metaItem}>
                            <span className={styles.metaIcon}>
                              {event.topicCategory.icon || "📂"}
                            </span>
                            <span>{event.topicCategory.title}</span>
                          </div>
                        )}
                        
                        {event.startDate && (
                          <div className={styles.metaItem}>
                            <span className={styles.metaIcon}>📅</span>
                            <span>{formatDate(event.startDate)}</span>
                          </div>
                        )}
                      </div>

                      <div className={styles.cardFooter}>
                        <div className={styles.cardInfo}>
                          <span className={styles.views}>
                            👁️ {event.views || 0} بازدید
                          </span>
                          <span className={styles.bookmarkDate}>
                            نشان شده: {formatDate(bookmark.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* دکمه‌های عملیات */}
                    <div className={styles.cardActions}>
                      <button
                        className={styles.viewBtn}
                        onClick={() => router.push(`/events/${event.slug || event._id}`)}
                        title="مشاهده رویداد"
                      >
                        👁️ مشاهده
                      </button>
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRemoveBookmark(bookmark._id, event._id)}
                        title="حذف نشان"
                      >
                        ⭐ حذف نشان
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  قبلی
                </button>
                <span className={styles.pageInfo}>
                  صفحه {currentPage} از {totalPages}
                </span>
                <button
                  className={styles.pageBtn}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  بعدی
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


