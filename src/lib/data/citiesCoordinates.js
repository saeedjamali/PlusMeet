/**
 * مختصات جغرافیایی شهرها و استان‌های ایران
 * برای استفاده در MapPicker و سایر کامپوننت‌ها
 */

import provincesData from './iranProvincesComplete.json';

// تبدیل داده‌ها به فرمت ساده برای دسترسی سریع
const citiesCoordinatesMap = {};
provincesData.forEach(province => {
  // اضافه کردن مختصات استان
  citiesCoordinatesMap[province.province_name] = {
    lat: province.latitude,
    lng: province.longitude
  };
  
  // اضافه کردن مختصات شهرها
  province.cities.forEach(city => {
    citiesCoordinatesMap[city.city_name] = {
      lat: city.latitude,
      lng: city.longitude
    };
  });
});

// Export برای سازگاری با کدهای موجود
export const citiesCoordinates = citiesCoordinatesMap;

// توابع کمکی جدید

/**
 * دریافت اطلاعات کامل استان (شامل کد، نام، مختصات و لیست شهرها)
 * @param {string} provinceCodeOrName - کد یا نام استان
 * @returns {object|null} اطلاعات استان
 */
export const getProvinceData = (provinceCodeOrName) => {
  return provincesData.find(p => 
    p.province_code === provinceCodeOrName || 
    p.province_name === provinceCodeOrName
  );
};

/**
 * دریافت اطلاعات کامل شهر (شامل کد، نام و مختصات)
 * @param {string} cityCodeOrName - کد یا نام شهر
 * @returns {object|null} اطلاعات شهر
 */
export const getCityData = (cityCodeOrName) => {
  for (const province of provincesData) {
    const city = province.cities.find(c => 
      c.city_code === cityCodeOrName || 
      c.city_name === cityCodeOrName
    );
    if (city) {
      return {
        ...city,
        province_code: province.province_code,
        province_name: province.province_name
      };
    }
  }
  return null;
};

/**
 * دریافت مختصات جغرافیایی شهر یا استان
 * @param {string} name - نام شهر یا استان
 * @returns {{lat: number, lng: number}|null}
 */
export const getCoordinates = (name) => {
  return citiesCoordinatesMap[name] || null;
};

/**
 * جستجوی شهر یا استان بر اساس مختصات (نزدیک‌ترین موقعیت)
 * @param {number} lat - عرض جغرافیایی
 * @param {number} lng - طول جغرافیایی
 * @returns {object|null}
 */
export const findNearestLocation = (lat, lng) => {
  let nearest = null;
  let minDistance = Infinity;
  
  provincesData.forEach(province => {
    // بررسی استان
    const provinceDist = calculateDistance(lat, lng, province.latitude, province.longitude);
    if (provinceDist < minDistance) {
      minDistance = provinceDist;
      nearest = {
        type: 'province',
        province_code: province.province_code,
        province_name: province.province_name,
        latitude: province.latitude,
        longitude: province.longitude,
        distance: provinceDist
      };
    }
    
    // بررسی شهرها
    province.cities.forEach(city => {
      const cityDist = calculateDistance(lat, lng, city.latitude, city.longitude);
      if (cityDist < minDistance) {
        minDistance = cityDist;
        nearest = {
          type: 'city',
          province_code: province.province_code,
          province_name: province.province_name,
          city_code: city.city_code,
          city_name: city.city_name,
          latitude: city.latitude,
          longitude: city.longitude,
          distance: cityDist
        };
      }
    });
  });
  
  return nearest;
};

/**
 * محاسبه فاصله بین دو نقطه جغرافیایی (فرمول Haversine)
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} فاصله به کیلومتر
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // شعاع زمین به کیلومتر
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// Export همه داده‌های استان‌ها
export { provincesData };

export default citiesCoordinates;
