/**
 * API Permission Grid Component
 * جدول دسترسی‌های API برای RBAC
 */

"use client";

import { useState, useEffect } from "react";
import styles from "./ApiPermissionGrid.module.css";

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE"];

const METHOD_COLORS = {
  GET: "blue",
  POST: "green",
  PUT: "orange",
  DELETE: "red",
};

export default function ApiPermissionGrid({
  apis,
  selectedPermissions,
  onChange,
}) {
  const [permissions, setPermissions] = useState({});
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // Initialize permissions from props
  useEffect(() => {
    const permMap = {};
    if (selectedPermissions && Array.isArray(selectedPermissions)) {
      selectedPermissions.forEach((perm) => {
        permMap[perm.path] = perm.methods || [];
      });
    }
    setPermissions(permMap);

    // Auto-expand all modules initially
    if (apis && Object.keys(apis).length > 0) {
      setExpandedModules(new Set(Object.keys(apis)));
    }
  }, [selectedPermissions, apis]);

  // Toggle module expansion
  const toggleModule = (module) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(module)) {
        newSet.delete(module);
      } else {
        newSet.add(module);
      }
      return newSet;
    });
  };

  // Handle method toggle
  const toggleMethod = (path, method) => {
    const newPermissions = { ...permissions };
    const currentMethods = newPermissions[path] || [];

    if (currentMethods.includes(method)) {
      // Remove method
      const filtered = currentMethods.filter((m) => m !== method);
      if (filtered.length === 0) {
        delete newPermissions[path];
      } else {
        newPermissions[path] = filtered;
      }
    } else {
      // Add method
      newPermissions[path] = [...currentMethods, method];
    }

    setPermissions(newPermissions);

    // Convert to array format and notify parent
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
      // All selected -> deselect all
      delete newPermissions[path];
    } else {
      // Some or none selected -> select all
      newPermissions[path] = [...availableMethods];
    }

    setPermissions(newPermissions);

    const permArray = Object.entries(newPermissions).map(([path, methods]) => ({
      path,
      methods,
    }));
    onChange(permArray);
  };

  // Filter APIs by search term
  const filterApis = (apiList) => {
    if (!searchTerm) return apiList;

    return apiList.filter(
      (api) =>
        api.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        api.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        api.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (!apis || Object.keys(apis).length === 0) {
    return (
      <div className={styles.empty}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p>هیچ API Endpoint یافت نشد</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
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

      {/* API Grid */}
      <div className={styles.grid}>
        {Object.entries(apis).map(([module, apiList]) => {
          const filteredApis = filterApis(apiList);
          if (filteredApis.length === 0) return null;

          const isExpanded = expandedModules.has(module);

          return (
            <div key={module} className={styles.module}>
              {/* Module Header */}
              <button
                type="button"
                onClick={() => toggleModule(module)}
                className={styles.moduleHeader}
              >
                <div className={styles.moduleInfo}>
                  <span className={styles.moduleIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                  </span>
                  <span className={styles.moduleName}>{module}</span>
                  <span className={styles.moduleCount}>
                    {filteredApis.length} endpoint
                  </span>
                </div>
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* API List */}
              {isExpanded && (
                <div className={styles.apiList}>
                  {filteredApis.map((api) => {
                    const currentMethods = permissions[api.path] || [];
                    const allSelected =
                      currentMethods.length === api.availableMethods.length;

                    return (
                      <div key={api._id} className={styles.apiItem}>
                        <div className={styles.apiInfo}>
                          <div className={styles.apiHeader}>
                            <span className={styles.apiPath}>{api.path}</span>
                            {api.title && (
                              <span className={styles.apiTitle}>
                                {api.title}
                              </span>
                            )}
                          </div>
                          {api.description && (
                            <span className={styles.apiDescription}>
                              {api.description}
                            </span>
                          )}
                        </div>

                        <div className={styles.apiMethods}>
                          {/* Select All Checkbox */}
                          <button
                            type="button"
                            onClick={() =>
                              toggleAllMethods(api.path, api.availableMethods)
                            }
                            className={`${styles.selectAllBtn} ${
                              allSelected ? styles.active : ""
                            }`}
                            title={
                              allSelected ? "لغو انتخاب همه" : "انتخاب همه"
                            }
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

                          {/* Method Checkboxes */}
                          {api.availableMethods.map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => toggleMethod(api.path, method)}
                              className={`${styles.methodBtn} ${
                                currentMethods.includes(method)
                                  ? styles.active
                                  : ""
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
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>مجموع دسترسی‌ها:</span>
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
