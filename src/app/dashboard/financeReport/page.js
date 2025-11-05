"use client";

import { useState, useEffect } from "react";
import styles from "./finance.module.css";

export default function FinanceReportPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [activeTab, setActiveTab] = useState("overview"); // overview, withdrawals, transactions, wallets
  const [error, setError] = useState(null);

  // Withdrawals filters
  const [withdrawalStatus, setWithdrawalStatus] = useState("pending");
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [withdrawalPagination, setWithdrawalPagination] = useState(null);

  // Transactions filters
  const [transactions, setTransactions] = useState([]);
  const [transactionType, setTransactionType] = useState("all");
  const [transactionStatus, setTransactionStatus] = useState("all");
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionPagination, setTransactionPagination] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Wallets state
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletsLoading, setWalletsLoading] = useState(false);

  // Modal states
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [actionNote, setActionNote] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  // Wallet management
  const [walletAction, setWalletAction] = useState("freeze"); // freeze, unfreeze, suspend, activate
  const [walletAmount, setWalletAmount] = useState("");
  const [walletReason, setWalletReason] = useState("");

  // دریافت آمار کلی
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/finance/stats", {
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("خطا در دریافت آمار");
      // Error logged for debugging
    }
  };

  // دریافت درخواست‌های برداشت
  const fetchWithdrawals = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (withdrawalStatus && withdrawalStatus !== "all") {
        params.append("status", withdrawalStatus);
      }

      const response = await fetch(
        `/api/admin/finance/withdrawals?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.success) {
        setWithdrawals(data.data);
        setWithdrawalPagination(data.pagination);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("خطا در دریافت درخواست‌های برداشت");
      // Error logged for debugging
    }
  };

  // دریافت تراکنش‌ها
  const fetchTransactions = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (transactionType !== "all") {
        params.append("type", transactionType);
      }

      if (transactionStatus !== "all") {
        params.append("status", transactionStatus);
      }

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const response = await fetch(
        `/api/admin/finance/transactions?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.success) {
        setTransactions(data.data);
        setTransactionPagination(data.pagination);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("خطا در دریافت تراکنش‌ها");
      // Error logged
    }
  };

  // دریافت لیست کیف پول‌ها (با user populate)
  const fetchWallets = async () => {
    try {
      setWalletsLoading(true);
      // این API رو باید اضافه کنیم - برای الان از users API استفاده می‌کنیم
      const response = await fetch("/api/admin/users?limit=100", {
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        // API users یک شیء با users و pagination برمی‌گردونه
        const usersList = data.data?.users || [];
        setWallets(Array.isArray(usersList) ? usersList : []);
      } else {
        setError(data.error);
        setWallets([]);
      }
    } catch (err) {
      setError("خطا در دریافت کیف پول‌ها");
      setWallets([]);
      // Error logged
    } finally {
      setWalletsLoading(false);
    }
  };

  // مدیریت کیف پول کاربر
  const handleWalletManagement = async (e) => {
    e.preventDefault();
    if (!selectedWallet) return;

    setProcessingAction(true);

    try {
      const body = {
        action: walletAction,
        reason: walletReason,
      };

      if (walletAction === "freeze" || walletAction === "unfreeze") {
        const amount = parseInt(walletAmount);
        if (!amount || amount <= 0) {
          alert("لطفاً مبلغ معتبر وارد کنید");
          setProcessingAction(false);
          return;
        }
        body.amount = amount;
      }

      const response = await fetch(
        `/api/admin/finance/wallets/${selectedWallet._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setShowWalletModal(false);
        setSelectedWallet(null);
        setWalletAmount("");
        setWalletReason("");
        // رفرش
        if (activeTab === "wallets") {
          await fetchWallets();
        }
      } else {
        alert(data.error || "خطا در عملیات");
      }
    } catch (err) {
      alert("خطا در اتصال به سرور");
      // Error logged
    } finally {
      setProcessingAction(false);
    }
  };

  // بارگذاری اولیه
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchWithdrawals()]);
      setLoading(false);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // رفرش درخواست‌ها با فیلتر
  useEffect(() => {
    if (!loading) {
      fetchWithdrawals(withdrawalPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withdrawalStatus, withdrawalPage]);

  // رفرش تراکنش‌ها با فیلتر
  useEffect(() => {
    if (!loading && activeTab === "transactions") {
      fetchTransactions(transactionPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionType, transactionStatus, transactionPage, searchQuery]);

  // بارگذاری داده‌ها با تغییر تب
  useEffect(() => {
    if (!loading) {
      if (activeTab === "transactions" && transactions.length === 0) {
        fetchTransactions();
      } else if (activeTab === "wallets" && wallets.length === 0) {
        fetchWallets();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // تایید یا رد درخواست برداشت
  const handleWithdrawalAction = async (action) => {
    if (!selectedWithdrawal) return;

    setProcessingAction(true);

    try {
      const response = await fetch(
        `/api/admin/finance/withdrawals/${selectedWithdrawal._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            action, // 'approve' | 'reject'
            note: actionNote,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setShowWithdrawalModal(false);
        setSelectedWithdrawal(null);
        setActionNote("");
        // رفرش
        await Promise.all([fetchStats(), fetchWithdrawals()]);
      } else {
        alert(data.error || "خطا در پردازش");
      }
    } catch (err) {
      alert("خطا در اتصال به سرور");
      // Error logged for debugging
    } finally {
      setProcessingAction(false);
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

  // نام فارسی وضعیت
  const getStatusName = (status) => {
    const statuses = {
      pending: "در انتظار",
      completed: "تایید شده",
      cancelled: "رد شده",
      processing: "در حال پردازش",
      failed: "ناموفق",
    };
    return statuses[status] || status;
  };

  // کلاس badge وضعیت
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

  // نام فارسی نوع تراکنش
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

  if (error && !stats) {
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
          <h1 className={styles.title}>مدیریت مالی</h1>
          <p className={styles.subtitle}>
            گزارش و مدیریت تراکنش‌ها، برداشت‌ها و کیف پول‌های کاربران
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "overview" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("overview")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
              fill="currentColor"
            />
          </svg>
          آمار کلی
        </button>

        <button
          className={`${styles.tab} ${
            activeTab === "withdrawals" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("withdrawals")}
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
          درخواست‌های برداشت
          {stats?.transactions?.pendingWithdrawals > 0 && (
            <span className={styles.badge}>
              {stats.transactions.pendingWithdrawals}
            </span>
          )}
        </button>

        <button
          className={`${styles.tab} ${
            activeTab === "transactions" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("transactions")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          تمام تراکنش‌ها
        </button>

        <button
          className={`${styles.tab} ${
            activeTab === "wallets" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("wallets")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          کیف پول کاربران
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && stats && (
        <div className={styles.content}>
          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>موجودی کل سیستم</span>
                <div
                  className={styles.statIcon}
                  style={{
                    background:
                      "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  }}
                >
                  💰
                </div>
              </div>
              <div className={styles.statValue}>
                {formatPrice(stats.wallets.totalBalance)} ریال
              </div>
              <div className={styles.statFooter}>
                <span>
                  موجودی فعال: {formatPrice(stats.wallets.totalAvailable)}
                </span>
                <span>مسدود شده: {formatPrice(stats.wallets.totalFrozen)}</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>تراکنش‌های امروز</span>
                <div
                  className={styles.statIcon}
                  style={{
                    background:
                      "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                  }}
                >
                  📊
                </div>
              </div>
              <div className={styles.statValue}>
                {formatPrice(stats.today.deposits + stats.today.withdrawals)}{" "}
                ریال
              </div>
              <div className={styles.statFooter}>
                <span style={{ color: "#10B981" }}>
                  واریز: {formatPrice(stats.today.deposits)}
                </span>
                <span style={{ color: "#EF4444" }}>
                  برداشت: {formatPrice(stats.today.withdrawals)}
                </span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>کیف پول‌های فعال</span>
                <div
                  className={styles.statIcon}
                  style={{
                    background:
                      "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                  }}
                >
                  👥
                </div>
              </div>
              <div className={styles.statValue}>
                {stats.wallets.activeWallets}
              </div>
              <div className={styles.statFooter}>
                <span>تعلیق شده: {stats.wallets.suspendedWallets}</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>درخواست‌های منتظر</span>
                <div
                  className={styles.statIcon}
                  style={{
                    background:
                      "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                  }}
                >
                  ⏳
                </div>
              </div>
              <div className={styles.statValue}>
                {stats.transactions.pending}
              </div>
              <div className={styles.statFooter}>
                <span>برداشت‌ها: {stats.transactions.pendingWithdrawals}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>فعالیت اخیر</h2>
            <p className={styles.sectionDesc}>
              برای مشاهده جزئیات به تب‌های مربوطه مراجعه کنید
            </p>
          </div>
        </div>
      )}

      {/* Withdrawals Tab */}
      {activeTab === "withdrawals" && (
        <div className={styles.content}>
          <div className={styles.filterBar}>
            <select
              value={withdrawalStatus}
              onChange={(e) => {
                setWithdrawalStatus(e.target.value);
                setWithdrawalPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="all">همه درخواست‌ها</option>
              <option value="pending">در انتظار تایید</option>
              <option value="completed">تایید شده</option>
              <option value="cancelled">رد شده</option>
            </select>
          </div>

          {withdrawals.length === 0 ? (
            <div className={styles.emptyState}>
              <p>درخواست برداشتی یافت نشد</p>
            </div>
          ) : (
            <>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>کاربر</th>
                      <th>مبلغ</th>
                      <th>شبا</th>
                      <th>تاریخ درخواست</th>
                      <th>وضعیت</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal._id}>
                        <td>
                          <div className={styles.userCell}>
                            <strong>
                              {withdrawal.userId?.firstName}{" "}
                              {withdrawal.userId?.lastName}
                            </strong>
                            <span>{withdrawal.userId?.phoneNumber}</span>
                          </div>
                        </td>
                        <td>
                          <strong>{formatPrice(withdrawal.amount)} ریال</strong>
                        </td>
                        <td>
                          <span style={{ direction: "ltr", display: "block" }}>
                            {withdrawal.metadata?.bankAccount?.iban || "-"}
                          </span>
                        </td>
                        <td>{formatDate(withdrawal.createdAt)}</td>
                        <td>
                          <span
                            className={getStatusBadgeClass(withdrawal.status)}
                          >
                            {getStatusName(withdrawal.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            className={styles.btnView}
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setShowWithdrawalModal(true);
                            }}
                          >
                            مشاهده
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {withdrawalPagination && withdrawalPagination.pages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => setWithdrawalPage(withdrawalPage - 1)}
                    disabled={withdrawalPage === 1}
                    className={styles.paginationBtn}
                  >
                    قبلی
                  </button>

                  <span className={styles.paginationInfo}>
                    صفحه {withdrawalPagination.page} از{" "}
                    {withdrawalPagination.pages}
                  </span>

                  <button
                    onClick={() => setWithdrawalPage(withdrawalPage + 1)}
                    disabled={withdrawalPage === withdrawalPagination.pages}
                    className={styles.paginationBtn}
                  >
                    بعدی
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <div className={styles.content}>
          <div className={styles.filterBar}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setTransactionPage(1);
              }}
              placeholder="جستجو (نام، شماره تلفن)..."
              className={styles.searchInput}
            />

            <select
              value={transactionType}
              onChange={(e) => {
                setTransactionType(e.target.value);
                setTransactionPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="all">همه انواع</option>
              <option value="deposit">واریز</option>
              <option value="withdraw">برداشت</option>
              <option value="payment">پرداخت</option>
              <option value="refund">بازگشت وجه</option>
              <option value="transfer_in">انتقال دریافتی</option>
              <option value="transfer_out">انتقال ارسالی</option>
            </select>

            <select
              value={transactionStatus}
              onChange={(e) => {
                setTransactionStatus(e.target.value);
                setTransactionPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="completed">تکمیل شده</option>
              <option value="pending">در انتظار</option>
              <option value="processing">در حال پردازش</option>
              <option value="failed">ناموفق</option>
              <option value="cancelled">لغو شده</option>
              <option value="refunded">بازگشت داده شده</option>
            </select>
          </div>

          {transactions.length === 0 ? (
            <div className={styles.emptyState}>
              <p>تراکنشی یافت نشد</p>
            </div>
          ) : (
            <>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>کاربر</th>
                      <th>نوع</th>
                      <th>مبلغ</th>
                      <th>جهت</th>
                      <th>تاریخ</th>
                      <th>وضعیت</th>
                      <th>کد پیگیری</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction._id}>
                        <td>
                          <div className={styles.userCell}>
                            <strong>
                              {transaction.userId?.firstName}{" "}
                              {transaction.userId?.lastName}
                            </strong>
                            <span>{transaction.userId?.phoneNumber}</span>
                          </div>
                        </td>
                        <td>{getTransactionTypeName(transaction.type)}</td>
                        <td>
                          <span
                            className={
                              transaction.direction === "in"
                                ? styles.amountIn
                                : styles.amountOut
                            }
                          >
                            {transaction.direction === "in" ? "+" : "-"}
                            {formatPrice(transaction.amount)} ریال
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              transaction.direction === "in"
                                ? styles.badgeSuccess
                                : styles.badgeDanger
                            }
                          >
                            {transaction.direction === "in"
                              ? "↓ ورودی"
                              : "↑ خروجی"}
                          </span>
                        </td>
                        <td>{formatDate(transaction.createdAt)}</td>
                        <td>
                          <span
                            className={getStatusBadgeClass(transaction.status)}
                          >
                            {getStatusName(transaction.status)}
                          </span>
                        </td>
                        <td>
                          {transaction.refId ? (
                            <code className={styles.refCode}>
                              {transaction.refId}
                            </code>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {transactionPagination && transactionPagination.pages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => setTransactionPage(transactionPage - 1)}
                    disabled={transactionPage === 1}
                    className={styles.paginationBtn}
                  >
                    قبلی
                  </button>

                  <span className={styles.paginationInfo}>
                    صفحه {transactionPagination.page} از{" "}
                    {transactionPagination.pages}
                  </span>

                  <button
                    onClick={() => setTransactionPage(transactionPage + 1)}
                    disabled={transactionPage === transactionPagination.pages}
                    className={styles.paginationBtn}
                  >
                    بعدی
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Wallets Tab */}
      {activeTab === "wallets" && (
        <div className={styles.content}>
          {walletsLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>در حال بارگذاری کاربران...</p>
            </div>
          ) : !Array.isArray(wallets) || wallets.length === 0 ? (
            <div className={styles.emptyState}>
              <p>کاربری یافت نشد</p>
            </div>
          ) : (
            <div className={styles.walletsGrid}>
              {wallets.map((user) => (
                <div key={user._id} className={styles.walletCard}>
                  <div className={styles.walletCardHeader}>
                    <div>
                      <h4>
                        {user.firstName} {user.lastName}
                      </h4>
                      <p>{user.phoneNumber}</p>
                    </div>
                    <div className={styles.walletCardIcon}>💰</div>
                  </div>

                  <div className={styles.walletCardBody}>
                    <div className={styles.walletCardStat}>
                      <span className={styles.walletCardLabel}>نوع کاربر:</span>
                      <span>{user.userType || "user"}</span>
                    </div>
                    <div className={styles.walletCardStat}>
                      <span className={styles.walletCardLabel}>وضعیت:</span>
                      <span className={getStatusBadgeClass(user.state)}>
                        {user.state === "active" ? "فعال" : user.state}
                      </span>
                    </div>
                  </div>

                  <button
                    className={styles.btnManage}
                    onClick={() => {
                      setSelectedWallet(user);
                      setShowWalletModal(true);
                      setWalletAction("freeze");
                      setWalletAmount("");
                      setWalletReason("");
                    }}
                  >
                    مدیریت کیف پول
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Withdrawal Detail Modal */}
      {showWithdrawalModal && selectedWithdrawal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowWithdrawalModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>جزئیات درخواست برداشت</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowWithdrawalModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailGroup}>
                <label>کاربر:</label>
                <span>
                  {selectedWithdrawal.userId?.firstName}{" "}
                  {selectedWithdrawal.userId?.lastName} (
                  {selectedWithdrawal.userId?.phoneNumber})
                </span>
              </div>

              <div className={styles.detailGroup}>
                <label>مبلغ:</label>
                <span className={styles.amountText}>
                  {formatPrice(selectedWithdrawal.amount)} ریال
                </span>
              </div>

              <div className={styles.detailGroup}>
                <label>شماره شبا:</label>
                <span style={{ direction: "ltr" }}>
                  {selectedWithdrawal.metadata?.bankAccount?.iban}
                </span>
              </div>

              <div className={styles.detailGroup}>
                <label>نام صاحب حساب:</label>
                <span>
                  {selectedWithdrawal.metadata?.bankAccount?.accountHolder}
                </span>
              </div>

              {selectedWithdrawal.metadata?.bankAccount?.bankName && (
                <div className={styles.detailGroup}>
                  <label>نام بانک:</label>
                  <span>
                    {selectedWithdrawal.metadata.bankAccount.bankName}
                  </span>
                </div>
              )}

              <div className={styles.detailGroup}>
                <label>تاریخ درخواست:</label>
                <span>{formatDate(selectedWithdrawal.createdAt)}</span>
              </div>

              <div className={styles.detailGroup}>
                <label>وضعیت:</label>
                <span
                  className={getStatusBadgeClass(selectedWithdrawal.status)}
                >
                  {getStatusName(selectedWithdrawal.status)}
                </span>
              </div>

              {selectedWithdrawal.description && (
                <div className={styles.detailGroup}>
                  <label>توضیحات:</label>
                  <span>{selectedWithdrawal.description}</span>
                </div>
              )}

              {selectedWithdrawal.status === "pending" && (
                <>
                  <div className={styles.inputGroup}>
                    <label>یادداشت (اختیاری):</label>
                    <textarea
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder="توضیحات برای کاربر..."
                      className={styles.textarea}
                      rows="3"
                    />
                  </div>

                  <div className={styles.modalActions}>
                    <button
                      onClick={() => handleWithdrawalAction("approve")}
                      disabled={processingAction}
                      className={styles.btnApprove}
                    >
                      {processingAction
                        ? "در حال پردازش..."
                        : "✓ تایید و پرداخت"}
                    </button>

                    <button
                      onClick={() => handleWithdrawalAction("reject")}
                      disabled={processingAction}
                      className={styles.btnReject}
                    >
                      {processingAction ? "در حال پردازش..." : "✕ رد درخواست"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wallet Management Modal */}
      {showWalletModal && selectedWallet && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowWalletModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>مدیریت کیف پول</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowWalletModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailGroup}>
                <label>کاربر:</label>
                <span>
                  {selectedWallet.firstName} {selectedWallet.lastName} (
                  {selectedWallet.phoneNumber})
                </span>
              </div>

              <form onSubmit={handleWalletManagement}>
                <div className={styles.inputGroup}>
                  <label>نوع عملیات *</label>
                  <select
                    value={walletAction}
                    onChange={(e) => setWalletAction(e.target.value)}
                    className={styles.select}
                    required
                  >
                    <option value="freeze">مسدود کردن مبلغ</option>
                    <option value="unfreeze">آزادسازی مبلغ</option>
                    <option value="suspend">تعلیق کیف پول</option>
                    <option value="activate">فعال‌سازی کیف پول</option>
                  </select>
                </div>

                {(walletAction === "freeze" || walletAction === "unfreeze") && (
                  <div className={styles.inputGroup}>
                    <label>مبلغ (ریال) *</label>
                    <input
                      type="number"
                      value={walletAmount}
                      onChange={(e) => setWalletAmount(e.target.value)}
                      placeholder="مثال: 100000"
                      min="1000"
                      step="1000"
                      required
                      className={styles.input}
                    />
                  </div>
                )}

                <div className={styles.inputGroup}>
                  <label>دلیل (اختیاری):</label>
                  <textarea
                    value={walletReason}
                    onChange={(e) => setWalletReason(e.target.value)}
                    placeholder="توضیحات برای این عملیات..."
                    className={styles.textarea}
                    rows="3"
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
                    {walletAction === "freeze" &&
                      "مبلغ مشخص شده از موجودی قابل برداشت کاربر کسر و به بخش مسدود شده اضافه می‌شود."}
                    {walletAction === "unfreeze" &&
                      "مبلغ مشخص شده از بخش مسدود شده به موجودی قابل برداشت کاربر اضافه می‌شود."}
                    {walletAction === "suspend" &&
                      "کیف پول تعلیق شده و کاربر نمی‌تواند هیچ عملیاتی انجام دهد."}
                    {walletAction === "activate" &&
                      "کیف پول فعال شده و کاربر می‌تواند از آن استفاده کند."}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={processingAction}
                  className={
                    walletAction === "suspend"
                      ? styles.btnReject
                      : styles.btnApprove
                  }
                >
                  {processingAction ? (
                    "در حال پردازش..."
                  ) : (
                    <>
                      {walletAction === "freeze" && "🔒 مسدود کردن"}
                      {walletAction === "unfreeze" && "🔓 آزادسازی"}
                      {walletAction === "suspend" && "⚠️ تعلیق کیف پول"}
                      {walletAction === "activate" && "✓ فعال‌سازی"}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
