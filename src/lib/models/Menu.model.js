/**
 * Menu Model
 * مدل منوها با ساختار درختی
 */

import mongoose from "mongoose";

// ==================== Menu Schema ====================
const MenuSchema = new mongoose.Schema(
  {
    // شناسه یکتا (برای reference در permissions)
    menuId: {
      type: String,
      required: [true, "شناسه منو الزامی است"],
      unique: true,
      trim: true,
      // مثال: "dashboard", "users", "users.list", "users.create"
    },

    // اطلاعات نمایشی
    title: {
      type: String,
      required: [true, "عنوان منو الزامی است"],
      trim: true,
      // مثال: "داشبورد", "کاربران", "لیست کاربران"
    },
    titleEn: {
      type: String,
      trim: true,
      // برای چندزبانه بودن
    },

    // مسیر و ساختار
    path: {
      type: String,
      trim: true,
      // مثال: "/admin", "/admin/users", "/admin/users/create"
      // اگر null باشه یعنی فقط parent هست و route نداره
    },
    parentId: {
      type: String,
      default: null,
      // مثال: "users" برای "users.list"
      // null برای منوهای سطح اول
    },

    // ظاهر و آیکون
    icon: {
      type: String,
      default: "📄",
      // می‌تونه emoji باشه یا نام icon library
      // مثال: "👥", "📊", "lucide:users"
    },
    color: {
      type: String,
      default: "#6B7280",
    },

    // ترتیب و نمایش
    order: {
      type: Number,
      default: 0,
      // برای ترتیب نمایش منوها
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVisible: {
      type: Boolean,
      default: true,
      // برای مخفی کردن موقت بدون حذف
    },

    // متادیتا
    description: {
      type: String,
      maxlength: 200,
    },
    badge: {
      type: String,
      // مثال: "جدید", "Beta", "3" (تعداد notification)
    },
    badgeColor: {
      type: String,
      default: "#EF4444", // red
    },

    // دسترسی پیش‌فرض
    defaultRoles: {
      type: [String],
      default: [],
      // نقش‌هایی که به صورت پیش‌فرض به این منو دسترسی دارن
      // مثال: ["admin", "moderator"]
    },

    // تنظیمات اضافی
    requiresAuth: {
      type: Boolean,
      default: true,
      // آیا برای دیدن این منو نیاز به لاگین هست؟
    },
    openInNewTab: {
      type: Boolean,
      default: false,
    },
    isExternal: {
      type: Boolean,
      default: false,
      // آیا لینک خارجی هست؟
    },
  },
  {
    timestamps: true,
  }
);

// ==================== Indexes ====================
MenuSchema.index({ menuId: 1 });
MenuSchema.index({ parentId: 1 });
MenuSchema.index({ order: 1 });
MenuSchema.index({ isActive: 1, isVisible: 1 });

// ==================== Virtual Fields ====================

/**
 * گرفتن زیرمنوها
 */
MenuSchema.virtual("children", {
  ref: "Menu",
  localField: "menuId",
  foreignField: "parentId",
});

// ==================== Instance Methods ====================

/**
 * تبدیل به JSON
 */
MenuSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    menuId: this.menuId,
    title: this.title,
    titleEn: this.titleEn,
    path: this.path,
    parentId: this.parentId,
    icon: this.icon,
    color: this.color,
    order: this.order,
    isActive: this.isActive,
    isVisible: this.isVisible,
    description: this.description,
    badge: this.badge,
    badgeColor: this.badgeColor,
    defaultRoles: this.defaultRoles,
    requiresAuth: this.requiresAuth,
    openInNewTab: this.openInNewTab,
    isExternal: this.isExternal,
  };
};

// ==================== Static Methods ====================

/**
 * گرفتن ساختار درختی منوها
 */
MenuSchema.statics.getTreeStructure = async function () {
  const menus = await this.find({ isActive: true }).sort({ order: 1 }).lean();

  // ساخت tree از flat list
  const menuMap = {};
  const tree = [];

  // اول همه رو در map بذار
  menus.forEach((menu) => {
    menuMap[menu.menuId] = { ...menu, children: [] };
  });

  // حالا tree رو بساز
  menus.forEach((menu) => {
    if (menu.parentId && menuMap[menu.parentId]) {
      menuMap[menu.parentId].children.push(menuMap[menu.menuId]);
    } else {
      tree.push(menuMap[menu.menuId]);
    }
  });

  return tree;
};

/**
 * گرفتن منوهای سطح اول
 */
MenuSchema.statics.getRootMenus = function () {
  return this.find({ parentId: null, isActive: true, isVisible: true }).sort({
    order: 1,
  });
};

/**
 * گرفتن زیرمنوهای یک منو
 */
MenuSchema.statics.getChildren = function (parentId) {
  return this.find({ parentId, isActive: true, isVisible: true }).sort({
    order: 1,
  });
};

/**
 * فیلتر منوها بر اساس نقش‌های کاربر
 */
MenuSchema.statics.getMenusForRoles = async function (userRoles) {
  if (!userRoles || userRoles.length === 0) {
    return [];
  }

  // اگر admin هست، همه رو نمایش بده
  if (userRoles.includes("admin")) {
    return this.getTreeStructure();
  }

  const Role = mongoose.model("Role");

  // گرفتن permissions از roles
  const roles = await Role.find({ slug: { $in: userRoles } });

  const allowedMenuIds = new Set();

  roles.forEach((role) => {
    role.menuPermissions.forEach((perm) => {
      if (perm.canView) {
        allowedMenuIds.add(perm.menuId);
      }
    });
  });

  // گرفتن منوها و فیلتر کردن
  const tree = await this.getTreeStructure();

  const filterTree = (nodes) => {
    return nodes
      .filter((node) => allowedMenuIds.has(node.menuId))
      .map((node) => ({
        ...node,
        children: node.children ? filterTree(node.children) : [],
      }));
  };

  return filterTree(tree);
};

// ==================== Export ====================

const Menu = mongoose.models.Menu || mongoose.model("Menu", MenuSchema);

export default Menu;

/**
 * مثال داده‌های اولیه:
 *
 * [
 *   { menuId: "dashboard", title: "داشبورد", path: "/admin", icon: "📊", order: 1 },
 *   { menuId: "users", title: "کاربران", path: null, icon: "👥", order: 2 },
 *   { menuId: "users.list", title: "لیست کاربران", path: "/admin/users", parentId: "users", order: 1 },
 *   { menuId: "users.create", title: "ایجاد کاربر", path: "/admin/users/create", parentId: "users", order: 2 },
 *   { menuId: "events", title: "رویدادها", path: null, icon: "📅", order: 3 },
 *   { menuId: "events.list", title: "لیست رویدادها", path: "/admin/events", parentId: "events", order: 1 },
 *   { menuId: "settings", title: "تنظیمات", path: "/admin/settings", icon: "⚙️", order: 10 },
 * ]
 */


