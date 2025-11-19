/**
 * Admin Panel Layout
 * چیدمان اصلی پنل مدیریت
 */

"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/NewAuthContext";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Logo from "@/components/ui/Logo";
import ProfileDropdown from "@/components/dashboard/ProfileDropdown";
import NotificationBell from "@/components/dashboard/NotificationBell";
import styles from "./admin.module.css";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isAuthenticated,
    user,
    logout,
    loading: authLoading,
    fetchWithAuth,
  } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(280); // عرض پیش‌فرض
  const [isResizing, setIsResizing] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [menusLoading, setMenusLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState(new Set());

  // Fetch menus from database
  useEffect(() => {
    const fetchMenus = async () => {
      if (!isAuthenticated || !user) return;

      try {
        const response = await fetchWithAuth("/api/user/menus");
        const data = await response.json();

        if (data.success && data.menus) {
          // حفظ ساختار درختی منوها
          const formattedMenus = formatMenuTree(data.menus);
          setMenuItems(formattedMenus);
        }
      } catch (error) {
        console.error("Error fetching menus:", error);
      } finally {
        setMenusLoading(false);
      }
    };

    if (isAuthenticated && !authLoading) {
      fetchMenus();
    }
  }, [isAuthenticated, user, authLoading, fetchWithAuth, pathname]);

  // Format menu tree recursively
  const formatMenuTree = (menus) => {
    return menus.map((menu) => ({
      menuId: menu.menuId,
      title: menu.title,
      href: menu.path,
      active: menu.path && pathname.startsWith(menu.path),
      icon: getMenuIcon(menu.menuId),
      hasChildren: menu.children && menu.children.length > 0,
      children: menu.children ? formatMenuTree(menu.children) : [],
    }));
  };

  // Toggle menu expansion
  const toggleMenu = (menuId) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  // Render menu item recursively
  const renderMenuItem = (item, level) => {
    const isExpanded = expandedMenus.has(item.menuId);
    const hasPath = Boolean(item.href);
    const hasChildren = item.hasChildren;

    return (
      <div key={item.menuId} className={styles.menuItemWrapper}>
        {/* Parent Menu or Leaf Node */}
        {hasPath ? (
          <a
            href={item.href}
            className={`${styles.navItem} ${
              item.active ? styles.navItemActive : ""
            } ${level > 0 ? styles.navItemChild : ""}`}
            style={{
              paddingRight: sidebarOpen ? `${level * 1.5 + 1}rem` : undefined,
            }}
            onClick={(e) => {
              // اگر منو زیرمنو داره و sidebar بسته است
              if (hasChildren && !sidebarOpen) {
                e.preventDefault(); // جلوگیری از رفتن به link
                setSidebarOpen(true);
                setTimeout(() => {
                  toggleMenu(item.menuId);
                }, 100);
              }
            }}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {sidebarOpen && (
              <>
                <span className={styles.navText}>{item.title}</span>
                {hasChildren && (
                  <button
                    className={styles.expandBtn}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleMenu(item.menuId);
                    }}
                  >
                    {isExpanded ? "▼" : "◀"}
                  </button>
                )}
              </>
            )}
          </a>
        ) : (
          <div
            className={`${styles.navItem} ${styles.navItemParent} ${
              level > 0 ? styles.navItemChild : ""
            }`}
            style={{
              paddingRight: sidebarOpen ? `${level * 1.5 + 1}rem` : undefined,
            }}
            onClick={() => {
              if (hasChildren) {
                // اگر sidebar بسته است، اول آن را باز کن
                if (!sidebarOpen) {
                  setSidebarOpen(true);
                  // بعد از باز شدن sidebar، منو را expand کن
                  setTimeout(() => {
                    toggleMenu(item.menuId);
                  }, 100);
                } else {
                  // اگر sidebar باز است، فقط toggle کن
                  toggleMenu(item.menuId);
                }
              }
            }}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {sidebarOpen && (
              <>
                <span className={styles.navText}>{item.title}</span>
                {hasChildren && (
                  <span className={styles.expandBtn}>
                    {isExpanded ? "▼" : "◀"}
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {/* Children (Submenu) */}
        {hasChildren && isExpanded && sidebarOpen && (
          <div className={styles.submenu}>
            {item.children.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Check authentication
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }
    }
  }, [isAuthenticated, pathname, router, authLoading]);

  // Handle sidebar resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      // در RTL، sidebar در سمت راست است، پس باید از window.innerWidth کم کنیم
      const newWidth = window.innerWidth - e.clientX;
      
      console.log('📏 New width:', newWidth); // Debug
      
      // حداقل: 200px، حداکثر: 500px
      if (newWidth >= 200 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      console.log('✋ Resize ended'); // Debug
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // تابع برای گرفتن آیکون منو براساس menuId
  const getMenuIcon = (menuId) => {
    const icons = {
      dashboard: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
      "users.list": (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      "rbac.roles": (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
      "events.list": (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      "settings.system": (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      "settings.menus": (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      ),
      "settings.sync": (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
    };

    return (
      icons[menuId] || (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      )
    );
  };


  // Show loading state
  if (authLoading || menusLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      {/* Desktop Header - فقط در دسکتاپ */}
      <div className={styles.desktopHeader}>
        <div className={styles.desktopHeaderContent}>
          <div className={styles.headerLeft}>
            <ThemeToggle />
          </div>
          <div className={styles.headerRight}>
            <NotificationBell />
            <ProfileDropdown />
          </div>
        </div>
      </div>

      {/* Mobile Header - فقط در موبایل */}
      <div className={styles.mobileHeader}>
        <div className={styles.mobileHeaderContent}>
          <Link href="/" className={styles.mobileHeaderLogo}>
            <Logo
              type="icon"
              width={36}
              height={36}
              priority={true}
            />
          </Link>
          
          <div className={styles.mobileHeaderTitle}>داشبورد</div>
          
          <div className={styles.mobileHeaderActions}>
            <button
              className={styles.mobileToggleBtn}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="منو"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className={styles.mobileHeaderActions}>
              <NotificationBell />
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </div>

      {/* Overlay برای موبایل - وقتی sidebar باز است */}
      {sidebarOpen && (
        <div 
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${
          sidebarOpen ? "" : styles.sidebarClosed
        }`}
        style={{
          width: sidebarOpen ? `${sidebarWidth}px` : undefined
        }}
      >
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logo}>
            <Logo 
              type={sidebarOpen ? "horizontal" : "icon"}
              width={sidebarOpen ? 100 : 32}
              height={sidebarOpen ? 30 : 32}
              className={styles.logoImage}
            />
          </Link>
          <button
            className={styles.toggleBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        <nav className={styles.nav}>
          {menuItems.map((item) => renderMenuItem(item, 0))}
        </nav>

        <div className={styles.sidebarFooter}>
          {/* Theme Toggle */}
          <div className={styles.themeToggleWrapper}>
            <ThemeToggle variant="small" />
            {sidebarOpen && (
              <span className={styles.themeToggleText}>تغییر تم</span>
            )}
          </div>

          <div
            className={styles.userInfo}
            onClick={() => router.push("/profile")}
            title="کلیک کنید برای مشاهده پروفایل 👤"
          >
            <div className={styles.userAvatar}>
              {user?.displayName?.[0] || "U"}
            </div>
            {sidebarOpen && (
              <div className={styles.userDetails}>
                <div className={styles.userName}>
                  {user?.displayName || "کاربر"} 👤
                </div>
                <div className={styles.userRole}>
                  {user?.roles?.includes("admin") ? "مدیر" : "کاربر"}
                </div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button className={styles.logoutBtn} onClick={logout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              خروج
            </button>
          )}
        </div>

        {/* Resize Handle */}
        {sidebarOpen && (
          <div
            className={styles.resizeHandle}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsResizing(true);
              console.log('🎯 Resize started'); // Debug
            }}
            title="درگ کنید برای تغییر اندازه"
          >
            <div className={styles.resizeHandleBar}></div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={`${styles.mainContent} ${
        !sidebarOpen ? styles.mainContentSidebarClosed : ""
      }`}>
        <div className={styles.contentWrapper}>{children}</div>
      </main>
    </div>
  );
}
