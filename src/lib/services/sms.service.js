/**
 * SMS Service - SMS.ir Integration
 * سرویس ارسال پیامک با استفاده از SMS.ir
 */

const SMS_IR_API_KEY = process.env.SMS_IR_API_KEY;
const SMS_IR_LINE_NUMBER = process.env.SMS_IR_LINE_NUMBER;
const SMS_IR_BASE_URL = "https://api.sms.ir/v1";

/**
 * ارسال کد OTP
 * @param {string} phoneNumber - شماره موبایل (09xxxxxxxxx)
 * @param {string} code - کد 5 رقمی
 */
export async function sendOTP(phoneNumber, code) {
  try {
    // حذف صفر اول و اضافه کردن 98
    const mobile = phoneNumber.startsWith("0")
      ? "98" + phoneNumber.substring(1)
      : phoneNumber;

    const response = await fetch(`${SMS_IR_BASE_URL}/send/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": SMS_IR_API_KEY,
      },
      body: JSON.stringify({
        mobile,
        templateId: process.env.SMS_IR_TEMPLATE_ID, // شناسه الگو در پنل SMS.ir
        parameters: [
          {
            name: "CODE",
            value: code,
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.status === 1) {
      return {
        success: true,
        messageId: data.data.messageId,
      };
    } else {
      throw new Error(data.message || "خطا در ارسال پیامک");
    }
  } catch (error) {
    console.error("SMS send error:", error);
    throw new Error("خطا در ارسال پیامک");
  }
}

/**
 * ارسال پیامک ساده
 * @param {string} phoneNumber - شماره موبایل
 * @param {string} message - متن پیام
 */
export async function sendSMS(phoneNumber, message) {
  try {
    const mobile = phoneNumber.startsWith("0")
      ? "98" + phoneNumber.substring(1)
      : phoneNumber;

    const response = await fetch(`${SMS_IR_BASE_URL}/send/bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": SMS_IR_API_KEY,
      },
      body: JSON.stringify({
        lineNumber: SMS_IR_LINE_NUMBER,
        messageText: message,
        mobiles: [mobile],
      }),
    });

    const data = await response.json();

    if (data.status === 1) {
      return {
        success: true,
        messageId: data.data.messageIds[0],
      };
    } else {
      throw new Error(data.message || "خطا در ارسال پیامک");
    }
  } catch (error) {
    console.error("SMS send error:", error);
    throw new Error("خطا در ارسال پیامک");
  }
}

/**
 * تولید کد OTP تصادفی 5 رقمی
 */
export function generateOTP() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

/**
 * ذخیره OTP در دیتابیس/کش
 * @param {string} phoneNumber
 * @param {string} code
 * @param {number} expiresIn - مدت زمان اعتبار (دقیقه)
 */
export async function storeOTP(phoneNumber, code, expiresIn = 2) {
  // می‌توان از Redis استفاده کرد برای کش موقت
  // یا از مدل MongoDB
  const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);

  // ذخیره در دیتابیس موقت یا کش
  // برای ساده‌سازی از یک Map استفاده می‌کنیم
  // در production باید از Redis استفاده شود
  if (!global.otpStore) {
    global.otpStore = new Map();
  }

  global.otpStore.set(phoneNumber, {
    code,
    expiresAt,
    attempts: 0,
  });

  // پاکسازی خودکار بعد از انقضا
  setTimeout(() => {
    global.otpStore.delete(phoneNumber);
  }, expiresIn * 60 * 1000);

  return true;
}

/**
 * تایید OTP
 * @param {string} phoneNumber
 * @param {string} code
 */
export async function verifyOTP(phoneNumber, code) {
  if (!global.otpStore) {
    return { success: false, error: "هیچ کد تاییدی برای این شماره ارسال نشده است" };
  }

  const otpData = global.otpStore.get(phoneNumber);

  if (!otpData) {
    return { success: false, error: "کد وارد شده منقضی شده یا وجود ندارد" };
  }

  // چک انقضا
  if (new Date() > otpData.expiresAt) {
    global.otpStore.delete(phoneNumber);
    return { success: false, error: "کد تایید منقضی شده است. لطفاً کد جدید دریافت کنید" };
  }

  // چک تعداد تلاش‌ها
  if (otpData.attempts >= 3) {
    global.otpStore.delete(phoneNumber);
    return { success: false, error: "تعداد تلاش‌های مجاز تمام شده است. لطفاً کد جدید دریافت کنید" };
  }

  // تایید کد
  if (otpData.code === code) {
    global.otpStore.delete(phoneNumber);
    return { success: true };
  } else {
    otpData.attempts += 1;
    const remainingAttempts = 3 - otpData.attempts;
    
    if (remainingAttempts > 0) {
      return { 
        success: false, 
        error: `کد وارد شده اشتباه است. ${remainingAttempts} تلاش دیگر باقی مانده` 
      };
    } else {
      global.otpStore.delete(phoneNumber);
      return { 
        success: false, 
        error: "کد وارد شده اشتباه است. تعداد تلاش‌های مجاز تمام شده است" 
      };
    }
  }
}

/**
 * بررسی محدودیت ارسال (Rate Limiting)
 * @param {string} phoneNumber
 */
export function checkRateLimit(phoneNumber) {
  if (!global.otpRateLimit) {
    global.otpRateLimit = new Map();
  }

  const now = Date.now();
  const lastSent = global.otpRateLimit.get(phoneNumber);

  // محدودیت: حداکثر یک بار در 60 ثانیه
  if (lastSent && now - lastSent < 60000) {
    const remainingSeconds = Math.ceil((60000 - (now - lastSent)) / 1000);
    return {
      allowed: false,
      remainingSeconds,
    };
  }

  global.otpRateLimit.set(phoneNumber, now);

  // پاکسازی بعد از 5 دقیقه
  setTimeout(() => {
    global.otpRateLimit.delete(phoneNumber);
  }, 5 * 60 * 1000);

  return { allowed: true };
}




