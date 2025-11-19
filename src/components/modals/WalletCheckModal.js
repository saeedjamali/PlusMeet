"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./Modal.module.css";
import "./ModalDark.css";

/**
 * مدال چک کیف پول و پرداخت
 * برای رویدادهای TICKETED و APPROVAL_TICKETED
 */
export default function WalletCheckModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  onPaymentSuccess,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);
  const [error, setError] = useState(null);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState(null);

  useEffect(() => {
    if (isOpen && eventId) {
      checkWallet();
    }
  }, [isOpen, eventId]);

  const checkWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      setRequiresAuth(false);

      const response = await fetch(`/api/events/${eventId}/check-wallet`, {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        // چک کردن اینکه آیا خطا به دلیل عدم احراز هویت است
        if (data.requiresAuth || response.status === 401) {
          setRequiresAuth(true);
        }
        throw new Error(data.error || "خطا در بررسی کیف پول");
      }

      setWalletInfo(data);
    } catch (err) {
      console.error("Error checking wallet:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError("لطفاً کد تخفیف را وارد کنید");
      return;
    }

    try {
      setApplyingDiscount(true);
      setDiscountError(null);

      const response = await fetch(
        `/api/events/${eventId}/validate-discount?code=${encodeURIComponent(
          discountCode.trim()
        )}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "کد تخفیف نامعتبر است");
      }

      setDiscountInfo(data);
      setDiscountError(null);
    } catch (err) {
      console.error("Error applying discount:", err);
      setDiscountError(err.message);
      setDiscountInfo(null);
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountCode("");
    setDiscountInfo(null);
    setDiscountError(null);
  };

  const handleConfirmPayment = async () => {
    try {
      setProcessing(true);
      setError(null);

      const body = {};
      if (discountInfo && discountCode) {
        body.discountCode = discountCode.trim().toUpperCase();
      }

      const response = await fetch(`/api/events/${eventId}/join-with-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در پرداخت");
      }

      // موفقیت
      alert(data.message);
      onPaymentSuccess && onPaymentSuccess(data);
      onClose();
    } catch (err) {
      console.error("Error joining with payment:", err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleGoToWallet = () => {
    window.location.href = "/dashboard/wallet";
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "500px" }}
      >
        <div className={styles.modalHeader}>
          <h2>💳 بررسی کیف پول</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div className={styles.spinner}></div>
              <p>در حال بررسی موجودی...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p style={{ color: "var(--color-error, #e74c3c)" }}>❌ {error}</p>
              <button
                onClick={() => {
                  if (requiresAuth) {
                    // ریدایرکت به صفحه لاگین با return URL
                    const currentPath = window.location.pathname;
                    router.push(
                      `/login?returnUrl=${encodeURIComponent(currentPath)}`
                    );
                  } else {
                    checkWallet();
                  }
                }}
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 1.5rem",
                  background: requiresAuth
                    ? "linear-gradient(135deg, #27ae60 0%, #229954 100%)"
                    : "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "1rem",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                {requiresAuth ? "🔐 ورود به سیستم" : "🔄 تلاش مجدد"}
              </button>
            </div>
          ) : walletInfo ? (
            <>
              <div
                style={{
                  background: "var(--bg-secondary, #f8f9fa)",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  marginBottom: "1.5rem",
                }}
              >
                <h3
                  style={{
                    marginBottom: "1rem",
                    fontSize: "1.1rem",
                    color: "var(--text-primary, #2c3e50)",
                  }}
                >
                  📊 اطلاعات رویداد
                </h3>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span>عنوان رویداد:</span>
                  <strong>{eventTitle}</strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span>قیمت بلیط:</span>
                  <strong style={{ color: "var(--color-primary, #3498db)" }}>
                    {walletInfo.ticketPrice.toLocaleString("fa-IR")} ریال
                  </strong>
                </div>
              </div>

              {/* بخش کد تخفیف */}
              <div
                style={{
                  background: "var(--bg-secondary, #f8f9fa)",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  marginBottom: "1.5rem",
                  border: discountInfo
                    ? "2px solid var(--color-success, #27ae60)"
                    : "none",
                }}
              >
                <h3
                  style={{
                    marginBottom: "1rem",
                    fontSize: "1.1rem",
                    color: "var(--text-primary, #2c3e50)",
                  }}
                >
                  🎫 کد تخفیف
                </h3>

                {!discountInfo ? (
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "flex-start",
                    }}
                  >
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) =>
                        setDiscountCode(e.target.value.toUpperCase())
                      }
                      placeholder="کد تخفیف خود را وارد کنید"
                      disabled={applyingDiscount}
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        border: "2px solid var(--border-color, #ddd)",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        outline: "none",
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleApplyDiscount();
                        }
                      }}
                    />
                    <button
                      onClick={handleApplyDiscount}
                      disabled={applyingDiscount || !discountCode.trim()}
                      style={{
                        padding: "0.75rem 1.5rem",
                        background:
                          applyingDiscount || !discountCode.trim()
                            ? "#95a5a6"
                            : "var(--color-primary, #3498db)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor:
                          applyingDiscount || !discountCode.trim()
                            ? "not-allowed"
                            : "pointer",
                        fontSize: "1rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {applyingDiscount ? "⏳" : "✓ اعمال"}
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        background: "var(--success-light, #d4edda)",
                        padding: "1rem",
                        borderRadius: "8px",
                        marginBottom: "1rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "bold",
                            color: "var(--color-success, #27ae60)",
                          }}
                        >
                          ✅ کد "{discountCode}" اعمال شد
                        </span>
                        <button
                          onClick={handleRemoveDiscount}
                          style={{
                            background: "transparent",
                            color: "var(--color-error, #e74c3c)",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "1.2rem",
                            padding: "0.25rem",
                          }}
                          title="حذف کد تخفیف"
                        >
                          ✕
                        </button>
                      </div>
                      {discountInfo.title && (
                        <p
                          style={{
                            fontSize: "0.9rem",
                            color: "var(--text-secondary, #7f8c8d)",
                            margin: "0.5rem 0",
                          }}
                        >
                          {discountInfo.title}
                        </p>
                      )}
                      <div
                        style={{
                          marginTop: "0.75rem",
                          paddingTop: "0.75rem",
                          borderTop: "1px dashed var(--color-success, #27ae60)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "0.5rem",
                            fontSize: "0.9rem",
                          }}
                        >
                          <span>قیمت اصلی:</span>
                          <span style={{ textDecoration: "line-through" }}>
                            {discountInfo.originalPrice.toLocaleString("fa-IR")}{" "}
                            ریال
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "0.5rem",
                            fontSize: "0.9rem",
                            color: "var(--color-error, #e74c3c)",
                          }}
                        >
                          <span>تخفیف ({discountInfo.discountText}):</span>
                          <span>
                            -
                            {discountInfo.discountAmount.toLocaleString(
                              "fa-IR"
                            )}{" "}
                            ریال
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontWeight: "bold",
                            color: "var(--color-success, #27ae60)",
                            fontSize: "1.1rem",
                          }}
                        >
                          <span>مبلغ نهایی:</span>
                          <span>
                            {discountInfo.finalPrice.toLocaleString("fa-IR")}{" "}
                            ریال
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {discountError && (
                  <p
                    style={{
                      color: "var(--color-error, #e74c3c)",
                      fontSize: "0.9rem",
                      marginTop: "0.5rem",
                      marginBottom: 0,
                    }}
                  >
                    ❌ {discountError}
                  </p>
                )}
              </div>

              <div
                style={{
                  background: (
                    discountInfo
                      ? walletInfo.availableBalance >= discountInfo.finalPrice
                      : walletInfo.hasSufficientBalance
                  )
                    ? "var(--success-light, #d4edda)"
                    : "var(--error-light, #f8d7da)",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  marginBottom: "1.5rem",
                  border: `2px solid ${
                    (
                      discountInfo
                        ? walletInfo.availableBalance >= discountInfo.finalPrice
                        : walletInfo.hasSufficientBalance
                    )
                      ? "var(--color-success, #27ae60)"
                      : "var(--color-error, #e74c3c)"
                  }`,
                }}
              >
                <h3
                  style={{
                    marginBottom: "1rem",
                    fontSize: "1.1rem",
                    color: (
                      discountInfo
                        ? walletInfo.availableBalance >= discountInfo.finalPrice
                        : walletInfo.hasSufficientBalance
                    )
                      ? "var(--color-success, #27ae60)"
                      : "var(--color-error, #e74c3c)",
                  }}
                >
                  {(
                    discountInfo
                      ? walletInfo.availableBalance >= discountInfo.finalPrice
                      : walletInfo.hasSufficientBalance
                  )
                    ? "✅"
                    : "⚠️"}{" "}
                  کیف پول شما
                </h3>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span>💰 موجودی قابل استفاده:</span>
                  <strong
                    style={{
                      color: (
                        discountInfo
                          ? walletInfo.availableBalance >=
                            discountInfo.finalPrice
                          : walletInfo.hasSufficientBalance
                      )
                        ? "var(--color-success, #27ae60)"
                        : "var(--color-error, #e74c3c)",
                    }}
                  >
                    {walletInfo.availableBalance.toLocaleString("fa-IR")} ریال
                  </strong>
                </div>
                {walletInfo.totalBalance &&
                  walletInfo.totalBalance !== walletInfo.availableBalance && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.75rem",
                        fontSize: "0.9rem",
                        color: "var(--text-secondary, #7f8c8d)",
                      }}
                    >
                      <span>📊 موجودی کل:</span>
                      <span>
                        {walletInfo.totalBalance.toLocaleString("fa-IR")} ریال
                      </span>
                    </div>
                  )}
                {walletInfo.reservedBalance > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.75rem",
                      fontSize: "0.9rem",
                      color: "var(--text-secondary, #7f8c8d)",
                    }}
                  >
                    <span>🔒 رزرو شده:</span>
                    <span>
                      {walletInfo.reservedBalance.toLocaleString("fa-IR")} ریال
                    </span>
                  </div>
                )}
                {!(discountInfo
                  ? walletInfo.availableBalance >= discountInfo.finalPrice
                  : walletInfo.hasSufficientBalance) && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "0.75rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px dashed var(--color-error, #e74c3c)",
                    }}
                  >
                    <span>⚡ مبلغ مورد نیاز برای شارژ:</span>
                    <strong style={{ color: "var(--color-error, #e74c3c)" }}>
                      {(discountInfo
                        ? Math.max(
                            0,
                            discountInfo.finalPrice -
                              walletInfo.availableBalance
                          )
                        : walletInfo.requiredAmount
                      ).toLocaleString("fa-IR")}{" "}
                      ریال
                    </strong>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-secondary, #7f8c8d)",
                  }}
                >
                  {(
                    discountInfo
                      ? walletInfo.availableBalance >= discountInfo.finalPrice
                      : walletInfo.hasSufficientBalance
                  )
                    ? walletInfo.participationType === "APPROVAL_TICKETED"
                      ? "⏱️ با تایید شما، مبلغ رزرو می‌شود و پس از تایید مالک رویداد، کسر خواهد شد."
                      : "✅ با تایید شما، مبلغ بلافاصله کسر شده و در رویداد ثبت‌نام می‌شوید."
                    : "❌ موجودی کیف پول شما کافی نیست. لطفاً ابتدا کیف پول خود را شارژ کنید."}
                </p>
              </div>
            </>
          ) : null}
        </div>

        <div className={styles.modalFooter}>
          {walletInfo && (
            <>
              {(
                discountInfo
                  ? walletInfo.availableBalance >= discountInfo.finalPrice
                  : walletInfo.hasSufficientBalance
              ) ? (
                <>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={processing}
                    style={{
                      flex: 1,
                      padding: "0.75rem 1.5rem",
                      background: processing
                        ? "#95a5a6"
                        : "var(--color-success, #27ae60)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      cursor: processing ? "not-allowed" : "pointer",
                      fontSize: "1rem",
                    }}
                  >
                    {processing
                      ? "در حال پردازش..."
                      : walletInfo.participationType === "APPROVAL_TICKETED"
                      ? "✅ رزرو و ادامه"
                      : "💳 پرداخت و ثبت‌نام"}
                  </button>
                  <button
                    onClick={onClose}
                    disabled={processing}
                    style={{
                      flex: 1,
                      padding: "0.75rem 1.5rem",
                      background: "transparent",
                      color: "var(--text-secondary, #7f8c8d)",
                      border: "2px solid var(--border-color, #ddd)",
                      borderRadius: "8px",
                      cursor: processing ? "not-allowed" : "pointer",
                      fontSize: "1rem",
                    }}
                  >
                    لغو
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleGoToWallet}
                    style={{
                      flex: 1,
                      padding: "0.75rem 1.5rem",
                      background: "var(--color-primary, #3498db)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: "1rem",
                    }}
                  >
                    💰 شارژ کیف پول
                  </button>
                  <button
                    onClick={onClose}
                    style={{
                      flex: 1,
                      padding: "0.75rem 1.5rem",
                      background: "transparent",
                      color: "var(--text-secondary, #7f8c8d)",
                      border: "2px solid var(--border-color, #ddd)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "1rem",
                    }}
                  >
                    لغو
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-top: 4px solid var(--color-primary, #3498db);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
