/**
 * Page: Notification Manager
 * صفحه مدیریت اعلانات
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/NewAuthContext";
import NotificationForm from "./NotificationForm";
import NotificationList from "./NotificationList";
import styles from "./notifManager.module.css";

export default function NotificationManagerPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNotif, setEditingNotif] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // دریافت لیست اعلانات
  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.status) params.append("status", filters.status);
      if (filters.type) params.append("type", filters.type);
      if (filters.search) params.append("search", filters.search);

      const response = await fetch(`/api/admin/notifications?${params}`, {
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setNotifications(data.data.notifications);
        setPagination(data.data.pagination);
      } else {
        console.error("Error fetching notifications:", data.error);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(pagination.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleCreate = () => {
    setEditingNotif(null);
    setShowForm(true);
  };

  const handleEdit = (notification) => {
    setEditingNotif(notification);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("آیا از حذف این اعلان اطمینان دارید؟")) return;

    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        fetchNotifications(pagination.page);
        alert("اعلان با موفقیت حذف شد");
      } else {
        alert(data.error || "خطا در حذف اعلان");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      alert("خطا در حذف اعلان");
    }
  };

  const handleFormClose = (shouldRefresh) => {
    setShowForm(false);
    setEditingNotif(null);
    if (shouldRefresh) {
      fetchNotifications(pagination.page);
    }
  };

  // بررسی دسترسی
  if (!user || (!user.roles.includes("admin") && !user.roles.includes("moderator"))) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>شما به این بخش دسترسی ندارید</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>مدیریت اعلانات</h1>
          <p>ایجاد، ویرایش و مدیریت اعلانات سیستم</p>
        </div>
        <button className={styles.createBtn} onClick={handleCreate}>
          <span>➕</span>
          <span>ایجاد اعلان جدید</span>
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>جستجو:</label>
          <input
            type="text"
            placeholder="عنوان یا متن اعلان..."
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value })
            }
          />
        </div>

        <div className={styles.filterGroup}>
          <label>وضعیت:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">همه</option>
            <option value="draft">پیش‌نویس</option>
            <option value="scheduled">زمان‌بندی شده</option>
            <option value="published">منتشر شده</option>
            <option value="expired">منقضی شده</option>
            <option value="cancelled">لغو شده</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>نوع:</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">همه</option>
            <option value="info">اطلاعیه</option>
            <option value="success">موفقیت</option>
            <option value="warning">هشدار</option>
            <option value="error">خطا</option>
            <option value="announcement">اعلامیه</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>کل اعلانات</span>
          <span className={styles.statValue}>{pagination.total}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>صفحه فعلی</span>
          <span className={styles.statValue}>
            {pagination.page} از {pagination.pages}
          </span>
        </div>
      </div>

      {/* List */}
      <NotificationList
        notifications={notifications}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        pagination={pagination}
        onPageChange={fetchNotifications}
      />

      {/* Form Modal */}
      {showForm && (
        <NotificationForm
          notification={editingNotif}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}




