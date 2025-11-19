"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import styles from "./eventView.module.css";
import {
  JOIN_REQUEST_STATUS,
  getStatusLabel,
  getStatusColor,
  getStatusIcon,
} from "@/lib/helpers/joinRequestStatus";
import {
  PARTICIPATION_TYPES,
  canUserCancelRequest,
  getUserAllowedActions,
  FINAL_EVENT_STATUSES,
} from "@/lib/utils/joinRequestHelpers";
import {
  loadInitialTheme,
  toggleTheme as toggleThemeUtil,
} from "@/lib/utils/themeManager";
import "./eventViewDark.css";
import EventReviews from "@/components/EventReviews";
import Toast from "@/components/Toast";
import "@/components/ToastDark.css";

// Dynamic import برای MapPicker (فقط سمت کلاینت)
const MapPicker = dynamic(
  () => import("@/app/dashboard/events/create/MapPicker"),
  { ssr: false }
);

// Dynamic import برای WalletCheckModal (فقط سمت کلاینت)
const WalletCheckModal = dynamic(
  () => import("@/components/modals/WalletCheckModal"),
  { ssr: false }
);

// Dynamic import برای ReviewModal (فقط سمت کلاینت)
const ReviewModal = dynamic(() => import("@/components/modals/ReviewModal"), {
  ssr: false,
});

export default function EventViewPage() {
  const router = useRouter();
  const params = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [accessType, setAccessType] = useState("public"); // public, invite, owner
  const [inviteLink, setInviteLink] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({
    category: "",
    title: "",
    description: "",
    images: [],
  });
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Review states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewEligibility, setReviewEligibility] = useState(null);

  // Join Request states
  const [joinRequest, setJoinRequest] = useState(null);
  const [loadingJoinRequest, setLoadingJoinRequest] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // More actions menu
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef(null);

  // Toast state
  const [toast, setToast] = useState(null);

  // Show toast helper
  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  // Check bookmark status
  const checkBookmarkStatus = async () => {
    if (!event?._id) return;

    try {
      const response = await fetch(`/api/events/${event._id}/bookmark`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.isBookmarked || false);
      }
    } catch (error) {
      console.error("Error checking bookmark status:", error);
      // در صورت خطا، فرض می‌کنیم bookmark نشده
      setIsBookmarked(false);
    }
  };

  // Load dark mode preference
  useEffect(() => {
    const initialTheme = loadInitialTheme();
    setDarkMode(initialTheme === "dark");
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const currentTheme = darkMode ? "dark" : "light";
    const newTheme = toggleThemeUtil(currentTheme);
    setDarkMode(newTheme === "dark");
  };

  useEffect(() => {
    fetchEvent();
  }, [params.id]);

  // چک کردن join request کاربر بعد از load شدن event
  useEffect(() => {
    if (event && !isOwner) {
      checkJoinRequest();
      checkReviewEligibility();
      checkBookmarkStatus();
    }
  }, [event, isOwner]);

  // چک مجدد امکان ثبت نظر وقتی joinRequest یا وضعیت رویداد تغییر کرد
  useEffect(() => {
    if (event && joinRequest && !isOwner) {
      checkReviewEligibility();
    }
  }, [joinRequest, event?.status]);

  // Helper: چک کردن اینکه آیا رویداد دعوتی است
  const isInviteOnlyEvent = (event) => {
    const code = event?.participationType?.code;
    return code === PARTICIPATION_TYPES.INVITE_ONLY || code === "INVITEONLY";
  };

  // چک کردن امکان ثبت نظر (فقط برای چک کردن نظر قبلی)
  const checkReviewEligibility = async () => {
    if (!event?._id) return;

    // اگر شرایط اولیه برای ثبت نظر وجود نداشت، نیازی به API call نیست
    if (
      !joinRequest ||
      !["finished", "expired"].includes(event.status) ||
      !FINAL_EVENT_STATUSES.includes(joinRequest.status)
    ) {
      setCanReview(false);
      return;
    }

    try {
      const response = await fetch(`/api/events/${event._id}/can-review`, {
        credentials: "include",
      });
      const data = await response.json();

      console.log("🔍 Review Eligibility Check (برای چک نظر قبلی):", {
        eventId: event._id,
        eventStatus: event.status,
        joinRequestStatus: joinRequest?.status,
        canReview: data.canReview,
        reason: data.reason,
        message: data.message,
      });

      // فقط برای چک کردن اینکه آیا قبلاً نظر داده یا نه
      setCanReview(data.canReview || false);
      setReviewEligibility(data);
    } catch (err) {
      console.error("Error checking review eligibility:", err);
      // در صورت خطا، اجازه می‌دهیم که دکمه نمایش داده شود
      // (چک نهایی در API ثبت نظر انجام می‌شود)
      setCanReview(true);
    }
  };

  // ثبت نظر
  const handleSubmitReview = async (reviewData) => {
    try {
      const response = await fetch(`/api/events/${event._id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(reviewData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در ثبت نظر");
      }

      alert("✅ " + data.message);
      setShowReviewModal(false);
      setCanReview(false); // دیگه نمی‌تونه نظر بده

      // رفرش اطلاعات رویداد
      await fetchEvent();
    } catch (err) {
      throw new Error(err.message);
    }
  };

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreMenu]);

  // Keyboard navigation برای کاروسل
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (event?.images && event.images.length > 1) {
        if (e.key === "ArrowLeft") {
          nextImage();
        } else if (e.key === "ArrowRight") {
          prevImage();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [event, currentImageIndex]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ گرفتن invite token از URL (اگر وجود دارد)
      const urlParams = new URLSearchParams(window.location.search);
      const inviteToken = urlParams.get("invite");

      const url = inviteToken
        ? `/api/events/${params.id}?invite=${inviteToken}`
        : `/api/events/${params.id}`;

      const response = await fetch(url, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        // ✅ استفاده از message اگر وجود داشت، وگرنه از error
        const errorMessage =
          data.message || data.error || "خطا در بارگذاری رویداد";
        const errorDetails = {
          message: errorMessage,
          requiresInvite: data.requiresInvite || false,
          statusCode: response.status,
        };
        throw errorDetails;
      }

      setEvent(data.event);
      setIsOwner(data.isOwner || false);
      setAccessType(data.accessType || "public");
      setInviteLink(data.inviteLink || null);

      // Debug: چک کردن invitation
      if (data.isOwner) {
        const code = data.event.participationType?.code;
        const isInviteOnly =
          code === PARTICIPATION_TYPES.INVITE_ONLY || code === "INVITEONLY";
        console.log("🔍 Event invitation data:", {
          hasInvitation: !!data.event.invitation,
          invitation: data.event.invitation,
          participationType: data.event.participationType,
          participationTypeCode: code,
          isInviteOnly: isInviteOnly,
        });
      }

      // ✅ افزایش شمارنده بازدید (فقط یک بار)
      if (data.event && !sessionStorage.getItem(`viewed_${data.event._id}`)) {
        await incrementViews(data.event._id);
        sessionStorage.setItem(`viewed_${data.event._id}`, "true");
      }
    } catch (err) {
      console.error("Error fetching event:", err);
      // ذخیره اطلاعات کامل خطا
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async (eventId) => {
    try {
      await fetch(`/api/events/${eventId}/views`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Error incrementing views:", err);
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

  // ✅ توابع handler

  // چک کردن join request کاربر
  const checkJoinRequest = async () => {
    try {
      setLoadingJoinRequest(true);

      const response = await fetch(`/api/events/${event._id}/my-join-request`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setJoinRequest(data.joinRequest);
      } else {
        // اگر 404 بود، یعنی درخواستی ندارد
        setJoinRequest(null);
      }
    } catch (error) {
      console.error("Error checking join request:", error);
      setJoinRequest(null);
    } finally {
      setLoadingJoinRequest(false);
    }
  };

  // پیوستن به رویداد
  const handleJoinEvent = async () => {
    if (!event) {
      return;
    }

    // چک اینکه کاربر مالک رویداد نیست
    if (isOwner) {
      alert("❌ شما مالک این رویداد هستید و نمی‌توانید به آن بپیوندید");
      return;
    }

    // اگر قبلاً درخواست داده (و CANCELED نیست)
    if (joinRequest && joinRequest.status !== JOIN_REQUEST_STATUS.CANCELED) {
      alert(
        `شما قبلاً برای این رویداد درخواست داده‌اید.\nوضعیت فعلی: ${getStatusLabel(
          joinRequest.status
        )}`
      );
      return;
    }

    const participationType =
      event.participationType?.code || PARTICIPATION_TYPES.APPROVAL_REQUIRED;

    // اگر رویداد TICKETED یا APPROVAL_TICKETED است، مدال کیف پول را باز کنیم
    if (
      [
        PARTICIPATION_TYPES.TICKETED,
        PARTICIPATION_TYPES.APPROVAL_TICKETED,
      ].includes(participationType)
    ) {
      setShowWalletModal(true);
      return;
    }

    // برای بقیه انواع (OPEN, APPROVAL_REQUIRED, INVITE_ONLY)، مستقیماً API بزنیم
    try {
      const body =
        participationType === PARTICIPATION_TYPES.INVITE_ONLY
          ? JSON.stringify({
              inviteCode: event.inviteCode || event.access?.inviteCode,
            })
          : undefined;

      const response = await fetch(`/api/events/${event._id}/join`, {
        method: "POST",
        credentials: "include",
        headers: body ? { "Content-Type": "application/json" } : {},
        body,
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${data.message || "درخواست شما با موفقیت ثبت شد"}`);
        // به‌روزرسانی joinRequest
        await checkJoinRequest();
        // هدایت به صفحه myEvents قسمت شرکت‌کننده
        router.push("/dashboard/myEvents?tab=participating");
      } else {
        // اگر نیاز به لاگین یا تایید دارد
        if (data.requiresAuth) {
          const currentUrl = window.location.pathname + window.location.search;
          router.push(
            `/login?redirect=${encodeURIComponent(currentUrl)}&action=join`
          );
        } else if (data.requiresVerification) {
          alert(
            `⚠️ ${data.error}\n\nلطفاً ابتدا حساب کاربری خود را تکمیل کنید.`
          );
          router.push("/dashboard/profile");
        } else if (data.requiresPhoneVerification) {
          alert(
            `⚠️ ${data.error}\n\nلطفاً ابتدا شماره موبایل خود را تایید کنید.`
          );
          router.push("/dashboard/profile");
        } else {
          alert(`❌ ${data.error || "خطا در ثبت درخواست"}`);
        }
      }
    } catch (error) {
      console.error("Error joining event:", error);
      alert("❌ خطا در برقراری ارتباط با سرور");
    }
  };

  // لغو درخواست
  const handleCancelRequest = async () => {
    if (!joinRequest) return;

    if (
      !confirm(
        `آیا از لغو درخواست خود مطمئن هستید؟\nوضعیت فعلی: ${getStatusLabel(
          joinRequest.status
        )}`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${event._id}/cancel-request`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${data.message}`);
        // به‌روزرسانی joinRequest
        await checkJoinRequest();
      } else if (response.status === 401) {
        alert("⚠️ برای لغو درخواست، لطفاً ابتدا وارد حساب کاربری خود شوید");
        router.push("/login");
      } else {
        alert(`❌ ${data.error || "خطا در لغو درخواست"}`);
      }
    } catch (error) {
      console.error("Error canceling request:", error);
      alert("❌ خطا در ارتباط با سرور");
    }
  };

  // موفقیت پرداخت
  const handlePaymentSuccess = async (data) => {
    await checkJoinRequest();
    router.push("/dashboard/myEvents?tab=participating");
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleCopyLink = async () => {
    try {
      const link = window.location.href;

      // تلاش برای استفاده از Share API در موبایل
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        await navigator.share({
          title: event?.title || "رویداد",
          text: event?.description || "",
          url: link,
        });
        return;
      }

      // در غیر این صورت کپی به کلیپبورد
      await navigator.clipboard.writeText(link);
      alert("✅ لینک با موفقیت کپی شد!");
    } catch (error) {
      console.error("Error copying/sharing:", error);
      // Fallback برای مرورگرهای قدیمی
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("✅ لینک کپی شد!");
    }
  };

  const handleToggleBookmark = async () => {
    if (!event) return;
    try {
      const method = isBookmarked ? "DELETE" : "POST";
      const response = await fetch(`/api/events/${event._id}/bookmark`, {
        method,
        credentials: "include",
      });

      if (response.ok) {
        const newBookmarkState = !isBookmarked;
        setIsBookmarked(newBookmarkState);
        const message = newBookmarkState
          ? "رویداد به نشان‌شده‌ها اضافه شد"
          : "رویداد از نشان‌شده‌ها حذف شد";
        showToast(message, "success");
      } else if (response.status === 401) {
        showToast(
          "برای نشان‌کردن رویداد، لطفاً ابتدا وارد حساب کاربری خود شوید",
          "warning"
        );
        const currentUrl = window.location.pathname;
        setTimeout(() => {
          router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
        }, 1500);
      } else {
        const data = await response.json();
        showToast(data.error || "خطا در نشان‌کردن رویداد", "error");
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      showToast("خطا در اتصال به سرور. لطفاً دوباره تلاش کنید", "error");
    }
  };

  const handleReport = () => {
    if (!event) return;
    setShowReportModal(true);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();

    if (!reportData.category || !reportData.title || !reportData.description) {
      alert("لطفاً تمام فیلدهای الزامی را پر کنید");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("category", reportData.category);
      formData.append("title", reportData.title);
      formData.append("description", reportData.description);

      // اضافه کردن تصاویر
      if (reportData.images && reportData.images.length > 0) {
        for (const image of reportData.images) {
          formData.append("images", image);
        }
      }

      const response = await fetch(`/api/events/${event._id}/report`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "✅ گزارش شما با موفقیت ارسال شد");
        setShowReportModal(false);
        setReportData({
          category: "",
          title: "",
          description: "",
          images: [],
        });
      } else if (response.status === 401) {
        alert("⚠️ برای ارسال گزارش، لطفاً ابتدا وارد حساب کاربری خود شوید");
        setShowReportModal(false);
        router.push("/login");
      } else {
        alert(`❌ ${data.error || "خطا در ارسال گزارش"}`);
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("خطا در ارسال گزارش");
    }
  };

  const handleReportImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + reportData.images.length > 3) {
      alert("حداکثر 3 تصویر مجاز است");
      return;
    }
    setReportData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  const handleRemoveReportImage = (index) => {
    setReportData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleMessage = () => {
    if (!event) return;
    // TODO: پیاده‌سازی ارسال پیام
    router.push(`/messages?to=${event.creator._id}`);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      alert("لطفاً نظر خود را وارد کنید");
      return;
    }

    try {
      const response = await fetch(`/api/events/${event._id}/comments`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: commentText }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "نظر شما با موفقیت ثبت شد");
        setShowCommentModal(false);
        setCommentText("");
        // می‌توانید رویداد را مجدداً fetch کنید تا نظرات جدید نمایش داده شود
        fetchEvent();
      } else {
        alert(data.error || "خطا در ثبت نظر");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("خطا در ثبت نظر");
    }
  };

  // توابع کاروسل
  const nextImage = () => {
    if (event?.images && event.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % event.images.length);
    }
  };

  const prevImage = () => {
    if (event?.images && event.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? event.images.length - 1 : prev - 1
      );
    }
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  // Touch handlers برای swipe در موبایل
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swipe left (next image)
      nextImage();
    }

    if (touchStart - touchEnd < -75) {
      // Swipe right (previous image)
      prevImage();
    }
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

  if (error) {
    // تشخیص نوع خطا و نمایش پیام مناسب
    const errorMessage = error.message || error;
    const requiresInvite = error.requiresInvite || false;
    const statusCode = error.statusCode || 500;

    // آیکون بسته به نوع خطا
    const getErrorIcon = () => {
      if (statusCode === 404) return "🔍";
      if (statusCode === 403 || requiresInvite) return "🔒";
      return "❌";
    };

    // عنوان بسته به نوع خطا
    const getErrorTitle = () => {
      if (statusCode === 404) return "رویداد یافت نشد";
      if (statusCode === 403) return "دسترسی محدود";
      if (requiresInvite) return "نیاز به دعوت‌نامه";
      return "خطا در بارگذاری رویداد";
    };

    // پیام راهنما
    const getHelpMessage = () => {
      if (requiresInvite) {
        return "این رویداد خصوصی است. برای دسترسی به این رویداد باید از لینک دعوت استفاده کنید.";
      }
      if (statusCode === 404) {
        return "رویداد مورد نظر شما وجود ندارد یا حذف شده است.";
      }
      if (statusCode === 403) {
        return "شما دسترسی لازم برای مشاهده این رویداد را ندارید.";
      }
      return null;
    };

    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>{getErrorIcon()}</span>
          <h3>{getErrorTitle()}</h3>
          <p className={styles.errorMessage}>{errorMessage}</p>

          {getHelpMessage() && (
            <p className={styles.errorHelp}>{getHelpMessage()}</p>
          )}

          <div className={styles.errorActions}>
            <button
              className={styles.primaryBtn}
              onClick={() => router.push("/meetwall")}
            >
              🏠 بازگشت به لیست رویدادها
            </button>

            {statusCode !== 404 && (
              <button className={styles.secondaryBtn} onClick={fetchEvent}>
                🔄 تلاش مجدد
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>❓</span>
          <h3>رویداد یافت نشد</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="eventViewPage">
      <div className={styles.container}>
        {/* Header با دکمه‌های عملیات */}
        <div className={styles.pageHeader}>
          <div className={styles.headerRight}>
            <button
              className={styles.backToListBtn}
              onClick={() => router.push("/meetwall")}
              title="بازگشت به لیست رویدادها"
            >
              <span>📋</span>
              <span>لیست رویدادها</span>
            </button>

            <h1 className={styles.eventTitle}>{event.title}</h1>
            {event.views > 0 && (
              <div className={styles.viewCount}>
                <span className={styles.viewIcon}>👁️</span>
                <span>{event.views.toLocaleString("fa-IR")} بازدید</span>
              </div>
            )}
            {accessType === "invite" && (
              <div className={styles.inviteBadgeHeader}>
                <span>🎟️</span>
                <span>دعوت خصوصی</span>
              </div>
            )}
          </div>

          <div className={styles.headerLeft}>
            {/* نمایش وضعیت رویداد برای همه */}
            {(event.status === "finished" || event.status === "expired") && (
              <div
                className={styles.eventStatusBadge}
                style={{
                  background:
                    event.status === "finished" ? "#3498db" : "#95a5a6",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "12px",
                  color: "white",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>{event.status === "finished" ? "🏁" : "⏰"}</span>
                <span>
                  {event.status === "finished" ? "خاتمه یافته" : "منقضی شده"}
                </span>
              </div>
            )}

            {/* دکمه‌های اصلی برای بازدیدکننده */}
            {!isOwner && event.status === "approved" && (
              <>
                {/* اگر join request دارد، وضعیت فعلی را نمایش دهیم */}
                {joinRequest &&
                joinRequest.status !== JOIN_REQUEST_STATUS.CANCELED ? (
                  <>
                    <div
                      className={styles.statusBadge}
                      style={{
                        background: getStatusColor(joinRequest.status),
                        padding: "0.75rem 1.25rem",
                        borderRadius: "12px",
                        color: "white",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span>{getStatusIcon(joinRequest.status)}</span>
                      <span>{getStatusLabel(joinRequest.status)}</span>
                    </div>
                    {/* دکمه لغو (اگر مجاز باشد) */}
                    {canUserCancelRequest(joinRequest.status) && (
                      <button
                        className={styles.headerCancelBtn}
                        onClick={handleCancelRequest}
                        title="لغو درخواست"
                        style={{
                          background: "#e74c3c",
                          color: "white",
                          padding: "0.75rem 1.25rem",
                          borderRadius: "12px",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span>🚫</span>
                        <span>لغو درخواست</span>
                      </button>
                    )}
                  </>
                ) : (
                  /* دکمه پیوستن / درخواست مجدد - فقط برای غیر دعوتی */
                  !isInviteOnlyEvent(event) && (
                    <button
                      className={styles.headerJoinBtn}
                      onClick={handleJoinEvent}
                      title={
                        joinRequest?.status === JOIN_REQUEST_STATUS.CANCELED
                          ? "درخواست مجدد"
                          : "پیوستن به رویداد"
                      }
                    >
                      <span>
                        {joinRequest?.status === JOIN_REQUEST_STATUS.CANCELED
                          ? "🔄"
                          : "✅"}
                      </span>
                      <span>
                        {joinRequest?.status === JOIN_REQUEST_STATUS.CANCELED
                          ? "درخواست مجدد"
                          : "پیوستن به رویداد"}
                      </span>
                    </button>
                  )
                )}
              </>
            )}

            {/* دکمه ثبت نظر - فقط زمانی که رویداد پایان یافته و کاربر در FINAL_EVENT_STATUSES باشد */}
            {!isOwner &&
              (() => {
                // شرط‌های نمایش دکمه ثبت نظر:
                // 1. کاربر باید join request داشته باشد
                // 2. وضعیت رویداد باید finished یا expired باشد
                // 3. وضعیت join request باید در FINAL_EVENT_STATUSES باشد
                const shouldShowReviewButton =
                  joinRequest &&
                  ["finished", "expired"].includes(event.status) &&
                  FINAL_EVENT_STATUSES.includes(joinRequest.status);

                console.log("🎯 Review Button Check:", {
                  hasJoinRequest: !!joinRequest,
                  joinRequestStatus: joinRequest?.status,
                  eventStatus: event.status,
                  inFinalStatuses: joinRequest?.status
                    ? FINAL_EVENT_STATUSES.includes(joinRequest.status)
                    : false,
                  isEventFinished: ["finished", "expired"].includes(
                    event.status
                  ),
                  shouldShowReviewButton,
                  canReview,
                  reviewEligibility,
                  FINAL_EVENT_STATUSES_LIST: FINAL_EVENT_STATUSES,
                });

                // اگر شرایط اولیه برقرار بود، چک می‌کنیم که آیا قبلاً نظر داده یا نه
                if (shouldShowReviewButton) {
                  // اگر کاربر قبلاً نظر داده (canReview === false)
                  if (canReview === false) {
                    return (
                      <div
                        className={styles.alreadyReviewedMessage}
                        title="شما قبلاً نظر خود را ثبت کرده‌اید"
                      >
                        <span>✅</span>
                        <span>نظر شما ثبت شده است</span>
                      </div>
                    );
                  }

                  // اگر کاربر هنوز نظر نداده (canReview === true)
                  if (canReview === true) {
                    return (
                      <button
                        className={styles.headerCommentBtn}
                        onClick={() => setShowReviewModal(true)}
                        title="ثبت نظر"
                      >
                        <span>✍️</span>
                        <span>ثبت نظر</span>
                      </button>
                    );
                  }
                }

                return null;
              })()}

            {/* دکمه منوی بیشتر */}
            <div className={styles.moreMenuContainer} ref={moreMenuRef}>
              <button
                className={styles.moreBtn}
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                title="عملیات بیشتر"
              >
                <span>⋯</span>
              </button>

              {showMoreMenu && (
                <div className={styles.moreMenuDropdown}>
                  <button
                    className={styles.menuItem}
                    onClick={() => {
                      handleShare();
                      setShowMoreMenu(false);
                    }}
                  >
                    <span>🔗</span>
                    <span>اشتراک‌گذاری</span>
                  </button>

                  <button
                    className={`${styles.menuItem} ${
                      isBookmarked ? styles.bookmarked : ""
                    }`}
                    onClick={() => {
                      handleToggleBookmark();
                      setShowMoreMenu(false);
                    }}
                  >
                    <span>{isBookmarked ? "⭐" : "🔖"}</span>
                    <span>{isBookmarked ? "حذف نشان" : "نشان کردن"}</span>
                  </button>

                  <button
                    className={styles.menuItem}
                    onClick={() => {
                      handleReport();
                      setShowMoreMenu(false);
                    }}
                  >
                    <span>🚩</span>
                    <span>گزارش تخلف</span>
                  </button>

                  <div className={styles.menuDivider}></div>

                  <button
                    className={styles.menuItem}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleDarkMode();
                      setShowMoreMenu(false);
                    }}
                  >
                    <span>{darkMode ? "☀️" : "🌙"}</span>
                    <span>{darkMode ? "حالت روشن" : "حالت تاریک"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* نمایش لینک دعوت برای مالک رویدادهای دعوتی */}
        {isOwner &&
          isInviteOnlyEvent(event) &&
          event.invitation?.inviteCode && (
            <div className={styles.inviteLinkContainer}>
              <div className={styles.inviteLinkHeader}>
                <span className={styles.inviteLinkIcon}>🔒</span>
                <h3>لینک دعوت خصوصی</h3>
              </div>
              <p className={styles.inviteLinkDescription}>
                این رویداد از نوع دعوتی است. از لینک زیر برای دعوت افراد استفاده
                کنید:
              </p>
              <div className={styles.inviteLinkBox}>
                <div className={styles.inviteLinkSection}>
                  <label>🔗 لینک دعوت:</label>
                  <div className={styles.linkWrapper}>
                    <input
                      type="text"
                      readOnly
                      value={`${
                        typeof window !== "undefined"
                          ? window.location.origin
                          : ""
                      }/events/join?code=${event.invitation.inviteCode}`}
                      className={styles.linkInput}
                      onClick={(e) => e.target.select()}
                    />
                    <button
                      className={styles.copyBtn}
                      onClick={() => {
                        const link = `${window.location.origin}/events/join?code=${event.invitation.inviteCode}`;
                        navigator.clipboard.writeText(link);
                        alert("✅ لینک دعوت کپی شد!");
                      }}
                    >
                      📋 کپی
                    </button>
                  </div>
                </div>
                <div className={styles.inviteLinkSection}>
                  <label>🔑 کد دعوت:</label>
                  <div className={styles.linkWrapper}>
                    <input
                      type="text"
                      readOnly
                      value={event.invitation.inviteCode}
                      className={styles.linkInput}
                      onClick={(e) => e.target.select()}
                    />
                    <button
                      className={styles.copyBtn}
                      onClick={() => {
                        navigator.clipboard.writeText(
                          event.invitation.inviteCode
                        );
                        alert("✅ کد دعوت کپی شد!");
                      }}
                    >
                      📋 کپی
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Layout دو ستونه در دسکتاپ */}
        <div className={styles.twoColumnLayout}>
          {/* ستون چپ: تصاویر و نقشه */}
          <div className={styles.leftColumn}>
            {/* کاروسل تصاویر */}
            {event.images && event.images.length > 0 && (
              <div className={styles.carouselContainer}>
                <div
                  className={styles.carouselWrapper}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* تصویر فعلی */}
                  <div className={styles.carouselImage}>
                    <img
                      src={
                        event.images[currentImageIndex]?.url ||
                        event.images[currentImageIndex]
                      }
                      alt={
                        event.images[currentImageIndex]?.alt ||
                        `${event.title} - تصویر ${currentImageIndex + 1}`
                      }
                      onError={(e) => {
                        e.target.style.display = "none";
                        console.error(
                          "Failed to load image:",
                          event.images[currentImageIndex]
                        );
                      }}
                    />
                  </div>

                  {/* دکمه قبلی */}
                  {event.images.length > 1 && (
                    <>
                      <button
                        className={`${styles.carouselBtn} ${styles.prevBtn}`}
                        onClick={prevImage}
                        aria-label="تصویر قبلی"
                      >
                        ❮
                      </button>

                      {/* دکمه بعدی */}
                      <button
                        className={`${styles.carouselBtn} ${styles.nextBtn}`}
                        onClick={nextImage}
                        aria-label="تصویر بعدی"
                      >
                        ❯
                      </button>
                    </>
                  )}

                  {/* شمارنده تصاویر */}
                  <div className={styles.imageCounter}>
                    {currentImageIndex + 1} / {event.images.length}
                  </div>
                </div>

                {/* نقاط نشانگر (dots) */}
                {event.images.length > 1 && (
                  <div className={styles.carouselDots}>
                    {event.images.map((_, index) => (
                      <button
                        key={index}
                        className={`${styles.dot} ${
                          index === currentImageIndex ? styles.activeDot : ""
                        }`}
                        onClick={() => goToImage(index)}
                        aria-label={`رفتن به تصویر ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* نمایش نقشه - فقط برای رویدادهای حضوری */}
            {event.formatMode?.code !== "ONLINE" &&
              event.formatMode?.title !== "آنلاین" &&
              event.location?.coordinates &&
              event.location.coordinates.length === 2 && (
                <div className={styles.sidebarMapContainer}>
                  <h3 className={styles.sidebarMapTitle}>📍 موقعیت روی نقشه</h3>
                  <div className={styles.sidebarMapWrapper}>
                    <MapPicker
                      key={`map-${event._id}`}
                      value={[
                        event.location.coordinates[1],
                        event.location.coordinates[0],
                      ]}
                      onChange={() => {}}
                      selectedCity={{ name: event.location.city }}
                      selectedProvince={{ name: event.location.province }}
                      readOnly={true}
                    />
                  </div>
                </div>
              )}

            {/* قسمت امتیازات و نظرات - زیر نقشه (در دسکتاپ) */}
            <div className={styles.reviewsWrapper}>
              {/* امتیازات */}
              {event._id && (
                <EventReviews
                  eventId={event._id}
                  isOwner={isOwner}
                  showStatsOnly={true}
                />
              )}

              {/* نظرات */}
              {event._id && (
                <EventReviews
                  eventId={event._id}
                  isOwner={isOwner}
                  showReviewsOnly={true}
                />
              )}
            </div>
          </div>

          {/* ستون راست: اطلاعات */}
          <div className={styles.rightColumn}>
            <div className={styles.content}>
              <div className={styles.header}>
                <h1 className={styles.title}>{event.title}</h1>
                <div className={styles.meta}>
                  <span className={styles.creator}>
                    👤 {event.creator?.firstName} {event.creator?.lastName}
                  </span>
                  <span className={styles.date}>
                    📅 {formatDate(event.createdAt)}
                  </span>
                </div>
              </div>

              {/* توضیحات */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>📝 توضیحات</h2>
                <p className={styles.description}>{event.description}</p>
              </div>

              {/* دسته‌بندی‌ها */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>🏷️ دسته‌بندی‌ها</h2>
                <div className={styles.categories}>
                  {event.topicCategory && (
                    <span className={styles.category}>
                      {event.topicCategory.icon} {event.topicCategory.title}
                    </span>
                  )}
                  {event.formatMode && (
                    <span className={styles.category}>
                      {event.formatMode.icon} {event.formatMode.title}
                    </span>
                  )}
                  {event.participationType && (
                    <span className={styles.category}>
                      {event.participationType.icon}{" "}
                      {event.participationType.title}
                    </span>
                  )}
                </div>
              </div>

              {/* اطلاعات زمان و مکان */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>📍 زمان و مکان</h2>
                <div className={styles.infoGrid}>
                  {/* تاریخ */}
                  {event.startDate && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>📅 تاریخ شروع:</span>
                      <span className={styles.infoValue}>
                        {formatDate(event.startDate)}
                      </span>
                    </div>
                  )}
                  {event.endDate && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>📅 تاریخ پایان:</span>
                      <span className={styles.infoValue}>
                        {formatDate(event.endDate)}
                      </span>
                    </div>
                  )}

                  {/* نوع تکرار */}
                  {event.schedule?.recurrence && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>🔄 نوع برگزاری:</span>
                      <span className={styles.infoValue}>
                        {event.schedule.recurrence === "one-time"
                          ? "یک‌باره"
                          : event.schedule.recurrence === "recurring"
                          ? "دوره‌ای"
                          : "مداوم"}
                      </span>
                    </div>
                  )}

                  {/* بازه زمانی */}
                  {event.schedule?.eventDuration && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>⏱️ بازه زمانی:</span>
                      <span className={styles.infoValue}>
                        {event.schedule.eventDuration === "day"
                          ? "یک روز"
                          : event.schedule.eventDuration === "week"
                          ? "یک هفته"
                          : "یک ماه یا بیشتر"}
                      </span>
                    </div>
                  )}

                  {/* مکان حضوری */}
                  {event.location?.venue && (
                    <>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>🏢 مکان:</span>
                        <span className={styles.infoValue}>
                          {event.location.venue}
                        </span>
                      </div>
                      {event.location.city && (
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>🌆 شهر:</span>
                          <span className={styles.infoValue}>
                            {event.location.city}
                            {event.location.province &&
                              `, ${event.location.province}`}
                          </span>
                        </div>
                      )}
                      {event.location.address && (
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>📍 آدرس:</span>
                          <span className={styles.infoValue}>
                            {event.location.address}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* آنلاین */}
                  {event.onlinePlatform && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>
                        💻 پلتفرم آنلاین:
                      </span>
                      <span className={styles.infoValue}>
                        {event.onlinePlatform}
                      </span>
                    </div>
                  )}
                  {event.onlineLink && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>🔗 لینک:</span>
                      <span className={styles.infoValue}>
                        <a
                          href={event.onlineLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {event.onlineLink}
                        </a>
                      </span>
                    </div>
                  )}

                  {/* ظرفیت */}
                  {event.capacity && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>👥 ظرفیت:</span>
                      <span className={styles.infoValue}>
                        {event.capacity} نفر
                        {event.registeredCount !== undefined &&
                          ` (${event.registeredCount} نفر ثبت‌نام کرده)`}
                      </span>
                    </div>
                  )}

                  {/* ضرب‌الاجل ثبت‌نام */}
                  {event.registrationDeadline && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>⏰ مهلت ثبت‌نام:</span>
                      <span className={styles.infoValue}>
                        {formatDate(event.registrationDeadline)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* اطلاعات بلیط و قیمت */}
              {event.ticket && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>🎫 اطلاعات بلیط</h2>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>نوع:</span>
                      <span className={styles.infoValue}>
                        {event.ticket.type === "free"
                          ? "🆓 رایگان"
                          : event.ticket.type === "paid"
                          ? "💰 پولی"
                          : "🎟️ ترکیبی"}
                      </span>
                    </div>

                    {event.ticket.type !== "free" && event.ticket.price > 0 && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>قیمت:</span>
                        <span className={styles.infoValue}>
                          {event.ticket.price.toLocaleString("fa-IR")} تومان
                        </span>
                      </div>
                    )}

                    {event.ticket.refundable !== undefined && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>قابل استرداد:</span>
                        <span className={styles.infoValue}>
                          {event.ticket.refundable ? "✅ بله" : "❌ خیر"}
                        </span>
                      </div>
                    )}

                    {event.ticket.saleEndDate && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>پایان فروش:</span>
                        <span className={styles.infoValue}>
                          {formatDate(event.ticket.saleEndDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* سخنران‌ها */}
              {event.speakers && event.speakers.length > 0 && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>🎤 سخنران‌ها</h2>
                  <div className={styles.speakers}>
                    {event.speakers.map((speaker, index) => (
                      <div key={index} className={styles.speakerCard}>
                        {speaker.image && (
                          <img
                            src={speaker.image}
                            alt={speaker.name}
                            className={styles.speakerImage}
                          />
                        )}
                        <div className={styles.speakerInfo}>
                          <h3 className={styles.speakerName}>{speaker.name}</h3>
                          {speaker.role && (
                            <span className={styles.speakerRole}>
                              {speaker.role}
                            </span>
                          )}
                          {speaker.bio && (
                            <p className={styles.speakerBio}>{speaker.bio}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* اطلاعات تماس */}
              {(event.contactInfo?.phone || event.contactInfo?.email) && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>📞 اطلاعات تماس</h2>
                  <div className={styles.contact}>
                    {event.contactInfo.phone && event.contactInfo.showPhone && (
                      <div className={styles.contactItem}>
                        📱 {event.contactInfo.phone}
                      </div>
                    )}
                    {event.contactInfo.email &&
                      event.contactInfo.showEmail !== false && (
                        <div className={styles.contactItem}>
                          📧 {event.contactInfo.email}
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* ویژگی‌ها و امکانات */}
              {(event.createGroupChat || event.hasCertificate) && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>✨ ویژگی‌ها و امکانات</h2>
                  <div className={styles.features}>
                    {event.createGroupChat && (
                      <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>💬</div>
                        <div className={styles.featureContent}>
                          <h3>گروه چت اختصاصی</h3>
                          <p>
                            شرکت‌کنندگان می‌توانند در گروه چت رویداد عضو شوند و
                            با یکدیگر در ارتباط باشند.
                          </p>
                        </div>
                      </div>
                    )}

                    {event.hasCertificate && (
                      <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>🏆</div>
                        <div className={styles.featureContent}>
                          <h3>صدور گواهی‌نامه</h3>
                          <p>
                            شرکت‌کنندگان واجد شرایط، گواهی‌نامه معتبر دریافت
                            می‌کنند.
                          </p>
                          {event.certificateSettings && (
                            <div className={styles.certificateInfo}>
                              {event.certificateSettings.title && (
                                <div className={styles.certificateItem}>
                                  <strong>عنوان:</strong>{" "}
                                  {event.certificateSettings.title}
                                </div>
                              )}
                              {event.certificateSettings.issuerName && (
                                <div className={styles.certificateItem}>
                                  <strong>صادرکننده:</strong>{" "}
                                  {event.certificateSettings.issuerName}
                                </div>
                              )}
                              <div className={styles.certificateItem}>
                                <strong>حداقل حضور:</strong>{" "}
                                {event.certificateSettings
                                  .minAttendancePercent || 80}
                                %
                              </div>
                              {event.certificateSettings.requiresCompletion !==
                                false && (
                                <div className={styles.certificateItem}>
                                  ✅ نیاز به اتمام کامل رویداد
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* سایر دسته‌بندی‌ها */}
              {(event.intent ||
                event.emotional ||
                event.audienceType ||
                event.socialDynamics ||
                event.impactPurpose) && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>🏷️ سایر دسته‌بندی‌ها</h2>
                  <div className={styles.categoriesList}>
                    {event.intent && (
                      <div className={styles.categoryItem}>
                        <span className={styles.categoryIcon}>
                          {event.intent.icon || "🎯"}
                        </span>
                        <span className={styles.categoryName}>
                          {event.intent.title}
                        </span>
                      </div>
                    )}
                    {event.emotional && (
                      <div className={styles.categoryItem}>
                        <span className={styles.categoryIcon}>
                          {event.emotional.icon || "❤️"}
                        </span>
                        <span className={styles.categoryName}>
                          {event.emotional.title}
                        </span>
                      </div>
                    )}
                    {event.audienceType && (
                      <div className={styles.categoryItem}>
                        <span className={styles.categoryIcon}>
                          {event.audienceType.icon || "👥"}
                        </span>
                        <span className={styles.categoryName}>
                          {event.audienceType.title}
                        </span>
                      </div>
                    )}
                    {event.socialDynamics && (
                      <div className={styles.categoryItem}>
                        <span className={styles.categoryIcon}>
                          {event.socialDynamics.icon || "🤝"}
                        </span>
                        <span className={styles.categoryName}>
                          {event.socialDynamics.title}
                        </span>
                      </div>
                    )}
                    {event.impactPurpose && (
                      <div className={styles.categoryItem}>
                        <span className={styles.categoryIcon}>
                          {event.impactPurpose.icon || "✨"}
                        </span>
                        <span className={styles.categoryName}>
                          {event.impactPurpose.title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* دکمه‌های عملیات - مدیریت شده */}
              <div className={styles.actionsContainer}>
                {/* دکمه‌های اصلی */}
                <div className={styles.primaryActions}>
                  {!isOwner && event.status === "approved" && (
                    <>
                      {/* نمایش دکمه Join فقط اگر هیچ درخواستی نداریم یا درخواست CANCELED شده - و رویداد دعوتی نباشد */}
                      {(!joinRequest ||
                        joinRequest.status === JOIN_REQUEST_STATUS.CANCELED) &&
                        !isInviteOnlyEvent(event) && (
                          <button
                            className={styles.joinBtn}
                            onClick={handleJoinEvent}
                          >
                            <span>
                              {joinRequest?.status ===
                              JOIN_REQUEST_STATUS.CANCELED
                                ? "🔄"
                                : "✅"}
                            </span>
                            <span>
                              {joinRequest?.status ===
                              JOIN_REQUEST_STATUS.CANCELED
                                ? "درخواست مجدد"
                                : "پیوستن به رویداد"}
                            </span>
                          </button>
                        )}
                      <button
                        className={styles.commentBtn}
                        onClick={() => setShowCommentModal(true)}
                      >
                        <span>💭</span>
                        <span>ثبت نظر</span>
                      </button>
                    </>
                  )}

                  {isOwner && (
                    <>
                      <button
                        className={styles.manageBtn}
                        onClick={() =>
                          router.push(`/dashboard/events/${event._id}/manage`)
                        }
                      >
                        <span>⚙️</span>
                        <span>مدیریت</span>
                      </button>
                      <button
                        className={styles.editBtn}
                        onClick={() =>
                          router.push(`/dashboard/events/${event._id}/edit`)
                        }
                      >
                        <span>✏️</span>
                        <span>ویرایش</span>
                      </button>
                    </>
                  )}
                </div>

                {/* دکمه‌های ثانویه */}
                <div className={styles.secondaryActions}>
                  {!isOwner && event.status === "approved" && (
                    <button
                      className={styles.messageBtn}
                      onClick={handleMessage}
                      title="ارسال پیام به مالک"
                    >
                      <span>💬</span>
                      <span>پیام</span>
                    </button>
                  )}

                  {isOwner && inviteLink && (
                    <button
                      className={styles.inviteBtn}
                      onClick={handleCopyLink}
                      title="کپی لینک دعوت خصوصی"
                    >
                      <span>🔗</span>
                      <span>لینک دعوت</span>
                    </button>
                  )}

                  <button
                    className={styles.backBtn}
                    onClick={() => router.back()}
                  >
                    <span>←</span>
                    <span>بازگشت</span>
                  </button>
                </div>
              </div>

              {/* Modal اشتراک‌گذاری */}
              {showShareModal && (
                <div
                  className={styles.modalOverlay}
                  onClick={() => setShowShareModal(false)}
                >
                  <div
                    className={styles.modal}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={styles.modalHeader}>
                      <h3>اشتراک‌گذاری رویداد</h3>
                      <button
                        className={styles.modalClose}
                        onClick={() => setShowShareModal(false)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className={styles.modalBody}>
                      <div className={styles.shareOptions}>
                        <button
                          className={styles.shareOption}
                          onClick={() => {
                            handleCopyLink();
                            setShowShareModal(false);
                          }}
                        >
                          <span>📋</span>
                          <span>کپی لینک</span>
                        </button>
                        <a
                          href={`https://t.me/share/url?url=${encodeURIComponent(
                            window.location.href
                          )}&text=${encodeURIComponent(event.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.shareOption}
                        >
                          <span>📱</span>
                          <span>تلگرام</span>
                        </a>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            event.title + " - " + window.location.href
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.shareOption}
                        >
                          <span>💚</span>
                          <span>واتساپ</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal ثبت نظر */}
              {showCommentModal && (
                <div
                  className={styles.modalOverlay}
                  onClick={() => setShowCommentModal(false)}
                >
                  <div
                    className={styles.modal}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <form onSubmit={handleSubmitComment}>
                      <div className={styles.modalHeader}>
                        <h3>ثبت نظر</h3>
                        <button
                          type="button"
                          className={styles.modalClose}
                          onClick={() => setShowCommentModal(false)}
                        >
                          ✕
                        </button>
                      </div>
                      <div className={styles.modalBody}>
                        <div className={styles.formGroup}>
                          <label>
                            نظر شما <span className={styles.required}>*</span>
                          </label>
                          <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="نظر خود را درباره این رویداد بنویسید..."
                            required
                            maxLength={1000}
                            rows={6}
                            className={styles.textarea}
                          />
                          <div className={styles.charCount}>
                            {commentText.length} / 1000
                          </div>
                        </div>
                      </div>
                      <div className={styles.modalFooter}>
                        <button
                          type="button"
                          className={styles.cancelBtn}
                          onClick={() => setShowCommentModal(false)}
                        >
                          انصراف
                        </button>
                        <button type="submit" className={styles.confirmBtn}>
                          ثبت نظر
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Modal گزارش تخلف */}
              {showReportModal && (
                <div
                  className={styles.modalOverlay}
                  onClick={() => setShowReportModal(false)}
                >
                  <div
                    className={styles.modal}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <form onSubmit={handleSubmitReport}>
                      <div className={styles.modalHeader}>
                        <h3>گزارش تخلف</h3>
                        <button
                          type="button"
                          className={styles.modalClose}
                          onClick={() => setShowReportModal(false)}
                        >
                          ✕
                        </button>
                      </div>
                      <div className={styles.modalBody}>
                        <div className={styles.formGroup}>
                          <label>
                            نوع تخلف <span className={styles.required}>*</span>
                          </label>
                          <select
                            value={reportData.category}
                            onChange={(e) =>
                              setReportData((prev) => ({
                                ...prev,
                                category: e.target.value,
                              }))
                            }
                            required
                            className={styles.select}
                          >
                            <option value="">انتخاب کنید</option>
                            <option value="inappropriate_content">
                              محتوای نامناسب
                            </option>
                            <option value="spam">هرزنامه</option>
                            <option value="misleading">گمراه‌کننده</option>
                            <option value="copyright">
                              نقض حق نسخه‌برداری
                            </option>
                            <option value="violence">خشونت</option>
                            <option value="harassment">آزار و اذیت</option>
                            <option value="scam">کلاهبرداری</option>
                            <option value="other">سایر</option>
                          </select>
                        </div>

                        <div className={styles.formGroup}>
                          <label>
                            عنوان <span className={styles.required}>*</span>
                          </label>
                          <input
                            type="text"
                            value={reportData.title}
                            onChange={(e) =>
                              setReportData((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            placeholder="عنوان گزارش را وارد کنید"
                            required
                            maxLength={200}
                            className={styles.input}
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>
                            توضیحات <span className={styles.required}>*</span>
                          </label>
                          <textarea
                            value={reportData.description}
                            onChange={(e) =>
                              setReportData((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            placeholder="توضیحات کامل گزارش را وارد کنید..."
                            required
                            maxLength={2000}
                            rows={5}
                            className={styles.textarea}
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>تصاویر (اختیاری - حداکثر 3 تصویر)</label>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleReportImageChange}
                            className={styles.fileInput}
                          />
                          {reportData.images.length > 0 && (
                            <div className={styles.imagePreview}>
                              {reportData.images.map((image, index) => (
                                <div
                                  key={index}
                                  className={styles.imagePreviewItem}
                                >
                                  <span>{image.name}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveReportImage(index)
                                    }
                                    className={styles.removeImageBtn}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={styles.modalFooter}>
                        <button
                          type="button"
                          className={styles.cancelBtn}
                          onClick={() => setShowReportModal(false)}
                        >
                          انصراف
                        </button>
                        <button type="submit" className={styles.confirmBtn}>
                          ارسال گزارش
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Wallet Check Modal */}
              {showWalletModal && (
                <WalletCheckModal
                  isOpen={showWalletModal}
                  onClose={() => setShowWalletModal(false)}
                  eventId={event?._id}
                  eventTitle={event?.title}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* امتیازات و نظرات برای موبایل - در پایین صفحه */}
      <div className={styles.mobileReviewsSection}>
        {/* امتیازات */}
        {event._id && (
          <EventReviews
            eventId={event._id}
            isOwner={isOwner}
            showStatsOnly={true}
          />
        )}

        {/* نظرات */}
        {event._id && (
          <EventReviews
            eventId={event._id}
            isOwner={isOwner}
            showReviewsOnly={true}
          />
        )}
      </div>

      {/* مدال ثبت نظر */}
      {showReviewModal && reviewEligibility && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          eventTitle={event?.title || ""}
          onSubmit={handleSubmitReview}
          joinRequestId={reviewEligibility.joinRequestId}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
