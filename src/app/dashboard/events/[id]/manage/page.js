"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./manage.module.css";
import "./manageDark.css";
import {
  JOIN_REQUEST_STATUS,
  getStatusLabel,
  getStatusColor,
  getStatusIcon,
} from "@/lib/helpers/joinRequestStatus";
import {
  PARTICIPATION_TYPES,
  getDisplayableNextStatuses,
  canUserChangeStatus,
} from "@/lib/utils/joinRequestHelpers";
import dynamic from "next/dynamic";

const EventDiscountModal = dynamic(
  () => import("@/components/modals/EventDiscountModal"),
  { ssr: false }
);

export default function EventManagePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id;

  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, pending, approved, attended
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  // کدهای تخفیف
  const [discountCodes, setDiscountCodes] = useState([]);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [showDiscountSection, setShowDiscountSection] = useState(false);

  // پایان رویداد
  const [finishingEvent, setFinishingEvent] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventData();
      fetchDiscountCodes();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      setError(null);

      // دریافت اطلاعات رویداد و شرکت‌کنندگان
      const [eventRes, participantsRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/participants`),
      ]);

      const eventData = await eventRes.json();
      const participantsData = await participantsRes.json();

      if (!eventRes.ok) {
        throw new Error(eventData.error || "Failed to fetch event");
      }

      setEvent(eventData.event || eventData);
      setParticipants(participantsData.participants || []);
    } catch (err) {
      console.error("Error fetching event data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscountCodes = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/discount-codes`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setDiscountCodes(data.discountCodes || []);
      }
    } catch (err) {
      console.error("Error fetching discount codes:", err);
    }
  };

  const handleDeleteDiscount = async (codeId) => {
    if (!confirm("آیا از حذف این کد تخفیف اطمینان دارید؟")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/events/${eventId}/discount-codes/${codeId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("✅ کد تخفیف با موفقیت حذف شد");
        fetchDiscountCodes();
      } else {
        alert(`❌ ${data.error || "خطا در حذف کد تخفیف"}`);
      }
    } catch (error) {
      console.error("Error deleting discount code:", error);
      alert("❌ خطا در حذف کد تخفیف");
    }
  };

  const handleStatusChange = async (participantId, newStatus, reason = "") => {
    try {
      const response = await fetch(
        `/api/events/${eventId}/manage-participant/${participantId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ newStatus, reason }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // اگر خطای مربوط به موجودی کیف پول است، پیام کامل نمایش بده
        if (data.details && data.details.totalAvailable !== undefined) {
          const details = data.details;
          const message =
            `${data.error}\n\n` +
            `📊 جزئیات کیف پول کاربر:\n` +
            `💰 موجودی قابل استفاده: ${details.availableBalance?.toLocaleString(
              "fa-IR"
            )} ریال\n` +
            `🔒 موجودی رزرو شده: ${details.reservedBalance?.toLocaleString(
              "fa-IR"
            )} ریال\n` +
            `📈 مجموع: ${details.totalAvailable?.toLocaleString(
              "fa-IR"
            )} ریال\n` +
            `🎯 مبلغ مورد نیاز: ${details.requiredAmount?.toLocaleString(
              "fa-IR"
            )} ریال\n` +
            `❌ کمبود: ${details.shortfall?.toLocaleString("fa-IR")} ریال\n\n` +
            `💡 ${data.suggestion || ""}`;
          alert(message);
        } else {
          alert(data.error || "خطا در تغییر وضعیت");
        }
        return;
      }

      // به‌روزرسانی لیست
      await fetchEventData();
      alert(data.message || "وضعیت با موفقیت به‌روزرسانی شد");
    } catch (err) {
      console.error("Error updating status:", err);
      alert(`خطا: ${err.message}`);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedParticipants.length === 0) {
      alert("لطفاً حداقل یک شرکت‌کننده را انتخاب کنید");
      return;
    }

    if (
      !confirm(
        `آیا مطمئن هستید که می‌خواهید ${selectedParticipants.length} نفر را تایید کنید؟`
      )
    ) {
      return;
    }

    try {
      await Promise.all(
        selectedParticipants.map((id) =>
          handleStatusChange(id, JOIN_REQUEST_STATUS.APPROVED)
        )
      );
      setSelectedParticipants([]);
    } catch (err) {
      console.error("Error in bulk approve:", err);
    }
  };

  const handleFinishEvent = async () => {
    // چک کردن نوع رویداد و نمایش هشدار مناسب
    const participationType = event.participationType?.code;
    const isTicketed =
      participationType === "TICKETED" ||
      participationType === "APPROVAL_TICKETED";

    const confirmMessage = isTicketed
      ? `⚠️ توجه: با پایان رویداد، تمامی تسویه‌حساب‌های مالی انجام خواهد شد.\n\nآیا مطمئن هستید که می‌خواهید رویداد را پایان دهید؟`
      : `آیا مطمئن هستید که می‌خواهید رویداد را پایان دهید؟`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setFinishingEvent(true);

      const response = await fetch(`/api/events/${eventId}/finish`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        // اگر درخواست‌های معلق داشتیم
        if (data.hasPendingRequests) {
          const pendingCount = data.pendingCount || 0;
          const message = `⚠️ ${pendingCount} درخواست پیوستن در وضعیت نهایی نیستند.\n\n${data.message}\n\nلطفاً ابتدا وضعیت این درخواست‌ها را در لیست شرکت‌کنندگان مشخص کنید.`;
          alert(message);

          // رفرش اطلاعات تا لیست شرکت‌کنندگان بروز شود
          await fetchEventData();
          return;
        }

        throw new Error(data.error || "خطا در پایان رویداد");
      }

      alert(data.message);
      // رفرش اطلاعات رویداد
      await fetchEventData();
    } catch (err) {
      console.error("Error finishing event:", err);
      alert(err.message || "خطا در پایان رویداد");
    } finally {
      setFinishingEvent(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getFilteredParticipants = () => {
    if (filter === "all") return participants;

    const filterMap = {
      pending: [
        JOIN_REQUEST_STATUS.PENDING,
        JOIN_REQUEST_STATUS.PAYMENT_RESERVED,
      ],
      approved: [
        JOIN_REQUEST_STATUS.APPROVED,
        JOIN_REQUEST_STATUS.PAID,
        JOIN_REQUEST_STATUS.CONFIRMED,
      ],
      attended: [
        JOIN_REQUEST_STATUS.CHECKED_IN,
        JOIN_REQUEST_STATUS.ATTENDED,
        JOIN_REQUEST_STATUS.COMPLETED,
      ],
    };

    return participants.filter((p) => filterMap[filter]?.includes(p.status));
  };

  const getStats = () => {
    const stats = {
      total: participants.length,
      pending: 0,
      approved: 0,
      attended: 0,
      rejected: 0,
    };

    participants.forEach((p) => {
      if (
        [
          JOIN_REQUEST_STATUS.PENDING,
          JOIN_REQUEST_STATUS.PAYMENT_RESERVED,
        ].includes(p.status)
      ) {
        stats.pending++;
      } else if (
        [
          JOIN_REQUEST_STATUS.APPROVED,
          JOIN_REQUEST_STATUS.PAID,
          JOIN_REQUEST_STATUS.CONFIRMED,
        ].includes(p.status)
      ) {
        stats.approved++;
      } else if (
        [
          JOIN_REQUEST_STATUS.CHECKED_IN,
          JOIN_REQUEST_STATUS.ATTENDED,
          JOIN_REQUEST_STATUS.COMPLETED,
        ].includes(p.status)
      ) {
        stats.attended++;
      } else if (p.status === JOIN_REQUEST_STATUS.REJECTED) {
        stats.rejected++;
      }
    });

    return stats;
  };

  // دریافت وضعیت‌های مجاز برای یک شرکت‌کننده
  const getAllowedStatuses = (participant) => {
    if (!event || !participant) return [];

    const participationType =
      event.participationType?.code || PARTICIPATION_TYPES.APPROVAL_REQUIRED;
    const currentStatus = participant.status;

    // دریافت وضعیت‌های قابل نمایش برای مالک
    const displayableStatuses = getDisplayableNextStatuses(
      participationType,
      currentStatus,
      "owner"
    );

    return displayableStatuses;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>❌</span>
          <h3>خطا در بارگذاری رویداد</h3>
          <p>{error || "رویداد یافت نشد"}</p>
          <button className={styles.backBtn} onClick={() => router.back()}>
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const filteredParticipants = getFilteredParticipants();

  return (
    <div className="eventManagePage">
      <div className={styles.container}>
        {/* هدر */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <button className={styles.backBtn} onClick={() => router.back()}>
              ← بازگشت
            </button>
            <div>
              <h1 className={styles.title}>{event.title}</h1>
              <p className={styles.subtitle}>مدیریت شرکت‌کنندگان</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            {event.status === "approved" && (
              <>
                <button
                  className={styles.finishBtn}
                  onClick={handleFinishEvent}
                  disabled={finishingEvent}
                  title="پایان رویداد"
                >
                  {finishingEvent ? "⏳ در حال پردازش..." : "🏁 پایان رویداد"}
                </button>
                <button
                  className={styles.discountBtn}
                  onClick={() => setShowDiscountModal(true)}
                >
                  🎫 تعریف کد تخفیف
                </button>
              </>
            )}
            {(event.status === "finished" || event.status === "expired") && (
              <div
                className={styles.statusBadge}
                style={{
                  background:
                    event.status === "finished" ? "#3498db" : "#95a5a6",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  fontWeight: "bold",
                }}
              >
                {event.status === "finished"
                  ? "🏁 خاتمه یافته"
                  : "⏰ منقضی شده"}
              </div>
            )}
            <button
              className={styles.viewEventBtn}
              onClick={() => router.push(`/events/${event.slug || event._id}`)}
            >
              👁️ مشاهده رویداد
            </button>
          </div>
        </div>

        {/* آمار */}
        <div className={styles.statsCards}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "#3b82f6" }}>
              👥
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.total}</div>
              <div className={styles.statLabel}>کل درخواست‌ها</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "#f59e0b" }}>
              ⏳
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.pending}</div>
              <div className={styles.statLabel}>در انتظار تایید</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "#10b981" }}>
              ✅
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.approved}</div>
              <div className={styles.statLabel}>تایید شده</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "#8b5cf6" }}>
              🎯
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.attended}</div>
              <div className={styles.statLabel}>شرکت کرده</div>
            </div>
          </div>
        </div>

        {/* کدهای تخفیف */}
        {event.status === "approved" && discountCodes.length > 0 && (
          <div className={styles.discountSection}>
            <div className={styles.discountHeader}>
              <h2 className={styles.discountTitle}>
                🎫 کدهای تخفیف ({discountCodes.length})
              </h2>
              <button
                className={styles.toggleDiscountBtn}
                onClick={() => setShowDiscountSection(!showDiscountSection)}
              >
                {showDiscountSection ? "پنهان کردن" : "نمایش"}
              </button>
            </div>

            {showDiscountSection && (
              <div className={styles.discountGrid}>
                {discountCodes.map((discount) => {
                  const now = new Date();
                  const isExpired = new Date(discount.expiryDate) < now;
                  const isNotStarted = new Date(discount.startDate) > now;
                  const isActive =
                    discount.isActive && !isExpired && !isNotStarted;

                  return (
                    <div key={discount._id} className={styles.discountCard}>
                      <div className={styles.discountCardHeader}>
                        <code className={styles.discountCode}>
                          {discount.code}
                        </code>
                        <span
                          className={`${styles.discountStatus} ${
                            isActive
                              ? styles.statusActive
                              : styles.statusInactive
                          }`}
                        >
                          {isExpired
                            ? "منقضی شده"
                            : isNotStarted
                            ? "شروع نشده"
                            : discount.isActive
                            ? "فعال"
                            : "غیرفعال"}
                        </span>
                      </div>

                      <h3 className={styles.discountCardTitle}>
                        {discount.title}
                      </h3>

                      {discount.description && (
                        <p className={styles.discountCardDescription}>
                          {discount.description}
                        </p>
                      )}

                      <div className={styles.discountCardDetails}>
                        <div className={styles.discountDetail}>
                          <span className={styles.discountDetailLabel}>
                            مقدار تخفیف:
                          </span>
                          <span className={styles.discountDetailValue}>
                            {discount.discount.type === "percentage"
                              ? `${discount.discount.value}%`
                              : `${discount.discount.value.toLocaleString(
                                  "fa-IR"
                                )} تومان`}
                          </span>
                        </div>

                        <div className={styles.discountDetail}>
                          <span className={styles.discountDetailLabel}>
                            استفاده شده:
                          </span>
                          <span className={styles.discountDetailValue}>
                            {discount.usage?.usedCount || 0}
                            {discount.usage?.maxUsage
                              ? ` / ${discount.usage.maxUsage}`
                              : ""}
                          </span>
                        </div>

                        <div className={styles.discountDetail}>
                          <span className={styles.discountDetailLabel}>
                            تاریخ انقضا:
                          </span>
                          <span className={styles.discountDetailValue}>
                            {new Date(discount.expiryDate).toLocaleDateString(
                              "fa-IR"
                            )}
                          </span>
                        </div>
                      </div>

                      <div className={styles.discountCardActions}>
                        <button
                          className={styles.editDiscountBtn}
                          onClick={() => {
                            setEditingDiscount(discount);
                            setShowDiscountModal(true);
                          }}
                        >
                          ✏️ ویرایش
                        </button>
                        <button
                          className={styles.deleteDiscountBtn}
                          onClick={() => handleDeleteDiscount(discount._id)}
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* فیلترها */}
        <div className={styles.filters}>
          <div className={styles.filterButtons}>
            <button
              className={`${styles.filterBtn} ${
                filter === "all" ? styles.filterBtnActive : ""
              }`}
              onClick={() => setFilter("all")}
            >
              همه ({stats.total})
            </button>
            <button
              className={`${styles.filterBtn} ${
                filter === "pending" ? styles.filterBtnActive : ""
              }`}
              onClick={() => setFilter("pending")}
            >
              در انتظار ({stats.pending})
            </button>
            <button
              className={`${styles.filterBtn} ${
                filter === "approved" ? styles.filterBtnActive : ""
              }`}
              onClick={() => setFilter("approved")}
            >
              تایید شده ({stats.approved})
            </button>
            <button
              className={`${styles.filterBtn} ${
                filter === "attended" ? styles.filterBtnActive : ""
              }`}
              onClick={() => setFilter("attended")}
            >
              شرکت کرده ({stats.attended})
            </button>
          </div>

          {selectedParticipants.length > 0 && (
            <div className={styles.bulkActions}>
              <span className={styles.bulkActionsLabel}>
                {selectedParticipants.length} نفر انتخاب شده
              </span>
              <button
                className={styles.bulkApproveBtn}
                onClick={handleBulkApprove}
              >
                ✅ تایید گروهی
              </button>
              <button
                className={styles.bulkCancelBtn}
                onClick={() => setSelectedParticipants([])}
              >
                ❌ لغو انتخاب
              </button>
            </div>
          )}
        </div>

        {/* لیست شرکت‌کنندگان */}
        <div className={styles.participantsSection}>
          {filteredParticipants.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <h3>شرکت‌کننده‌ای یافت نشد</h3>
              <p>در این دسته شرکت‌کننده‌ای وجود ندارد</p>
            </div>
          ) : (
            <div className={styles.participantsTable}>
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          filteredParticipants.length > 0 &&
                          selectedParticipants.length ===
                            filteredParticipants.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedParticipants(
                              filteredParticipants.map((p) => p._id)
                            );
                          } else {
                            setSelectedParticipants([]);
                          }
                        }}
                      />
                    </th>
                    <th>شرکت‌کننده</th>
                    <th>ایمیل</th>
                    <th>تاریخ درخواست</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((participant) => (
                    <tr key={participant._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedParticipants.includes(
                            participant._id
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedParticipants([
                                ...selectedParticipants,
                                participant._id,
                              ]);
                            } else {
                              setSelectedParticipants(
                                selectedParticipants.filter(
                                  (id) => id !== participant._id
                                )
                              );
                            }
                          }}
                        />
                      </td>
                      <td>
                        <div className={styles.participantInfo}>
                          <div className={styles.participantAvatar}>
                            {participant.user?.avatar ? (
                              <img src={participant.user.avatar} alt="" />
                            ) : (
                              <span>
                                {participant.user?.firstName?.charAt(0) || "؟"}
                              </span>
                            )}
                          </div>
                          <div className={styles.participantDetails}>
                            <div className={styles.participantName}>
                              {participant.user?.firstName}{" "}
                              {participant.user?.lastName}
                            </div>
                            <div className={styles.participantUsername}>
                              @{participant.user?.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{participant.user?.email || "-"}</td>
                      <td>{formatDate(participant.createdAt)}</td>
                      <td>
                        <span
                          className={styles.statusBadge}
                          style={{
                            background: getStatusColor(participant.status),
                          }}
                        >
                          {getStatusIcon(participant.status)}{" "}
                          {getStatusLabel(participant.status)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <select
                            className={styles.statusSelect}
                            value={participant.status}
                            onChange={(e) => {
                              if (
                                confirm(
                                  `آیا از تغییر وضعیت این شرکت‌کننده مطمئن هستید؟`
                                )
                              ) {
                                handleStatusChange(
                                  participant._id,
                                  e.target.value
                                );
                              }
                            }}
                          >
                            {/* وضعیت فعلی */}
                            <option value={participant.status}>
                              {getStatusIcon(participant.status)}{" "}
                              {getStatusLabel(participant.status)} (فعلی)
                            </option>

                            {/* وضعیت‌های مجاز بر اساس نوع رویداد */}
                            {getAllowedStatuses(participant).map((status) => (
                              <option key={status} value={status}>
                                {getStatusIcon(status)} {getStatusLabel(status)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* مودال کد تخفیف */}
      <EventDiscountModal
        show={showDiscountModal}
        onClose={() => {
          setShowDiscountModal(false);
          setEditingDiscount(null);
        }}
        onSave={fetchDiscountCodes}
        editing={editingDiscount}
        eventId={eventId}
      />
    </div>
  );
}
