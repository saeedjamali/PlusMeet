"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/NewAuthContext";
import styles from "./ticketSetting.module.css";

export default function TicketSettingPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "🎫",
    assignedRole: "",
    assignedUser: "",
    isActive: true,
    order: 0,
    color: "#3b82f6",
  });

  useEffect(() => {
    fetchCategories();
    fetchRoles();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tickets/categories", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/admin/roles", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setRoles(data.data.roles);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchUsersByRole = async (roleId) => {
    if (!roleId) {
      setUsers([]);
      return;
    }
    try {
      const response = await fetch(
        `/api/admin/roles/${roleId}/users?activeOnly=true&limit=100`,
        { credentials: "include" }
      );
      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
        console.log(`✅ Found ${data.data.users.length} users for this role`);
      } else {
        console.error("Error:", data.error);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        title: category.title,
        description: category.description || "",
        icon: category.icon || "🎫",
        assignedRole: category.assignedRole?._id || "",
        assignedUser: category.assignedUser?._id || "",
        isActive: category.isActive,
        order: category.order || 0,
        color: category.color || "#3b82f6",
      });
      if (category.assignedRole?._id) {
        fetchUsersByRole(category.assignedRole._id);
      }
    } else {
      setEditingCategory(null);
      setFormData({
        title: "",
        description: "",
        icon: "🎫",
        assignedRole: "",
        assignedUser: "",
        isActive: true,
        order: 0,
        color: "#3b82f6",
      });
      setUsers([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setUsers([]);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === "assignedRole") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        assignedUser: "", // Reset user when role changes
      }));
      fetchUsersByRole(value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.assignedRole) {
      alert("عنوان و نقش پیش‌فرض الزامی است");
      return;
    }

    try {
      const url = editingCategory
        ? `/api/tickets/categories/${editingCategory._id}`
        : "/api/tickets/categories";
      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          assignedUser: formData.assignedUser || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        handleCloseModal();
        fetchCategories();
      } else {
        alert(data.error || "خطا در ذخیره موضوع");
      }
    } catch (error) {
      console.error("Error saving category:", error);
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("آیا از حذف این موضوع اطمینان دارید؟")) return;

    try {
      const response = await fetch(`/api/tickets/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        alert(data.message);
        fetchCategories();
      } else {
        alert(data.error || "خطا در حذف موضوع");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("خطا در ارتباط با سرور");
    }
  };

  const iconOptions = ["🎫", "❓", "🐛", "💡", "⚙️", "📦", "🔧", "💳", "🔒", "📱"];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>⚙️ تنظیمات موضوعات تیکت</h1>
          <p className={styles.subtitle}>
            مدیریت موضوعات و دسته‌بندی تیکت‌های پشتیبانی
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => handleOpenModal()}>
          ➕ موضوع جدید
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>در حال بارگذاری...</div>
      ) : categories.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📭</div>
          <p>هنوز موضوعی تعریف نشده است</p>
          <button className={styles.emptyBtn} onClick={() => handleOpenModal()}>
            ➕ ایجاد اولین موضوع
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {categories.map((category) => (
            <div key={category._id} className={styles.card}>
              <div
                className={styles.cardHeader}
                style={{ borderTopColor: category.color }}
              >
                <div className={styles.cardIcon}>{category.icon}</div>
                <div className={styles.cardTitle}>{category.title}</div>
                {!category.isActive && (
                  <span className={styles.inactiveBadge}>غیرفعال</span>
                )}
              </div>
              <div className={styles.cardBody}>
                {category.description && (
                  <p className={styles.cardDescription}>{category.description}</p>
                )}
                <div className={styles.cardInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>نقش پیش‌فرض:</span>
                    <span className={styles.infoValue}>
                      {category.assignedRole?.icon} {category.assignedRole?.name}
                    </span>
                  </div>
                  {category.assignedUser && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>کارشناس:</span>
                      <span className={styles.infoValue}>
                        {category.assignedUser.displayName}
                      </span>
                    </div>
                  )}
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>ترتیب:</span>
                    <span className={styles.infoValue}>{category.order}</span>
                  </div>
                </div>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.editBtn}
                  onClick={() => handleOpenModal(category)}
                >
                  ✏️ ویرایش
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(category._id)}
                >
                  🗑️ حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>{editingCategory ? "ویرایش موضوع" : "موضوع جدید"}</h2>
              <button className={styles.closeBtn} onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>عنوان موضوع *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="مثال: مشکلات فنی"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>توضیحات</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="توضیح کوتاهی درباره این موضوع..."
                  rows={3}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>آیکون</label>
                  <select name="icon" value={formData.icon} onChange={handleChange}>
                    {iconOptions.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>رنگ</label>
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>ترتیب</label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>نقش پیش‌فرض *</label>
                <select
                  name="assignedRole"
                  value={formData.assignedRole}
                  onChange={handleChange}
                  required
                >
                  <option value="">انتخاب نقش...</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.icon} {role.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.assignedRole && (
                <div className={styles.formGroup}>
                  <label>کارشناس مسئول (اختیاری)</label>
                  <select
                    name="assignedUser"
                    value={formData.assignedUser}
                    onChange={handleChange}
                  >
                    <option value="">بدون انتخاب (به کل نقش ارجاع می‌شود)</option>
                    {users.length === 0 ? (
                      <option disabled>
                        هیچ کاربری با این نقش یافت نشد
                      </option>
                    ) : (
                      users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.displayName} ({user.phoneNumber})
                        </option>
                      ))
                    )}
                  </select>
                  {users.length > 0 && (
                    <small className={styles.helperText}>
                      {users.length} کاربر با این نقش یافت شد
                    </small>
                  )}
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <span>فعال</span>
                </label>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                  لغو
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {editingCategory ? "بروزرسانی" : "ایجاد"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

