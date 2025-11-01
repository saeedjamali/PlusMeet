/**
 * Auth Context
 * Context مدیریت احراز هویت
 */

"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const router = useRouter();

  // بارگذاری از localStorage
  useEffect(() => {
    const storedAccessToken = localStorage.getItem("accessToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");
    const storedUser = localStorage.getItem("user");

    if (storedAccessToken && storedUser) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  /**
   * ورود با OTP
   */
  const loginWithOTP = async (phoneNumber, code, role) => {
    try {
      const body = { phoneNumber, code };
      if (role) {
        body.role = role;
      }

      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "خطا در ورود");
      }

      // ذخیره اطلاعات
      const {
        user: userData,
        accessToken: token,
        refreshToken: refresh,
      } = data.data;

      setUser(userData);
      setAccessToken(token);
      setRefreshToken(refresh);

      localStorage.setItem("accessToken", token);
      localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("user", JSON.stringify(userData));

      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * ورود با رمز عبور
   */
  const loginWithPassword = async (phoneNumber, password) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "خطا در ورود");
      }

      // ذخیره اطلاعات
      const {
        user: userData,
        accessToken: token,
        refreshToken: refresh,
      } = data.data;

      setUser(userData);
      setAccessToken(token);
      setRefreshToken(refresh);

      localStorage.setItem("accessToken", token);
      localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("user", JSON.stringify(userData));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * ارسال OTP
   */
  const sendOTP = async (phoneNumber) => {
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
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
  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    router.push("/login");
  };

  /**
   * به‌روزرسانی اطلاعات کاربر از سرور
   */
  const refreshUser = async () => {
    try {
      const response = await fetchWithAuth("/api/user/profile");

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();

      if (data.success) {
        const userData = {
          phoneNumber: data.data.phoneNumber,
          displayName: data.data.displayName,
          roles: data.data.roles,
          state: data.data.state,
          userType: data.data.userType,
        };

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));

        return { success: true, user: userData };
      }

      return { success: false };
    } catch (error) {
      console.error("Error refreshing user:", error);
      return { success: false, error: error.message };
    }
  };

  /**
   * تمدید توکن
   */
  const refreshAccessToken = async () => {
    try {
      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error("Failed to refresh token");
      }

      const { accessToken: newToken, refreshToken: newRefresh } = data.data;

      setAccessToken(newToken);
      setRefreshToken(newRefresh);

      localStorage.setItem("accessToken", newToken);
      localStorage.setItem("refreshToken", newRefresh);

      return newToken;
    } catch (error) {
      console.error("Refresh token error:", error);
      logout();
      return null;
    }
  };

  /**
   * درخواست API با توکن
   */
  const fetchWithAuth = async (url, options = {}) => {
    let token = accessToken;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    // اگر 401، تلاش برای refresh
    if (response.status === 401) {
      token = await refreshAccessToken();

      if (token) {
        // تلاش مجدد
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
          },
        });
      }
    }

    return response;
  };

  const value = {
    user,
    accessToken,
    loading,
    isAuthenticated: !!user,
    loginWithOTP,
    loginWithPassword,
    sendOTP,
    logout,
    refreshUser,
    fetchWithAuth,
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
