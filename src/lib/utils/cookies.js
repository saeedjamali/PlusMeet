/**
 * Cookie Utilities
 * ابزارهای کار با Cookie (Server-side & Client-side)
 */

// ==================== Server-side (Next.js API Routes) ====================

/**
 * Set کردن httpOnly cookie در response
 * @param {Response} response - Next.js Response object
 * @param {string} name - نام cookie
 * @param {string} value - مقدار cookie
 * @param {object} options - تنظیمات اضافی
 */
export function setHttpOnlyCookie(response, name, value, options = {}) {
  const {
    maxAge = 60 * 60, // 60 minutes default
    httpOnly = true,
    secure = process.env.NODE_ENV === "production",
    sameSite = "lax",
    path = "/",
  } = options;

  const cookieValue = `${name}=${value}; Path=${path}; Max-Age=${maxAge}; SameSite=${sameSite}${
    httpOnly ? "; HttpOnly" : ""
  }${secure ? "; Secure" : ""}`;

  response.headers.append("Set-Cookie", cookieValue);
}

/**
 * حذف cookie از response
 * @param {Response} response - Next.js Response object
 * @param {string} name - نام cookie
 */
export function clearCookie(response, name) {
  const cookieValue = `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=lax`;
  response.headers.append("Set-Cookie", cookieValue);
}

/**
 * خواندن cookie از request headers
 * @param {Request} request - Next.js Request object
 * @param {string} name - نام cookie
 * @returns {string|null}
 */
export function getCookieFromRequest(request, name) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const cookie = cookies.find((c) => c.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return cookie.split("=")[1];
}

// ==================== Client-side (Browser) ====================

/**
 * خواندن cookie از browser (فقط برای non-httpOnly cookies)
 * @param {string} name - نام cookie
 * @returns {string|null}
 */
export function getCookie(name) {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";").map((c) => c.trim());
  const cookie = cookies.find((c) => c.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return cookie.split("=")[1];
}

/**
 * Set کردن cookie در browser
 * @param {string} name - نام cookie
 * @param {string} value - مقدار cookie
 * @param {number} days - تعداد روز اعتبار
 */
export function setCookie(name, value, days = 7) {
  if (typeof document === "undefined") {
    return;
  }

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=lax`;
}

/**
 * حذف cookie از browser
 * @param {string} name - نام cookie
 */
export function deleteCookie(name) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// ==================== CSRF Token ====================

/**
 * تولید CSRF token
 * @returns {string}
 */
export function generateCSRFToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Set کردن CSRF token در localStorage و cookie
 */
export function setCSRFToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const token = generateCSRFToken();
  localStorage.setItem("csrfToken", token);
  setCookie("XSRF-TOKEN", token, 1); // 1 day

  return token;
}

/**
 * گرفتن CSRF token از localStorage
 * @returns {string|null}
 */
export function getCSRFToken() {
  if (typeof window === "undefined") {
    return null;
  }

  let token = localStorage.getItem("csrfToken");

  if (!token) {
    token = setCSRFToken();
  }

  return token;
}

/**
 * Validate کردن CSRF token (server-side)
 * @param {Request} request - Next.js Request object
 * @returns {boolean}
 */
export function validateCSRFToken(request) {
  const headerToken = request.headers.get("x-csrf-token");
  const cookieToken = getCookieFromRequest(request, "XSRF-TOKEN");

  if (!headerToken || !cookieToken) {
    return false;
  }

  return headerToken === cookieToken;
}

/**
 * مثال استفاده:
 *
 * // Server-side (API Route)
 * import { setHttpOnlyCookie, getCookieFromRequest } from '@/lib/utils/cookies';
 *
 * export async function POST(request) {
 *   const response = NextResponse.json({ success: true });
 *
 *   setHttpOnlyCookie(response, 'accessToken', token, { maxAge: 900 });
 *   setHttpOnlyCookie(response, 'refreshToken', refreshToken, { maxAge: 604800 });
 *
 *   return response;
 * }
 *
 * // Client-side
 * import { getCSRFToken } from '@/lib/utils/cookies';
 *
 * const csrfToken = getCSRFToken();
 * fetch('/api/user/profile', {
 *   headers: {
 *     'X-CSRF-Token': csrfToken,
 *   },
 * });
 */





