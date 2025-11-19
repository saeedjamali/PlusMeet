"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./eventmanagment.module.css";
import "./eventmanagmentDark.css";
import { getTheme, applyTheme, toggleTheme, THEME } from "@/lib/utils/themeManager";

export default function EventManagementPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionType, setActionType] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

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

  // دریافت رویدادها
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
      });

      if (selectedStatus !== "all") {
        params.append("status", selectedStatus);
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/dashboard/eventmanagment?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("خطا در دریافت رویدادها");
      }

      const data = await response.json();
      setEvents(data.data || []);
      setStats(data.stats || {});
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error("Error fetching events:", error);
      alert("خطا در دریافت رویدادها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentPage, selectedStatus, searchQuery]);

  // تغییر وضعیت رویداد
  const handleAction = async () => {
    if (!selectedEvent || !actionType) return;

    try {
      const body = {
        eventId: selectedEvent._id,
        action: actionType,
      };

      if (actionType === "reject" && rejectionReason) {
        body.rejectionReason = rejectionReason;
      }

      const response = await fetch("/api/dashboard/eventmanagment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("خطا در تغییر وضعیت رویداد");
      }

      const data = await response.json();
      alert(data.message);
      setShowActionModal(false);
      setSelectedEvent(null);
      setActionType("");
      setRejectionReason("");
      fetchEvents();
    } catch (error) {
      console.error("Error updating event:", error);
      alert("خطا در تغییر وضعیت رویداد");
    }
  };

  // باز کردن مودال عملیات
  const openActionModal = (event, action) => {
    setSelectedEvent(event);
    setActionType(action);
    setShowActionModal(true);
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

  // Badge وضعیت
  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: "پیش‌نویس", color: "#9e9e9e" },
      pending: { label: "در انتظار تایید", color: "#ff9800" },
      approved: { label: "تایید شده", color: "#4caf50" },
      rejected: { label: "رد شده", color: "#f44336" },
      suspended: { label: "تعلیق", color: "#673ab7" },
      expired: { label: "منقضی شده", color: "#607d8b" },
      deleted: { label: "حذف شده", color: "#000000" },
    };

    const config = statusConfig[status] || { label: status, color: "#9e9e9e" };
    return (
      <span
        className={styles.statusBadge}
        style={{ backgroundColor: config.color }}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="eventManagementPage">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>مدیریت رویدادها</h1>
            <p className={styles.subtitle}>
              مدیریت و نظارت بر تمام رویدادهای سیستم
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

        {/* آمار */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard} onClick={() => setSelectedStatus("all")}>
            <span className={styles.statIcon}>📊</span>
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{stats.total || 0}</h3>
              <p className={styles.statLabel}>کل رویدادها</p>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => setSelectedStatus("pending")}>
            <span className={styles.statIcon}>⏳</span>
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{stats.pending || 0}</h3>
              <p className={styles.statLabel}>در انتظار تایید</p>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => setSelectedStatus("approved")}>
            <span className={styles.statIcon}>✅</span>
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{stats.approved || 0}</h3>
              <p className={styles.statLabel}>تایید شده</p>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => setSelectedStatus("rejected")}>
            <span className={styles.statIcon}>❌</span>
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{stats.rejected || 0}</h3>
              <p className={styles.statLabel}>رد شده</p>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => setSelectedStatus("suspended")}>
            <span className={styles.statIcon}>⚠️</span>
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{stats.suspended || 0}</h3>
              <p className={styles.statLabel}>تعلیق</p>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => setSelectedStatus("expired")}>
            <span className={styles.statIcon}>⏰</span>
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{stats.expired || 0}</h3>
              <p className={styles.statLabel}>منقضی شده</p>
            </div>
          </div>
        </div>

        {/* فیلترها */}
        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="جستجو در عنوان و توضیحات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={styles.statusFilter}
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="draft">پیش‌نویس</option>
            <option value="pending">در انتظار تایید</option>
            <option value="approved">تایید شده</option>
            <option value="rejected">رد شده</option>
            <option value="suspended">تعلیق</option>
            <option value="expired">منقضی شده</option>
          </select>
        </div>

        {/* لیست رویدادها */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>در حال بارگذاری...</p>
          </div>
        ) : events.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📭</span>
            <p>رویدادی یافت نشد</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>عنوان رویداد</th>
                    <th>سازنده</th>
                    <th>دسته‌بندی</th>
                    <th>وضعیت</th>
                    <th>تاریخ شروع</th>
                    <th>بازدید</th>
                    <th>تاریخ ایجاد</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event._id}>
                      <td>
                        <div className={styles.eventTitle}>
                          {event.title}
                          {event.visibility?.level === "private" && (
                            <span className={styles.privateIcon} title="خصوصی">
                              🔒
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.creator}>
                          {event.creator?.displayName ||
                            `${event.creator?.firstName || ""} ${
                              event.creator?.lastName || ""
                            }` ||
                            "-"}
                        </div>
                      </td>
                      <td>{event.topicCategory?.title || "-"}</td>
                      <td>{getStatusBadge(event.status)}</td>
                      <td>{formatDate(event.startDate)}</td>
                      <td className={styles.views}>{event.views || 0}</td>
                      <td>{formatDate(event.createdAt)}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => router.push(`/events/${event.slug || event._id}`)}
                            title="مشاهده"
                          >
                            👁️
                          </button>
                          <button
                            className={styles.actionBtn}
                            onClick={() => router.push(`/dashboard/events/${event._id}/edit`)}
                            title="ویرایش"
                          >
                            ✏️
                          </button>
                          {event.status === "pending" && (
                            <>
                              <button
                                className={`${styles.actionBtn} ${styles.approve}`}
                                onClick={() => openActionModal(event, "approve")}
                                title="تایید"
                              >
                                ✅
                              </button>
                              <button
                                className={`${styles.actionBtn} ${styles.reject}`}
                                onClick={() => openActionModal(event, "reject")}
                                title="رد"
                              >
                                ❌
                              </button>
                            </>
                          )}
                          {event.status === "approved" && (
                            <button
                              className={`${styles.actionBtn} ${styles.suspend}`}
                              onClick={() => openActionModal(event, "suspend")}
                              title="تعلیق"
                            >
                              ⚠️
                            </button>
                          )}
                          {event.status === "suspended" && (
                            <button
                              className={`${styles.actionBtn} ${styles.activate}`}
                              onClick={() => openActionModal(event, "activate")}
                              title="فعال‌سازی"
                            >
                              🔓
                            </button>
                          )}
                          <button
                            className={`${styles.actionBtn} ${styles.delete}`}
                            onClick={() => openActionModal(event, "delete")}
                            title="حذف"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  بعدی
                </button>
              </div>
            )}
          </>
        )}

        {/* Modal عملیات */}
        {showActionModal && selectedEvent && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowActionModal(false)}
          >
            <div
              className={styles.modal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3>تایید عملیات</h3>
                <button
                  className={styles.modalClose}
                  onClick={() => setShowActionModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className={styles.modalBody}>
                <p>
                  آیا از{" "}
                  <strong>
                    {actionType === "approve" && "تایید"}
                    {actionType === "reject" && "رد"}
                    {actionType === "suspend" && "تعلیق"}
                    {actionType === "activate" && "فعال‌سازی"}
                    {actionType === "delete" && "حذف"}
                  </strong>{" "}
                  رویداد <strong>{selectedEvent.title}</strong> اطمینان دارید؟
                </p>

                {actionType === "reject" && (
                  <div className={styles.formGroup}>
                    <label>دلیل رد:</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="دلیل رد رویداد را وارد کنید..."
                      className={styles.textarea}
                      rows={4}
                    />
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setShowActionModal(false)}
                >
                  انصراف
                </button>
                <button
                  className={styles.confirmBtn}
                  onClick={handleAction}
                >
                  تایید
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

