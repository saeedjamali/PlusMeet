'use client';

import { useState, useEffect } from 'react';
import provincesData from '@/lib/data/iranProvincesComplete.json';
import styles from './ProvinceCity.module.css';

export default function ProvinceCity({ 
  province, 
  city, 
  onProvinceChange, 
  onCityChange,
  provinceRequired = false,
  cityRequired = false,
  disabled = false,
  showLabels = true,
  returnCodes = false, // اگر true باشد، کدها را برمی‌گرداند (برای ذخیره در دیتابیس)
  returnData = false, // اگر true باشد، object کامل با مختصات را برمی‌گرداند
}) {
  const [selectedProvince, setSelectedProvince] = useState(province || '');
  const [selectedCity, setSelectedCity] = useState(city || '');
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (province) {
      setSelectedProvince(province);
      loadCities(province);
    }
  }, [province]);

  useEffect(() => {
    setSelectedCity(city || '');
  }, [city]);

  const loadCities = (provinceIdentifier) => {
    const provinceObj = provincesData.find(p => 
      returnCodes 
        ? p.province_code === provinceIdentifier
        : p.province_name === provinceIdentifier
    );
    
    if (provinceObj) {
      setCities(provinceObj.cities);
    } else {
      setCities([]);
    }
  };

  const handleProvinceChange = (e) => {
    const value = e.target.value;
    setSelectedProvince(value);
    setSelectedCity(''); // Reset شهر انتخاب شده
    setCities([]);
    
    if (value) {
      loadCities(value);
      
      // اگر returnData فعال باشد، object کامل را برگردان
      if (returnData) {
        const provinceObj = provincesData.find(p => 
          returnCodes ? p.province_code === value : p.province_name === value
        );
        if (onProvinceChange) {
          onProvinceChange(provinceObj);
        }
      } else {
        if (onProvinceChange) {
          onProvinceChange(value);
        }
      }
    } else {
      if (onProvinceChange) {
        onProvinceChange(returnData ? null : '');
      }
    }
    
    // اگر استان تغییر کرد، شهر رو ریست کن
    if (onCityChange) {
      onCityChange(returnData ? null : '');
    }
  };

  const handleCityChange = (e) => {
    const value = e.target.value;
    setSelectedCity(value);
    
    // اگر returnData فعال باشد، object کامل شهر را برگردان
    if (returnData && value) {
      const cityObj = cities.find(c => 
        returnCodes ? c.city_code === value : c.city_name === value
      );
      if (onCityChange) {
        onCityChange(cityObj);
      }
    } else {
      if (onCityChange) {
        onCityChange(value);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formGroup}>
        {showLabels && (
          <label className={styles.label}>
            استان {provinceRequired && <span className={styles.required}>*</span>}
          </label>
        )}
        <select
          className={styles.select}
          value={selectedProvince}
          onChange={handleProvinceChange}
          required={provinceRequired}
          disabled={disabled}
        >
          <option value="">انتخاب استان...</option>
          {provincesData.map((prov) => (
            <option 
              key={prov.province_code} 
              value={returnCodes ? prov.province_code : prov.province_name}
            >
              {prov.province_name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        {showLabels && (
          <label className={styles.label}>
            شهر {cityRequired && <span className={styles.required}>*</span>}
          </label>
        )}
        <select
          className={styles.select}
          value={selectedCity}
          onChange={handleCityChange}
          required={cityRequired}
          disabled={disabled || !selectedProvince}
        >
          <option value="">
            {selectedProvince ? 'انتخاب شهر...' : 'ابتدا استان را انتخاب کنید'}
          </option>
          {cities.map((cityObj) => (
            <option 
              key={cityObj.city_code} 
              value={returnCodes ? cityObj.city_code : cityObj.city_name}
            >
              {cityObj.city_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

