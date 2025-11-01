/**
 * Admin Users Page
 * صفحه مدیریت کاربران
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/NewAuthContext";
import RolesModal from "@/components/admin/RolesModal";
import PasswordModal from "@/components/admin/PasswordModal";
import EditUserModal from "@/components/admin/EditUserModal";
import styles from "./users.module.css";

export default function UsersPage() {
  const { fetchWithAuth } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Delete/Suspend/Lock
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, stateFilter, userTypeFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(stateFilter && { state: stateFilter }),
        ...(userTypeFilter && { userType: userTypeFilter }),
      });

      const response = await fetchWithAuth(`/api/admin/users?${params}`);
      const data = await response.json(); // ✅ تبدیل به JSON

      if (data.success) {
        setUsers(data.data.users);
        setTotal(data.data.pagination.total);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        setError(data.error || "خطا در دریافت لیست کاربران");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  // Suspend/Unsuspend user
  const handleToggleSuspend = async (user) => {
    const isSuspended = user.state === "suspended";
    const action = isSuspended ? "فعال" : "غیرفعال";

    if (!confirm(`آیا مطمئن هستید که می‌خواهید این کاربر را ${action} کنید؟`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetchWithAuth(
        `/api/admin/users/${user._id}/state`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state: isSuspended ? "active" : "suspended",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(`کاربر با موفقیت ${action} شد`);
        fetchUsers();
      } else {
        alert(data.error || `خطا در ${action} کردن کاربر`);
      }
    } catch (err) {
      console.error("Error toggling suspend:", err);
      alert("خطا در برقراری ارتباط با سرور");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete user
  const handleDelete = async (user) => {
    if (
      !confirm(
        `آیا مطمئن هستید که می‌خواهید کاربر "${
          user.displayName || user.phoneNumber
        }" را حذف کنید؟\n\nاین عملیات غیرقابل بازگشت است!`
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetchWithAuth(`/api/admin/users/${user._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        alert("کاربر با موفقیت حذف شد");
        fetchUsers();
      } else {
        alert(data.error || "خطا در حذف کاربر");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("خطا در برقراری ارتباط با سرور");
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeClass = (roles) => {
    if (roles.includes("admin")) return styles.badgeAdmin;
    if (roles.includes("moderator")) return styles.badgeModerator;
    if (roles.includes("event_owner")) return styles.badgeEventOwner;
    return styles.badgeUser;
  };

  const getStateBadgeClass = (state) => {
    const stateMap = {
      active: styles.badgeActive,
      verified: styles.badgeVerified,
      pending_verification: styles.badgePendingVerification,
      pending: styles.badgePending,
      suspended: styles.badgeSuspended,
      deleted: styles.badgeDeleted,
    };
    return stateMap[state] || styles.badgeDefault;
  };

  const getRolePersianName = (role) => {
    const roleNames = {
      admin: "مدیر",
      moderator: "ناظر",
      event_owner: "مالک رویداد",
      user: "کاربر",
      guest: "مهمان",
    };
    return roleNames[role] || role;
  };

  const getStatePersianName = (state) => {
    const stateNames = {
      active: "فعال",
      verified: "تایید شده",
      pending_verification: "در انتظار تایید",
      pending: "در انتظار",
      suspended: "معلق",
      deleted: "حذف شده",
      unregistered: "ثبت نام نشده",
    };
    return stateNames[state] || state;
  };

  const getUserTypePersianName = (userType) => {
    const typeNames = {
      individual: "فردی",
      individual_freelancer: "فردی (آزاد)",
      organization: "سازمانی",
      organization_team: "تیم",
      organization_private: "شرکت خصوصی",
      organization_public: "شرکت دولتی",
      organization_ngo: "NGO",
      organization_edu: "آموزشی",
      organization_media: "رسانه‌ای",
      government: "دولتی",
    };
    return typeNames[userType] || userType;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>مدیریت کاربران</h1>
          <p className={styles.subtitle}>مجموع {total} کاربر</p>
        </div>
        <button
          className={styles.createBtn}
          onClick={() => (window.location.href = "/dashboard/users/create")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          ایجاد کاربر جدید
        </button>
      </div>

      {/* Search & Filters */}
      <div className={styles.filtersCard}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="جستجو بر اساس شماره، نام یا نام کاربری..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className={styles.searchBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            جستجو
          </button>
        </form>

        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">همه نقش‌ها</option>
            <option value="admin">مدیر</option>
            <option value="moderator">ناظر</option>
            <option value="event_owner">مالک رویداد</option>
            <option value="user">کاربر</option>
          </select>

          <select
            className={styles.filterSelect}
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="active">فعال</option>
            <option value="verified">تایید شده</option>
            <option value="pending_verification">در انتظار تایید</option>
            <option value="pending">در انتظار</option>
            <option value="suspended">معلق</option>
            <option value="deleted">حذف شده</option>
          </select>

          <select
            className={styles.filterSelect}
            value={userTypeFilter}
            onChange={(e) => {
              setUserTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">همه انواع کاربر</option>
            <option value="individual">👤 فردی (شخصی / آزاد)</option>
            <option value="organization">🏢 سازمانی (شرکت / تیم / NGO)</option>
            <option value="government">🏛️ دولتی (ادارات / نهادها)</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.error}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>در حال بارگذاری...</p>
          </div>
        ) : users.length === 0 ? (
          <div className={styles.emptyState}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p>کاربری یافت نشد</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>کاربر</th>
                  <th>شماره موبایل</th>
                  <th>نقش‌ها</th>
                  <th>وضعیت</th>
                  <th>نوع کاربر</th>
                  <th>تاریخ عضویت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar}>
                          {user.displayName?.[0] || "U"}
                        </div>
                        <div className={styles.userInfo}>
                          <div className={styles.userName}>
                            {user.displayName ||
                              `${user.firstName} ${user.lastName}`}
                          </div>
                          {user.email && (
                            <div className={styles.userEmail}>{user.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{user.phoneNumber}</td>
                    <td>
                      <div className={styles.rolesCell}>
                        {user.roles?.map((role) => (
                          <span
                            key={role}
                            className={`${styles.badge} ${getRoleBadgeClass(
                              user.roles
                            )}`}
                          >
                            {getRolePersianName(role)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${getStateBadgeClass(
                          user.state
                        )}`}
                      >
                        {getStatePersianName(user.state)}
                      </span>
                    </td>
                    <td>
                      <span className={styles.userTypeText}>
                        {getUserTypePersianName(user.userType)}
                      </span>
                    </td>
                    <td>
                      {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => {
                            setSelectedUser(user);
                            setEditModalOpen(true);
                          }}
                          title="ویرایش"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={() => {
                            setSelectedUser(user);
                            setRolesModalOpen(true);
                          }}
                          title="مدیریت نقش‌ها"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={() => {
                            setSelectedUser(user);
                            setPasswordModalOpen(true);
                          }}
                          title="تنظیم رمز عبور"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                            />
                          </svg>
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnWarning}`}
                          onClick={() => handleToggleSuspend(user)}
                          disabled={actionLoading}
                          title={
                            user.state === "suspended"
                              ? "فعال کردن"
                              : "غیرفعال کردن"
                          }
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            {user.state === "suspended" ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                              />
                            )}
                          </svg>
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => handleDelete(user)}
                          disabled={actionLoading}
                          title="حذف کاربر"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.paginationBtn}
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              قبلی
            </button>
            <span className={styles.paginationInfo}>
              صفحه {currentPage} از {totalPages}
            </span>
            <button
              className={styles.paginationBtn}
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              بعدی
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <RolesModal
        user={selectedUser}
        isOpen={rolesModalOpen}
        onClose={() => setRolesModalOpen(false)}
        onUpdate={fetchUsers}
      />

      <PasswordModal
        user={selectedUser}
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onUpdate={fetchUsers}
      />

      {/* Edit User Modal */}
      <EditUserModal
        user={selectedUser}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
