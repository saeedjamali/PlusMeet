/**
 * Cookie Utilities
 * ابزارهای کار با Cookie (Server & Client)
 */

import { COOKIE_CONFIG } from "@/config/api.config";

/**
 * ==================== SERVER-SIDE ====================
 */

/**
 * Set Cookie in Response (Next.js API Routes)
 * @param {Response} response - NextResponse object
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {Object} options - Cookie options
 * @returns {Response}
 */
export function setCookie(response, name, value, options = {}) {
  const config = COOKIE_CONFIG[name] || {};
  const cookieOptions = {
    ...config,
    ...options,
  };

  const cookieString = [
    `${name}=${value}`,
    cookieOptions.httpOnly ? "HttpOnly" : "",
    cookieOptions.secure ? "Secure" : "",
    cookieOptions.sameSite ? `SameSite=${cookieOptions.sameSite}` : "",
    cookieOptions.maxAge ? `Max-Age=${cookieOptions.maxAge}` : "",
    cookieOptions.path ? `Path=${cookieOptions.path}` : "",
  ]
    .filter(Boolean)
    .join("; ");

  response.headers.append("Set-Cookie", cookieString);

  return response;
}

/**
 * Set Multiple Cookies
 * @param {Response} response
 * @param {Array} cookies - Array of {name, value, options}
 * @returns {Response}
 */
export function setCookies(response, cookies) {
  cookies.forEach(({ name, value, options }) => {
    setCookie(response, name, value, options);
  });
  return response;
}

/**
 * Clear Cookie (Set with expired date)
 * @param {Response} response
 * @param {string} name
 * @returns {Response}
 */
export function clearCookie(response, name) {
  const config = COOKIE_CONFIG[name] || {};

  const cookieString = [
    `${name}=`,
    "HttpOnly",
    config.secure ? "Secure" : "",
    config.sameSite ? `SameSite=${config.sameSite}` : "",
    "Max-Age=0",
    `Path=${config.path || "/"}`,
  ]
    .filter(Boolean)
    .join("; ");

  response.headers.append("Set-Cookie", cookieString);

  return response;
}

/**
 * Get Cookie from Request (Next.js API Routes)
 * @param {Request} request
 * @param {string} name
 * @returns {string|null}
 */
export function getCookie(request, name) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {});

  return cookies[name] || null;
}

/**
 * Get All Cookies from Request
 * @param {Request} request
 * @returns {Object}
 */
export function getAllCookies(request) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {});
}

/**
 * ==================== CLIENT-SIDE ====================
 */

/**
 * Get Cookie from Document (Client-side)
 * @param {string} name
 * @returns {string|null}
 */
export function getClientCookie(name) {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {});

  return cookies[name] || null;
}

/**
 * Set Cookie from Client (فقط برای non-httpOnly cookies مثل CSRF)
 * @param {string} name
 * @param {string} value
 * @param {Object} options
 */
export function setClientCookie(name, value, options = {}) {
  if (typeof document === "undefined") {
    return;
  }

  const cookieOptions = [];

  if (options.maxAge) {
    cookieOptions.push(`max-age=${options.maxAge}`);
  }
  if (options.path) {
    cookieOptions.push(`path=${options.path}`);
  }
  if (options.sameSite) {
    cookieOptions.push(`samesite=${options.sameSite}`);
  }
  if (options.secure) {
    cookieOptions.push("secure");
  }

  document.cookie = `${name}=${value}; ${cookieOptions.join("; ")}`;
}

/**
 * Delete Cookie from Client
 * @param {string} name
 */
export function deleteClientCookie(name) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=; max-age=0; path=/`;
}

/**
 * ==================== VALIDATION ====================
 */

/**
 * Validate Cookie Value
 * @param {string} value
 * @returns {boolean}
 */
export function isValidCookieValue(value) {
  if (!value || typeof value !== "string") {
    return false;
  }

  // Check for invalid characters
  const invalidChars = /[;,\s]/;
  return !invalidChars.test(value);
}

/**
 * Sanitize Cookie Value
 * @param {string} value
 * @returns {string}
 */
export function sanitizeCookieValue(value) {
  if (!value) return "";
  return value.replace(/[;,\s]/g, "");
}


