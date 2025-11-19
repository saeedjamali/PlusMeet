'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './eventCreate.module.css';
import { getCoordinates } from '@/lib/data/citiesCoordinates';

// Custom icon برای marker (ایکن سایت)
let customIcon = null;
if (typeof window !== 'undefined') {
  const L = require('leaflet');
  customIcon = new L.Icon({
    iconUrl: '/icons/light-mode/Verical/logo-07-01.png', // ایکن سایت
    iconRetinaUrl: '/icons/light-mode/Verical/logo-07-01.png',
    iconSize: [35, 45],
    iconAnchor: [17.5, 45],
    popupAnchor: [0, -45],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
  });
}

// Component برای تغییر مرکز نقشه
function ChangeView({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

function LocationMarker({ position, setPosition, onAddressSelect, readOnly }) {
  const [isLoading, setIsLoading] = useState(false);
  
  const map = useMapEvents({
    async click(e) {
      // اگر readOnly است، کلیک را ignore کن
      if (readOnly) {
        return;
      }
      
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      console.log('📍 موقعیت انتخاب شد:', newPos);
      
      // Reverse Geocoding با Nominatim (OpenStreetMap)
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&accept-language=fa`
        );
        const data = await response.json();
        
        if (data && data.display_name) {
          const address = data.display_name;
          console.log('📮 آدرس دریافت شده:', address);
          if (onAddressSelect) {
            onAddressSelect(address);
          }
        }
      } catch (error) {
        console.error('❌ خطا در دریافت آدرس:', error);
      } finally {
        setIsLoading(false);
      }
    },
  });

  return position ? (
    <Marker 
      position={position} 
      icon={customIcon || undefined}
    />
  ) : null;
}

export default function MapPicker({ 
  value, 
  onChange, 
  disabled,
  selectedProvince,
  selectedCity,
  onAddressSelect,
  readOnly = false,
  initialZoom
}) {
  const [position, setPosition] = useState(value || [35.6892, 51.3890]); // Tehran as default
  const [mapCenter, setMapCenter] = useState(value || [35.6892, 51.3890]);
  // zoom بالاتر برای readOnly، پایین‌تر برای edit
  const defaultZoom = readOnly ? 14 : 6;
  const [mapZoom, setMapZoom] = useState(initialZoom || defaultZoom);
  const [mounted, setMounted] = useState(false);
  const previousCityRef = useRef(null);
  const previousProvinceRef = useRef(null);
  const isUpdatingFromCityRef = useRef(false); // برای جلوگیری از loop
  const mapKeyRef = useRef(`map-${Date.now()}`); // کلید یکتا برای map (فقط یکبار)

  useEffect(() => {
    setMounted(true);
    console.log('🗺️ MapPicker mounted');
    return () => {
      console.log('🗺️ MapPicker unmounted');
    };
  }, []);

  // وقتی استان انتخاب میشه (و شهر خالی است)، نقشه رو ببر روی اون استان
  useEffect(() => {
    console.log('🔍 useEffect triggered - selectedProvince:', selectedProvince);
    console.log('🔍 selectedCity:', selectedCity);
    console.log('🔍 previousProvinceRef.current:', previousProvinceRef.current);
    
    // اگر شهر انتخاب شده، استان رو ignore کن
    if (selectedCity) {
      return;
    }
    
    if (selectedProvince && selectedProvince !== previousProvinceRef.current) {
      console.log('✅ استان جدید انتخاب شد:', selectedProvince);
      previousProvinceRef.current = selectedProvince;
      isUpdatingFromCityRef.current = true;
      
      const coords = getCoordinates(selectedProvince);
      console.log('📍 مختصات استان دریافت شده:', coords);
      
      if (coords && coords.lat && coords.lng) {
        const coordsArray = [coords.lat, coords.lng];
        console.log(`🗺️ نقشه به استان ${selectedProvince} منتقل می‌شود:`, coordsArray);
        
        // تغییر مرکز نقشه با zoom پایین‌تر برای استان
        setMapCenter(coordsArray);
        setMapZoom(9); // zoom متوسط برای استان
        
        // تغییر موقعیت marker
        setPosition(coordsArray);
        if (onChange) {
          onChange(coordsArray);
        }
        
        // Reset flag
        setTimeout(() => {
          isUpdatingFromCityRef.current = false;
        }, 100);
      } else {
        console.error('❌ مختصات برای استان پیدا نشد:', selectedProvince);
      }
    }
  }, [selectedProvince, selectedCity, onChange]);

  // وقتی شهر انتخاب میشه، نقشه و marker رو ببر روی اون شهر
  useEffect(() => {
    console.log('🔍 useEffect triggered - selectedCity:', selectedCity);
    console.log('🔍 previousCityRef.current:', previousCityRef.current);
    
    if (selectedCity && selectedCity !== previousCityRef.current) {
      console.log('✅ شهر جدید انتخاب شد:', selectedCity);
      previousCityRef.current = selectedCity;
      isUpdatingFromCityRef.current = true; // Flag برای جلوگیری از loop
      
      const coords = getCoordinates(selectedCity);
      console.log('📍 مختصات دریافت شده:', coords);
      
      if (coords && coords.lat && coords.lng) {
        const coordsArray = [coords.lat, coords.lng];
        console.log(`🗺️ نقشه و marker به ${selectedCity} منتقل می‌شود:`, coordsArray);
        
        // تغییر مرکز نقشه با zoom بالاتر برای شهر
        setMapCenter(coordsArray);
        setMapZoom(13); // zoom بالا برای شهر
        
        // تغییر موقعیت marker (همیشه به مرکز شهر برود)
        setPosition(coordsArray);
        if (onChange) {
          onChange(coordsArray);
        }
        
        // Reset flag بعد از یک تاخیر کوچک
        setTimeout(() => {
          isUpdatingFromCityRef.current = false;
        }, 100);
      } else {
        console.error('❌ مختصات برای شهر پیدا نشد:', selectedCity);
      }
    }
  }, [selectedCity, onChange]);

  // وقتی value از parent تغییر می‌کند (فقط در حالت edit یا لود اولیه)
  useEffect(() => {
    // اگر در حال به‌روزرسانی از طریق انتخاب شهر هستیم، ignore کن
    if (isUpdatingFromCityRef.current) {
      return;
    }
    
    if (value && Array.isArray(value) && value.length === 2) {
      const lat = parseFloat(value[0]);
      const lng = parseFloat(value[1]);
      
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        // فقط اگر value واقعاً متفاوت باشد
        if (Math.abs(position[0] - lat) > 0.0001 || Math.abs(position[1] - lng) > 0.0001) {
          console.log('📍 Value از parent تغییر کرد:', [lat, lng]);
          setPosition([lat, lng]);
          setMapCenter([lat, lng]);
          // اگر readOnly است، zoom بیشتری تنظیم کن
          if (readOnly && !initialZoom) {
            setMapZoom(14);
          }
        }
      }
    }
  }, [value, readOnly, initialZoom]);

  const handlePositionChange = (newPosition) => {
    console.log('🎯 Position تغییر کرد:', newPosition);
    setPosition(newPosition);
    if (onChange) {
      onChange(newPosition);
    }
  };

  if (!mounted) {
    return (
      <div className={styles.mapPlaceholder}>
        <div className={styles.spinner}></div>
        <p>در حال بارگذاری نقشه...</p>
      </div>
    );
  }

  return (
    <div className={styles.mapWrapper}>
      {!readOnly && (
        <div className={styles.mapHint}>
          💡 روی نقشه کلیک کنید تا موقعیت دقیق و آدرس را دریافت کنید
        </div>
      )}
      
      <MapContainer
        key={mapKeyRef.current} // کلید یکتا و ثابت برای جلوگیری از re-initialization
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '400px', width: '100%', borderRadius: '8px' }}
        scrollWheelZoom={!disabled && !readOnly}
        dragging={!readOnly}
        doubleClickZoom={!readOnly}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={mapCenter} zoom={mapZoom} />
        <LocationMarker 
          position={position} 
          setPosition={handlePositionChange}
          onAddressSelect={onAddressSelect}
          readOnly={readOnly}
        />
      </MapContainer>
      
      {!readOnly && (
        <div className={styles.mapInfo}>
          <span className={styles.mapInfoLabel}>📍 موقعیت انتخاب شده:</span>
          <span className={styles.mapInfoValue}>
            عرض: {position[0].toFixed(6)} | طول: {position[1].toFixed(6)}
          </span>
        </div>
      )}
    </div>
  );
}

