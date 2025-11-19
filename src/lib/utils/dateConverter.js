/**
 * تبدیل اعداد فارسی به انگلیسی
 */
function convertPersianToEnglishNumbers(str) {
  if (!str || typeof str !== 'string') return str;
  
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  
  let result = str;
  
  // تبدیل اعداد فارسی
  persianNumbers.forEach((persian, index) => {
    result = result.replace(new RegExp(persian, 'g'), index.toString());
  });
  
  // تبدیل اعداد عربی
  arabicNumbers.forEach((arabic, index) => {
    result = result.replace(new RegExp(arabic, 'g'), index.toString());
  });
  
  return result;
}

/**
 * تبدیل تاریخ شمسی به میلادی (الگوریتم ساده و تست شده)
 * @param {number} jy - سال شمسی
 * @param {number} jm - ماه شمسی (1-12)
 * @param {number} jd - روز شمسی (1-31)
 * @returns {object} - {year, month, day}
 */
function jalaliToGregorian(jy, jm, jd) {
  // محاسبه تعداد روزهای گذشته از ابتدای سال جلالی
  let totalDays;
  if (jm <= 6) {
    // 6 ماه اول: هر ماه 31 روز
    totalDays = (jm - 1) * 31 + jd;
  } else {
    // 6 ماه دوم: هر ماه 30 روز
    totalDays = 6 * 31 + (jm - 7) * 30 + jd;
  }
  
  // تاریخ آغاز سال جلالی در تقویم میلادی (معمولاً 21 مارس)
  // برای سادگی، از یک ثابت استفاده می‌کنیم
  const gregorianYear = jy + 621;
  
  // 21 مارس = روز 80 از سال میلادی (در سال‌های غیر کبیسه)
  // اگر سال میلادی کبیسه باشد، 21 مارس = روز 81
  const isLeapYear = (gregorianYear % 4 === 0 && gregorianYear % 100 !== 0) || (gregorianYear % 400 === 0);
  let marchDay = isLeapYear ? 81 : 80; // روز 21 مارس
  
  // محاسبه روز سال میلادی
  let dayOfYear = marchDay + totalDays - 1;
  
  // اگر از پایان سال گذشته، به سال بعد برویم
  const daysInYear = isLeapYear ? 366 : 365;
  let gy = gregorianYear;
  
  if (dayOfYear > daysInYear) {
    dayOfYear -= daysInYear;
    gy++;
  }
  
  // تبدیل روز سال به ماه و روز
  const isLeapNextYear = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
  const monthDays = [
    31, // ژانویه
    isLeapNextYear ? 29 : 28, // فوریه
    31, // مارس
    30, // آوریل
    31, // می
    30, // ژوئن
    31, // ژوئیه
    31, // اوت
    30, // سپتامبر
    31, // اکتبر
    30, // نوامبر
    31  // دسامبر
  ];
  
  let gm = 1;
  let gd = dayOfYear;
  
  for (let i = 0; i < 12; i++) {
    if (gd <= monthDays[i]) {
      gm = i + 1;
      break;
    }
    gd -= monthDays[i];
  }
  
  return { year: gy, month: gm, day: gd };
}

/**
 * تبدیل رشته تاریخ فارسی به Date object
 * فرمت‌های پشتیبانی شده:
 * - "۱۴۰۴-۰۸-۲۵ ۰۳:۰۰:۰۰"
 * - "۱۴۰۴-۰۸-۲۵"
 * - "1404-08-25 03:00:00"
 * - "1404-08-25"
 */
function parsePersianDate(dateString) {
  if (!dateString) return null;
  
  // اگر قبلاً Date object است
  if (dateString instanceof Date) {
    return dateString;
  }
  
  // اگر timestamp عددی است
  if (typeof dateString === 'number') {
    return new Date(dateString);
  }
  
  // تبدیل اعداد فارسی به انگلیسی
  const normalizedDate = convertPersianToEnglishNumbers(dateString);
  
  // پارس تاریخ و زمان
  const dateTimeMatch = normalizedDate.match(/(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?/);
  
  if (!dateTimeMatch) {
    // اگر فرمت تاریخ نامعتبر است، سعی کن به عنوان ISO date پارس کنی
    const fallbackDate = new Date(normalizedDate);
    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate;
    }
    console.warn(`Invalid date format: ${dateString}`);
    return null;
  }
  
  const [_, jy, jm, jd, hour = '0', minute = '0', second = '0'] = dateTimeMatch;
  
  // تبدیل به میلادی
  const { year, month, day } = jalaliToGregorian(
    parseInt(jy),
    parseInt(jm),
    parseInt(jd)
  );
  
  // ساخت Date object
  const date = new Date(
    year,
    month - 1, // ماه در JavaScript از 0 شروع می‌شود
    day,
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );
  
  return date;
}

/**
 * تبدیل تمام فیلدهای تاریخ در یک object
 */
function convertDatesInObject(obj, dateFields = []) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const converted = { ...obj };
  
  dateFields.forEach(field => {
    const fieldParts = field.split('.');
    let current = converted;
    
    // پیمایش تا آخرین بخش
    for (let i = 0; i < fieldParts.length - 1; i++) {
      if (current[fieldParts[i]]) {
        current = current[fieldParts[i]];
      } else {
        return; // فیلد وجود ندارد
      }
    }
    
    // تبدیل مقدار نهایی
    const lastPart = fieldParts[fieldParts.length - 1];
    if (current[lastPart]) {
      const parsedDate = parsePersianDate(current[lastPart]);
      if (parsedDate) {
        current[lastPart] = parsedDate;
      }
    }
  });
  
  return converted;
}

module.exports = {
  convertPersianToEnglishNumbers,
  jalaliToGregorian,
  parsePersianDate,
  convertDatesInObject,
};












