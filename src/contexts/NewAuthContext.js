/**
 * Auth Context (با httpOnly Cookie)
 * مدیریت احراز هویت با استفاده از httpOnly Cookies و CSRF Protection
 */

"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCSRFToken, setCSRFToken } from "@/lib/utils/cookies";
import { API_ROUTES } from "@/lib/config/api.config";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // بارگذاری اولیه - چک کردن وضعیت احراز هویت
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * چک کردن وضعیت احراز هویت
   */
  const checkAuth = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_ROUTES.user.profile, {
        credentials: "include", // ارسال cookies
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.data);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Check auth error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ورود با OTP
   */
  const loginWithOTP = async (phoneNumber, code, role) => {
    try {
      const response = await fetch(API_ROUTES.auth.verifyOtp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // دریافت cookies
        body: JSON.stringify({ phoneNumber, code, role }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        // Set کردن CSRF token برای درخواست‌های بعدی
        setCSRFToken();
        return { success: true, data: data.data };
      }

      return { success: false, error: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * ورود با رمز عبور
   */
  const loginWithPassword = async (phoneNumber, password) => {
    try {
      const response = await fetch(API_ROUTES.auth.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phoneNumber, password }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        setCSRFToken();
        return { success: true };
      }

      return { success: false, error: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * ارسال OTP
   */
  const sendOTP = async (phoneNumber, type = "login") => {
    try {
      const response = await fetch(API_ROUTES.auth.sendOtp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, type }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "خطا در ارسال کد");
      }

      return {
        success: true,
        expiresIn: data.expiresIn,
        isNewUser: data.isNewUser,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * خروج
   */
  const logout = async () => {
    try {
      await fetch(API_ROUTES.auth.logout, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      // پاک کردن CSRF token
      localStorage.removeItem("csrfToken");
      router.push("/login");
    }
  };

  /**
   * به‌روزرسانی اطلاعات کاربر
   */
  const refreshUser = async () => {
    try {
      const response = await fetch(API_ROUTES.user.profile, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        return { success: true, user: data.data };
      }

      return { success: false };
    } catch (error) {
      console.error("Error refreshing user:", error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Fetch با authentication (CSRF token)
   */
  const fetchWithAuth = async (url, options = {}) => {
    const csrfToken = getCSRFToken();

    const headers = {
      ...options.headers,
      "Content-Type": "application/json",
    };

    // اضافه کردن CSRF token برای state-changing requests
    const method = options.method || "GET";
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // ارسال cookies
    });

    // اگر 401 بود، سعی کن refresh کنی
    if (response.status === 401) {
      const refreshResponse = await fetch(API_ROUTES.auth.refresh, {
        method: "POST",
        credentials: "include",
      });

      if (refreshResponse.ok) {
        // درخواست اصلی رو دوباره بفرست
        return fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });
      } else {
        // Refresh هم کار نکرد، logout کن
        await logout();
        throw new Error("Unauthorized");
      }
    }

    return response;
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    loginWithOTP,
    loginWithPassword,
    sendOTP,
    logout,
    refreshUser,
    fetchWithAuth,
    checkAuth, // برای refresh دستی
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth باید داخل AuthProvider استفاده شود");
  }
  return context;
}

