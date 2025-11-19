# سیستم مدیریت استان‌ها و شهرهای ایران

## 📋 فایل‌ها

### 1. `iranProvincesComplete.json`
فایل اصلی حاوی اطلاعات کامل 31 استان و بیش از 200 شهر ایران

**ساختار:**
```json
[
  {
    "province_code": "01",
    "province_name": "تهران",
    "latitude": 35.6892,
    "longitude": 51.3890,
    "cities": [
      {
        "city_code": "0101",
        "city_name": "تهران",
        "latitude": 35.6892,
        "longitude": 51.3890
      }
    ]
  }
]
```

### 2. `citiesCoordinates.js`
توابع کمکی برای کار با داده‌های جغرافیایی

---

## 🎯 کاربردها

### 1️⃣ **فیلتر رویدادها در صفحه اصلی**

```javascript
// API: /api/events/search
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const provinceCode = searchParams.get('province');
  const cityCode = searchParams.get('city');
  
  const query = {};
  
  if (provinceCode) {
    query['location.province_code'] = provinceCode;
  }
  
  if (cityCode) {
    query['location.city_code'] = cityCode;
  }
  
  const events = await Event.find(query);
  return NextResponse.json({ events });
}
```

### 2️⃣ **ذخیره رویداد با اطلاعات کامل**

```javascript
import { getCityData } from '@/lib/data/citiesCoordinates';

// در Step2Details.js
const handleCityChange = (cityName) => {
  const cityData = getCityData(cityName);
  
  if (cityData) {
    handleChange({
      target: {
        name: 'location',
        value: {
          city: cityData.city_name,
          city_code: cityData.city_code,
          province: cityData.province_name,
          province_code: cityData.province_code,
          latitude: cityData.latitude,
          longitude: cityData.longitude
        }
      }
    });
  }
};
```

### 3️⃣ **کامپوننت فیلتر در صفحه اصلی**

```jsx
// در صفحه لیست رویدادها
import ProvinceCity from '@/components/ProvinceCity';

function EventsList() {
  const [filters, setFilters] = useState({
    provinceCode: '',
    cityCode: ''
  });

  const handleSearch = async () => {
    const params = new URLSearchParams();
    if (filters.provinceCode) params.set('province', filters.provinceCode);
    if (filters.cityCode) params.set('city', filters.cityCode);
    
    const response = await fetch(`/api/events/search?${params}`);
    const data = await response.json();
    setEvents(data.events);
  };

  return (
    <>
      <ProvinceCity
        province={filters.provinceCode}
        city={filters.cityCode}
        onProvinceChange={(code) => {
          setFilters({ provinceCode: code, cityCode: '' });
        }}
        onCityChange={(code) => {
          setFilters({ ...filters, cityCode: code });
        }}
        returnCodes={true}
      />
      <button onClick={handleSearch}>جستجو</button>
    </>
  );
}
```

### 4️⃣ **نمایش رویدادها روی نقشه**

```jsx
import { MapContainer, Marker, Popup } from 'react-leaflet';

function EventsMap({ events }) {
  return (
    <MapContainer center={[32.4279, 53.6880]} zoom={5}>
      {events.map(event => (
        event.location?.latitude && event.location?.longitude && (
          <Marker
            key={event._id}
            position={[event.location.latitude, event.location.longitude]}
          >
            <Popup>
              <h3>{event.title}</h3>
              <p>📍 {event.location.city}, {event.location.province}</p>
            </Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  );
}
```

### 5️⃣ **جستجوی رویدادهای نزدیک**

```javascript
import { findNearestLocation } from '@/lib/data/citiesCoordinates';

// پیدا کردن رویدادهای نزدیک به موقعیت فعلی کاربر
navigator.geolocation.getCurrentPosition(async (position) => {
  const { latitude, longitude } = position.coords;
  
  // پیدا کردن نزدیک‌ترین شهر
  const nearest = findNearestLocation(latitude, longitude);
  
  if (nearest.type === 'city') {
    // جستجوی رویدادها در این شهر
    const response = await fetch(
      `/api/events/search?city=${nearest.city_code}`
    );
    const data = await response.json();
    console.log(`${data.events.length} رویداد در ${nearest.city_name}`);
  }
});
```

---

## 🗄️ ساختار دیتابیس

### Event Model

```javascript
location: {
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [lng, lat]
    index: '2dsphere'
  },
  address: String,
  city: String,
  city_code: {
    type: String,
    index: true  // ✅ فیلتر سریع
  },
  province: String,
  province_code: {
    type: String,
    index: true  // ✅ فیلتر سریع
  },
  latitude: Number,
  longitude: Number,
  venue: String
}
```

### نمونه Document

```json
{
  "_id": "...",
  "title": "کارگاه برنامه‌نویسی Python",
  "location": {
    "type": "Point",
    "coordinates": [51.3890, 35.6892],
    "province": "تهران",
    "province_code": "01",
    "city": "تهران",
    "city_code": "0101",
    "latitude": 35.6892,
    "longitude": 51.3890,
    "address": "خیابان آزادی، ...",
    "venue": "دانشگاه تهران"
  }
}
```

---

## 🔍 Query Patterns

### جستجو بر اساس استان
```javascript
const events = await Event.find({
  'location.province_code': '01'
});
```

### جستجو بر اساس شهر
```javascript
const events = await Event.find({
  'location.city_code': '0101'
});
```

### جستجوی رویدادهای نزدیک (GeoSpatial)
```javascript
const events = await Event.find({
  'location.coordinates': {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [51.3890, 35.6892] // [lng, lat]
      },
      $maxDistance: 50000 // 50 کیلومتر
    }
  }
});
```

### آمار رویدادها بر اساس استان
```javascript
const stats = await Event.aggregate([
  {
    $group: {
      _id: '$location.province_code',
      province_name: { $first: '$location.province' },
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
]);
```

---

## 📊 مزایای این رویکرد

✅ **فیلتر سریع**: استفاده از کد به جای نام برای query های سریع‌تر  
✅ **یکتا بودن**: هر استان/شهر کد یکتای خود را دارد  
✅ **GeoSpatial**: پشتیبانی از جستجوهای مکانی MongoDB  
✅ **آماده برای مقیاس‌پذیری**: ساختار استاندارد برای توسعه آینده  
✅ **قابلیت نمایش روی نقشه**: مختصات دقیق برای همه موقعیت‌ها  
✅ **بهینه برای SEO**: URL های تمیز با کد استان/شهر  

---

## 🚀 مثال کامل: صفحه فیلتر رویدادها

```jsx
// pages/events/index.js
'use client';

import { useState, useEffect } from 'react';
import ProvinceCity from '@/components/ProvinceCity';
import EventCard from '@/components/EventCard';

export default function EventsPage() {
  const [filters, setFilters] = useState({
    provinceCode: '',
    cityCode: '',
    category: ''
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [filters]);

  const loadEvents = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    
    if (filters.provinceCode) {
      params.set('province', filters.provinceCode);
    }
    if (filters.cityCode) {
      params.set('city', filters.cityCode);
    }
    
    const response = await fetch(`/api/events/search?${params}`);
    const data = await response.json();
    setEvents(data.events);
    setLoading(false);
  };

  return (
    <div>
      <div className="filters">
        <ProvinceCity
          province={filters.provinceCode}
          city={filters.cityCode}
          onProvinceChange={(code) => {
            setFilters({ ...filters, provinceCode: code, cityCode: '' });
          }}
          onCityChange={(code) => {
            setFilters({ ...filters, cityCode: code });
          }}
          returnCodes={true}
        />
      </div>

      <div className="results">
        {loading ? (
          <p>در حال بارگذاری...</p>
        ) : events.length > 0 ? (
          events.map(event => (
            <EventCard key={event._id} event={event} />
          ))
        ) : (
          <p>رویدادی یافت نشد</p>
        )}
      </div>
    </div>
  );
}
```

---

## 📝 نکات مهم

1. **همیشه از کدها برای query استفاده کنید** (سریع‌تر و یکتا)
2. **نام‌ها را برای نمایش به کاربر نگه دارید** (خوانا و SEO-friendly)
3. **مختصات را برای نقشه و جستجوی GeoSpatial ذخیره کنید**
4. **Index های MongoDB را فراموش نکنید** (بهبود performance)

---

## 🔗 مستندات مرتبط

- [ProvinceCity Component](../../components/ProvinceCity/README.md)
- [Event Model](../models/Event.model.js)
- [Cities Coordinates Helper](./citiesCoordinates.js)



