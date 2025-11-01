/**
 * Menu Tree View Component
 * نمایش درختی منوها برای RBAC
 */

"use client";

import { useState, useEffect } from "react";
import styles from "./MenuTreeView.module.css";

export default function MenuTreeView({ menus, selectedPermissions, onChange }) {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [permissions, setPermissions] = useState({});

  // Initialize permissions from props
  useEffect(() => {
    const permMap = {};
    if (selectedPermissions && Array.isArray(selectedPermissions)) {
      selectedPermissions.forEach((perm) => {
        permMap[perm.menuId] = perm.access;
      });

      // Auto-expand nodes that have permissions
      const expanded = new Set();
      selectedPermissions.forEach((perm) => {
        // Find parent menus and expand them
        expandParents(menus, perm.menuId, expanded);
      });
      setExpandedNodes(expanded);
    }
    setPermissions(permMap);
  }, [selectedPermissions, menus]);

  // Find and expand all parent nodes
  const expandParents = (menuList, menuId, expandedSet) => {
    for (const menu of menuList) {
      if (menu.menuId === menuId) {
        return true;
      }
      if (menu.children && menu.children.length > 0) {
        if (expandParents(menu.children, menuId, expandedSet)) {
          expandedSet.add(menu.menuId);
          return true;
        }
      }
    }
    return false;
  };

  // Toggle node expansion
  const toggleNode = (menuId) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  // Handle permission change
  const handlePermissionChange = (menuId, access) => {
    const newPermissions = { ...permissions };

    if (access === null) {
      // Remove permission
      delete newPermissions[menuId];
    } else {
      // Set permission
      newPermissions[menuId] = access;
    }

    setPermissions(newPermissions);

    // Convert to array format and notify parent
    const permArray = Object.entries(newPermissions).map(
      ([menuId, access]) => ({
        menuId,
        access,
      })
    );
    onChange(permArray);
  };

  // Recursive menu renderer
  const renderMenu = (menu, level = 0) => {
    const hasChildren = menu.children && menu.children.length > 0;
    const isExpanded = expandedNodes.has(menu.menuId);
    const currentAccess = permissions[menu.menuId] || null;

    return (
      <div key={menu.menuId} className={styles.menuNode}>
        <div
          className={styles.menuItem}
          style={{ paddingRight: `${level * 1.5}rem` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleNode(menu.menuId)}
              className={`${styles.expandBtn} ${
                isExpanded ? styles.expanded : ""
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          ) : (
            <div className={styles.expandBtn} />
          )}

          {/* Menu Icon */}
          <div className={styles.menuIcon}>
            {menu.icon ? (
              <span>{menu.icon}</span>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            )}
          </div>

          {/* Menu Info */}
          <div className={styles.menuInfo}>
            <span className={styles.menuTitle}>
              {menu.title.fa || menu.title}
            </span>
            <span className={styles.menuPath}>{menu.path}</span>
          </div>

          {/* Permission Selector */}
          <div className={styles.permissionSelector}>
            <button
              type="button"
              onClick={() =>
                handlePermissionChange(
                  menu.menuId,
                  currentAccess === null ? "view" : null
                )
              }
              className={`${styles.permBtn} ${
                currentAccess === "view" ? styles.active : ""
              }`}
              title="مشاهده"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() =>
                handlePermissionChange(
                  menu.menuId,
                  currentAccess === "full" ? null : "full"
                )
              }
              className={`${styles.permBtn} ${
                currentAccess === "full" ? styles.active : ""
              }`}
              title="دسترسی کامل"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className={styles.children}>
            {menu.children.map((child) => renderMenu(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!menus || menus.length === 0) {
    return (
      <div className={styles.empty}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p>هیچ منویی یافت نشد</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span>مشاهده</span>
        </div>
        <div className={styles.legendItem}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>دسترسی کامل</span>
        </div>
      </div>

      {/* Menu Tree */}
      <div className={styles.tree}>{menus.map((menu) => renderMenu(menu))}</div>
    </div>
  );
}
