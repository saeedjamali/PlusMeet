"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./myEvents.module.css";
import {
  JOIN_REQUEST_STATUS,
  getStatusLabel,
  getStatusColor,
  getStatusIcon,
} from "@/lib/helpers/joinRequestStatus";
import "./myEventsDark.css";

export default function MyEventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("owned"); // owned, participating
  const [ownedEvents, setOwnedEvents] = useState([]);
  const [participatingEvents, setParticipatingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal برای ورود به رویداد خصوصی
  const [showPrivateEventModal, setShowPrivateEventModal] = useState(false);
  const [privateEventCode, setPrivateEventCode] = useState("");
  const [privateEventError, setPrivateEventError] = useState("");

  useEffect(() => {
    fetchEvents();

    // چک کردن query parameter برای تنظیم tab
    const tab = searchParams.get("tab");
    if (tab === "participating") {
      setActiveTab("participating");
    } else if (tab === "owned") {
      setActiveTab("owned");
    }
  }, [searchParams]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/events/my?type=all", {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch events");
      }

      console.log("✅ Fetched events:", {
        ownedCount: data.ownedEvents?.length || 0,
        participatingCount: data.participatingEvents?.length || 0,
        sampleOwned: data.ownedEvents?.[0] || null,
        sampleOwnedKeys: data.ownedEvents?.[0]
          ? Object.keys(data.ownedEvents[0])
          : [],
        sampleParticipating: data.participatingEvents?.[0] || null,
      });

      setOwnedEvents(data.ownedEvents || []);
      setParticipatingEvents(data.participatingEvents || []);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    // تایید حذف
    const confirmed = window.confirm(
      `آیا مطمئن هستید که می‌خواهید رویداد "${eventTitle}" را حذف کنید؟\n\nاین عمل غیرقابل بازگشت است.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در حذف رویداد");
      }

      alert("✅ رویداد با موفقیت حذف شد");

      // بروزرسانی لیست رویدادها
      await fetchEvents();
    } catch (err) {
      console.error("❌ Error deleting event:", err);
      alert(`خطا در حذف رویداد: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ورود به رویداد خصوصی
  const handleJoinPrivateEvent = async () => {
    if (!privateEventCode.trim()) {
      setPrivateEventError("لطفاً کد یا لینک رویداد را وارد کنید");
      return;
    }

    try {
      setPrivateEventError("");

      const input = privateEventCode.trim();

      // 1️⃣ بررسی اینکه آیا لینک /events/join?code=... است
      if (input.includes("/events/join")) {
        const codeMatch = input.match(/[?&]code=([^&]+)/);
        if (codeMatch) {
          router.push(`/events/join?code=${codeMatch[1]}`);
          setShowPrivateEventModal(false);
          setPrivateEventCode("");
          return;
        }
      }

      // 2️⃣ بررسی اینکه آیا لینک /events/[id]?invite=... است
      if (input.includes("/events/") && input.includes("invite=")) {
        const match = input.match(/\/events\/([^?]+)/);
        const inviteMatch = input.match(/[?&]invite=([^&]+)/);
        if (match && inviteMatch) {
          router.push(`/events/${match[1]}?invite=${inviteMatch[1]}`);
          setShowPrivateEventModal(false);
          setPrivateEventCode("");
          return;
        }
      }

      // 3️⃣ بررسی اینکه آیا فقط یک کد دعوت است (بدون /events/)
      // در این صورت فرض می‌کنیم کد دعوتی است برای رویدادهای INVITE_ONLY
      if (!input.includes("/") && !input.includes("http")) {
        router.push(`/events/join?code=${encodeURIComponent(input)}`);
        setShowPrivateEventModal(false);
        setPrivateEventCode("");
        return;
      }

      // 4️⃣ اگر لینک کامل /events/[id] است (بدون invite)
      if (input.includes("/events/")) {
        const match = input.match(/\/events\/([^?]+)/);
        if (match) {
          router.push(`/events/${match[1]}`);
          setShowPrivateEventModal(false);
          setPrivateEventCode("");
          return;
        }
      }

      // اگر هیچکدام نبود، خطا
      setPrivateEventError("لینک یا کد نامعتبر است");
    } catch (err) {
      setPrivateEventError("لینک یا کد نامعتبر است");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const getEventStatusBadge = (status) => {
    const statusMap = {
      draft: { label: "📝 پیش‌نویس", className: styles.statusDraft },
      pending: { label: "⏳ در انتظار تایید", className: styles.statusPending },
      approved: { label: "✅ تایید شده", className: styles.statusApproved },
      rejected: { label: "❌ رد شده", className: styles.statusRejected },
      suspended: { label: "⏸️ تعلیق", className: styles.statusDraft },
      deleted: { label: "🗑️ حذف شده", className: styles.statusRejected },
      expired: { label: "⌛ منقضی شده", className: styles.statusExpired },
      finished: { label: "✔️ پایان یافته", className: styles.statusFinished },
    };

    const statusInfo = statusMap[status] || statusMap.draft;

    return (
      <span className={`${styles.statusBadge} ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const renderOwnedEvents = () => {
    if (ownedEvents.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📅</div>
          <h3>رویدادی وجود ندارد</h3>
          <p>شما هنوز رویدادی ایجاد نکرده‌اید</p>
          <button
            className={styles.createEventBtn}
            onClick={() => router.push("/dashboard/events/create")}
          >
            <span>➕</span>
            <span>ایجاد رویداد جدید</span>
          </button>
        </div>
      );
    }

    return (
      <div className={styles.eventsGrid}>
        {ownedEvents.map((event) => (
          <div key={event._id} className={styles.eventCard}>
            {/* Header با تصویر */}
            <div className={styles.eventHeader}>
              <div className={styles.eventImage}>
                <img
                  src={event.coverImage || "/icons/download.png"}
                  alt={event.title}
                  onError={(e) => {
                    e.target.src = "/icons/download.png";
                  }}
                />
              </div>
              <div className={styles.eventHeaderContent}>
                <h3 className={styles.eventTitle}>{event.title}</h3>
                {getEventStatusBadge(event.status)}
              </div>
            </div>

            {/* Main Content - اطلاعات */}
            <div className={styles.eventCardMain}>
              {/* نمایش دلیل رد */}
              {event.status === "rejected" &&
                (event.rejectionReason || event.approval?.rejectionReason) && (
                  <div className={styles.rejectionReason}>
                    <strong>📋 دلیل رد:</strong>
                    <p>
                      {event.rejectionReason || event.approval?.rejectionReason}
                    </p>
                  </div>
                )}

              <div className={styles.eventInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>📊 دسته‌بندی:</span>
                  <span className={styles.infoValue}>
                    {event.topicCategory?.title || "-"}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>📍 نوع برگزاری:</span>
                  <span className={styles.infoValue}>
                    {event.formatMode?.title || "-"}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>📅 تاریخ شروع:</span>
                  <span className={styles.infoValue}>
                    {formatDate(event.schedule?.startDate || event.startDate)}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>👥 نحوه شرکت:</span>
                  <span className={styles.infoValue}>
                    {event.participationType?.title || "-"}
                  </span>
                </div>
                {event.capacity && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>🎯 ظرفیت:</span>
                    <span className={styles.infoValue}>
                      {event.capacity} نفر
                      {event.registeredCount !== undefined &&
                        ` (${event.registeredCount} ثبت‌نام)`}
                    </span>
                  </div>
                )}
                {event.ticket && event.ticket.type !== "free" && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>🎫 قیمت:</span>
                    <span className={styles.infoValue}>
                      {event.ticket.price > 0
                        ? `${event.ticket.price.toLocaleString()} تومان`
                        : "رایگان"}
                    </span>
                  </div>
                )}
                {event.location?.city && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>🌆 مکان:</span>
                    <span className={styles.infoValue}>
                      {event.location.city}
                      {event.location.province &&
                        `, ${event.location.province}`}
                    </span>
                  </div>
                )}
                {event.onlinePlatform && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>💻 پلتفرم:</span>
                    <span className={styles.infoValue}>
                      {event.onlinePlatform}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer - آمار و دکمه‌ها */}
            <div className={styles.eventCardFooter}>
              {event.stats && (
                <div className={styles.eventStats}>
                  <div className={styles.statsTitle}>آمار شرکت‌کنندگان:</div>
                  <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>
                        {event.stats.totalRequests}
                      </span>
                      <span className={styles.statLabel}>کل درخواست‌ها</span>
                    </div>
                    <div className={styles.statItem}>
                      <span
                        className={styles.statValue}
                        style={{ color: "#f59e0b" }}
                      >
                        {event.stats.pending + event.stats.paymentReserved}
                      </span>
                      <span className={styles.statLabel}>در انتظار</span>
                    </div>
                    <div className={styles.statItem}>
                      <span
                        className={styles.statValue}
                        style={{ color: "#10b981" }}
                      >
                        {event.stats.approved +
                          event.stats.paid +
                          event.stats.confirmed}
                      </span>
                      <span className={styles.statLabel}>تایید شده</span>
                    </div>
                    <div className={styles.statItem}>
                      <span
                        className={styles.statValue}
                        style={{ color: "#3b82f6" }}
                      >
                        {event.stats.attended + event.stats.completed}
                      </span>
                      <span className={styles.statLabel}>شرکت کرده</span>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.eventActions}>
                <button
                  className={styles.viewBtn}
                  onClick={() => {
                    const eventId = event.slug || event._id;
                    if (
                      eventId &&
                      eventId !== "-1" &&
                      eventId !== "undefined"
                    ) {
                      router.push(`/events/${eventId}`);
                    } else {
                      alert("شناسه رویداد معتبر نیست");
                    }
                  }}
                  title="مشاهده جزئیات رویداد"
                  disabled={!event._id || event._id === "-1"}
                >
                  <span>👁️</span>
                  <span>مشاهده</span>
                </button>
                <button
                  className={styles.manageBtn}
                  onClick={() => {
                    if (
                      event._id &&
                      event._id !== "-1" &&
                      event._id !== "undefined"
                    ) {
                      router.push(`/dashboard/events/${event._id}/manage`);
                    } else {
                      alert("شناسه رویداد معتبر نیست");
                    }
                  }}
                  title="مدیریت رویداد"
                  disabled={!event._id || event._id === "-1"}
                >
                  <span>⚙️</span>
                  <span>مدیریت</span>
                </button>
                {(event.status === "draft" || event.status === "rejected") && (
                  <button
                    className={
                      event.status === "rejected"
                        ? styles.resubmitBtn
                        : styles.editBtn
                    }
                    onClick={() => {
                      if (
                        event._id &&
                        event._id !== "-1" &&
                        event._id !== "undefined"
                      ) {
                        router.push(`/dashboard/events/${event._id}/edit`);
                      } else {
                        alert("شناسه رویداد معتبر نیست");
                      }
                    }}
                    title={
                      event.status === "rejected"
                        ? "رفع ایراد و ارسال مجدد"
                        : "ویرایش رویداد"
                    }
                    disabled={!event._id || event._id === "-1"}
                  >
                    <span>{event.status === "rejected" ? "🔄" : "✏️"}</span>
                    <span>
                      {event.status === "rejected" ? "رفع ایراد" : "ویرایش"}
                    </span>
                  </button>
                )}
                {event.status !== "approved" && event.status !== "expired" && (
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteEvent(event._id, event.title)}
                    title="حذف رویداد"
                    disabled={!event._id || event._id === "-1"}
                  >
                    <span>🗑️</span>
                    <span>حذف</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderParticipatingEvents = () => {
    if (participatingEvents.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎫</div>
          <h3>شرکتی وجود ندارد</h3>
          <p>شما هنوز در هیچ رویدادی شرکت نکرده‌اید</p>
        </div>
      );
    }

    return (
      <div className={styles.eventsGrid}>
        {participatingEvents.map((event) => (
          <div key={event._id} className={styles.eventCard}>
            {/* Header با تصویر */}
            <div className={styles.eventHeader}>
              <div className={styles.eventImage}>
                <img
                  src={event.coverImage || "/icons/download.png"}
                  alt={event.title}
                  onError={(e) => {
                    e.target.src = "/icons/download.png";
                  }}
                />
              </div>
              <div className={styles.eventHeaderContent}>
                <h3 className={styles.eventTitle}>{event.title}</h3>
                {event.joinRequest && (
                  <span
                    className={styles.joinStatusBadge}
                    style={{
                      background: getStatusColor(event.joinRequest.status),
                    }}
                  >
                    {getStatusIcon(event.joinRequest.status)}{" "}
                    {getStatusLabel(event.joinRequest.status)}
                  </span>
                )}
              </div>
            </div>

            {/* Main Content - اطلاعات */}
            <div className={styles.eventCardMain}>
              <div className={styles.eventInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>👤 برگزارکننده:</span>
                  <span className={styles.infoValue}>
                    {event.creator?.firstName} {event.creator?.lastName}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>📊 دسته‌بندی:</span>
                  <span className={styles.infoValue}>
                    {event.topicCategory?.title || "-"}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>📍 نوع برگزاری:</span>
                  <span className={styles.infoValue}>
                    {event.formatMode?.title || "-"}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>👥 نحوه شرکت:</span>
                  <span className={styles.infoValue}>
                    {event.participationType?.title || "-"}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>📅 تاریخ شروع:</span>
                  <span className={styles.infoValue}>
                    {formatDate(event.schedule?.startDate || event.startDate)}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>📅 تاریخ درخواست:</span>
                  <span className={styles.infoValue}>
                    {formatDate(event.joinRequest?.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer - اطلاعات شرکت و دکمه‌ها */}
            <div className={styles.eventCardFooter}>
              {event.joinRequest && (
                <div className={styles.participationInfo}>
                  <div className={styles.participationRow}>
                    <span className={styles.participationLabel}>وضعیت:</span>
                    <span className={styles.participationValue}>
                      {getStatusLabel(event.joinRequest.status)}
                    </span>
                  </div>
                  {event.joinRequest.attendancePercentage !== undefined && (
                    <div className={styles.participationRow}>
                      <span className={styles.participationLabel}>
                        درصد حضور:
                      </span>
                      <span className={styles.participationValue}>
                        {event.joinRequest.attendancePercentage}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.eventActions}>
                <button
                  className={styles.viewBtn}
                  onClick={() =>
                    router.push(`/events/${event.slug || event._id}`)
                  }
                  title="مشاهده جزئیات رویداد"
                >
                  <span>👁️</span>
                  <span>مشاهده جزئیات</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>در حال بارگذاری رویدادها...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>❌</span>
          <h3>خطا در بارگذاری رویدادها</h3>
          <p>{error}</p>
          <button className={styles.retryBtn} onClick={fetchEvents}>
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="myEventsPage">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>رویدادهای من</h1>
          <div className={styles.headerActions}>
            <button
              className={styles.privateEventBtn}
              onClick={() => setShowPrivateEventModal(true)}
              title="ورود به رویداد خصوصی با کد دعوت"
            >
              <span>🔒</span>
              <span>ورود به رویداد خصوصی</span>
            </button>
            <button
              className={styles.createBtn}
              onClick={() => router.push("/dashboard/events/create")}
            >
              <span>➕</span>
              <span>ایجاد رویداد جدید</span>
            </button>
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "owned" ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab("owned")}
          >
            <span className={styles.tabIcon}>🎯</span>
            <span className={styles.tabLabel}>میزبان</span>
            <span className={styles.tabBadge}>{ownedEvents.length}</span>
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "participating" ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab("participating")}
          >
            <span className={styles.tabIcon}>👥</span>
            <span className={styles.tabLabel}>شرکت‌کننده</span>
            <span className={styles.tabBadge}>
              {participatingEvents.length}
            </span>
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === "owned" && renderOwnedEvents()}
          {activeTab === "participating" && renderParticipatingEvents()}
        </div>

        {/* Modal ورود به رویداد خصوصی */}
        {showPrivateEventModal && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowPrivateEventModal(false)}
          >
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  <span>🔒</span>
                  <span>ورود به رویداد خصوصی</span>
                </h2>
                <button
                  className={styles.modalClose}
                  onClick={() => setShowPrivateEventModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className={styles.modalBody}>
                <p className={styles.modalDescription}>
                  برای ورود به یک رویداد خصوصی یا دعوتی، می‌توانید یکی از موارد
                  زیر را وارد کنید:
                </p>

                <ul className={styles.exampleList}>
                  <li>
                    <strong>کد دعوت:</strong> مثال:{" "}
                    <code>426eed27945519d3</code>
                  </li>
                  <li>
                    <strong>لینک دعوت:</strong> مثال:{" "}
                    <code>
                      http://localhost:3000/events/join?code=426eed27945519d3
                    </code>
                  </li>
                  <li>
                    <strong>لینک رویداد خصوصی:</strong> مثال:{" "}
                    <code>
                      http://localhost:3000/events/event-slug?invite=abc123
                    </code>
                  </li>
                </ul>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>کد دعوت یا لینک</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="426eed27945519d3"
                    value={privateEventCode}
                    onChange={(e) => {
                      setPrivateEventCode(e.target.value);
                      setPrivateEventError("");
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleJoinPrivateEvent();
                      }
                    }}
                  />
                  {privateEventError && (
                    <p className={styles.inputError}>{privateEventError}</p>
                  )}
                </div>

                <div className={styles.modalFooter}>
                  <button
                    className={styles.cancelBtn}
                    onClick={() => {
                      setShowPrivateEventModal(false);
                      setPrivateEventCode("");
                      setPrivateEventError("");
                    }}
                  >
                    انصراف
                  </button>
                  <button
                    className={styles.submitBtn}
                    onClick={handleJoinPrivateEvent}
                  >
                    <span>🚀</span>
                    <span>ورود به رویداد</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
