/**
 * ZarinPal Payment Gateway Service
 * سرویس درگاه پرداخت زرین‌پال
 * 
 * مستندات: https://docs.zarinpal.com/paymentGateway/
 */

// ⚠️ این مقادیر باید در .env تنظیم شوند
const ZARINPAL_MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID || 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX';
const ZARINPAL_CALLBACK_URL = process.env.ZARINPAL_CALLBACK_URL || 'http://localhost:3000/api/payment/verify';
const ZARINPAL_SANDBOX = process.env.ZARINPAL_SANDBOX === 'true'; // برای تست

// URLs
const ZARINPAL_API_URL = ZARINPAL_SANDBOX
  ? 'https://sandbox.zarinpal.com/pg/v4/payment'
  : 'https://api.zarinpal.com/pg/v4/payment';

const ZARINPAL_PAYMENT_URL = ZARINPAL_SANDBOX
  ? 'https://sandbox.zarinpal.com/pg/StartPay'
  : 'https://www.zarinpal.com/pg/StartPay';

/**
 * درخواست پرداخت جدید
 * @param {Object} params - پارامترهای پرداخت
 * @param {number} params.amount - مبلغ به ریال (حداقل 1000 ریال)
 * @param {string} params.description - توضیحات (حداکثر 255 کاراکتر)
 * @param {string} params.mobile - شماره موبایل کاربر (اختیاری)
 * @param {string} params.email - ایمیل کاربر (اختیاری)
 * @param {string} params.callbackUrl - URL بازگشت (اختیاری)
 * @param {Object} params.metadata - اطلاعات اضافی (اختیاری)
 * @returns {Promise<Object>} - نتیجه درخواست
 */
export async function requestPayment(params) {
  try {
    const {
      amount,
      description,
      mobile = null,
      email = null,
      callbackUrl = ZARINPAL_CALLBACK_URL,
      metadata = {},
    } = params;

    // اعتبارسنجی
    if (!amount || amount < 1000) {
      throw new Error('مبلغ باید حداقل 1000 ریال باشد');
    }

    if (!description || description.length > 255) {
      throw new Error('توضیحات الزامی است و باید کمتر از 255 کاراکتر باشد');
    }

    // آماده‌سازی درخواست
    const requestBody = {
      merchant_id: ZARINPAL_MERCHANT_ID,
      amount: amount,
      description: description,
      callback_url: callbackUrl,
    };

    // اضافه کردن موبایل و ایمیل (اختیاری)
    if (mobile) {
      requestBody.mobile = mobile;
    }

    if (email) {
      requestBody.email = email;
    }

    // اضافه کردن metadata (اختیاری)
    if (Object.keys(metadata).length > 0) {
      requestBody.metadata = metadata;
    }

    console.log('🔷 ZarinPal Request:', {
      ...requestBody,
      merchant_id: ZARINPAL_MERCHANT_ID.substring(0, 8) + '...',
    });

    // ارسال درخواست به زرین‌پال
    const response = await fetch(`${ZARINPAL_API_URL}/request.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    console.log('🔷 ZarinPal Response:', data);

    // چک کردن پاسخ
    if (data.data && data.data.code === 100) {
      // موفق
      return {
        success: true,
        authority: data.data.authority,
        paymentUrl: `${ZARINPAL_PAYMENT_URL}/${data.data.authority}`,
        code: data.data.code,
        message: 'درخواست پرداخت با موفقیت ایجاد شد',
      };
    } else if (data.errors) {
      // خطا
      const errorCode = data.errors.code;
      const errorMessage = getErrorMessage(errorCode);
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    } else {
      throw new Error('پاسخ نامعتبر از درگاه پرداخت');
    }
  } catch (error) {
    console.error('❌ ZarinPal Request Error:', error);
    return {
      success: false,
      error: error.message || 'خطا در برقراری ارتباط با درگاه پرداخت',
    };
  }
}

/**
 * تایید پرداخت
 * @param {Object} params - پارامترهای تایید
 * @param {string} params.authority - کد authority دریافتی
 * @param {number} params.amount - مبلغ تراکنش (برای اعتبارسنجی)
 * @returns {Promise<Object>} - نتیجه تایید
 */
export async function verifyPayment(params) {
  try {
    const { authority, amount } = params;

    // اعتبارسنجی
    if (!authority) {
      throw new Error('کد authority الزامی است');
    }

    if (!amount || amount < 1000) {
      throw new Error('مبلغ نامعتبر است');
    }

    // آماده‌سازی درخواست
    const requestBody = {
      merchant_id: ZARINPAL_MERCHANT_ID,
      authority: authority,
      amount: amount,
    };

    console.log('✅ ZarinPal Verify Request:', {
      ...requestBody,
      merchant_id: ZARINPAL_MERCHANT_ID.substring(0, 8) + '...',
    });

    // ارسال درخواست تایید به زرین‌پال
    const response = await fetch(`${ZARINPAL_API_URL}/verify.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    console.log('✅ ZarinPal Verify Response:', data);

    // چک کردن پاسخ
    if (data.data && (data.data.code === 100 || data.data.code === 101)) {
      // موفق (100 = موفق، 101 = قبلاً verify شده)
      return {
        success: true,
        refId: data.data.ref_id,
        cardPan: data.data.card_pan,
        cardHash: data.data.card_hash,
        feeType: data.data.fee_type,
        fee: data.data.fee,
        code: data.data.code,
        message: data.data.code === 101 
          ? 'این تراکنش قبلاً تایید شده است' 
          : 'پرداخت با موفقیت تایید شد',
        alreadyVerified: data.data.code === 101,
      };
    } else if (data.errors) {
      // خطا
      const errorCode = data.errors.code;
      const errorMessage = getErrorMessage(errorCode);
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    } else {
      throw new Error('پاسخ نامعتبر از درگاه پرداخت');
    }
  } catch (error) {
    console.error('❌ ZarinPal Verify Error:', error);
    return {
      success: false,
      error: error.message || 'خطا در تایید پرداخت',
    };
  }
}

/**
 * استعلام تراکنش (اختیاری - برای چک کردن وضعیت)
 * @param {string} authority - کد authority
 * @returns {Promise<Object>} - اطلاعات تراکنش
 */
export async function inquiryPayment(authority) {
  try {
    if (!authority) {
      throw new Error('کد authority الزامی است');
    }

    const requestBody = {
      merchant_id: ZARINPAL_MERCHANT_ID,
      authority: authority,
    };

    const response = await fetch(`${ZARINPAL_API_URL}/inquiry.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('❌ ZarinPal Inquiry Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * لغو تراکنش (Unverified) - برای تراکنش‌های تایید نشده
 * @param {string} authority - کد authority
 * @returns {Promise<Object>}
 */
export async function unverifiedPayment(authority) {
  try {
    if (!authority) {
      throw new Error('کد authority الزامی است');
    }

    const requestBody = {
      merchant_id: ZARINPAL_MERCHANT_ID,
      authority: authority,
    };

    const response = await fetch(`${ZARINPAL_API_URL}/unVerified.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('❌ ZarinPal Unverified Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * دریافت پیام خطا بر اساس کد
 * @param {number} code - کد خطا
 * @returns {string} - پیام فارسی
 */
function getErrorMessage(code) {
  const errorMessages = {
    '-9': 'خطای اعتبار سنجی',
    '-10': 'ای پی و يا مرچنت كد پذيرنده صحيح نيست',
    '-11': 'مرچنت کد فعال نیست، پذیرنده مشکل خود را به امور مشتریان زرین‌پال ارجاع دهد',
    '-12': 'تلاش بیش از دفعات مجاز در یک بازه زمانی کوتاه',
    '-15': 'ترمینال شما به حالت تعلیق در آمده، با بخش امور مشتریان تماس بگیرید',
    '-16': 'سطح تایید پذیرنده پایین‌تر از سطح نقره‌ای است',
    '-17': 'محدودیت پذیرنده در سطح آبی',
    '-30': 'پذیرنده اجازه دسترسی به سرویس تسویه اشتراکی شناور را ندارد',
    '-31': 'حساب بانکی تسویه را به پنل اضافه کنید. مقادیر وارد شده برای تسهیم درست نیست',
    '-32': 'مبلغ وارد شده از مبلغ کل تراکنش بیشتر است',
    '-33': 'درصدهای وارد شده صحیح نیست',
    '-34': 'مبلغ از کل تراکنش بیشتر است',
    '-35': 'تعداد افراد دریافت کننده تسهیم بیش از حد مجاز است',
    '-36': 'حداقل مبلغ جهت تسهیم باید ۱۰,۰۰۰ ریال باشد',
    '-37': 'یکی از حساب‌های بانکی شما برای نوع ارز ارسالی شناسایی نشده است',
    '-38': 'خطا٬عدم تعریف صحیح شبا٬لطفا به امور مشتریان اطلاع دهید',
    '-39': 'خطایی رخ داده است به امور مشتریان اطلاع دهید',
    '-40': 'Invalid extra params, expire_in is not valid',
    '-50': 'مبلغ پرداخت شده با مقدار مبلغ در وریفای متفاوت است',
    '-51': 'پرداخت ناموفق',
    '-52': 'خطای غیر منتظره، با پشتیبانی زرین‌پال تماس بگیرید',
    '-53': 'پرداخت متعلق به این مرچنت نیست',
    '-54': 'اتوریتی نامعتبر است',
    '101': 'تراکنش وریفای شده است',
  };

  return errorMessages[code.toString()] || `خطای ناشناخته (کد: ${code})`;
}

/**
 * بررسی اینکه آیا در حال استفاده از sandbox هستیم
 */
export function isSandbox() {
  return ZARINPAL_SANDBOX;
}

/**
 * بررسی اینکه آیا تنظیمات زرین‌پال درست است
 */
export function isConfigured() {
  return ZARINPAL_MERCHANT_ID && ZARINPAL_MERCHANT_ID !== 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX';
}

/**
 * دریافت اطلاعات کانفیگ (برای دیباگ)
 */
export function getConfig() {
  return {
    merchantId: ZARINPAL_MERCHANT_ID ? ZARINPAL_MERCHANT_ID.substring(0, 8) + '...' : 'NOT_SET',
    callbackUrl: ZARINPAL_CALLBACK_URL,
    sandbox: ZARINPAL_SANDBOX,
    configured: isConfigured(),
  };
}




