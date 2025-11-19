"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./inviteJoin.module.css";
import {
  loadInitialTheme,
  toggleTheme as toggleThemeUtil,
} from "@/lib/utils/themeManager";
import "./inviteJoinDark.css";

/**
 * صفحه پیوستن به رویدادهای دعوتی
 * URL: /events/join?code=INVITE_CODE
 */
export default function InviteJoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [joining, setJoining] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    const initialTheme = loadInitialTheme();
    setDarkMode(initialTheme === "dark");
  }, []);

  const toggleDarkMode = () => {
    const currentTheme = darkMode ? "dark" : "light";
    const newTheme = toggleThemeUtil(currentTheme);
    setDarkMode(newTheme === "dark");
  };

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setInviteCode(code);
      fetchEventByInviteCode(code);
    } else {
      setError("کد دعوت یافت نشد. لطفاً از لینک دعوت معتبر استفاده کنید.");
      setLoading(false);
    }
  }, [searchParams]);

  const fetchEventByInviteCode = async (code) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/events/by-invite-code?code=${encodeURIComponent(code)}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در دریافت اطلاعات رویداد");
      }

      setEvent(data.event);
    } catch (err) {
      console.error("Error fetching event:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async () => {
    if (!event || !inviteCode) {
      return;
    }

    if (!confirm(`آیا می‌خواهید به رویداد "${event.title}" بپیوندید؟`)) {
      return;
    }

    try {
      setJoining(true);

      const response = await fetch(`/api/events/${event._id}/join`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inviteCode }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${data.message || "درخواست شما با موفقیت ثبت شد"}`);
        router.push("/dashboard/myEvents?tab=participating");
      } else {
        if (data.requiresAuth) {
          const currentUrl = `/events/join?code=${inviteCode}`;
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
    } catch (err) {
      console.error("Error joining event:", err);
      alert("خطا در ارتباط با سرور");
    } finally {
      setJoining(false);
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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p>در حال بررسی دعوت‌نامه...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorWrapper}>
          <div className={styles.errorIcon}>❌</div>
          <h2>خطا</h2>
          <p>{error}</p>
          <button
            onClick={() => router.push("/")}
            className={styles.homeButton}
          >
            بازگشت به صفحه اصلی
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={styles.container}>
        <div className={styles.errorWrapper}>
          <div className={styles.errorIcon}>🔍</div>
          <h2>رویداد یافت نشد</h2>
          <p>متأسفانه رویدادی با این کد دعوت یافت نشد.</p>
          <button
            onClick={() => router.push("/")}
            className={styles.homeButton}
          >
            بازگشت به صفحه اصلی
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button className={styles.themeToggle} onClick={toggleDarkMode}>
        {darkMode ? "🌞" : "🌙"}
      </button>

      <div className={styles.inviteCard}>
        {/* Header */}
        <div className={styles.inviteHeader}>
          <div className={styles.inviteIcon}>🎉</div>
          <h1>شما دعوت شده‌اید!</h1>
          <p>به رویداد زیر دعوت شده‌اید</p>
        </div>

        {/* Event Info */}
        <div className={styles.eventInfo}>
          {event.images && event.images.length > 0 && (
            <div className={styles.eventImage}>
              <img
                src={event.images[0]}
                alt={event.title}
                onError={(e) => {
                  e.target.src = "/placeholder-event.jpg";
                }}
              />
            </div>
          )}

          <h2 className={styles.eventTitle}>{event.title}</h2>

          {event.description && (
            <p className={styles.eventDescription}>
              {event.description.length > 200
                ? `${event.description.substring(0, 200)}...`
                : event.description}
            </p>
          )}

          <div className={styles.eventDetails}>
            {event.schedule?.startDate && (
              <div className={styles.detailItem}>
                <span className={styles.detailIcon}>📅</span>
                <div>
                  <strong>تاریخ شروع:</strong>
                  <p>{formatDate(event.schedule.startDate)}</p>
                </div>
              </div>
            )}

            {event.schedule?.endDate && (
              <div className={styles.detailItem}>
                <span className={styles.detailIcon}>🏁</span>
                <div>
                  <strong>تاریخ پایان:</strong>
                  <p>{formatDate(event.schedule.endDate)}</p>
                </div>
              </div>
            )}

            {event.formatMode && (
              <div className={styles.detailItem}>
                <span className={styles.detailIcon}>
                  {event.formatMode.code === "ONLINE" ? "💻" : "📍"}
                </span>
                <div>
                  <strong>نحوه برگزاری:</strong>
                  <p>{event.formatMode.title}</p>
                </div>
              </div>
            )}

            {event.location?.address && event.formatMode?.code !== "ONLINE" && (
              <div className={styles.detailItem}>
                <span className={styles.detailIcon}>🗺️</span>
                <div>
                  <strong>مکان:</strong>
                  <p>{event.location.address}</p>
                </div>
              </div>
            )}

            {event.capacity && (
              <div className={styles.detailItem}>
                <span className={styles.detailIcon}>👥</span>
                <div>
                  <strong>ظرفیت:</strong>
                  <p>
                    {event.registeredCount || 0} / {event.capacity} نفر
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            onClick={handleJoinEvent}
            disabled={joining}
            className={styles.joinButton}
          >
            {joining ? "در حال ثبت درخواست..." : "✅ پیوستن به رویداد"}
          </button>
          <button
            onClick={() => router.push(`/events/${event._id}`)}
            className={styles.viewButton}
          >
            👁️ مشاهده جزئیات رویداد
          </button>
        </div>

        {/* Footer Note */}
        <div className={styles.footerNote}>
          <p>
            🔒 این یک رویداد دعوتی است و فقط با لینک دعوت قابل دسترسی
            می‌باشد.
          </p>
        </div>
      </div>
    </div>
  );
}

