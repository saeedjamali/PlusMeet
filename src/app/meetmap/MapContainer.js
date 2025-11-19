"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function MapContainer({ events, center, zoom, onMarkerClick, selectedEvent }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // ایجاد نقشه فقط یک بار
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

      // اضافه کردن لایه OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      // پاکسازی نقشه هنگام unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // بروزرسانی مرکز و زوم
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  }, [center, zoom]);

  // بروزرسانی مارکرها
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // حذف مارکرهای قبلی
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // اضافه کردن مارکرهای جدید
    events.forEach((event) => {
      if (event.location?.coordinates && event.location.coordinates.length === 2) {
        const [lng, lat] = event.location.coordinates;
        
        // آیکون سفارشی برای رویداد انتخاب شده
        const isSelected = selectedEvent?._id === event._id;
        
        // استفاده از آیکن دسته‌بندی یا آیکن پیش‌فرض
        const categoryIcon = event.topicCategory?.icon || '📚';
        const categoryTitle = event.topicCategory?.title || 'دسته‌بندی نامشخص';
        
        // رنگ‌بندی بر اساس وضعیت، انتخاب، یا دسته‌بندی
        const markerColor = (event.status === 'finished' || event.status === 'expired')
          ? '#94a3b8'  // خاکستری برای رویدادهای پایان یافته
          : isSelected 
          ? '#ef4444' 
          : event.topicCategory?.color || '#10b981';
        
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="marker-container" style="
              background: ${markerColor};
              width: 40px;
              height: 40px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.3s ease;
            ">
              <span style="
                transform: rotate(45deg);
                font-size: 20px;
                filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
              ">${categoryIcon}</span>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40],
        });

        // آماده‌سازی اطلاعات برای popup
        let dateStr = '';
        if (event.startDate) {
          try {
            const date = new Date(event.startDate);
            dateStr = new Intl.DateTimeFormat('fa-IR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }).format(date);
          } catch (e) {
            dateStr = '';
          }
        }
        
        const marker = L.marker([lat, lng], { icon })
          .addTo(mapInstanceRef.current)
          .bindTooltip(`
            <div style="
              direction: rtl; 
              font-family: 'IRANSansXFaNum', Vazir, Tahoma, sans-serif;
              font-size: 0.875rem;
              font-weight: 600;
              color: #0D4C57;
              padding: 2px 4px;
              white-space: nowrap;
            ">
              ${categoryIcon} ${categoryTitle}
            </div>
          `, {
            permanent: false,
            direction: 'top',
            offset: [0, -45],
            className: 'custom-tooltip'
          })
          .bindPopup(`
            <div style="min-width: 250px; max-width: 300px; direction: rtl; font-family: Vazir, Tahoma, sans-serif;">
              ${(event.status === 'finished' || event.status === 'expired') ? `
                <div style="
                  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
                  color: white;
                  padding: 0.4rem 0.75rem;
                  border-radius: 6px;
                  font-size: 0.75rem;
                  font-weight: bold;
                  text-align: center;
                  margin-bottom: 8px;
                  box-shadow: 0 2px 6px rgba(100, 116, 139, 0.3);
                ">
                  ${event.status === 'finished' ? '✅ رویداد پایان یافته' : '⏰ رویداد منقضی شده'}
                </div>
              ` : ''}
              <h3 style="margin: 0 0 10px 0; color: #0D4C57; font-size: 1.05rem; font-weight: 700; line-height: 1.4;">
                ${event.title}
              </h3>
              
              <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px;">
                ${dateStr ? `
                  <div style="display: flex; align-items: center; gap: 6px; color: #6b7280; font-size: 0.8125rem;">
                    <span>📅</span>
                    <span>${dateStr}</span>
                  </div>
                ` : ''}
                
                ${event.location?.city ? `
                  <div style="display: flex; align-items: center; gap: 6px; color: #6b7280; font-size: 0.8125rem;">
                    <span>📍</span>
                    <span>${event.location.city}</span>
                  </div>
                ` : ''}
                
                ${event.formatMode?.title ? `
                  <div style="display: flex; align-items: center; gap: 6px; color: #6b7280; font-size: 0.8125rem;">
                    <span>${event.formatMode.icon || '🎯'}</span>
                    <span>${event.formatMode.title}</span>
                  </div>
                ` : ''}
                
                ${event.topicCategory?.title ? `
                  <div style="display: flex; align-items: center; gap: 6px; color: #6b7280; font-size: 0.8125rem;">
                    <span>${event.topicCategory.icon || '📚'}</span>
                    <span>${event.topicCategory.title}</span>
                  </div>
                ` : ''}
                
                ${event.capacity ? `
                  <div style="display: flex; align-items: center; gap: 6px; color: #6b7280; font-size: 0.8125rem;">
                    <span>👥</span>
                    <span>ظرفیت: ${event.capacity}</span>
                  </div>
                ` : ''}
              </div>
              
              <div style="padding: 8px; background: #f0fdf4; border-radius: 8px; margin-bottom: 10px; text-align: center;">
                ${event.ticket?.type === 'free' ? `
                  <span style="color: #10b981; font-weight: 700; font-size: 0.9375rem;">🆓 رایگان</span>
                ` : event.ticket?.price ? `
                  <span style="color: #10b981; font-weight: 700; font-size: 0.9375rem;">💰 ${event.ticket.price.toLocaleString('fa-IR')} تومان</span>
                ` : `
                  <span style="color: #6b7280; font-weight: 600; font-size: 0.875rem;">📞 تماس بگیرید</span>
                `}
              </div>
              
              <button
                onclick="window.location.href='/events/${event._id}'"
                style="
                  padding: 10px 16px;
                  background: linear-gradient(135deg, #0D4C57 0%, #0a3d45 100%);
                  color: white;
                  border: none;
                  border-radius: 8px;
                  cursor: pointer;
                  width: 100%;
                  font-size: 0.875rem;
                  font-family: inherit;
                  font-weight: 600;
                  transition: all 0.3s ease;
                "
                onmouseover="this.style.background='linear-gradient(135deg, #0a3d45 0%, #083339 100%)'"
                onmouseout="this.style.background='linear-gradient(135deg, #0D4C57 0%, #0a3d45 100%)'"
              >
                مشاهده جزئیات
              </button>
            </div>
          `);

        marker.on('click', () => {
          if (onMarkerClick) {
            onMarkerClick(event);
          }
        });

        markersRef.current.push(marker);
      }
    });
  }, [events, selectedEvent, onMarkerClick]);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    />
  );
}










