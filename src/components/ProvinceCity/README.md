# ProvinceCity Component

کامپوننت انتخاب استان و شهر ایران با پشتیبانی از کد و مختصات جغرافیایی

## ویژگی‌ها

- ✅ لیست کامل 31 استان و بیش از 200 شهر ایران
- ✅ کد استان و شهر (برای ذخیره در دیتابیس و فیلتر)
- ✅ مختصات جغرافیایی (latitude/longitude) برای نمایش روی نقشه
- ✅ به‌روز شدن خودکار لیست شهرها بر اساس استان انتخابی

## استفاده پایه (با نام)

```jsx
import ProvinceCity from '@/components/ProvinceCity';

function MyComponent() {
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');

  return (
    <ProvinceCity
      province={province}
      city={city}
      onProvinceChange={setProvince}
      onCityChange={setCity}
      provinceRequired
      cityRequired
    />
  );
}
```

## استفاده با کد (برای دیتابیس و فیلتر)

```jsx
import ProvinceCity from '@/components/ProvinceCity';

function EventForm() {
  const [provinceCode, setProvinceCode] = useState('');
  const [cityCode, setCityCode] = useState('');

  return (
    <ProvinceCity
      province={provinceCode}
      city={cityCode}
      onProvinceChange={setProvinceCode}
      onCityChange={setCityCode}
      returnCodes={true}  // برگرداندن کد به جای نام
      provinceRequired
      cityRequired
    />
  );
}
```

## استفاده با داده کامل (شامل مختصات)

```jsx
import ProvinceCity from '@/components/ProvinceCity';

function EventForm() {
  const [provinceData, setProvinceData] = useState(null);
  const [cityData, setCityData] = useState(null);

  const handleProvinceChange = (data) => {
    setProvinceData(data);
    // data شامل: { province_code, province_name, latitude, longitude, cities }
  };

  const handleCityChange = (data) => {
    setCityData(data);
    // data شامل: { city_code, city_name, latitude, longitude }
  };

  return (
    <ProvinceCity
      province={provinceData?.province_name}
      city={cityData?.city_name}
      onProvinceChange={handleProvinceChange}
      onCityChange={handleCityChange}
      returnData={true}  // برگرداندن object کامل
      provinceRequired
      cityRequired
    />
  );
}
```

## Props

| Prop | Type | Default | توضیحات |
|------|------|---------|---------|
| `province` | `string` | `''` | مقدار استان انتخاب شده |
| `city` | `string` | `''` | مقدار شهر انتخاب شده |
| `onProvinceChange` | `function` | - | تابع callback برای تغییر استان |
| `onCityChange` | `function` | - | تابع callback برای تغییر شهر |
| `provinceRequired` | `boolean` | `false` | استان اجباری است؟ |
| `cityRequired` | `boolean` | `false` | شهر اجباری است؟ |
| `disabled` | `boolean` | `false` | غیرفعال کردن کامپوننت |
| `showLabels` | `boolean` | `true` | نمایش برچسب‌ها |
| `returnCodes` | `boolean` | `false` | برگرداندن کد به جای نام |
| `returnData` | `boolean` | `false` | برگرداندن object کامل با مختصات |

## ساختار داده

### استان (Province)
```json
{
  "province_code": "01",
  "province_name": "تهران",
  "latitude": 35.6892,
  "longitude": 51.3890,
  "cities": [...]
}
```

### شهر (City)
```json
{
  "city_code": "0101",
  "city_name": "تهران",
  "latitude": 35.6892,
  "longitude": 51.3890
}
```

## استفاده در فیلتر رویدادها

```jsx
// در صفحه لیست رویدادها
const [filters, setFilters] = useState({
  provinceCode: '',
  cityCode: ''
});

<ProvinceCity
  province={filters.provinceCode}
  city={filters.cityCode}
  onProvinceChange={(code) => setFilters({...filters, provinceCode: code, cityCode: ''})}
  onCityChange={(code) => setFilters({...filters, cityCode: code})}
  returnCodes={true}
/>

// در API
const query = {};
if (filters.provinceCode) {
  query['location.province_code'] = filters.provinceCode;
}
if (filters.cityCode) {
  query['location.city_code'] = filters.cityCode;
}
const events = await Event.find(query);
```

## ذخیره در Event Model

```javascript
// در Event.model.js
location: {
  province_code: String,
  province_name: String,
  city_code: String,
  city_name: String,
  latitude: Number,
  longitude: Number
}
```
