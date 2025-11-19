/**
 * joinRequestHelpers.js
 * توابع کمکی برای مدیریت وضعیت‌های درخواست پیوستن به رویداد
 */

import { JOIN_REQUEST_STATUS } from "@/lib/helpers/joinRequestStatus";

// ═══════════════════════════════════════════════════════════
// وضعیت‌های نهایی که امکان ثبت نظر دارند
// ═══════════════════════════════════════════════════════════
export const FINAL_EVENT_STATUSES = [
  JOIN_REQUEST_STATUS.ATTENDED, // شرکت کرده
  JOIN_REQUEST_STATUS.COMPLETED, // تکمیل شده
  JOIN_REQUEST_STATUS.NO_SHOW, // حضور نداشت
];

// ═══════════════════════════════════════════════════════════
// انواع مشارکت
// ═══════════════════════════════════════════════════════════
export const PARTICIPATION_TYPES = {
  OPEN: "OPEN", // آزاد
  APPROVAL_REQUIRED: "APPROVAL_REQUIRED", // نیازمند تایید
  TICKETED: "TICKETED", // بلیت محور
  APPROVAL_TICKETED: "APPROVAL_TICKETED", // ترکیبی (تایید + بلیت)
  INVITE_ONLY: "INVITE_ONLY", // دعوتی
};

// ═══════════════════════════════════════════════════════════
// وضعیت‌های مجاز برای هر نوع شرکت
// ═══════════════════════════════════════════════════════════
export const ALLOWED_STATUSES_BY_TYPE = {
  [PARTICIPATION_TYPES.OPEN]: [
    JOIN_REQUEST_STATUS.PENDING,
    JOIN_REQUEST_STATUS.APPROVED,
    JOIN_REQUEST_STATUS.REJECTED,
    JOIN_REQUEST_STATUS.WAITLISTED,
    JOIN_REQUEST_STATUS.CONFIRMED,
    JOIN_REQUEST_STATUS.CHECKED_IN,
    JOIN_REQUEST_STATUS.ATTENDED,
    JOIN_REQUEST_STATUS.NO_SHOW,
    JOIN_REQUEST_STATUS.COMPLETED,
    JOIN_REQUEST_STATUS.CANCELED,
    JOIN_REQUEST_STATUS.REVOKED,
    JOIN_REQUEST_STATUS.EXPIRED,
  ],
  [PARTICIPATION_TYPES.APPROVAL_REQUIRED]: [
    JOIN_REQUEST_STATUS.PENDING,
    JOIN_REQUEST_STATUS.APPROVED,
    JOIN_REQUEST_STATUS.REJECTED,
    JOIN_REQUEST_STATUS.WAITLISTED,
    JOIN_REQUEST_STATUS.CONFIRMED,
    JOIN_REQUEST_STATUS.CHECKED_IN,
    JOIN_REQUEST_STATUS.ATTENDED,
    JOIN_REQUEST_STATUS.NO_SHOW,
    JOIN_REQUEST_STATUS.COMPLETED,
    JOIN_REQUEST_STATUS.CANCELED,
    JOIN_REQUEST_STATUS.REVOKED,
    JOIN_REQUEST_STATUS.EXPIRED,
  ],
  [PARTICIPATION_TYPES.TICKETED]: [
    JOIN_REQUEST_STATUS.PENDING,
    JOIN_REQUEST_STATUS.APPROVED,
    JOIN_REQUEST_STATUS.REJECTED,
    JOIN_REQUEST_STATUS.WAITLISTED,
    JOIN_REQUEST_STATUS.PAYMENT_RESERVED,
    JOIN_REQUEST_STATUS.PAYMENT_PENDING,
    JOIN_REQUEST_STATUS.PAID,
    JOIN_REQUEST_STATUS.PAYMENT_FAILED,
    JOIN_REQUEST_STATUS.CONFIRMED,
    JOIN_REQUEST_STATUS.CHECKED_IN,
    JOIN_REQUEST_STATUS.ATTENDED,
    JOIN_REQUEST_STATUS.NO_SHOW,
    JOIN_REQUEST_STATUS.COMPLETED,
    JOIN_REQUEST_STATUS.CANCELED,
    JOIN_REQUEST_STATUS.REVOKED,
    JOIN_REQUEST_STATUS.REFUNDED,
    JOIN_REQUEST_STATUS.EXPIRED,
  ],
  [PARTICIPATION_TYPES.APPROVAL_TICKETED]: [
    JOIN_REQUEST_STATUS.PENDING,
    JOIN_REQUEST_STATUS.APPROVED,
    JOIN_REQUEST_STATUS.REJECTED,
    JOIN_REQUEST_STATUS.WAITLISTED,
    JOIN_REQUEST_STATUS.PAYMENT_RESERVED,
    JOIN_REQUEST_STATUS.PAYMENT_PENDING,
    JOIN_REQUEST_STATUS.PAID,
    JOIN_REQUEST_STATUS.PAYMENT_FAILED,
    JOIN_REQUEST_STATUS.CONFIRMED,
    JOIN_REQUEST_STATUS.CHECKED_IN,
    JOIN_REQUEST_STATUS.ATTENDED,
    JOIN_REQUEST_STATUS.NO_SHOW,
    JOIN_REQUEST_STATUS.COMPLETED,
    JOIN_REQUEST_STATUS.CANCELED,
    JOIN_REQUEST_STATUS.REVOKED,
    JOIN_REQUEST_STATUS.REFUNDED,
    JOIN_REQUEST_STATUS.EXPIRED,
  ],
  [PARTICIPATION_TYPES.INVITE_ONLY]: [
    JOIN_REQUEST_STATUS.PENDING,
    JOIN_REQUEST_STATUS.APPROVED,
    JOIN_REQUEST_STATUS.REJECTED,
    JOIN_REQUEST_STATUS.WAITLISTED,
    JOIN_REQUEST_STATUS.CONFIRMED,
    JOIN_REQUEST_STATUS.CHECKED_IN,
    JOIN_REQUEST_STATUS.ATTENDED,
    JOIN_REQUEST_STATUS.NO_SHOW,
    JOIN_REQUEST_STATUS.COMPLETED,
    JOIN_REQUEST_STATUS.CANCELED,
    JOIN_REQUEST_STATUS.REVOKED,
    JOIN_REQUEST_STATUS.EXPIRED,
  ],
};

// ═══════════════════════════════════════════════════════════
// وضعیت‌هایی که کاربر می‌تواند درخواست لغو بدهد
// ═══════════════════════════════════════════════════════════
export const USER_CANCELABLE_STATUSES = [
  JOIN_REQUEST_STATUS.PENDING,
  JOIN_REQUEST_STATUS.WAITLISTED,
  JOIN_REQUEST_STATUS.PAYMENT_RESERVED,
];

// ═══════════════════════════════════════════════════════════
// وضعیت‌های شرکت‌کننده فعال
// ═══════════════════════════════════════════════════════════
export const ACTIVE_PARTICIPANT_STATUSES = [
  JOIN_REQUEST_STATUS.APPROVED,
  JOIN_REQUEST_STATUS.PAYMENT_PENDING,
  JOIN_REQUEST_STATUS.PAID,
  JOIN_REQUEST_STATUS.CONFIRMED,
  JOIN_REQUEST_STATUS.CHECKED_IN,
  JOIN_REQUEST_STATUS.ATTENDED,
];

// ═══════════════════════════════════════════════════════════
// توابع کمکی
// ═══════════════════════════════════════════════════════════

/**
 * آیا کاربر شرکت‌کننده فعال است؟
 */
export function isActiveParticipant(status) {
  return ACTIVE_PARTICIPANT_STATUSES.includes(status);
}

/**
 * آیا کاربر می‌تواند به محتوای رویداد دسترسی داشته باشد؟
 */
export function canAccessEventContent(status) {
  return [
    JOIN_REQUEST_STATUS.CONFIRMED,
    JOIN_REQUEST_STATUS.CHECKED_IN,
    JOIN_REQUEST_STATUS.ATTENDED,
    JOIN_REQUEST_STATUS.COMPLETED,
  ].includes(status);
}

/**
 * آیا کاربر واقعاً در رویداد شرکت کرده؟
 */
export function hasAttended(status) {
  return [JOIN_REQUEST_STATUS.ATTENDED, JOIN_REQUEST_STATUS.COMPLETED].includes(
    status
  );
}

/**
 * آیا کاربر می‌تواند نظر بگذارد؟
 */
export function canLeaveReview(status) {
  return FINAL_EVENT_STATUSES.includes(status);
}

/**
 * آیا کاربر می‌تواند در جامعه رویداد شرکت کند؟
 */
export function canParticipateInCommunity(status) {
  return [
    JOIN_REQUEST_STATUS.CONFIRMED,
    JOIN_REQUEST_STATUS.CHECKED_IN,
    JOIN_REQUEST_STATUS.ATTENDED,
    JOIN_REQUEST_STATUS.COMPLETED,
  ].includes(status);
}

/**
 * آیا کاربر می‌تواند گواهی‌نامه دریافت کند؟
 */
export function canReceiveCertificate(status) {
  return [JOIN_REQUEST_STATUS.ATTENDED, JOIN_REQUEST_STATUS.COMPLETED].includes(
    status
  );
}

/**
 * آیا در حالت انتظار است؟
 */
export function isPending(status) {
  return [
    JOIN_REQUEST_STATUS.PENDING,
    JOIN_REQUEST_STATUS.PAYMENT_PENDING,
    JOIN_REQUEST_STATUS.WAITLISTED,
  ].includes(status);
}

/**
 * آیا نیاز به پرداخت دارد؟
 */
export function needsPayment(status) {
  return [
    JOIN_REQUEST_STATUS.PAYMENT_PENDING,
    JOIN_REQUEST_STATUS.PAYMENT_FAILED,
  ].includes(status);
}

/**
 * تعیین سطح دسترسی
 */
export function getAccessLevel(status) {
  if (!status) return "none";

  if (hasAttended(status) || status === JOIN_REQUEST_STATUS.COMPLETED) {
    return "completed";
  }

  if (canAccessEventContent(status)) {
    return "full";
  }

  if (isActiveParticipant(status)) {
    return "basic";
  }

  if (isPending(status)) {
    return "pending";
  }

  return "none";
}

/**
 * آیا کاربر می‌تواند درخواست را لغو کند؟
 */
export function canUserCancelRequest(status) {
  return USER_CANCELABLE_STATUSES.includes(status);
}

/**
 * دریافت اقدامات مجاز کاربر
 */
export function getUserAllowedActions(status, participationType) {
  const actions = [];

  // لغو درخواست
  if (canUserCancelRequest(status)) {
    actions.push("cancel");
  }

  // پرداخت
  if (needsPayment(status)) {
    actions.push("payment");
  }

  // دسترسی به محتوا
  if (canAccessEventContent(status)) {
    actions.push("access_content");
    actions.push("join_community");
  }

  // ثبت نظر
  if (canLeaveReview(status)) {
    actions.push("leave_review");
  }

  // دریافت گواهی
  if (canReceiveCertificate(status)) {
    actions.push("get_certificate");
  }

  return actions;
}

/**
 * دریافت لیست وضعیت‌های شرکت‌کننده فعال
 */
export function getActiveParticipantStatuses() {
  return ACTIVE_PARTICIPANT_STATUSES;
}

/**
 * نقشه انتقال وضعیت برای مالک رویداد
 * تعیین می‌کند مالک از هر وضعیت می‌تواند به کدام وضعیت‌ها تغییر دهد
 */
export const STATUS_TRANSITION_MAP = {
  // از PENDING می‌تواند به:
  [JOIN_REQUEST_STATUS.PENDING]: [
    JOIN_REQUEST_STATUS.APPROVED,
    JOIN_REQUEST_STATUS.REJECTED,
    JOIN_REQUEST_STATUS.WAITLISTED,
  ],

  // از PAYMENT_RESERVED می‌تواند به:
  [JOIN_REQUEST_STATUS.PAYMENT_RESERVED]: [
    JOIN_REQUEST_STATUS.APPROVED,
    JOIN_REQUEST_STATUS.REJECTED,
    JOIN_REQUEST_STATUS.REFUNDED,
  ],

  // از APPROVED می‌تواند به:
  [JOIN_REQUEST_STATUS.APPROVED]: [
    JOIN_REQUEST_STATUS.CONFIRMED,
    JOIN_REQUEST_STATUS.REJECTED,
    JOIN_REQUEST_STATUS.REVOKED,
  ],

  // از CONFIRMED می‌تواند به:
  [JOIN_REQUEST_STATUS.CONFIRMED]: [
    JOIN_REQUEST_STATUS.CHECKED_IN,
    JOIN_REQUEST_STATUS.REVOKED,
  ],

  // از CHECKED_IN می‌تواند به:
  [JOIN_REQUEST_STATUS.CHECKED_IN]: [
    JOIN_REQUEST_STATUS.ATTENDED,
    JOIN_REQUEST_STATUS.NO_SHOW,
  ],

  // از ATTENDED می‌تواند به:
  [JOIN_REQUEST_STATUS.ATTENDED]: [JOIN_REQUEST_STATUS.COMPLETED],

  // از WAITLISTED می‌تواند به:
  [JOIN_REQUEST_STATUS.WAITLISTED]: [
    JOIN_REQUEST_STATUS.APPROVED,
    JOIN_REQUEST_STATUS.REJECTED,
  ],

  // وضعیت‌های نهایی (بدون امکان تغییر)
  [JOIN_REQUEST_STATUS.REJECTED]: [],
  [JOIN_REQUEST_STATUS.COMPLETED]: [],
  [JOIN_REQUEST_STATUS.CANCELED]: [],
  [JOIN_REQUEST_STATUS.REVOKED]: [],
  [JOIN_REQUEST_STATUS.REFUNDED]: [],
  [JOIN_REQUEST_STATUS.EXPIRED]: [],
  [JOIN_REQUEST_STATUS.NO_SHOW]: [],
  [JOIN_REQUEST_STATUS.PAYMENT_FAILED]: [],
};

/**
 * دریافت وضعیت‌های قابل تغییر برای مالک
 */
export function getOwnerAllowedTransitions(currentStatus) {
  return STATUS_TRANSITION_MAP[currentStatus] || [];
}

/**
 * دریافت وضعیت‌های قابل نمایش بر اساس نوع مشارکت و نقش
 * @param {string} participationType - نوع مشارکت
 * @param {string} currentStatus - وضعیت فعلی
 * @param {string} role - نقش ("owner" یا "user")
 * @returns {Array} آرایه وضعیت‌های قابل نمایش
 */
export function getDisplayableNextStatuses(
  participationType,
  currentStatus,
  role = "owner"
) {
  if (role === "owner") {
    // برای مالک، از STATUS_TRANSITION_MAP استفاده می‌کنیم
    const allowedTransitions = STATUS_TRANSITION_MAP[currentStatus] || [];

    // فیلتر کردن بر اساس نوع مشارکت
    if (participationType === PARTICIPATION_TYPES.OPEN) {
      // در نوع OPEN، بدون نیاز به تایید مالک
      // ولی مالک هنوز می‌تواند وضعیت را تغییر دهد
      return allowedTransitions;
    } else if (
      participationType === PARTICIPATION_TYPES.TICKETED ||
      participationType === PARTICIPATION_TYPES.APPROVAL_TICKETED
    ) {
      // در رویدادهای بلیطی، تمام انتقالات مجاز است
      return allowedTransitions;
    } else if (participationType === PARTICIPATION_TYPES.APPROVAL_REQUIRED) {
      // در نوع APPROVAL_REQUIRED
      return allowedTransitions;
    } else if (participationType === PARTICIPATION_TYPES.INVITE_ONLY) {
      // در نوع دعوتی
      return allowedTransitions;
    }

    return allowedTransitions;
  } else {
    // برای کاربر، محدودیت‌های بیشتری وجود دارد
    // کاربر فقط می‌تواند در برخی موارد وضعیت را تغییر دهد (مثلاً لغو کردن)
    return [];
  }
}

/**
 * بررسی اینکه آیا مالک می‌تواند از وضعیت A به B تغییر دهد
 */
export function canOwnerTransitionStatus(fromStatus, toStatus) {
  const allowedTransitions = STATUS_TRANSITION_MAP[fromStatus] || [];
  return allowedTransitions.includes(toStatus);
}

/**
 * بررسی validation تغییر وضعیت - برای استفاده در API
 * @param {string} participationType - نوع مشارکت
 * @param {string} currentStatus - وضعیت فعلی
 * @param {string} newStatus - وضعیت جدید
 * @param {string} role - نقش ("owner" یا "user")
 * @returns {object} { valid: boolean, reason?: string }
 */
export function canUserChangeStatus(
  participationType,
  currentStatus,
  newStatus,
  role = "user"
) {
  if (role === "owner") {
    // بررسی اینکه آیا این انتقال مجاز است
    const isAllowed = canOwnerTransitionStatus(currentStatus, newStatus);

    if (!isAllowed) {
      return {
        valid: false,
        reason: `تغییر از وضعیت "${currentStatus}" به "${newStatus}" مجاز نیست`,
      };
    }

    return { valid: true };
  } else {
    // کاربر فقط در برخی موارد می‌تواند تغییر دهد (مثلاً لغو)
    const canCancel = canUserCancelRequest(currentStatus);

    if (!canCancel) {
      return {
        valid: false,
        reason: "شما اجازه تغییر این وضعیت را ندارید",
      };
    }

    // اگر کاربر می‌خواهد لغو کند، بررسی می‌کنیم که به CANCELED تغییر می‌دهد
    if (newStatus !== JOIN_REQUEST_STATUS.CANCELED) {
      return {
        valid: false,
        reason: "شما فقط می‌توانید درخواست را لغو کنید",
      };
    }

    return { valid: true };
  }
}

/**
 * دریافت اقدامات مجاز مالک برای یک درخواست
 */
export function getOwnerAllowedActions(joinRequest, event) {
  if (!joinRequest || !event) return [];

  const actions = [];
  const currentStatus = joinRequest.status;
  const participationType = event.participationType?.key;

  // تغییر وضعیت
  const allowedTransitions = getOwnerAllowedTransitions(currentStatus);
  if (allowedTransitions.length > 0) {
    actions.push({
      type: "change_status",
      allowedStatuses: allowedTransitions,
    });
  }

  // لغو توسط مالک
  if (
    [
      JOIN_REQUEST_STATUS.APPROVED,
      JOIN_REQUEST_STATUS.CONFIRMED,
      JOIN_REQUEST_STATUS.CHECKED_IN,
    ].includes(currentStatus)
  ) {
    actions.push({ type: "revoke" });
  }

  // بازپرداخت
  if (
    participationType === PARTICIPATION_TYPES.TICKETED ||
    participationType === PARTICIPATION_TYPES.APPROVAL_TICKETED
  ) {
    if (
      [
        JOIN_REQUEST_STATUS.PAID,
        JOIN_REQUEST_STATUS.CONFIRMED,
        JOIN_REQUEST_STATUS.CHECKED_IN,
      ].includes(currentStatus)
    ) {
      actions.push({ type: "refund" });
    }
  }

  // ثبت حضور
  if (currentStatus === JOIN_REQUEST_STATUS.CONFIRMED) {
    actions.push({ type: "check_in" });
  }

  // تایید شرکت
  if (currentStatus === JOIN_REQUEST_STATUS.CHECKED_IN) {
    actions.push({ type: "mark_attended" });
    actions.push({ type: "mark_no_show" });
  }

  return actions;
}

/**
 * USER_ACTIONS_MAP - نقشه اقدامات کاربر
 * تعیین می‌کند کاربر در هر وضعیت چه اقداماتی می‌تواند انجام دهد
 */
export const USER_ACTIONS_MAP = {
  // PENDING - می‌تواند لغو کند
  [JOIN_REQUEST_STATUS.PENDING]: ["cancel"],

  // PAYMENT_RESERVED - می‌تواند لغو کند
  [JOIN_REQUEST_STATUS.PAYMENT_RESERVED]: ["cancel"],

  // WAITLISTED - می‌تواند لغو کند
  [JOIN_REQUEST_STATUS.WAITLISTED]: ["cancel"],

  // APPROVED - اقدامی ندارد (منتظر تایید نهایی یا پرداخت)
  [JOIN_REQUEST_STATUS.APPROVED]: [],

  // PAYMENT_PENDING - باید پرداخت کند
  [JOIN_REQUEST_STATUS.PAYMENT_PENDING]: ["pay"],

  // PAYMENT_FAILED - می‌تواند دوباره تلاش کند
  [JOIN_REQUEST_STATUS.PAYMENT_FAILED]: ["retry_payment"],

  // PAID, CONFIRMED - اقدام خاصی ندارد
  [JOIN_REQUEST_STATUS.PAID]: [],
  [JOIN_REQUEST_STATUS.CONFIRMED]: [],

  // CHECKED_IN, ATTENDED - اقدام خاصی ندارد
  [JOIN_REQUEST_STATUS.CHECKED_IN]: [],
  [JOIN_REQUEST_STATUS.ATTENDED]: [],

  // COMPLETED - می‌تواند نظر بگذارد
  [JOIN_REQUEST_STATUS.COMPLETED]: ["leave_review", "get_certificate"],

  // NO_SHOW - می‌تواند نظر بگذارد
  [JOIN_REQUEST_STATUS.NO_SHOW]: ["leave_review"],

  // وضعیت‌های نهایی - اقدامی ندارد
  [JOIN_REQUEST_STATUS.REJECTED]: [],
  [JOIN_REQUEST_STATUS.CANCELED]: [],
  [JOIN_REQUEST_STATUS.REVOKED]: [],
  [JOIN_REQUEST_STATUS.REFUNDED]: [],
  [JOIN_REQUEST_STATUS.EXPIRED]: [],
};

/**
 * دریافت اقدامات مجاز کاربر برای یک وضعیت
 */
export function getUserActionsForStatus(status) {
  return USER_ACTIONS_MAP[status] || [];
}
