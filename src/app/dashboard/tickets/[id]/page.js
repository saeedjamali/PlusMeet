"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/NewAuthContext";
import { useRouter, useParams } from "next/navigation";
import styles from "./ticketDetail.module.css";

export default function TicketDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id;

  const [ticket, setTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [replyImage, setReplyImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Reassign (ارجاع) states
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Staff check - از دیتابیس (user.isStaff) به جای hardcode
  const isStaff = user?.isStaff || false;
  console.log("isStaff----->",  user);
// console.log(first)
  useEffect(() => {
    if (ticketId) {
      loadTicket(); // بارگذاری اولیه تیکت
    }
  }, [ticketId]);

  useEffect(() => {
    if (isStaff) {
      fetchCategories(); // بارگذاری موضوعات برای ارجاع
    }
  }, [isStaff]);

  // بارگذاری تیکت و ثبت زمان مشاهده
  const loadTicket = async () => {
    await fetchTicket();
    await fetchReplies();
    await markAsViewed(); // ثبت زمان مشاهده
    await fetchTicket(); // دوباره fetch برای گرفتن تاریخ به‌روز شده
  };

  const markAsViewed = async () => {
    try {
      await fetch(`/api/tickets/${ticketId}/view`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error marking ticket as viewed:", error);
    }
  };

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tickets/${ticketId}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        setTicket(data.data.ticket);
      } else {
        alert(data.error || "خطا در دریافت تیکت");
        router.push("/dashboard/ticketList");
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
      alert("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/replies`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        setReplies(data.data.replies);
      }
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("فقط فایل‌های تصویری مجاز هستند");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("حجم تصویر نباید بیشتر از 2 مگابایت باشد");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setReplyImage(base64String);
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setReplyImage(null);
    setImagePreview(null);
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();

    if (!replyText.trim()) {
      alert("لطفاً متن پاسخ را وارد کنید");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/tickets/${ticketId}/reply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: replyText,
          image: replyImage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ پاسخ با موفقیت ارسال شد");
        setReplyText("");
        setReplyImage(null);
        setImagePreview(null);
        fetchReplies();
        fetchTicket(); // برای به‌روزرسانی تعداد پاسخ‌ها
      } else {
        alert(data.error || "خطا در ارسال پاسخ");
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      alert("خطا در ارتباط با سرور");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    // 🔒 Guard: فقط کارشناس (assignedTo یا staff) می‌تواند وضعیت را تغییر دهد
    // سازنده نمی‌تواند وضعیت را تغییر دهد
    const isCreator =
      ticket?.creator?._id === user?.id || ticket?.creator === user?.id;
    const isAssignedTo =
      ticket?.assignedTo?._id === user?.id || ticket?.assignedTo === user?.id;
    const canManageTicket = (isStaff || isAssignedTo) && !isCreator;

    if (!canManageTicket) {
      alert("❌ فقط کارشناس مسئول می‌تواند وضعیت تیکت را تغییر دهد");
      console.error("🚫 Access Denied: User cannot manage this ticket");
      return;
    }

    if (
      !confirm(
        `آیا مطمئن هستید که می‌خواهید وضعیت را به "${getStatusLabel(
          newStatus
        )}" تغییر دهید؟`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ وضعیت تیکت با موفقیت تغییر کرد");
        fetchTicket();
      } else {
        alert(data.error || "خطا در تغییر وضعیت");
      }
    } catch (error) {
      console.error("Error changing status:", error);
      alert("خطا در ارتباط با سرور");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/tickets/categories", {
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

  const handleReassignClick = () => {
    setSelectedCategory("");
    setShowReassignModal(true);
  };

  const handleReassign = async () => {
    if (!selectedCategory) {
      alert("لطفاً یک موضوع انتخاب کنید");
      return;
    }

    if (
      !confirm(
        "آیا مطمئن هستید که می‌خواهید این تیکت را به موضوع دیگری ارجاع دهید؟"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/tickets/${ticketId}/reassign`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newCategoryId: selectedCategory }),
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ تیکت با موفقیت ارجاع شد");
        setShowReassignModal(false);
        router.push("/dashboard/ticketList");
      } else {
        alert(data.error || "خطا در ارجاع تیکت");
      }
    } catch (error) {
      console.error("Error reassigning ticket:", error);
      alert("خطا در ارتباط با سرور");
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      open: "باز",
      in_progress: "در حال بررسی",
      pending: "در انتظار پاسخ",
      resolved: "حل شده",
      closed: "بسته شده",
      reopened: "بازگشایی شده",
    };
    return statusMap[status] || status;
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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>در حال بارگذاری...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>تیکت یافت نشد</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          ← بازگشت
        </button>
        <h1 className={styles.title}>جزئیات تیکت #{ticket.ticketNumber}</h1>
      </div>

      {/* Ticket Info Card */}
      <div className={styles.ticketCard}>
        {/* نمایش banner ارجاع برای سازنده */}
        {ticket.assignmentHistory &&
          ticket.assignmentHistory.length > 0 &&
          (ticket.creator?._id === user?.id || ticket.creator === user?.id) && (
            <div className={styles.reassignedBanner}>
              <div className={styles.reassignedIcon}>🔄</div>
              <div className={styles.reassignedContent}>
                <div className={styles.reassignedTitle}>تیکت ارجاع شده</div>
                <div className={styles.reassignedMessage}>
                  این تیکت به{" "}
                  <strong>
                    {ticket.assignedTo?.displayName ||
                      ticket.assignedRole?.name ||
                      "کارشناس دیگر"}
                  </strong>{" "}
                  ارجاع شده است و وضعیت آن{" "}
                  <strong>{getStatusLabel(ticket.status)}</strong> می‌باشد.
                </div>
              </div>
            </div>
          )}

        <div className={styles.ticketHeader}>
          <div className={styles.ticketMeta}>
            <span className={styles.category}>
              {ticket.category?.icon} {ticket.category?.title}
            </span>
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
          </div>

          {/* Status Actions (برای کارشناس/assignedTo - نه سازنده) */}
          {(() => {
            const isCreator =
              ticket.creator?._id === user?.id || ticket.creator === user?.id;
            const isAssignedTo =
              ticket.assignedTo?._id === user?.id ||
              ticket.assignedTo === user?.id;
            const canManageTicket = (isStaff || isAssignedTo) && !isCreator;

            return canManageTicket ? (
              <div className={styles.statusActions}>
                <select
                  className={styles.statusSelect}
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="open">باز</option>
                  <option value="in_progress">در حال بررسی</option>
                  <option value="pending">در انتظار پاسخ</option>
                  <option value="resolved">حل شده</option>
                  <option value="closed">بسته شده</option>
                  <option value="reopened">بازگشایی شده</option>
                </select>
                <button
                  className={styles.reassignButton}
                  onClick={handleReassignClick}
                  title="ارجاع تیکت به موضوع دیگر"
                >
                  🔄 ارجاع
                </button>
              </div>
            ) : null;
          })()}
        </div>

        <h2 className={styles.ticketSubject}>{ticket.subject}</h2>
        <p className={styles.ticketDescription}>{ticket.description}</p>

        {/* Attachments */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div className={styles.attachments}>
            <h3>تصاویر پیوست:</h3>
            <div className={styles.attachmentGrid}>
              {ticket.attachments
                .filter((att) => att.type === "image")
                .map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.attachmentItem}
                  >
                    <img src={att.url} alt={`Attachment ${idx + 1}`} />
                  </a>
                ))}
            </div>
          </div>
        )}

        {/* Ticket Info Footer */}
        <div className={styles.ticketFooter}>
          <div className={styles.ticketInfoItem}>
            <strong>ایجاد کننده:</strong>{" "}
            {ticket.creator?.displayName || "ناشناس"}
          </div>
          <div className={styles.ticketInfoItem}>
            <strong>ارجاع به:</strong>{" "}
            {ticket.assignedTo?.displayName ||
              ticket.assignedRole?.name ||
              "نامشخص"}
          </div>
          <div className={styles.ticketInfoItem}>
            <strong>تاریخ ایجاد:</strong>{" "}
            {new Date(ticket.createdAt).toLocaleDateString("fa-IR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div className={styles.ticketInfoItem}>
            <strong>تعداد پاسخ:</strong> {ticket.replyCount || 0}
          </div>

          {/* تاریخ آخرین مشاهده صفحه - با هر باز شدن صفحه، به‌روز می‌شود */}
          {(() => {
            const isCreator =
              ticket.creator?._id === user?.id || ticket.creator === user?.id;

            // منطق نمایش:
            // من سازنده‌ام → نشان بده کارشناس کی دیده (lastViewedByStaff)
            // من کارشناس‌ام → نشان بده سازنده کی دیده (lastViewedByCreator)
            const lastViewed = isCreator
              ? ticket.lastViewedByStaff // کارشناس کی دیده؟
              : ticket.lastViewedByCreator; // سازنده کی دیده؟

            return (
              <div className={styles.ticketInfoItem}>
                <strong>👁️ آخرین بار طرف مقابل این صفحه را دیده:</strong>{" "}
                {lastViewed ? (
                  <span style={{ color: "#22c55e" }}>
                    {new Date(lastViewed).toLocaleDateString("fa-IR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : (
                  <span style={{ color: "#ef4444", fontStyle: "italic" }}>
                    هنوز مشاهده نکرده
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Replies Section */}
      <div className={styles.repliesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>💬 پاسخ‌ها ({replies.length})</h2>

          {/* نمایش "پیام جدید" براساس counter */}
          {(() => {
            const isCreator =
              ticket?.creator?._id === user?.id || ticket?.creator === user?.id;
            const unreadCount = isCreator
              ? ticket?.unreadCountForCreator
              : ticket?.unreadCountForStaff;

            if (unreadCount > 0) {
              return (
                <div className={styles.newMessageBadge}>
                  🔔 {unreadCount} پیام جدید
                </div>
              );
            }
            return null;
          })()}
        </div>

        {replies.length === 0 ? (
          <div className={styles.noReplies}>هنوز پاسخی ثبت نشده است</div>
        ) : (
          <div className={styles.repliesList}>
            {replies.map((reply) => {
              const isMyReply = reply.sender?._id === user?.id;

              // تعیین نوع پاسخ براساس replyType
              const replyType = reply.replyType || "other";
              const isCreatorReply = replyType === "creator";
              const isAssignedReply = replyType === "assigned";

              return (
                <div
                  key={reply._id}
                  className={`${styles.replyCard} ${
                    isAssignedReply ? styles.replyStaff : styles.replyUser
                  } ${isMyReply ? styles.replyMine : ""}`}
                >
                  <div className={styles.replyHeader}>
                    <div className={styles.replyAuthor}>
                      <img
                        src={
                          reply.sender?.avatar
                            ? reply.sender.avatar.startsWith("/") ||
                              reply.sender.avatar.startsWith("http")
                              ? reply.sender.avatar
                              : `/api/uploads/${reply.sender.avatar}`
                            : "/images/default-avatar.png"
                        }
                        alt={reply.sender?.displayName}
                        className={styles.replyAvatar}
                        onError={(e) => {
                          // جلوگیری از loop - فقط یک بار تغییر دهید
                          if (
                            e.target.src !==
                            window.location.origin +
                              "/images/default-avatar.png"
                          ) {
                            e.target.src = "/images/default-avatar.png";
                          }
                          // حذف onError برای جلوگیری از loop
                          e.target.onerror = null;
                        }}
                      />
                      <div className={styles.replyAuthorInfo}>
                        <div className={styles.replyAuthorName}>
                          {reply.sender?.displayName || "ناشناس"}
                        </div>
                        <div className={styles.replyBadges}>
                          {isCreatorReply && (
                            <span className={styles.creatorBadge}>
                              سازنده تیکت
                            </span>
                          )}
                          {isAssignedReply && (
                            <span className={styles.staffBadge}>پاسخگو</span>
                          )}
                          {isMyReply && (
                            <span className={styles.meBadge}>شما</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={styles.replyDate}>
                      {new Date(reply.createdAt).toLocaleDateString("fa-IR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div className={styles.replyMessage}>{reply.message}</div>

                  {reply.attachments && reply.attachments.length > 0 && (
                    <div className={styles.replyAttachments}>
                      {reply.attachments
                        .filter((att) => att.type === "image")
                        .map((att, idx) => (
                          <a
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.replyAttachmentItem}
                          >
                            <img
                              src={att.url}
                              alt={`Reply attachment ${idx + 1}`}
                              onError={(e) => {
                                console.error("Failed to load image:", att.url);
                                e.target.style.display = "none";
                                // حذف onError برای جلوگیری از loop
                                e.target.onerror = null;
                              }}
                            />
                          </a>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reply Form */}
      {ticket.status !== "closed" && (
        <div className={styles.replyFormSection}>
          <h2 className={styles.sectionTitle}>✍️ ارسال پاسخ</h2>
          <form onSubmit={handleSubmitReply} className={styles.replyForm}>
            <div className={styles.formGroup}>
              <label>پیام شما:</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="پاسخ خود را اینجا بنویسید..."
                rows={5}
                required
              />
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
                      id="replyImage"
                    />
                    <label htmlFor="replyImage" className={styles.uploadLabel}>
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
                type="submit"
                className={styles.submitBtn}
                disabled={submitting}
              >
                {submitting ? "در حال ارسال..." : "ارسال پاسخ"}
              </button>
            </div>
          </form>
        </div>
      )}

      {ticket.status === "closed" && (
        <div className={styles.closedMessage}>
          ⚠️ این تیکت بسته شده است و امکان ارسال پاسخ جدید وجود ندارد.
        </div>
      )}

      {/* Modal ارجاع تیکت */}
      {showReassignModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowReassignModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>🔄 ارجاع تیکت</h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowReassignModal(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.reassignDescription}>
                این تیکت به موضوع دیگری ارجاع می‌شود و از لیست شما خارج خواهد
                شد.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span className={styles.required}>*</span> موضوع جدید:
                </label>
                <select
                  className={styles.select}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">انتخاب موضوع...</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.icon} {cat.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowReassignModal(false)}
              >
                انصراف
              </button>
              <button
                className={styles.reassignConfirmBtn}
                onClick={handleReassign}
                disabled={!selectedCategory}
              >
                تأیید ارجاع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
