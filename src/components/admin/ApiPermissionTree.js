/**
 * API Permission Tree Component
 * ساختار درختی دسترسی‌های API برای RBAC
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import styles from "./ApiPermissionTree.module.css";

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE"];

const METHOD_COLORS = {
  GET: "blue",
  POST: "green",
  PUT: "orange",
  DELETE: "red",
};

// تبدیل لیست API ها به ساختار درختی
function buildTree(apis) {
  const tree = {};

  Object.values(apis)
    .flat()
    .forEach((api) => {
      const parts = api.path.split("/").filter(Boolean); // ['api', 'admin', 'users', ':id']
      let current = tree;

      parts.forEach((part, index) => {
        const currentPath = "/" + parts.slice(0, index + 1).join("/"); // همیشه از / استفاده کن

        // اگر این part هنوز وجود نداره، بسازش
        if (!current[part]) {
          current[part] = {
            name: part,
            path: currentPath,
            children: {},
            endpoints: [],
            isFolder: true, // به صورت پیش‌فرض فولدر هست
          };
        }

        // برو به سطح بعدی (children)
        if (index < parts.length - 1) {
          current = current[part].children;
        } else {
          // اگر آخرین part بود، این endpoint رو اضافه کن
          current[part].endpoints.push(api);
          // اگه endpoint داره، دیگه فولدر محض نیست
          current[part].isFolder =
            Object.keys(current[part].children).length > 0;
        }
      });
    });

  return tree;
}

export default function ApiPermissionTree({
  apis,
  selectedPermissions,
  onChange,
}) {
  const [permissions, setPermissions] = useState({});
  const [expandedNodes, setExpandedNodes] = useState(new Set(["/api"]));
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState(new Set()); // فیلتر متدها (خالی = همه)

  // Build tree structure
  const tree = useMemo(() => {
    if (!apis || Object.keys(apis).length === 0) return {};
    const builtTree = buildTree(apis);
    console.log("🌳 Built tree:", builtTree);
    return builtTree;
  }, [apis]);

  // Initialize permissions from props
  useEffect(() => {
    const permMap = {};
    if (selectedPermissions && Array.isArray(selectedPermissions)) {
      selectedPermissions.forEach((perm) => {
        permMap[perm.path] = perm.methods || [];
      });
    }
    setPermissions(permMap);
  }, [selectedPermissions]);

  // Toggle node expansion
  const toggleNode = (path) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  // Expand all nodes
  const expandAll = () => {
    const allPaths = new Set();
    const collectPaths = (node) => {
      allPaths.add(node.path); // استفاده از path ذخیره شده که قبلاً با / ساخته شده
      Object.values(node.children).forEach((child) => collectPaths(child));
    };
    Object.values(tree).forEach((node) => collectPaths(node));
    setExpandedNodes(allPaths);
  };

  // Collapse all nodes
  const collapseAll = () => {
    setExpandedNodes(new Set(["/api"]));
  };

  // Toggle method filter
  const toggleMethodFilter = (method) => {
    setMethodFilter((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(method)) {
        newSet.delete(method);
      } else {
        newSet.add(method);
      }
      return newSet;
    });
  };

  // Handle method toggle
  const toggleMethod = (path, method) => {
    const newPermissions = { ...permissions };
    const currentMethods = newPermissions[path] || [];

    if (currentMethods.includes(method)) {
      const filtered = currentMethods.filter((m) => m !== method);
      if (filtered.length === 0) {
        delete newPermissions[path];
      } else {
        newPermissions[path] = filtered;
      }
    } else {
      newPermissions[path] = [...currentMethods, method];
    }

    setPermissions(newPermissions);

    const permArray = Object.entries(newPermissions).map(([path, methods]) => ({
      path,
      methods,
    }));
    onChange(permArray);
  };

  // Select/Deselect all methods for an endpoint
  const toggleAllMethods = (path, availableMethods) => {
    const newPermissions = { ...permissions };
    const currentMethods = newPermissions[path] || [];

    if (currentMethods.length === availableMethods.length) {
      delete newPermissions[path];
    } else {
      newPermissions[path] = [...availableMethods];
    }

    setPermissions(newPermissions);

    const permArray = Object.entries(newPermissions).map(([path, methods]) => ({
      path,
      methods,
    }));
    onChange(permArray);
  };

  // Filter function
  const shouldShowNode = (node, searchTerm, methodFilter) => {
    // چک کردن فیلتر متد برای endpoint ها
    const matchesMethodFilter = (endpoint) => {
      if (methodFilter.size === 0) return true; // اگه فیلتر خالیه، همه رو نشون بده
      // اگه حداقل یکی از متدهای endpoint با فیلتر match کنه
      return endpoint.availableMethods.some((method) =>
        methodFilter.has(method)
      );
    };

    // چک کردن جستجو
    const matchesSearch = (endpoint) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        endpoint.path.toLowerCase().includes(term) ||
        endpoint.title?.toLowerCase().includes(term) ||
        endpoint.description?.toLowerCase().includes(term)
      );
    };

    // چک کردن نام node
    if (
      !searchTerm ||
      node.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      // اگه این node فولدره، بررسی کن که آیا endpoint های children اش match میکنن؟
      if (node.isFolder && Object.keys(node.children).length > 0) {
        return Object.values(node.children).some((child) =>
          shouldShowNode(child, searchTerm, methodFilter)
        );
      }

      // اگه endpoint هست، بررسی کن که با فیلترها match کنه
      if (node.endpoints.length > 0) {
        return node.endpoints.some(
          (ep) => matchesMethodFilter(ep) && matchesSearch(ep)
        );
      }

      return true;
    }

    // اگه نام node match نکرد، بررسی کن endpoint ها و children
    if (
      node.endpoints.some((ep) => matchesMethodFilter(ep) && matchesSearch(ep))
    ) {
      return true;
    }

    // Check if any child matches
    return Object.values(node.children).some((child) =>
      shouldShowNode(child, searchTerm, methodFilter)
    );
  };

  // Render tree node
  const renderNode = (node, depth = 0) => {
    if (!shouldShowNode(node, searchTerm, methodFilter)) return null;

    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = Object.keys(node.children).length > 0;

    // فیلتر کردن endpoint ها براساس متد
    const filteredEndpoints = node.endpoints.filter((ep) => {
      // فیلتر متد
      if (methodFilter.size > 0) {
        const hasMatchingMethod = ep.availableMethods.some((method) =>
          methodFilter.has(method)
        );
        if (!hasMatchingMethod) return false;
      }

      // فیلتر جستجو
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          ep.path.toLowerCase().includes(term) ||
          ep.title?.toLowerCase().includes(term) ||
          ep.description?.toLowerCase().includes(term)
        );
      }

      return true;
    });

    const hasEndpoints = filteredEndpoints.length > 0;

    return (
      <div key={node.path} className={styles.node}>
        {/* Node Header */}
        {hasChildren && (
          <button
            type="button"
            onClick={() => toggleNode(node.path)}
            className={styles.nodeHeader}
            style={{ paddingRight: `${depth * 1.5}rem` }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className={`${styles.expandIcon} ${
                isExpanded ? styles.expanded : ""
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className={styles.folderIcon}>
              {isExpanded ? "📂" : "📁"}
            </span>
            <span className={styles.nodeName}>{node.name}</span>
            <span className={styles.nodeCount}>
              {Object.keys(node.children).length + node.endpoints.length}
            </span>
          </button>
        )}

        {/* Endpoints */}
        {hasEndpoints && (isExpanded || !hasChildren) && (
          <div
            className={styles.endpoints}
            style={{ paddingRight: `${(depth + 1) * 1.5}rem` }}
          >
            {filteredEndpoints.map((api) => {
              const currentMethods = permissions[api.path] || [];
              const allSelected =
                currentMethods.length === api.availableMethods.length;

              return (
                <div key={api._id || api.path} className={styles.endpoint}>
                  <div className={styles.endpointInfo}>
                    <span className={styles.fileIcon}>📄</span>
                    <div className={styles.endpointDetails}>
                      <span className={styles.endpointPath}>{api.path}</span>
                      {api.title && (
                        <span className={styles.endpointTitle}>
                          {api.title}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.endpointMethods}>
                    {/* Select All */}
                    <button
                      type="button"
                      onClick={() =>
                        toggleAllMethods(api.path, api.availableMethods)
                      }
                      className={`${styles.selectAllBtn} ${
                        allSelected ? styles.active : ""
                      }`}
                      title={allSelected ? "لغو انتخاب همه" : "انتخاب همه"}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        {allSelected ? (
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
                            d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        )}
                      </svg>
                    </button>

                    {/* Method Buttons */}
                    {api.availableMethods.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => toggleMethod(api.path, method)}
                        className={`${styles.methodBtn} ${
                          currentMethods.includes(method) ? styles.active : ""
                        } ${styles[METHOD_COLORS[method]]}`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Children */}
        {hasChildren &&
          isExpanded &&
          Object.values(node.children).map((child) =>
            renderNode(child, depth + 1)
          )}
      </div>
    );
  };

  if (!tree || Object.keys(tree).length === 0) {
    return (
      <div className={styles.empty}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <p>هیچ API Endpoint یافت نشد</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        {/* Search */}
        <div className={styles.search}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="جستجو در API ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Method Filter */}
        <div className={styles.methodFilterGroup}>
          <span className={styles.filterLabel}>فیلتر متد:</span>
          {HTTP_METHODS.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => toggleMethodFilter(method)}
              className={`${styles.methodFilterBtn} ${
                methodFilter.has(method) ? styles.active : ""
              } ${styles[METHOD_COLORS[method]]}`}
              title={`فیلتر ${method}`}
            >
              {method}
            </button>
          ))}
          {methodFilter.size > 0 && (
            <button
              type="button"
              onClick={() => setMethodFilter(new Set())}
              className={styles.clearFilterBtn}
              title="پاک کردن فیلتر"
            >
              ✕
            </button>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={expandAll}
            className={styles.actionBtn}
            title="باز کردن همه"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            <span>باز کردن همه</span>
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className={styles.actionBtn}
            title="بستن همه"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 11l3 3L9 17m5-6h3m-3 6h3M9 3l3 3-3 3M9 17l3-3-3-3m5-6h3M9 17H6"
              />
            </svg>
            <span>بستن همه</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {HTTP_METHODS.map((method) => (
          <div key={method} className={styles.legendItem}>
            <span
              className={`${styles.methodBadge} ${
                styles[METHOD_COLORS[method]]
              }`}
            >
              {method}
            </span>
            <span>
              {method === "GET" && "مشاهده"}
              {method === "POST" && "ایجاد"}
              {method === "PUT" && "ویرایش"}
              {method === "DELETE" && "حذف"}
            </span>
          </div>
        ))}
      </div>

      {/* Tree */}
      <div className={styles.tree}>
        {Object.values(tree).map((node) => renderNode(node, 0))}
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Endpoint های انتخاب شده:</span>
          <span className={styles.statValue}>
            {Object.keys(permissions).length}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>مجموع متدها:</span>
          <span className={styles.statValue}>
            {Object.values(permissions).reduce(
              (sum, methods) => sum + methods.length,
              0
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
