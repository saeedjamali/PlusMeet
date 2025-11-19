"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./wallet.module.css";

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeLoading, setChargeLoading] = useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [bankAccount, setBankAccount] = useState({
    iban: "",
    accountHolder: "",
    bankName: "",
  });

  // Filter states
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const searchParams = useSearchParams();

  // چک کردن نتیجه پرداخت
  useEffect(() => {
    const payment = searchParams.get("payment");
    const refId = searchParams.get("ref_id");
    const amount = searchParams.get("amount");
    const reason = searchParams.get("reason");

    if (payment === "success" && refId) {
      alert(
        `پرداخت با موفقیت انجام شد!\nکد پیگیری: ${refId}\nمبلغ: ${formatPrice(
          amount
        )} ریال`
      );
      // پاک کردن query params از URL
      window.history.replaceState({}, "", "/dashboard/wallet");
    } else if (payment === "failed") {
      const message =
        reason === "cancelled"
          ? "پرداخت لغو شد"
          : reason === "invalid"
          ? "درخواست پرداخت نامعتبر است"
          : reason === "not_found"
          ? "تراکنش یافت نشد"
          : `پرداخت ناموفق: ${reason}`;

      alert(message);
      window.history.replaceState({}, "", "/dashboard/wallet");
    }
  }, [searchParams]);

  // دریافت اطلاعات کیف پول
  const fetchWallet = async () => {
    try {
      const response = await fetch("/api/wallet", {
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setWallet(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("خطا در دریافت اطلاعات کیف پول");
      // Error logged for debugging
    }
  };

  // دریافت تراکنش‌ها
  const fetchTransactions = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (filterType !== "all") {
        params.append("type", filterType);
      }

      if (filterStatus !== "all") {
        params.append("status", filterStatus);
      }

      const response = await fetch(
        `/api/wallet/transactions?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.success) {
        setTransactions(data.data || []);
        setPagination(data.pagination);
        setStats(data.stats);
      } else {
        setError(data.error);
        setTransactions([]);
      }
    } catch (err) {
      setError("خطا در دریافت تراکنش‌ها");
      setTransactions([]);
      // Error logged for debugging
    }
  };

  // Load اولیه
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchWallet(), fetchTransactions()]);
      setLoading(false);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load با فیلتر یا صفحه جدید
  useEffect(() => {
    if (!loading) {
      fetchTransactions(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterStatus, currentPage]);

  // درخواست شارژ کیف پول
  const handleChargeWallet = async (e) => {
    e.preventDefault();

    const amount = parseInt(chargeAmount);

    if (!amount || amount < 1000) {
      alert("مبلغ باید حداقل 1000 ریال باشد");
      return;
    }

    if (amount > 100000000) {
      alert("مبلغ نباید بیشتر از 100 میلیون ریال باشد");
      return;
    }

    setChargeLoading(true);

    try {
      const response = await fetch("/api/payment/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          amount,
          description: `شارژ کیف پول ${amount} ریال`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect به درگاه پرداخت
        window.location.href = data.data.paymentUrl;
      } else {
        alert(data.error || "خطا در ایجاد درخواست پرداخت");
      }
    } catch (err) {
      alert("خطا در اتصال به سرور");
      // Error logged for debugging
    } finally {
      setChargeLoading(false);
    }
  };

  // درخواست برداشت از کیف پول
  const handleWithdrawRequest = async (e) => {
    e.preventDefault();

    const amount = parseInt(withdrawAmount);

    if (!amount || amount < 10000) {
      alert("مبلغ برداشت باید حداقل 10,000 ریال باشد");
      return;
    }

    if (amount > 50000000) {
      alert("مبلغ برداشت نباید بیشتر از 50 میلیون ریال باشد");
      return;
    }

    if (!bankAccount.iban || !bankAccount.accountHolder) {
      alert("لطفاً اطلاعات حساب بانکی را کامل کنید");
      return;
    }

    // اعتبارسنجی شبا
    if (!/^IR\d{24}$/.test(bankAccount.iban)) {
      alert("شماره شبا نامعتبر است. فرمت صحیح: IR + 24 رقم");
      return;
    }

    setWithdrawLoading(true);

    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          amount,
          bankAccount,
          description: `درخواست برداشت ${amount} ریال`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        setBankAccount({ iban: "", accountHolder: "", bankName: "" });
        // رفرش اطلاعات
        await Promise.all([fetchWallet(), fetchTransactions()]);
      } else {
        alert(data.error || "خطا در ثبت درخواست برداشت");
      }
    } catch (err) {
      alert("خطا در اتصال به سرور");
      // Error logged for debugging
    } finally {
      setWithdrawLoading(false);
    }
  };

  // فرمت قیمت
  const formatPrice = (price) => {
    if (!price) return "0";
    return new Intl.NumberFormat("fa-IR").format(price);
  };

  // فرمت تاریخ
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // دریافت نام فارسی نوع تراکنش
  const getTransactionTypeName = (type) => {
    const types = {
      deposit: "واریز",
      withdraw: "برداشت",
      payment: "پرداخت",
      refund: "بازگشت وجه",
      transfer_in: "انتقال دریافتی",
      transfer_out: "انتقال ارسالی",
      commission: "کمیسیون",
      bonus: "پاداش",
      penalty: "جریمه",
    };
    return types[type] || type;
  };

  // دریافت نام فارسی وضعیت
  const getStatusName = (status) => {
    const statuses = {
      pending: "در انتظار",
      processing: "در حال پردازش",
      completed: "تکمیل شده",
      failed: "ناموفق",
      cancelled: "لغو شده",
      refunded: "بازگشت داده شده",
    };
    return statuses[status] || status;
  };

  // دریافت کلاس badge وضعیت
  const getStatusBadgeClass = (status) => {
    const classes = {
      completed: styles.badgeSuccess,
      pending: styles.badgeWarning,
      processing: styles.badgeInfo,
      failed: styles.badgeDanger,
      cancelled: styles.badgeDanger,
      refunded: styles.badgeSecondary,
    };
    return `${styles.badge} ${classes[status] || ""}`;
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
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>تلاش مجدد</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>کیف پول من</h1>
          <p className={styles.subtitle}>مدیریت موجودی و تراکنش‌های مالی</p>
        </div>
      </div>

      {/* Wallet Card */}
      <div className={styles.walletCard}>
        <div className={styles.walletHeader}>
          <div className={styles.walletIcon}>💰</div>
          <div className={styles.walletInfo}>
            <span className={styles.walletLabel}>موجودی کل</span>
            <h2 className={styles.walletBalance}>
              {formatPrice(wallet?.balance)} ریال
            </h2>
          </div>
        </div>

        <div className={styles.walletDetails}>
          <div className={styles.walletDetailItem}>
            <span className={styles.detailLabel}>قابل برداشت</span>
            <span className={styles.detailValue}>
              {formatPrice(wallet?.availableBalance)} ریال
            </span>
          </div>
          <div className={styles.walletDetailItem}>
            <span className={styles.detailLabel}>مسدود شده</span>
            <span className={styles.detailValue}>
              {formatPrice(wallet?.frozenBalance)} ریال
            </span>
          </div>
        </div>

        <div className={styles.walletActions}>
          <button
            className={styles.chargeBtn}
            onClick={() => setShowChargeModal(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            شارژ کیف پول
          </button>

          <button
            className={styles.withdrawBtn}
            onClick={() => setShowWithdrawModal(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 12H3m0 0l8.5-8.5M3 12l8.5 8.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            درخواست برداشت
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14m7-7l-7-7-7 7"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>کل واریزی‌ها</span>
              <span className={styles.statValue}>
                {formatPrice(stats.totalIn)} ریال
              </span>
              <span className={styles.statCount}>{stats.countIn} تراکنش</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{
                background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 19V5m-7 7l7 7 7-7"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>کل برداشت‌ها</span>
              <span className={styles.statValue}>
                {formatPrice(stats.totalOut)} ریال
              </span>
              <span className={styles.statCount}>{stats.countOut} تراکنش</span>
            </div>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className={styles.transactionsSection}>
        <div className={styles.transactionsHeader}>
          <h2 className={styles.sectionTitle}>تراکنش‌ها</h2>

          <div className={styles.filters}>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="all">همه انواع</option>
              <option value="deposit">واریز</option>
              <option value="withdraw">برداشت</option>
              <option value="payment">پرداخت</option>
              <option value="refund">بازگشت وجه</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="completed">تکمیل شده</option>
              <option value="pending">در انتظار</option>
              <option value="failed">ناموفق</option>
            </select>
          </div>
        </div>

        {!transactions || transactions.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 11l3 3L22 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p>هیچ تراکنشی یافت نشد</p>
          </div>
        ) : (
          <>
            <div className={styles.transactionsList}>
              {transactions && transactions.map((transaction) => (
                <div key={transaction._id} className={styles.transactionItem}>
                  <div
                    className={styles.transactionIcon}
                    data-direction={transaction.direction}
                  >
                    {transaction.direction === "in" ? "↓" : "↑"}
                  </div>

                  <div className={styles.transactionInfo}>
                    <div className={styles.transactionMain}>
                      <span className={styles.transactionType}>
                        {getTransactionTypeName(transaction.type)}
                      </span>
                      <span
                        className={`${styles.transactionAmount} ${
                          transaction.direction === "in"
                            ? styles.amountIn
                            : styles.amountOut
                        }`}
                      >
                        {transaction.direction === "in" ? "+" : "-"}
                        {formatPrice(transaction.amount)} ریال
                      </span>
                    </div>

                    <div className={styles.transactionMeta}>
                      <span className={styles.transactionDate}>
                        {formatDate(transaction.createdAt)}
                      </span>
                      {transaction.refId && (
                        <span className={styles.transactionRefId}>
                          کد پیگیری: {transaction.refId}
                        </span>
                      )}
                    </div>

                    {transaction.description && (
                      <p className={styles.transactionDesc}>
                        {transaction.description}
                      </p>
                    )}
                  </div>

                  <span className={getStatusBadgeClass(transaction.status)}>
                    {getStatusName(transaction.status)}
                  </span>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={styles.paginationBtn}
                >
                  قبلی
                </button>

                <span className={styles.paginationInfo}>
                  صفحه {pagination.page} از {pagination.pages}
                </span>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                  className={styles.paginationBtn}
                >
                  بعدی
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Charge Modal */}
      {showChargeModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowChargeModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>شارژ کیف پول</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowChargeModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleChargeWallet} className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label>مبلغ (ریال)</label>
                <input
                  type="number"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  placeholder="مثال: 50000"
                  min="1000"
                  max="100000000"
                  step="1000"
                  required
                  className={styles.input}
                />
                <p className={styles.inputHint}>
                  حداقل: 1,000 ریال - حداکثر: 100,000,000 ریال
                </p>
              </div>

              <div className={styles.quickAmounts}>
                <p className={styles.quickAmountsLabel}>مبالغ پیشنهادی:</p>
                <div className={styles.quickAmountsGrid}>
                  {[10000, 50000, 100000, 500000, 1000000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setChargeAmount(amount.toString())}
                      className={styles.quickAmountBtn}
                    >
                      {formatPrice(amount)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={chargeLoading}
                className={styles.submitBtn}
              >
                {chargeLoading ? (
                  <>
                    <span className={styles.spinner}></span>
                    در حال انتقال به درگاه...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    پرداخت امن
                  </>
                )}
              </button>

              <p className={styles.paymentNote}>
                🔒 پرداخت از طریق درگاه امن زرین‌پال انجام می‌شود
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowWithdrawModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>درخواست برداشت</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowWithdrawModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleWithdrawRequest} className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label>مبلغ (ریال)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="مثال: 100000"
                  min="10000"
                  max="50000000"
                  step="1000"
                  required
                  className={styles.input}
                />
                <p className={styles.inputHint}>
                  حداقل: 10,000 ریال - حداکثر: 50,000,000 ریال
                </p>
                <p className={styles.inputHint}>
                  موجودی قابل برداشت: {formatPrice(wallet?.availableBalance)}{" "}
                  ریال
                </p>
              </div>

              <div className={styles.inputGroup}>
                <label>شماره شبا *</label>
                <input
                  type="text"
                  value={bankAccount.iban}
                  onChange={(e) =>
                    setBankAccount({ ...bankAccount, iban: e.target.value })
                  }
                  placeholder="IR000000000000000000000000"
                  maxLength="26"
                  required
                  className={styles.input}
                  style={{ direction: "ltr", textAlign: "left" }}
                />
                <p className={styles.inputHint}>فرمت: IR به همراه 24 رقم</p>
              </div>

              <div className={styles.inputGroup}>
                <label>نام صاحب حساب *</label>
                <input
                  type="text"
                  value={bankAccount.accountHolder}
                  onChange={(e) =>
                    setBankAccount({
                      ...bankAccount,
                      accountHolder: e.target.value,
                    })
                  }
                  placeholder="نام و نام خانوادگی"
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>نام بانک (اختیاری)</label>
                <input
                  type="text"
                  value={bankAccount.bankName}
                  onChange={(e) =>
                    setBankAccount({ ...bankAccount, bankName: e.target.value })
                  }
                  placeholder="مثال: ملی، ملت، سامان و ..."
                  className={styles.input}
                />
              </div>

              <div className={styles.warningBox}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ flexShrink: 0 }}
                >
                  <path
                    d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p>
                  درخواست برداشت پس از تایید مدیریت مالی پردازش خواهد شد. مبلغ
                  درخواستی تا زمان تایید یا رد، مسدود می‌گردد.
                </p>
              </div>

              <button
                type="submit"
                disabled={withdrawLoading}
                className={styles.submitBtn}
              >
                {withdrawLoading ? (
                  <>
                    <span className={styles.spinner}></span>
                    در حال ارسال...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    ثبت درخواست برداشت
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
