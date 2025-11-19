"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./eventsReport.module.css";
import "./eventsReportDark.css";
import { getTheme, applyTheme, toggleTheme, THEME } from "@/lib/utils/themeManager";
import {
  getReportCategoryLabel,
  getReportStatusLabel,
  getReportPriorityLabel,
} from "@/lib/utils/reportHelpers";

export default function EventsReportPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [responseData, setResponseData] = useState({
    status: "",
    priority: "",
    responseMessage: "",
    action: "",
    note: "",
  });

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

  // دریافت گزارشات
  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
      });

      if (selectedStatus !== "all") {
        params.append("status", selectedStatus);
      }
      if (selectedPriority !== "all") {
        params.append("priority", selectedPriority);
      }
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }

      const response = await fetch(`/api/dashboard/eventsReport?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("خطا در دریافت گزارشات");
      }

      const data = await response.json();
      setReports(data.data || []);
      setStats(data.stats || {});
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error("Error fetching reports:", error);
      alert("خطا در دریافت گزارشات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [currentPage, selectedStatus, selectedPriority, selectedCategory]);

  // باز کردن modal پاسخ
  const openResponseModal = (report) => {
    setSelectedReport(report);
    setResponseData({
      status: report.status,
      priority: report.priority,
      responseMessage: "",
      action: "",
      note: "",
    });
    setShowResponseModal(true);
  };

  // ارسال پاسخ
  const handleSubmitResponse = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/dashboard/eventsReport", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reportId: selectedReport._id,
          ...responseData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "پاسخ با موفقیت ارسال شد");
        setShowResponseModal(false);
        setSelectedReport(null);
        fetchReports();
      } else {
        alert(data.error || "خطا در ارسال پاسخ");
      }
    } catch (error) {
      console.error("Error responding to report:", error);
      alert("خطا در ارسال پاسخ");
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
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (error) {
      return "-";
    }
  };

  // Badge وضعیت
  const getStatusBadge = (status) => {
    const colors = {
      pending: "#ff9800",
      reviewing: "#2196f3",
      resolved: "#4caf50",
      rejected: "#f44336",
      closed: "#9e9e9e",
    };

    return (
      <span
        className={styles.statusBadge}
        style={{ backgroundColor: colors[status] || "#9e9e9e" }}
      >
        {getReportStatusLabel(status)}
      </span>
    );
  };

  // Badge اولویت
  const getPriorityBadge = (priority) => {
    const colors = {
      low: "#4caf50",
      medium: "#ff9800",
      high: "#f44336",
      urgent: "#9c27b0",
    };

    return (
      <span
        className={styles.priorityBadge}
        style={{ backgroundColor: colors[priority] || "#9e9e9e" }}
      >
        {getReportPriorityLabel(priority)}
      </span>
    );
  };

  return (
    <div className="eventsReportPage">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>گزارشات تخلف</h1>
            <p className={styles.subtitle}>
              مدیریت و پاسخگویی به گزارشات کاربران
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
              <p className={styles.statLabel}>کل گزارشات</p>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => setSelectedStatus("pending")}>
            <span className={styles.statIcon}>⏳</span>
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{stats.pending || 0}</h3>
              <p className={styles.statLabel}>در انتظار بررسی</p>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => setSelectedStatus("reviewing")}>
            <span className={styles.statIcon}>🔍</span>
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{stats.reviewing || 0}</h3>
              <p className={styles.statLabel}>در حال بررسی</p>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => setSelectedStatus("resolved")}>
            <span className={styles.statIcon}>✅</span>
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{stats.resolved || 0}</h3>
              <p className={styles.statLabel}>حل شده</p>
            </div>
          </div>
        </div>

        {/* فیلترها */}
        <div className={styles.filters}>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="pending">در انتظار بررسی</option>
            <option value="reviewing">در حال بررسی</option>
            <option value="resolved">حل شده</option>
            <option value="rejected">رد شده</option>
            <option value="closed">بسته شده</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">همه اولویت‌ها</option>
            <option value="urgent">فوری</option>
            <option value="high">زیاد</option>
            <option value="medium">متوسط</option>
            <option value="low">کم</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">همه دسته‌بندی‌ها</option>
            <option value="inappropriate_content">محتوای نامناسب</option>
            <option value="spam">هرزنامه</option>
            <option value="misleading">گمراه‌کننده</option>
            <option value="copyright">نقض حق نسخه‌برداری</option>
            <option value="violence">خشونت</option>
            <option value="harassment">آزار و اذیت</option>
            <option value="scam">کلاهبرداری</option>
            <option value="other">سایر</option>
          </select>
        </div>

        {/* جدول گزارشات */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>در حال بارگذاری...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📭</span>
            <p>گزارشی یافت نشد</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>گزارش‌دهنده</th>
                    <th>رویداد</th>
                    <th>دسته‌بندی</th>
                    <th>عنوان</th>
                    <th>وضعیت</th>
                    <th>اولویت</th>
                    <th>تاریخ</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report._id}>
                      <td>
                        {report.reporter?.displayName ||
                          `${report.reporter?.firstName || ""} ${
                            report.reporter?.lastName || ""
                          }` ||
                          "-"}
                      </td>
                      <td>{report.event?.title || "-"}</td>
                      <td>{getReportCategoryLabel(report.category)}</td>
                      <td className={styles.reportTitle}>{report.title}</td>
                      <td>{getStatusBadge(report.status)}</td>
                      <td>{getPriorityBadge(report.priority)}</td>
                      <td>{formatDate(report.createdAt)}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.viewBtn}
                            onClick={() => openResponseModal(report)}
                            title="مشاهده و پاسخ"
                          >
                            👁️
                          </button>
                          {report.event && (
                            <button
                              className={styles.eventBtn}
                              onClick={() =>
                                router.push(`/events/${report.event.slug || report.event._id}`)
                              }
                              title="مشاهده رویداد"
                            >
                              🔗
                            </button>
                          )}
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

        {/* Modal پاسخ */}
        {showResponseModal && selectedReport && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowResponseModal(false)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleSubmitResponse}>
                <div className={styles.modalHeader}>
                  <h3>پاسخ به گزارش</h3>
                  <button
                    type="button"
                    className={styles.modalClose}
                    onClick={() => setShowResponseModal(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.modalBody}>
                  {/* اطلاعات گزارش */}
                  <div className={styles.reportInfo}>
                    <p>
                      <strong>گزارش‌دهنده:</strong>{" "}
                      {selectedReport.reporter?.displayName || "-"}
                    </p>
                    <p>
                      <strong>رویداد:</strong> {selectedReport.event?.title || "-"}
                    </p>
                    <p>
                      <strong>دسته‌بندی:</strong>{" "}
                      {getReportCategoryLabel(selectedReport.category)}
                    </p>
                    <p>
                      <strong>عنوان:</strong> {selectedReport.title}
                    </p>
                    <p>
                      <strong>توضیحات:</strong> {selectedReport.description}
                    </p>
                  </div>

                  {/* فیلدهای پاسخ */}
                  <div className={styles.formGroup}>
                    <label>وضعیت</label>
                    <select
                      value={responseData.status}
                      onChange={(e) =>
                        setResponseData((prev) => ({ ...prev, status: e.target.value }))
                      }
                      className={styles.select}
                    >
                      <option value="pending">در انتظار بررسی</option>
                      <option value="reviewing">در حال بررسی</option>
                      <option value="resolved">حل شده</option>
                      <option value="rejected">رد شده</option>
                      <option value="closed">بسته شده</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>اولویت</label>
                    <select
                      value={responseData.priority}
                      onChange={(e) =>
                        setResponseData((prev) => ({ ...prev, priority: e.target.value }))
                      }
                      className={styles.select}
                    >
                      <option value="low">کم</option>
                      <option value="medium">متوسط</option>
                      <option value="high">زیاد</option>
                      <option value="urgent">فوری</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>اقدام انجام شده</label>
                    <select
                      value={responseData.action}
                      onChange={(e) =>
                        setResponseData((prev) => ({ ...prev, action: e.target.value }))
                      }
                      className={styles.select}
                    >
                      <option value="">انتخاب کنید</option>
                      <option value="no_action">بدون اقدام</option>
                      <option value="warning_to_creator">اخطار به سازنده</option>
                      <option value="event_suspended">تعلیق رویداد</option>
                      <option value="event_deleted">حذف رویداد</option>
                      <option value="user_warned">اخطار به کاربر</option>
                      <option value="user_suspended">تعلیق کاربر</option>
                      <option value="other">سایر</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>پیام پاسخ</label>
                    <textarea
                      value={responseData.responseMessage}
                      onChange={(e) =>
                        setResponseData((prev) => ({
                          ...prev,
                          responseMessage: e.target.value,
                        }))
                      }
                      placeholder="پیام خود را برای گزارش‌دهنده وارد کنید..."
                      rows={4}
                      className={styles.textarea}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>یادداشت داخلی</label>
                    <textarea
                      value={responseData.note}
                      onChange={(e) =>
                        setResponseData((prev) => ({ ...prev, note: e.target.value }))
                      }
                      placeholder="یادداشت برای مدیران..."
                      rows={3}
                      className={styles.textarea}
                    />
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setShowResponseModal(false)}
                  >
                    انصراف
                  </button>
                  <button type="submit" className={styles.confirmBtn}>
                    ارسال پاسخ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

