/**
 * Menu Management Page
 * صفحه مدیریت منوها
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/NewAuthContext";
import styles from "./menus.module.css";

export default function MenuManagementPage() {
  const { fetchWithAuth } = useAuth();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [selectedMenu, setSelectedMenu] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    menuId: "",
    title: "",
    titleEn: "",
    path: "",
    parentId: "",
    icon: "",
    order: 999,
    isActive: true,
  });

  // Fetch menus
  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchWithAuth("/api/admin/settings/menus");
      const data = await response.json();

      if (data.success) {
        setMenus(data.data.menus);
      } else {
        setError(data.error || "خطا در دریافت منوها");
      }
    } catch (err) {
      console.error("Error fetching menus:", err);
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  // Open create modal
  const handleCreate = () => {
    setModalMode("create");
    setFormData({
      menuId: "",
      title: "",
      titleEn: "",
      path: "",
      parentId: "",
      icon: "",
      order: 999,
      isActive: true,
    });
    setModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (menu) => {
    setModalMode("edit");
    setSelectedMenu(menu);
    setFormData({
      menuId: menu.menuId,
      title: menu.title,
      titleEn: menu.titleEn || "",
      path: menu.path || "",
      parentId: menu.parentId || "",
      icon: menu.icon || "",
      order: menu.order || 999,
      isActive: menu.isActive !== false,
    });
    setModalOpen(true);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url =
        modalMode === "create"
          ? "/api/admin/settings/menus"
          : `/api/admin/settings/menus/${selectedMenu._id}`;

      const method = modalMode === "create" ? "POST" : "PUT";

      const response = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setModalOpen(false);
        // ✅ Refresh لیست منوها
        await fetchMenus();
      } else {
        alert(data.error || "خطا در عملیات");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("خطا در برقراری ارتباط با سرور");
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (menu) => {
    if (
      !confirm(`آیا مطمئن هستید که می‌خواهید منوی "${menu.title}" را حذف کنید؟`)
    ) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetchWithAuth(
        `/api/admin/settings/menus/${menu._id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        fetchMenus();
      } else {
        alert(data.error || "خطا در حذف منو");
      }
    } catch (err) {
      console.error("Error deleting menu:", err);
      alert("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  // Get flat menu list for ordering operations
  const getFlatMenuList = (menuList, parentId = null) => {
    let flat = [];
    const items = menuList.filter((m) =>
      parentId ? m.parentId === parentId : !m.parentId
    );

    items.forEach((menu) => {
      flat.push(menu);
      if (menu.children && menu.children.length > 0) {
        flat = flat.concat(getFlatMenuList(menu.children, menu.menuId));
      }
    });

    return flat;
  };

  // Helper to get all menus recursively
  const getAllMenusFlat = (menuList) => {
    let flat = [];
    menuList.forEach((menu) => {
      flat.push(menu);
      if (menu.children && menu.children.length > 0) {
        flat = flat.concat(getAllMenusFlat(menu.children));
      }
    });
    return flat;
  };

  // Move menu up
  const handleMoveUp = async (menu) => {
    const allFlat = getAllMenusFlat(menus);
    const siblings = allFlat.filter((m) => m.parentId === menu.parentId);
    const sortedSiblings = siblings.sort((a, b) => a.order - b.order);
    const currentIndex = sortedSiblings.findIndex((m) => m._id === menu._id);

    if (currentIndex <= 0) {
      alert("این منو در بالاترین موقعیت است");
      return;
    }

    const prevMenu = sortedSiblings[currentIndex - 1];

    // Swap orders
    await updateMenuOrder(menu._id, prevMenu.order);
    await updateMenuOrder(prevMenu._id, menu.order);
    await fetchMenus();
  };

  // Move menu down
  const handleMoveDown = async (menu) => {
    const allFlat = getAllMenusFlat(menus);
    const siblings = allFlat.filter((m) => m.parentId === menu.parentId);
    const sortedSiblings = siblings.sort((a, b) => a.order - b.order);
    const currentIndex = sortedSiblings.findIndex((m) => m._id === menu._id);

    if (currentIndex >= sortedSiblings.length - 1) {
      alert("این منو در پایین‌ترین موقعیت است");
      return;
    }

    const nextMenu = sortedSiblings[currentIndex + 1];

    // Swap orders
    await updateMenuOrder(menu._id, nextMenu.order);
    await updateMenuOrder(nextMenu._id, menu.order);
    await fetchMenus();
  };

  // Make menu a submenu (indent - move to right)
  const handleIndent = async (menu) => {
    const allFlat = getAllMenusFlat(menus);
    const siblings = allFlat.filter((m) => m.parentId === menu.parentId);
    const sortedSiblings = siblings.sort((a, b) => a.order - b.order);
    const currentIndex = sortedSiblings.findIndex((m) => m._id === menu._id);

    if (currentIndex <= 0) {
      alert("برای تبدیل به زیرمنو، باید منویی بالاتر از آن وجود داشته باشد");
      return;
    }

    const newParent = sortedSiblings[currentIndex - 1];

    // اگر منوی بالایی path نداشته باشه، می‌تونه parent بشه
    // Update parent
    await updateMenuParent(menu._id, newParent.menuId);
    await fetchMenus();
  };

  // Make menu a root menu (outdent - move to left)
  const handleOutdent = async (menu) => {
    if (!menu.parentId) {
      alert("این منو در حال حاضر در سطح اصلی است");
      return;
    }

    const allFlat = getAllMenusFlat(menus);
    const parent = allFlat.find((m) => m.menuId === menu.parentId);

    if (!parent) {
      // تبدیل به root
      await updateMenuParent(menu._id, null);
    } else {
      // تبدیل به همسطح والد
      await updateMenuParent(menu._id, parent.parentId);
    }

    await fetchMenus();
  };

  // Update menu order
  const updateMenuOrder = async (menuId, newOrder) => {
    try {
      const response = await fetchWithAuth(
        `/api/admin/settings/menus/${menuId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: newOrder }),
        }
      );

      const data = await response.json();
      if (!data.success) {
        console.error("Error updating order:", data.error);
      }
    } catch (err) {
      console.error("Error updating order:", err);
    }
  };

  // Update menu parent
  const updateMenuParent = async (menuId, newParentId) => {
    try {
      const response = await fetchWithAuth(
        `/api/admin/settings/menus/${menuId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId: newParentId || "" }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(data.message);
      } else {
        alert(data.error || "خطا در تغییر سطح منو");
      }
    } catch (err) {
      console.error("Error updating parent:", err);
      alert("خطا در برقراری ارتباط با سرور");
    }
  };

  // Render menu tree recursively
  const renderMenuTree = (menuList, level = 0) => {
    return menuList.map((menu) => (
      <div
        key={menu._id}
        className={styles.menuItem}
        style={{ paddingRight: `${level * 2}rem` }}
      >
        <div className={styles.menuInfo}>
          <span className={styles.menuIcon}>{menu.icon || "📄"}</span>
          <div className={styles.menuDetails}>
            <div className={styles.menuTitle}>
              {menu.title}
              {menu.path && (
                <span className={styles.menuPath}>{menu.path}</span>
              )}
            </div>
            <div className={styles.menuMeta}>
              <span className={styles.menuId}>{menu.menuId}</span>
              {!menu.isActive && <span className={styles.badge}>غیرفعال</span>}
            </div>
          </div>
        </div>
        <div className={styles.menuActions}>
          {/* Move Controls */}
          <div className={styles.moveControls}>
            <button
              className={styles.moveBtn}
              onClick={() => handleMoveUp(menu)}
              title="انتقال به بالا"
            >
              ↑
            </button>
            <button
              className={styles.moveBtn}
              onClick={() => handleMoveDown(menu)}
              title="انتقال به پایین"
            >
              ↓
            </button>
            <button
              className={styles.moveBtn}
              onClick={() => handleOutdent(menu)}
              title="کاهش سطح (به منوی اصلی)"
            >
              ←
            </button>
            <button
              className={styles.moveBtn}
              onClick={() => handleIndent(menu)}
              title="افزایش سطح (به زیرمنو)"
            >
              →
            </button>
          </div>

          {/* Edit/Delete Controls */}
          <div className={styles.editControls}>
            <button
              className={styles.actionBtn}
              onClick={() => handleEdit(menu)}
              title="ویرایش"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
              onClick={() => handleDelete(menu)}
              title="حذف"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
        {menu.children && menu.children.length > 0 && (
          <div className={styles.menuChildren}>
            {renderMenuTree(menu.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>مدیریت منوها</h1>
          <p className={styles.subtitle}>ایجاد، ویرایش و حذف منوهای سیستم</p>
        </div>
        <button className={styles.createBtn} onClick={handleCreate}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          افزودن منو
        </button>
      </div>

      {/* Error */}
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

      {/* Menus List */}
      <div className={styles.menusCard}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>در حال بارگذاری...</p>
          </div>
        ) : menus.length === 0 ? (
          <div className={styles.emptyState}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <p>منویی یافت نشد</p>
          </div>
        ) : (
          <div className={styles.menusList}>{renderMenuTree(menus)}</div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setModalOpen(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {modalMode === "create" ? "افزودن منوی جدید" : "ویرایش منو"}
              </h2>
              <button
                className={styles.modalClose}
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalBody}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>شناسه منو (menuId) *</label>
                  <input
                    type="text"
                    value={formData.menuId}
                    onChange={(e) =>
                      setFormData({ ...formData, menuId: e.target.value })
                    }
                    required
                    disabled={modalMode === "edit"}
                    placeholder="مثال: users.list"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>عنوان فارسی *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    placeholder="مثال: لیست کاربران"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>عنوان انگلیسی</label>
                  <input
                    type="text"
                    value={formData.titleEn}
                    onChange={(e) =>
                      setFormData({ ...formData, titleEn: e.target.value })
                    }
                    placeholder="مثال: User List"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>مسیر (path)</label>
                  <input
                    type="text"
                    value={formData.path}
                    onChange={(e) =>
                      setFormData({ ...formData, path: e.target.value })
                    }
                    placeholder="مثال: /admin/users"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>منوی والد (parentId)</label>
                  <input
                    type="text"
                    value={formData.parentId}
                    onChange={(e) =>
                      setFormData({ ...formData, parentId: e.target.value })
                    }
                    placeholder="مثال: users"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>آیکون</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    placeholder="مثال: 👥"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>ترتیب</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                    />
                    فعال
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setModalOpen(false)}
                >
                  انصراف
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  {modalMode === "create" ? "ایجاد منو" : "ذخیره تغییرات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
