/**
 * CSRF Protection Utilities
 * ابزارهای محافظت در برابر CSRF
 */

import crypto from "crypto";
import { CSRF_CONFIG } from "@/config/api.config";
import { getCookie, setCookie, clearCookie } from "./cookie";

/**
 * Generate CSRF Token
 * @returns {string}
 */
export function generateCSRFToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Set CSRF Token in Cookie
 * @param {Response} response
 * @param {string} token
 * @returns {Response}
 */
export function setCSRFToken(response, token) {
  return setCookie(response, CSRF_CONFIG.cookieName, token, {
    httpOnly: false, // JS needs to read this
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60, // 24 hours
    path: "/",
  });
}

/**
 * Get CSRF Token from Request
 * @param {Request} request
 * @returns {string|null}
 */
export function getCSRFTokenFromRequest(request) {
  // Try to get from header first
  const headerToken = request.headers.get(CSRF_CONFIG.headerName);
  if (headerToken) {
    return headerToken;
  }

  // Try to get from cookie
  return getCookie(request, CSRF_CONFIG.cookieName);
}

/**
 * Get CSRF Token from Cookie
 * @param {Request} request
 * @returns {string|null}
 */
export function getCSRFTokenFromCookie(request) {
  return getCookie(request, CSRF_CONFIG.cookieName);
}

/**
 * Verify CSRF Token
 * @param {Request} request
 * @returns {boolean}
 */
export function verifyCSRFToken(request) {
  if (!CSRF_CONFIG.enabled) {
    return true;
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  // Check if path is excluded
  if (CSRF_CONFIG.excludePaths.includes(pathname)) {
    return true;
  }

  // Only check for non-GET requests
  if (request.method === "GET" || request.method === "HEAD") {
    return true;
  }

  const tokenFromRequest = getCSRFTokenFromRequest(request);
  const tokenFromCookie = getCSRFTokenFromCookie(request);

  if (!tokenFromRequest || !tokenFromCookie) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(tokenFromRequest),
    Buffer.from(tokenFromCookie)
  );
}

/**
 * Clear CSRF Token
 * @param {Response} response
 * @returns {Response}
 */
export function clearCSRFToken(response) {
  return clearCookie(response, CSRF_CONFIG.cookieName);
}

/**
 * CSRF Middleware for API Routes
 * @param {Request} request
 * @returns {Object} {success: boolean, error?: string}
 */
export function csrfMiddleware(request) {
  if (!verifyCSRFToken(request)) {
    return {
      success: false,
      error: "Invalid CSRF token",
    };
  }

  return {
    success: true,
  };
}


