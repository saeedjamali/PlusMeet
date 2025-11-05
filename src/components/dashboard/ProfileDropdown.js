"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/NewAuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import styles from "./ProfileDropdown.module.css";

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [wallet, setWallet] = useState(null);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // دریافت اطلاعات کیف پول
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await fetch("/api/wallet", {
          credentials: "include",
        });
        const data = await response.json();
        if (data.success) {
          setWallet(data.data);
        }
      } catch (err) {
        // Error logged
      }
    };

    if (user && user.roles && !user.roles.includes("guest")) {
      fetchWallet();
    }
  }, [user]);

  // بستن dropdown با کلیک بیرون
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatPrice = (price) => {
    if (!price) return "0";
    return new Intl.NumberFormat("fa-IR").format(price);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const menuItems = [
    {
      id: "wallet",
      label: "کیف پول من",
      icon: "💰",
      path: "/dashboard/wallet",
      badge: wallet ? `${formatPrice(wallet.balance)} ریال` : null,
      badgeColor: "green",
      show: user && !user.roles?.includes("guest"),
    },
    {
      id: "divider-1",
      type: "divider",
      show: true,
    },
    {
      id: "transactions",
      label: "جمع تنظیمات من",
      icon: "💳",
      path: "/dashboard/wallet",
      subLabel: "0 ریال",
      show: user && !user.roles?.includes("guest"),
    },
    {
      id: "badges",
      label: "نشان شده‌ها",
      icon: "🏆",
      path: "/dashboard/badges",
      show: true,
    },
    {
      id: "divider-2",
      type: "divider",
      show: true,
    },
    {
      id: "support",
      label: "پیام به پشتیبانی (لینک‌بت)",
      icon: "💬",
      path: "/dashboard/support",
      show: true,
    },
    {
      id: "orders",
      label: "سفارش های من",
      icon: "📋",
      path: "/dashboard/orders",
      show: true,
    },
    {
      id: "identity",
      label: "احراز هویت",
      icon: "👤",
      path: "/dashboard/identity",
      show: true,
    },
    {
      id: "security",
      label: "امنیت حساب",
      icon: "🛡️",
      path: "/dashboard/security",
      show: true,
    },
    {
      id: "bank-accounts",
      label: "حساب‌های بانکی",
      icon: "🏦",
      path: "/dashboard/bank-accounts",
      show: user && !user.roles?.includes("guest"),
    },
    {
      id: "referral",
      label: "معرفی دوستان",
      icon: "🤝",
      path: "/dashboard/referral",
      show: true,
    },
    {
      id: "divider-3",
      type: "divider",
      show: true,
    },
    {
      id: "theme",
      label: theme === "light" ? "حالت شب" : "حالت روز",
      icon: theme === "light" ? "🌙" : "☀️",
      type: "toggle",
      show: true,
    },
    {
      id: "divider-4",
      type: "divider",
      show: true,
    },
    {
      id: "logout",
      label: "خروج از حساب",
      icon: "🚪",
      type: "button",
      action: handleLogout,
      color: "danger",
      show: true,
    },
  ];

  const handleMenuClick = (item) => {
    if (item.type === "button" && item.action) {
      item.action();
    } else if (item.path) {
      router.push(item.path);
      setIsOpen(false);
    }
  };

  if (!user) return null;

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className={styles.avatar}>
          {user.avatar || user.organizationLogo ? (
            <img
              key={user.avatar || user.organizationLogo}
              src={user.avatar || user.organizationLogo}
              alt="Avatar"
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
          {user.isVerified && <span className={styles.verifiedBadge}>✓</span>}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>
            {user.firstName || user.displayName || "کاربر"}
          </span>
          {user.state && (
            <span
              className={`${styles.userBadge} ${styles[`badge${user.state}`]}`}
            >
              {user.state === "active"
                ? "فعال"
                : user.state === "pending_verification"
                ? "در انتظار تایید"
                : user.state === "suspended"
                ? "تعلیق شده"
                : user.state}
            </span>
          )}
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className={styles.chevronIcon}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {/* Header با اطلاعات حساب */}
          <div className={styles.dropdownHeader}>
            <div className={styles.headerAvatar}>
              {user.avatar || user.organizationLogo ? (
                <img
                  key={user.avatar || user.organizationLogo}
                  src={user.avatar || user.organizationLogo}
                  alt="Avatar"
                />
              ) : (
                <div className={styles.headerAvatarPlaceholder}>
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className={styles.headerInfo}>
              <h4>
                {user.firstName} {user.lastName}
              </h4>
              <button
                className={styles.viewProfile}
                onClick={() => {
                  router.push("/profile");
                  setIsOpen(false);
                }}
              >
                حساب من 👤
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M15 18l-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* کیف پول (اگر guest نیست) */}
          {wallet && (
            <div className={styles.walletCard}>
              <div className={styles.walletIcon}>💰</div>
              <div className={styles.walletInfo}>
                <span className={styles.walletLabel}>موجودی کیف پول</span>
                <div className={styles.walletAmount}>
                  {formatPrice(wallet.balance)} <span>ریال</span>
                </div>
              </div>
              <button
                className={styles.walletBtn}
                onClick={() => {
                  router.push("/dashboard/wallet");
                  setIsOpen(false);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M15 18l-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Menu Items */}
          <div className={styles.menuList}>
            {menuItems
              .filter((item) => item.show)
              .map((item) => {
                if (item.type === "divider") {
                  return <div key={item.id} className={styles.divider} />;
                }

                if (item.type === "toggle") {
                  return (
                    <div key={item.id} className={styles.menuItem}>
                      <span className={styles.menuIcon}>{item.icon}</span>
                      <span className={styles.menuLabel}>{item.label}</span>
                      <label className={styles.toggleSwitch}>
                        <input
                          type="checkbox"
                          checked={theme === "dark"}
                          onChange={toggleTheme}
                        />
                        <span className={styles.toggleSlider}></span>
                      </label>
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    className={`${styles.menuItem} ${
                      item.color === "danger" ? styles.menuItemDanger : ""
                    }`}
                    onClick={() => handleMenuClick(item)}
                  >
                    <span className={styles.menuIcon}>{item.icon}</span>
                    <div className={styles.menuContent}>
                      <span className={styles.menuLabel}>{item.label}</span>
                      {item.subLabel && (
                        <span className={styles.menuSubLabel}>
                          {item.subLabel}
                        </span>
                      )}
                    </div>
                    {item.badge && (
                      <span
                        className={`${styles.menuBadge} ${
                          styles[`badge${item.badgeColor}`]
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.path && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className={styles.menuArrow}
                      >
                        <path
                          d="M15 18l-6-6 6-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
