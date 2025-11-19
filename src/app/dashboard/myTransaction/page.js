"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./transaction.module.css";
import "./transactionDark.css";

const TRANSACTION_TYPES = {
  // درآمد
  payment: { label: "شارژ کیف پول", icon: "💰", category: "income", color: "green" },
  refund: { label: "بازگشت وجه", icon: "↩️", category: "income", color: "green" },
  event_ticket_income: { label: "درآمد بلیط", icon: "🎫", category: "income", color: "green" },
  event_refund: { label: "بازپرداخت دریافتی", icon: "💸", category: "income", color: "green" },
  unfreeze: { label: "آزادسازی موجودی", icon: "🔓", category: "income", color: "green" },
  release_reserve: { label: "آزادسازی رزرو", icon: "🔄", category: "income", color: "green" },
  
  // هزینه
  deduction: { label: "برداشت", icon: "💳", category: "expense", color: "red" },
  event_ticket_purchase: { label: "خرید بلیط", icon: "🎟️", category: "expense", color: "red" },
  event_ticket_approved: { label: "تایید بلیط", icon: "✅", category: "expense", color: "red" },
  event_ticket_reserve: { label: "رزرو بلیط", icon: "⏳", category: "expense", color: "orange" },
  freeze: { label: "فریز موجودی", icon: "🔒", category: "expense", color: "orange" },
  reserve: { label: "رزرو موجودی", icon: "📌", category: "expense", color: "orange" },
  deduct_reserve: { label: "کسر از رزرو", icon: "📉", category: "expense", color: "red" },
  event_refund_deduct: { label: "بازپرداخت پرداختی", icon: "💸", category: "expense", color: "red" },
};

export default function MyTransactionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    balance: 0,
    availableBalance: 0,
    frozenBalance: 0,
    reservedBalance: 0,
  });
  const [counts, setCounts] = useState({
    total: 0,
    income: 0,
    expense: 0,
  });
  const [filter, setFilter] = useState("all"); // all | income | expense
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [filter, selectedEvent]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        type: filter,
        limit: "100",
      });

      if (selectedEvent) {
        params.append("eventId", selectedEvent);
      }

      const response = await fetch(`/api/wallet/transactions?${params.toString()}`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresAuth) {
          router.push("/login");
          return;
        }
        throw new Error(data.error || "خطا در دریافت تراکنش‌ها");
      }

      setTransactions(data.transactions || []);
      setSummary(data.summary || {});
      setCounts(data.counts || {});
    } catch (err) {
      console.error("Error fetching transactions:", err);
      alert(err.message || "خطا در دریافت تراکنش‌ها");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return "0";
    return Math.abs(num).toLocaleString("fa-IR");
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

  const getTransactionInfo = (type) => {
    return TRANSACTION_TYPES[type] || {
      label: type,
      icon: "📝",
      category: "unknown",
      color: "gray",
    };
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>در حال بارگذاری تراکنش‌ها...</p>
      </div>
    );
  }

  return (
    <div className={styles.transactionPage}>
        {/* هدر */}
        <div className={styles.header}>
          <h1>💳 تراکنش‌های من</h1>
          <p>مشاهده تمامی تراکنش‌های مالی شما</p>
        </div>

        {/* خلاصه کیف پول */}
        <div className={styles.walletSummary}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>💰</div>
            <div className={styles.summaryInfo}>
              <span className={styles.summaryLabel}>موجودی کل</span>
              <span className={styles.summaryValue}>
                {formatNumber(summary.balance)} <small>ریال</small>
              </span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>✅</div>
            <div className={styles.summaryInfo}>
              <span className={styles.summaryLabel}>قابل برداشت</span>
              <span className={styles.summaryValue} style={{ color: "#22c55e" }}>
                {formatNumber(summary.availableBalance)} <small>ریال</small>
              </span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>🔒</div>
            <div className={styles.summaryInfo}>
              <span className={styles.summaryLabel}>فریز شده</span>
              <span className={styles.summaryValue} style={{ color: "#f59e0b" }}>
                {formatNumber(summary.frozenBalance)} <small>ریال</small>
              </span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>⏳</div>
            <div className={styles.summaryInfo}>
              <span className={styles.summaryLabel}>رزرو شده</span>
              <span className={styles.summaryValue} style={{ color: "#3b82f6" }}>
                {formatNumber(summary.reservedBalance)} <small>ریال</small>
              </span>
            </div>
          </div>
        </div>

        {/* فیلترها */}
        <div className={styles.filters}>
          <div className={styles.filterButtons}>
            <button
              className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
              onClick={() => setFilter("all")}
            >
              همه ({formatNumber(counts.total)})
            </button>
            <button
              className={`${styles.filterBtn} ${styles.income} ${filter === "income" ? styles.active : ""}`}
              onClick={() => setFilter("income")}
            >
              ➕ دریافتی ({formatNumber(counts.income)})
            </button>
            <button
              className={`${styles.filterBtn} ${styles.expense} ${filter === "expense" ? styles.active : ""}`}
              onClick={() => setFilter("expense")}
            >
              ➖ پرداختی ({formatNumber(counts.expense)})
            </button>
          </div>
        </div>

        {/* لیست تراکنش‌ها */}
        <div className={styles.transactionsList}>
          {transactions.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <h3>تراکنشی یافت نشد</h3>
              <p>هنوز هیچ تراکنشی ثبت نشده است</p>
            </div>
          ) : (
            transactions.map((transaction) => {
              const info = getTransactionInfo(transaction.type);
              const isIncome = info.category === "income";
              const amount = Math.abs(transaction.amount);

              return (
                <div key={transaction._id} className={styles.transactionCard}>
                  <div className={styles.transactionIcon} data-category={info.category}>
                    {info.icon}
                  </div>

                  <div className={styles.transactionDetails}>
                    <div className={styles.transactionHeader}>
                      <span className={styles.transactionType}>{info.label}</span>
                      <span
                        className={styles.transactionAmount}
                        data-type={isIncome ? "income" : "expense"}
                      >
                        {isIncome ? "+" : "-"} {formatNumber(amount)} ریال
                      </span>
                    </div>

                    <p className={styles.transactionDescription}>
                      {transaction.description}
                    </p>

                    {transaction.event && (
                      <div className={styles.transactionEvent}>
                        <span className={styles.eventIcon}>🎪</span>
                        <span className={styles.eventTitle}>
                          {transaction.event.title}
                        </span>
                      </div>
                    )}

                    <div className={styles.transactionFooter}>
                      <span className={styles.transactionDate}>
                        📅 {formatDate(transaction.createdAt)}
                      </span>
                      <div className={styles.transactionBalance}>
                        <span>موجودی بعد:</span>
                        <strong>{formatNumber(transaction.balanceAfter)} ریال</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* دکمه بازگشت */}
        <div className={styles.actions}>
          <button
            className={styles.backBtn}
            onClick={() => router.push("/dashboard")}
          >
            🔙 بازگشت به داشبورد
          </button>
          <button
            className={styles.walletBtn}
            onClick={() => router.push("/dashboard/wallet")}
          >
            💰 مدیریت کیف پول
          </button>
        </div>
    </div>
  );
}

