"use client";

import { useState, useEffect } from "react";
import styles from "./EventMultiSelect.module.css";
import "./EventMultiSelectDark.css";

/**
 * کامپوننت انتخاب چند رویداد با قابلیت جستجو
 */
export default function EventMultiSelect({ selectedEventIds = [], onChange }) {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [allEventsSelected, setAllEventsSelected] = useState(false);

  // بارگذاری رویدادها
  useEffect(() => {
    fetchEvents();
  }, []);

  // فیلتر کردن رویدادها بر اساس جستجو
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = events.filter((event) =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents(events);
    }
  }, [searchTerm, events]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/events/approved-list", {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setEvents(data.events || []);
        setFilteredEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEvent = (eventId) => {
    const newSelected = selectedEventIds.includes(eventId)
      ? selectedEventIds.filter((id) => id !== eventId)
      : [...selectedEventIds, eventId];
    onChange(newSelected);
    setAllEventsSelected(false);
  };

  const handleSelectAll = () => {
    if (allEventsSelected) {
      // حذف همه
      onChange([]);
      setAllEventsSelected(false);
    } else {
      // انتخاب همه (فقط رویدادهای فیلتر شده)
      const allIds = filteredEvents.map((e) => e._id);
      onChange(allIds);
      setAllEventsSelected(true);
    }
  };

  const handleClearAll = () => {
    onChange([]);
    setAllEventsSelected(false);
  };

  const selectedEvents = events.filter((e) =>
    selectedEventIds.includes(e._id)
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <label className={styles.label}>رویدادهای مشمول تخفیف</label>
        <div className={styles.info}>
          {allEventsSelected ? (
            <span className={styles.badge}>همه رویدادها</span>
          ) : selectedEventIds.length > 0 ? (
            <span className={styles.badge}>
              {selectedEventIds.length} رویداد انتخاب شده
            </span>
          ) : (
            <span className={styles.badgeGray}>هیچ رویدادی انتخاب نشده (همه رویدادها)</span>
          )}
        </div>
      </div>

      <div className={styles.selectBox}>
        <div
          className={styles.selectHeader}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className={styles.selectValue}>
            {allEventsSelected
              ? "همه رویدادها"
              : selectedEventIds.length > 0
              ? `${selectedEventIds.length} رویداد انتخاب شده`
              : "انتخاب رویدادها (اختیاری)"}
          </div>
          <span className={styles.arrow}>{showDropdown ? "▲" : "▼"}</span>
        </div>

        {showDropdown && (
          <div className={styles.dropdown}>
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="جستجو در رویدادها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={handleSelectAll}
              >
                {allEventsSelected ? "لغو همه" : "انتخاب همه"}
              </button>
              {selectedEventIds.length > 0 && (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={handleClearAll}
                >
                  پاک کردن
                </button>
              )}
            </div>

            <div className={styles.eventList}>
              {loading ? (
                <div className={styles.loading}>در حال بارگذاری...</div>
              ) : filteredEvents.length === 0 ? (
                <div className={styles.empty}>
                  {searchTerm
                    ? "رویدادی یافت نشد"
                    : "هیچ رویداد تایید شده‌ای وجود ندارد"}
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <label key={event._id} className={styles.eventItem}>
                    <input
                      type="checkbox"
                      checked={selectedEventIds.includes(event._id)}
                      onChange={() => handleToggleEvent(event._id)}
                    />
                    <span className={styles.eventTitle}>{event.title}</span>
                    {event.startDate && (
                      <span className={styles.eventDate}>
                        {new Date(event.startDate).toLocaleDateString("fa-IR")}
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {selectedEvents.length > 0 && !allEventsSelected && (
        <div className={styles.selectedList}>
          {selectedEvents.map((event) => (
            <div key={event._id} className={styles.selectedItem}>
              <span>{event.title}</span>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => handleToggleEvent(event._id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <p className={styles.hint}>
        💡 اگر هیچ رویدادی انتخاب نکنید، این کد تخفیف برای همه رویدادها قابل
        استفاده خواهد بود.
      </p>
    </div>
  );
}

