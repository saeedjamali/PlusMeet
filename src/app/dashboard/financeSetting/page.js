"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./financeSetting.module.css";
import "./financeSettingDark.css";
import GatewayModal from "@/components/modals/GatewayModal";
import PaymentCodeModal from "@/components/modals/PaymentCodeModal";
import DiscountModal from "@/components/modals/DiscountModal";

export default function FinanceSettingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("gateways"); // gateways | paymentCodes | discounts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // درگاه‌های پرداخت
  const [gateways, setGateways] = useState([]);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);

  // کدهای پرداخت
  const [paymentCodes, setPaymentCodes] = useState([]);
  const [showPaymentCodeModal, setShowPaymentCodeModal] = useState(false);
  const [editingPaymentCode, setEditingPaymentCode] = useState(null);

  // کدهای تخفیف
  const [discountCodes, setDiscountCodes] = useState([]);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, [activeTab, page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === "gateways") {
        await fetchGateways();
      } else if (activeTab === "paymentCodes") {
        await fetchPaymentCodes();
      } else {
        await fetchDiscountCodes();
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGateways = async () => {
    const response = await fetch("/api/finance/payment-gateways", {
      credentials: "include",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "خطا در دریافت درگاه‌های پرداخت");
    }

    const data = await response.json();
    setGateways(data.gateways || []);
  };

  const fetchPaymentCodes = async () => {
    const response = await fetch("/api/finance/payment-codes", {
      credentials: "include",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "خطا در دریافت کدهای پرداخت");
    }

    const data = await response.json();
    setPaymentCodes(data.codes || []);
  };

  const fetchDiscountCodes = async () => {
    const response = await fetch(
      `/api/finance/discount-codes?page=${page}&limit=20`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "خطا در دریافت کدهای تخفیف");
    }

    const data = await response.json();
    setDiscountCodes(data.codes || []);
    setTotalPages(data.pagination?.pages || 1);
  };

  const handleDeleteGateway = async (id, title) => {
    if (!window.confirm(`آیا از حذف درگاه "${title}" اطمینان دارید؟`)) {
      return;
    }

    try {
      const response = await fetch(`/api/finance/payment-gateways/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ درگاه پرداخت با موفقیت حذف شد");
        fetchGateways();
      } else {
        alert(`❌ ${data.error || "خطا در حذف درگاه"}`);
      }
    } catch (error) {
      console.error("Error deleting gateway:", error);
      alert("❌ خطا در حذف درگاه پرداخت");
    }
  };

  const handleDeletePaymentCode = async (id, code) => {
    if (!window.confirm(`آیا از حذف کد پرداخت "${code}" اطمینان دارید؟`)) {
      return;
    }

    try {
      const response = await fetch(`/api/finance/payment-codes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ کد پرداخت با موفقیت حذف شد");
        fetchPaymentCodes();
      } else {
        alert(`❌ ${data.error || "خطا در حذف کد پرداخت"}`);
      }
    } catch (error) {
      console.error("Error deleting payment code:", error);
      alert("❌ خطا در حذف کد پرداخت");
    }
  };

  const handleDeleteDiscount = async (id, code) => {
    if (!window.confirm(`آیا از حذف کد تخفیف "${code}" اطمینان دارید؟`)) {
      return;
    }

    try {
      const response = await fetch(`/api/finance/discount-codes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

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

  if (loading && (gateways.length === 0 && paymentCodes.length === 0 && discountCodes.length === 0)) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>
            <span>💰</span>
            <span>تنظیمات مالی</span>
          </h1>
          <button className={styles.backBtn} onClick={() => router.back()}>
            <span>←</span>
            <span>بازگشت</span>
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "gateways" ? styles.tabActive : ""
            }`}
            onClick={() => {
              setActiveTab("gateways");
              setPage(1);
            }}
          >
            <span>💳</span>
            <span>درگاه‌های پرداخت</span>
            <span className={styles.badge}>{gateways.length}</span>
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "paymentCodes" ? styles.tabActive : ""
            }`}
            onClick={() => {
              setActiveTab("paymentCodes");
              setPage(1);
            }}
          >
            <span>🔢</span>
            <span>کدهای پرداخت</span>
            <span className={styles.badge}>{paymentCodes.length}</span>
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "discounts" ? styles.tabActive : ""
            }`}
            onClick={() => {
              setActiveTab("discounts");
              setPage(1);
            }}
          >
            <span>🎟️</span>
            <span>کدهای تخفیف</span>
            <span className={styles.badge}>{discountCodes.length}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* درگاه‌های پرداخت */}
      {activeTab === "gateways" && (
        <div className={styles.content}>
          <div className={styles.contentHeader}>
            <h2 className={styles.contentTitle}>لیست درگاه‌های پرداخت</h2>
            <button
              className={styles.addBtn}
              onClick={() => {
                setEditingGateway(null);
                setShowGatewayModal(true);
              }}
            >
              <span>➕</span>
              <span>افزودن درگاه جدید</span>
            </button>
          </div>

          {gateways.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>💳</span>
              <p>هیچ درگاه پرداختی ثبت نشده است</p>
              <button
                className={styles.emptyBtn}
                onClick={() => setShowGatewayModal(true)}
              >
                افزودن اولین درگاه
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {gateways.map((gateway) => (
                <div key={gateway._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>
                      <h3>{gateway.title}</h3>
                      {gateway.isDefault && (
                        <span className={styles.defaultBadge}>پیش‌فرض</span>
                      )}
                      <span
                        className={`${styles.statusBadge} ${
                          gateway.isActive
                            ? styles.statusActive
                            : styles.statusInactive
                        }`}
                      >
                        {gateway.isActive ? "فعال" : "غیرفعال"}
                      </span>
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.editBtn}
                        onClick={() => {
                          setEditingGateway(gateway);
                          setShowGatewayModal(true);
                        }}
                        title="ویرایش"
                      >
                        ✏️
                      </button>
                      {!gateway.isDefault && (
                        <button
                          className={styles.deleteBtn}
                          onClick={() =>
                            handleDeleteGateway(gateway._id, gateway.title)
                          }
                          title="حذف"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>کد:</span>
                      <span className={styles.value}>{gateway.code}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>نوع:</span>
                      <span className={styles.value}>
                        {gateway.gateway?.provider || "-"}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>کارمزد:</span>
                      <span className={styles.value}>
                        {gateway.commission?.type === "percentage" &&
                          `${gateway.commission.percentage}%`}
                        {gateway.commission?.type === "fixed" &&
                          `${gateway.commission.fixedAmount.toLocaleString(
                            "fa-IR"
                          )} تومان`}
                        {gateway.commission?.type === "both" &&
                          `${gateway.commission.percentage}% + ${gateway.commission.fixedAmount.toLocaleString(
                            "fa-IR"
                          )} تومان`}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>محدودیت:</span>
                      <span className={styles.value}>
                        {gateway.limits?.minAmount.toLocaleString("fa-IR")} تا{" "}
                        {gateway.limits?.maxAmount.toLocaleString("fa-IR")}{" "}
                        تومان
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.stats}>
                      <div className={styles.stat}>
                        <span className={styles.statLabel}>تراکنش‌ها:</span>
                        <span className={styles.statValue}>
                          {gateway.stats?.totalTransactions || 0}
                        </span>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statLabel}>موفق:</span>
                        <span className={styles.statValue}>
                          {gateway.stats?.successfulTransactions || 0}
                        </span>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statLabel}>مجموع:</span>
                        <span className={styles.statValue}>
                          {(gateway.stats?.totalAmount || 0).toLocaleString(
                            "fa-IR"
                          )}{" "}
                          تومان
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* کدهای پرداخت */}
      {activeTab === "paymentCodes" && (
        <div className={styles.content}>
          <div className={styles.contentHeader}>
            <h2 className={styles.contentTitle}>لیست کدهای پرداخت</h2>
            <button
              className={styles.addBtn}
              onClick={() => {
                setEditingPaymentCode(null);
                setShowPaymentCodeModal(true);
              }}
            >
              <span>➕</span>
              <span>افزودن کد پرداخت جدید</span>
            </button>
          </div>

          {paymentCodes.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🔢</span>
              <p>هیچ کد پرداختی ثبت نشده است</p>
              <button
                className={styles.emptyBtn}
                onClick={() => setShowPaymentCodeModal(true)}
              >
                افزودن اولین کد پرداخت
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {paymentCodes.map((paymentCode) => (
                <div key={paymentCode._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>
                      <h3>{paymentCode.title}</h3>
                      <span
                        className={`${styles.statusBadge} ${
                          paymentCode.isActive
                            ? styles.statusActive
                            : styles.statusInactive
                        }`}
                      >
                        {paymentCode.isActive ? "فعال" : "غیرفعال"}
                      </span>
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.editBtn}
                        onClick={() => {
                          setEditingPaymentCode(paymentCode);
                          setShowPaymentCodeModal(true);
                        }}
                        title="ویرایش"
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() =>
                          handleDeletePaymentCode(paymentCode._id, paymentCode.code)
                        }
                        title="حذف"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>کد:</span>
                      <span className={styles.value}>
                        <code className={styles.code}>{paymentCode.code}</code>
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>کارمزد سایت:</span>
                      <span className={styles.value}>
                        {paymentCode.commission?.type === "percentage" &&
                          `${paymentCode.commission.percentage}%`}
                        {paymentCode.commission?.type === "fixed" &&
                          `${paymentCode.commission.fixedAmount.toLocaleString(
                            "fa-IR"
                          )} تومان`}
                        {paymentCode.commission?.type === "both" &&
                          `${paymentCode.commission.percentage}% + ${paymentCode.commission.fixedAmount.toLocaleString(
                            "fa-IR"
                          )} تومان`}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>کدهای تخفیف:</span>
                      <span className={styles.value}>
                        {paymentCode.discountCodes?.length || 0} کد
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>کاربرد:</span>
                      <span className={styles.value}>
                        {paymentCode.settings?.allowEventJoin && "پیوستن به رویداد"}
                        {paymentCode.settings?.allowTicketPurchase && " | خرید بلیط"}
                        {paymentCode.settings?.allowCourseEnrollment && " | ثبت‌نام دوره"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.stats}>
                      <div className={styles.stat}>
                        <span className={styles.statLabel}>تراکنش‌ها:</span>
                        <span className={styles.statValue}>
                          {paymentCode.stats?.totalTransactions || 0}
                        </span>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statLabel}>موفق:</span>
                        <span className={styles.statValue}>
                          {paymentCode.stats?.successfulTransactions || 0}
                        </span>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statLabel}>کارمزد کل:</span>
                        <span className={styles.statValue}>
                          {(paymentCode.stats?.totalCommission || 0).toLocaleString(
                            "fa-IR"
                          )}{" "}
                          تومان
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* کدهای تخفیف */}
      {activeTab === "discounts" && (
        <div className={styles.content}>
          <div className={styles.contentHeader}>
            <h2 className={styles.contentTitle}>لیست کدهای تخفیف</h2>
            <button
              className={styles.addBtn}
              onClick={() => {
                setEditingDiscount(null);
                setShowDiscountModal(true);
              }}
            >
              <span>➕</span>
              <span>افزودن کد تخفیف جدید</span>
            </button>
          </div>

          {discountCodes.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🎟️</span>
              <p>هیچ کد تخفیفی ثبت نشده است</p>
              <button
                className={styles.emptyBtn}
                onClick={() => setShowDiscountModal(true)}
              >
                افزودن اولین کد تخفیف
              </button>
            </div>
          ) : (
            <>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>کد</th>
                      <th>عنوان</th>
                      <th>تخفیف</th>
                      <th>رویدادهای مشمول</th>
                      <th>وضعیت</th>
                      <th>استفاده</th>
                      <th>تاریخ انقضا</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discountCodes.map((discount) => {
                      const now = new Date();
                      const isExpired = new Date(discount.expiryDate) < now;
                      const isNotStarted = new Date(discount.startDate) > now;

                      return (
                        <tr key={discount._id}>
                          <td>
                            <code className={styles.code}>{discount.code}</code>
                          </td>
                          <td>{discount.title}</td>
                          <td>
                            {discount.discount.type === "percentage"
                              ? `${discount.discount.value}%`
                              : `${discount.discount.value.toLocaleString(
                                  "fa-IR"
                                )} تومان`}
                          </td>
                          <td>
                            {discount.eventRestrictions?.specificEvents?.length > 0 ? (
                              <span className={styles.eventCount}>
                                {discount.eventRestrictions.specificEvents.length} رویداد
                              </span>
                            ) : (
                              <span className={styles.eventCountAll}>همه رویدادها</span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${
                                discount.isActive && !isExpired && !isNotStarted
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
                          </td>
                          <td>
                            <div className={styles.usageInfo}>
                              <span>
                                {discount.usage?.usedCount || 0}
                                {discount.usage?.maxUsage
                                  ? ` / ${discount.usage.maxUsage}`
                                  : ""}
                              </span>
                              {discount.usage?.maxUsage && (
                                <div className={styles.progressBar}>
                                  <div
                                    className={styles.progressFill}
                                    style={{
                                      width: `${Math.min(
                                        ((discount.usage.usedCount || 0) /
                                          discount.usage.maxUsage) *
                                          100,
                                        100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            {new Date(discount.expiryDate).toLocaleDateString(
                              "fa-IR"
                            )}
                          </td>
                          <td>
                            <div className={styles.tableActions}>
                              <button
                                className={styles.editBtn}
                                onClick={() => {
                                  setEditingDiscount(discount);
                                  setShowDiscountModal(true);
                                }}
                                title="ویرایش"
                              >
                                ✏️
                              </button>
                              <button
                                className={styles.deleteBtn}
                                onClick={() =>
                                  handleDeleteDiscount(
                                    discount._id,
                                    discount.code
                                  )
                                }
                                title="حذف"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.pageBtn}
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    قبلی
                  </button>
                  <span className={styles.pageInfo}>
                    صفحه {page} از {totalPages}
                  </span>
                  <button
                    className={styles.pageBtn}
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    بعدی
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal‌ها */}
      <GatewayModal
        show={showGatewayModal}
        onClose={() => {
          setShowGatewayModal(false);
          setEditingGateway(null);
        }}
        onSave={fetchGateways}
        editing={editingGateway}
      />

      <PaymentCodeModal
        show={showPaymentCodeModal}
        onClose={() => {
          setShowPaymentCodeModal(false);
          setEditingPaymentCode(null);
        }}
        onSave={fetchPaymentCodes}
        editing={editingPaymentCode}
      />

      <DiscountModal
        show={showDiscountModal}
        onClose={() => {
          setShowDiscountModal(false);
          setEditingDiscount(null);
        }}
        onSave={fetchDiscountCodes}
        editing={editingDiscount}
      />
    </div>
  );
}










