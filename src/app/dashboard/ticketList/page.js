"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/NewAuthContext";
import { useRouter } from "next/navigation";
import styles from "./ticketList.module.css";

export default function TicketListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
    search: "",
    myTickets: false,
    assignedToMe: false,
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Create form
  const [formData, setFormData] = useState({
    category: "",
    subject: "",
    description: "",
    priority: "medium",
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [filters, pagination.page]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/tickets/categories?activeOnly=true", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.category && { category: filters.category }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && { search: filters.search }),
        ...(filters.myTickets && { myTickets: "true" }),
        ...(filters.assignedToMe && { assignedToMe: "true" }),
      });

      const response = await fetch(`/api/tickets?${params}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        setTickets(data.data.tickets);
        setPagination((prev) => ({
          ...prev,
          total: data.data.pagination.total,
          pages: data.data.pagination.pages,
        }));

        // 🔍 Debug: نمایش counter ها برای هر تیکت
        console.log(
          "\n╔══════════════════════════════════════════════════════════════╗"
        );
        console.log(
          "║   🎫 Ticket Counters Debug                                   ║"
        );
        console.log(
          "╚══════════════════════════════════════════════════════════════╝\n"
        );
        console.log(
          `👤 Current User: ${
            user?.displayName || user?.phoneNumber || "Unknown"
          }`
        );
        console.log(`🔍 Full User Object:`, user);
        console.log(`📋 User ID (user.id): ${user?.id}`);
        console.log(`📋 User ID (user._id): ${user?._id}\n`);

        data.data.tickets.forEach((ticket, idx) => {
          const isCreator =
            ticket.creator?._id === user?.id || ticket.creator === user?.id;
          const unreadCount = isCreator
            ? ticket.unreadCountForCreator
            : ticket.unreadCountForStaff;

          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`${idx + 1}. Ticket #${ticket.ticketNumber}`);
          console.log(
            `   Creator: ${
              ticket.creator?.displayName || ticket.creator?._id || "Unknown"
            }`
          );
          console.log(
            `   Creator ID: ${ticket.creator?._id || ticket.creator || "N/A"}`
          );
          console.log(`   Am I Creator? ${isCreator ? "✅ YES" : "❌ NO"}`);
          console.log(`   📊 Counter in DB:`);
          console.log(
            `      unreadCountForCreator: ${ticket.unreadCountForCreator || 0}`
          );
          console.log(
            `      unreadCountForStaff: ${ticket.unreadCountForStaff || 0}`
          );
          console.log(`   👁️ Counter I see: ${unreadCount || 0}`);
          console.log(
            `   🎯 Badge shown: ${
              unreadCount > 0 ? `YES (🔔 ${unreadCount} پیام جدید)` : "NO"
            }`
          );
        });

        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // بررسی نوع فایل
    if (!file.type.startsWith("image/")) {
      alert("فقط فایل‌های تصویری مجاز هستند");
      return;
    }

    // بررسی حجم (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("حجم تصویر نباید بیشتر از 2 مگابایت باشد");
      return;
    }

    // تبدیل به base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setFormData((prev) => ({
        ...prev,
        image: base64String,
      }));
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: null,
    }));
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category || !formData.subject || !formData.description) {
      alert("موضوع، عنوان و توضیحات الزامی است");
      return;
    }

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ تیکت با موفقیت ایجاد شد");
        setShowCreateModal(false);
        setFormData({
          category: "",
          subject: "",
          description: "",
          priority: "medium",
          image: null,
        });
        setImagePreview(null);
        fetchTickets();
      } else {
        alert(data.error || "خطا در ایجاد تیکت");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("خطا در ارتباط با سرور");
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      open: { label: "باز", class: styles.statusOpen },
      in_progress: { label: "در حال بررسی", class: styles.statusInProgress },
      pending: { label: "در انتظار پاسخ", class: styles.statusPending },
      resolved: { label: "حل شده", class: styles.statusResolved },
      closed: { label: "بسته شده", class: styles.statusClosed },
      reopened: { label: "بازگشایی شده", class: styles.statusReopened },
    };
    const statusInfo = statusMap[status] || { label: status, class: "" };
    return (
      <span className={`${styles.statusBadge} ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      low: { label: "کم", class: styles.priorityLow },
      medium: { label: "متوسط", class: styles.priorityMedium },
      high: { label: "زیاد", class: styles.priorityHigh },
      urgent: { label: "فوری", class: styles.priorityUrgent },
    };
    const priorityInfo = priorityMap[priority] || {
      label: priority,
      class: "",
    };
    return (
      <span className={`${styles.priorityBadge} ${priorityInfo.class}`}>
        {priorityInfo.label}
      </span>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🎫 تیکت‌های پشتیبانی</h1>
          <p className={styles.subtitle}>مشاهده و مدیریت تیکت‌های شما</p>
        </div>
        <button
          className={styles.createBtn}
          onClick={() => setShowCreateModal(true)}
        >
          ➕ تیکت جدید
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filtersRow}>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className={styles.filterSelect}
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="open">باز</option>
            <option value="in_progress">در حال بررسی</option>
            <option value="pending">در انتظار پاسخ</option>
            <option value="resolved">حل شده</option>
            <option value="closed">بسته شده</option>
            <option value="reopened">بازگشایی شده</option>
          </select>

          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className={styles.filterSelect}
          >
            <option value="">همه موضوعات</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.icon} {cat.title}
              </option>
            ))}
          </select>

          <select
            name="priority"
            value={filters.priority}
            onChange={handleFilterChange}
            className={styles.filterSelect}
          >
            <option value="">همه اولویت‌ها</option>
            <option value="low">کم</option>
            <option value="medium">متوسط</option>
            <option value="high">زیاد</option>
            <option value="urgent">فوری</option>
          </select>

          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="جستجو در عنوان یا شماره تیکت..."
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filtersRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="myTickets"
              checked={filters.myTickets}
              onChange={handleFilterChange}
            />
            <span>تیکت‌های من</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="assignedToMe"
              checked={filters.assignedToMe}
              onChange={handleFilterChange}
            />
            <span>ارجاع شده به من</span>
          </label>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className={styles.loading}>در حال بارگذاری...</div>
      ) : tickets.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📭</div>
          <p>تیکتی یافت نشد</p>
          <button
            className={styles.emptyBtn}
            onClick={() => setShowCreateModal(true)}
          >
            ➕ ایجاد اولین تیکت
          </button>
        </div>
      ) : (
        <>
          <div className={styles.ticketsList}>
            {tickets.map((ticket) => (
              <div
                key={ticket._id}
                className={styles.ticketCard}
                onClick={() => router.push(`/dashboard/tickets/${ticket._id}`)}
              >
                <div className={styles.ticketHeader}>
                  <div className={styles.ticketNumber}>
                    #{ticket.ticketNumber}
                    {/* نمایش "پیام جدید" با تعداد */}
                    {(() => {
                      const isCreator =
                        ticket.creator?._id === user?.id ||
                        ticket.creator === user?.id;
                      const unreadCount = isCreator
                        ? ticket.unreadCountForCreator
                        : ticket.unreadCountForStaff;

                      if (unreadCount > 0) {
                        return (
                          <span className={styles.newMessageBadge}>
                            🔔 {unreadCount} پیام جدید
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className={styles.ticketBadges}>
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                  </div>
                </div>

                <div className={styles.ticketBody}>
                  <div className={styles.ticketCategory}>
                    {ticket.category?.icon} {ticket.category?.title}
                  </div>
                  <h3 className={styles.ticketSubject}>{ticket.subject}</h3>
                  <p className={styles.ticketDescription}>
                    {ticket.description.substring(0, 100)}
                    {ticket.description.length > 100 && "..."}
                  </p>
                  {ticket.attachments && ticket.attachments.length > 0 && (
                    <div className={styles.ticketAttachments}>
                      {ticket.attachments
                        .filter((att) => att.type === "image")
                        .slice(0, 1)
                        .map((att, idx) => (
                          <img
                            key={idx}
                            src={att.url}
                            alt="Attachment"
                            className={styles.ticketThumbnail}
                          />
                        ))}
                      {ticket.attachments.length > 1 && (
                        <span className={styles.moreAttachments}>
                          +{ticket.attachments.length - 1} فایل دیگر
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.ticketFooter}>
                  <div className={styles.ticketInfo}>
                    <span>👤 {ticket.creator?.displayName || "ناشناس"}</span>
                    <span>💬 {ticket.replyCount} پاسخ</span>
                    <span>
                      📅{" "}
                      {new Date(ticket.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                  {/* {(ticket.hasUnreadUserReply || ticket.hasUnreadStaffReply) && (
                    <span className={styles.unreadBadge}>پیام جدید</span>
                  )} */}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
              >
                قبلی
              </button>
              <span className={styles.pageInfo}>
                صفحه {pagination.page} از {pagination.pages}
              </span>
              <button
                className={styles.pageBtn}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page === pagination.pages}
              >
                بعدی
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>تیکت جدید</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>موضوع تیکت *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">انتخاب موضوع...</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.icon} {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>عنوان *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleFormChange}
                  placeholder="عنوان کوتاه و گویا"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>توضیحات *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="توضیحات کامل مشکل یا سوال خود را بنویسید..."
                  rows={5}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>اولویت</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleFormChange}
                >
                  <option value="low">کم</option>
                  <option value="medium">متوسط</option>
                  <option value="high">زیاد</option>
                  <option value="urgent">فوری</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>تصویر ضمیمه (اختیاری)</label>
                <div className={styles.imageUploadContainer}>
                  {!imagePreview ? (
                    <div className={styles.uploadBox}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className={styles.fileInput}
                        id="ticketImage"
                      />
                      <label
                        htmlFor="ticketImage"
                        className={styles.uploadLabel}
                      >
                        <span className={styles.uploadIcon}>📷</span>
                        <span>انتخاب تصویر</span>
                        <small>حداکثر 2MB</small>
                      </label>
                    </div>
                  ) : (
                    <div className={styles.imagePreviewContainer}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className={styles.imagePreview}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className={styles.removeImageBtn}
                      >
                        ✕ حذف تصویر
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowCreateModal(false)}
                >
                  لغو
                </button>
                <button type="submit" className={styles.submitBtn}>
                  ایجاد تیکت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
