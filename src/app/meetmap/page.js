"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/NewAuthContext";
import dynamic from "next/dynamic";
import Logo from "@/components/ui/Logo";
import LocationBanner from "@/components/LocationBanner";
import { MultiSelectFilter } from "@/components/filters";
import styles from "./meetmap.module.css";
import { loadInitialTheme } from "@/lib/utils/themeManager";
import iranProvinces from "@/lib/data/iranProvincesComplete.json";
import "./meetmapDark.css";

// Dynamic import برای نقشه (فقط سمت کلاینت)
const MapContainer = dynamic(() => import("./MapContainer"), { ssr: false });

export default function MeetMapPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState([36.2972, 59.6067]); // مشهد
  const [mapZoom, setMapZoom] = useState(12);
  const [filtersOpen, setFiltersOpen] = useState(false); // وضعیت باز/بسته فیلترها
  const [isFilterInitialized, setIsFilterInitialized] = useState(false);
  const [manualFilterClear, setManualFilterClear] = useState(false);

  // Refs برای اسکرول خودکار
  const eventCardsRef = useRef({});
  const eventsListRef = useRef(null);

  // فیلترها - تغییر به array برای multi-select
  const [filters, setFilters] = useState({
    provinces: [],
    cities: [],
    categories: [],
    subCategories: [],
    formatModes: [],
    participationTypes: [],
    ticketTypes: [],
  });

  // دسته‌بندی‌ها
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [formatModes, setFormatModes] = useState([]);
  const [participationTypes, setParticipationTypes] = useState([]);

  // استان‌ها و شهرها
  const [provinces] = useState(iranProvinces);
  const [cities, setCities] = useState([]);

  // Load dark mode preference
  useEffect(() => {
    const initialTheme = loadInitialTheme();
    setDarkMode(initialTheme === "dark");
  }, []);

  // Apply theme when darkMode changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const theme = darkMode ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", theme);
      if (darkMode) {
        document.documentElement.classList.add("dark-mode");
        document.body.classList.add("dark-mode");
      } else {
        document.documentElement.classList.remove("dark-mode");
        document.body.classList.remove("dark-mode");
      }
    }
  }, [darkMode]);

  // اسکرول خودکار به رویداد انتخاب شده در لیست
  useEffect(() => {
    if (selectedEvent && eventCardsRef.current[selectedEvent._id]) {
      const cardElement = eventCardsRef.current[selectedEvent._id];
      if (cardElement) {
        // اسکرول با انیمیشن نرم
        cardElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }
  }, [selectedEvent]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    const theme = newDarkMode ? "dark" : "light";
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
    }
  };

  // تنظیم فیلتر پیش‌فرض بر اساس location کاربر
  useEffect(() => {
    if (!isFilterInitialized && !manualFilterClear && user?.location) {
      const userState = user.location.state;
      const userCity = user.location.city;

      if (userState || userCity) {
        console.log("🗺️ تنظیم فیلتر پیش‌فرض در نقشه:", { userState, userCity });

        setFilters((prev) => ({
          ...prev,
          provinces: userState ? [userState] : [],
          cities: userCity ? [userCity] : [],
        }));

        // بارگذاری شهرهای استان کاربر و تنظیم مرکز نقشه
        if (userState) {
          const province = iranProvinces.find(
            (p) => p.province_name === userState
          );
          if (province) {
            // بارگذاری شهرها
            if (province.cities) {
              setCities(province.cities);
            }

            // اگر شهر هم انتخاب شده، از مختصات شهر استفاده کن
            if (userCity && province.cities) {
              const city = province.cities.find(
                (c) => c.city_name === userCity
              );
              if (city && city.latitude && city.longitude) {
                setMapCenter([city.latitude, city.longitude]);
                setMapZoom(12); // zoom بیشتر برای شهر
                console.log("📍 مرکز نقشه روی شهر تنظیم شد:", {
                  province: userState,
                  city: userCity,
                  coordinates: [city.latitude, city.longitude],
                });
              }
            }
            // اگر فقط استان انتخاب شده، از مختصات استان استفاده کن
            else if (province.latitude && province.longitude) {
              setMapCenter([province.latitude, province.longitude]);
              setMapZoom(10);
              console.log("📍 مرکز نقشه روی استان تنظیم شد:", {
                province: userState,
                coordinates: [province.latitude, province.longitude],
              });
            }
          }
        }

        setIsFilterInitialized(true);
      }
    } else if (!isFilterInitialized && manualFilterClear) {
      // اگر کاربر دستی فیلترها را پاک کرده، بدون تنظیم فیلتر پیش‌فرض، initialize را true کن
      setIsFilterInitialized(true);
    }
  }, [user, isFilterInitialized, manualFilterClear]);

  // بروزرسانی لیست شهرها با تغییر استان
  useEffect(() => {
    if (filters.provinces.length > 0) {
      const selectedProvince = filters.provinces[0];
      const province = iranProvinces.find(
        (p) => p.province_name === selectedProvince
      );
      if (province && province.cities) {
        setCities(province.cities);
      }
    } else {
      setCities([]);
      // اگر استان پاک شد، شهرها را هم پاک کن
      if (filters.cities.length > 0) {
        setFilters((prev) => ({ ...prev, cities: [] }));
      }
    }
  }, [filters.provinces]);

  // تغییر مرکز نقشه با تغییر دستی فیلترهای استان/شهر
  useEffect(() => {
    // فقط زمانی که فیلترها initialize شده‌اند
    if (!isFilterInitialized) return;

    const selectedProvince = filters.provinces[0]; // اولین استان انتخابی
    const selectedCity = filters.cities[0]; // اولین شهر انتخابی

    if (selectedProvince) {
      const province = iranProvinces.find(
        (p) => p.province_name === selectedProvince
      );

      if (province) {
        // اگر شهر انتخاب شده باشد، روی شهر focus کن
        if (selectedCity && province.cities) {
          const city = province.cities.find(
            (c) => c.city_name === selectedCity
          );
          if (city && city.latitude && city.longitude) {
            setMapCenter([city.latitude, city.longitude]);
            setMapZoom(12);
            console.log("📍 نقشه به شهر منتقل شد:", {
              city: selectedCity,
              coordinates: [city.latitude, city.longitude],
            });
          }
        }
        // در غیر این صورت روی استان focus کن
        else if (province.latitude && province.longitude) {
          setMapCenter([province.latitude, province.longitude]);
          setMapZoom(10);
          console.log("📍 نقشه به استان منتقل شد:", {
            province: selectedProvince,
            coordinates: [province.latitude, province.longitude],
          });
        }
      }
    }
  }, [filters.provinces, filters.cities, isFilterInitialized]);

  useEffect(() => {
    // فقط بعد از اینکه فیلتر initialize شد، رویدادها را fetch کن
    if (isFilterInitialized || !user) {
      fetchEvents();
      fetchFilterOptions();
    }
  }, [filters, searchQuery, isFilterInitialized]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        limit: 100, // برای نمایش روی نقشه تعداد بیشتری می‌گیریم
      });

      // جستجو
      if (searchQuery) {
        queryParams.append("search", searchQuery);
      }

      // فیلترهای چند انتخابی - ارسال به صورت comma-separated
      if (filters.provinces.length > 0) {
        queryParams.append("provinces", filters.provinces.join(","));
      }
      if (filters.cities.length > 0) {
        queryParams.append("cities", filters.cities.join(","));
      }
      if (filters.categories.length > 0) {
        queryParams.append("categories", filters.categories.join(","));
      }
      if (filters.subCategories.length > 0) {
        queryParams.append("subCategories", filters.subCategories.join(","));
      }
      if (filters.ticketTypes.length > 0) {
        queryParams.append("ticketTypes", filters.ticketTypes.join(","));
      }

      const response = await fetch(`/api/events?${queryParams}`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch events");
      }

      // فقط رویدادهایی که location دارند (برای نمایش روی نقشه)
      const eventsWithLocation = (data.data || []).filter(
        (event) =>
          event.location?.coordinates && event.location.coordinates.length === 2
      );

      setEvents(eventsWithLocation);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error fetching events:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // دریافت همه دسته‌بندی‌ها
      const categoriesRes = await fetch("/api/dashboard/cat_topic", {
        credentials: "include",
      });
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        // فیلتر کردن فقط دسته‌های اصلی (که parentId ندارند)
        const parentCategories = (categoriesData.data || []).filter(
          (cat) => !cat.parentId || cat.parentId === null
        );
        setCategories(parentCategories);
      }

      const formatModesRes = await fetch("/api/dashboard/format_mode", {
        credentials: "include",
      });
      if (formatModesRes.ok) {
        const formatModesData = await formatModesRes.json();
        setFormatModes(formatModesData.data || []);
      }

      const participationTypesRes = await fetch(
        "/api/dashboard/participationType",
        { credentials: "include" }
      );
      if (participationTypesRes.ok) {
        const participationTypesData = await participationTypesRes.json();
        setParticipationTypes(participationTypesData.data || []);
      }
    } catch (err) {
      console.error("Error fetching filter options:", err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));

    // اگر استان‌ها تغییر کردند، شهرهای تمام استان‌های انتخاب شده را لود کن
    if (filterName === "provinces") {
      if (value && value.length > 0) {
        const allCities = [];
        value.forEach((provinceName) => {
          const selectedProvince = provinces.find(
            (p) => p.province_name === provinceName
          );
          if (selectedProvince) {
            allCities.push(...selectedProvince.cities);
          }
        });
        setCities(allCities);
      } else {
        setCities([]);
        setFilters((prev) => ({ ...prev, cities: [] }));
      }
    }

    // اگر دسته‌بندی‌ها تغییر کردند، زیردسته‌های تمام دسته‌های انتخاب شده را لود کن
    if (filterName === "categories") {
      if (value && value.length > 0) {
        const fetchAllSubCategories = async () => {
          const allSubCats = [];
          for (const categoryId of value) {
            try {
              const response = await fetch(
                `/api/dashboard/cat_topic?parentId=${categoryId}&view=flat`,
                { credentials: "include" }
              );
              if (response.ok) {
                const data = await response.json();
                // eslint-disable-next-line no-console
                console.log(`زیردسته‌های دسته ${categoryId}:`, data.data);
                allSubCats.push(...(data.data || []));
              }
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error("Error fetching subcategories:", err);
            }
          }
          // Remove duplicates if any
          const uniqueSubCats = Array.from(
            new Map(allSubCats.map((item) => [item._id, item])).values()
          );
          // eslint-disable-next-line no-console
          console.log("زیردسته‌های یونیک:", uniqueSubCats);
          setSubCategories(uniqueSubCats);
        };
        fetchAllSubCategories();
      } else {
        setSubCategories([]);
        setFilters((prev) => ({ ...prev, subCategories: [] }));
      }
    }
  };

  const handleMarkerClick = (event) => {
    setSelectedEvent(event);
    // تنظیم مرکز نقشه روی رویداد انتخاب شده
    if (event.location?.coordinates) {
      setMapCenter([
        event.location.coordinates[1],
        event.location.coordinates[0],
      ]);
      setMapZoom(15);
    }
  };

  const handleEventCardClick = (event) => {
    setSelectedEvent(event);
    if (event.location?.coordinates) {
      setMapCenter([
        event.location.coordinates[1],
        event.location.coordinates[0],
      ]);
      setMapZoom(15);
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>در حال بارگذاری رویدادها...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="meetMapPage">
      <div className={styles.container}>
        {/* Header */}
        <div className={`header ${styles.header}`}>
          <div className={`headerContent ${styles.headerContent}`}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Logo type="icon" width={45} height={45} priority={true} />
              <h1 className={`title ${styles.title}`}>رویدادها روی نقشه</h1>
            </div>
            <div className={`viewToggle ${styles.viewToggle}`}>
              <button
                className={`viewBtn ${styles.viewBtn}`}
                onClick={() => router.push("/meetwall")}
                title="نمایش لیستی"
              >
                <span>☰</span>
                <span>لیست</span>
              </button>
              <button
                className={`viewBtn viewBtnActive ${styles.viewBtn} ${styles.viewBtnActive}`}
                title="نمایش روی نقشه"
              >
                <span>🗺️</span>
                <span>نقشه</span>
              </button>
            </div>
          </div>
          <button
            className="themeToggle"
            onClick={toggleDarkMode}
            title={darkMode ? "حالت روشن" : "حالت تاریک"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        {/* Location Banner */}
        <LocationBanner />

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Map Container */}
          <div className={`mapSection ${styles.mapSection}`}>
            <MapContainer
              events={events}
              center={mapCenter}
              zoom={mapZoom}
              onMarkerClick={handleMarkerClick}
              selectedEvent={selectedEvent}
            />

            {/* Map Controls */}
            <div className={styles.mapControls}>
              <button
                className={styles.mapControlBtn}
                onClick={() => setMapZoom((prev) => Math.min(18, prev + 1))}
                title="بزرگنمایی"
              >
                +
              </button>
              <button
                className={styles.mapControlBtn}
                onClick={() => setMapZoom((prev) => Math.max(8, prev - 1))}
                title="کوچکنمایی"
              >
                -
              </button>
              <button
                className={styles.mapControlBtn}
                onClick={() => {
                  setMapCenter([36.2972, 59.6067]);
                  setMapZoom(12);
                }}
                title="بازگشت به مرکز"
              >
                🎯
              </button>
            </div>

            {/* Map Legend */}
            <div className={styles.mapLegend}>
              <div className={styles.legendItem}>
                <span
                  className={styles.legendIcon}
                  style={{ background: "#10b981" }}
                >
                  📍
                </span>
                <span>رویدادهای موجود ({events.length})</span>
              </div>
            </div>
          </div>

          {/* Events Sidebar */}
          <aside className={`eventsSidebar ${styles.eventsSidebar}`}>
            {/* Filters */}
            <div className={`filtersSection ${styles.filtersSection}`}>
              <div className={styles.filtersHeader}>
                <h2 className={`sidebarTitle ${styles.sidebarTitle}`}>
                  <span>🔍</span>
                  <span>فیلتر رویدادها</span>
                </h2>
                <button
                  className={styles.filtersToggle}
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  title={filtersOpen ? "بستن فیلترها" : "باز کردن فیلترها"}
                >
                  {filtersOpen ? "▲" : "▼"}
                </button>
              </div>

              {filtersOpen && (
                <>
                  {/* Search Box */}
                  <input
                    type="text"
                    className={`searchInput ${styles.searchInput}`}
                    placeholder="جستجوی عنوان رویداد..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  {/* Province Filter */}
                  <div className={`filterGroup ${styles.filterGroup}`}>
                    <MultiSelectFilter
                      label="🗺️ استان"
                      options={provinces.map((p) => ({
                        value: p.province_name,
                        label: p.province_name,
                      }))}
                      selectedValues={filters.provinces}
                      onChange={(values) =>
                        handleFilterChange("provinces", values)
                      }
                      placeholder="همه استان‌ها"
                    />
                  </div>

                  {/* City Filter */}
                  {filters.provinces.length > 0 && cities.length > 0 && (
                    <div className={`filterGroup ${styles.filterGroup}`}>
                      <MultiSelectFilter
                        label="🏙️ شهر"
                        options={cities.map((c) => ({
                          value: c.city_name,
                          label: c.city_name,
                        }))}
                        selectedValues={filters.cities}
                        onChange={(values) =>
                          handleFilterChange("cities", values)
                        }
                        placeholder="همه شهرها"
                      />
                    </div>
                  )}

                  {/* Ticket Type */}
                  <div className={`filterGroup ${styles.filterGroup}`}>
                    <MultiSelectFilter
                      label="🎫 نوع بلیط"
                      options={[
                        { value: "free", label: "🆓 رایگان" },
                        { value: "paid", label: "💰 پولی" },
                        { value: "mixed", label: "🎟️ ترکیبی" },
                      ]}
                      selectedValues={filters.ticketTypes}
                      onChange={(values) =>
                        handleFilterChange("ticketTypes", values)
                      }
                      placeholder="همه"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className={`filterGroup ${styles.filterGroup}`}>
                    <MultiSelectFilter
                      label="📊 دسته‌بندی"
                      options={categories.map((cat) => ({
                        value: cat._id,
                        label: `${cat.icon ? cat.icon + " " : ""}${cat.title}`,
                      }))}
                      selectedValues={filters.categories}
                      onChange={(values) =>
                        handleFilterChange("categories", values)
                      }
                      placeholder="همه"
                    />
                  </div>

                  {/* SubCategory Filter */}
                  {filters.categories.length > 0 && (
                    <div className={`filterGroup ${styles.filterGroup}`}>
                      <MultiSelectFilter
                        label="🏷️ زیردسته"
                        options={subCategories.map((subCat) => ({
                          value: subCat._id,
                          label: `${subCat.icon ? subCat.icon + " " : ""}${
                            subCat.title
                          }`,
                        }))}
                        selectedValues={filters.subCategories}
                        onChange={(values) =>
                          handleFilterChange("subCategories", values)
                        }
                        placeholder={
                          subCategories.length === 0
                            ? "در حال بارگذاری زیردسته‌ها..."
                            : "همه زیردسته‌ها"
                        }
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Events List */}
            <div className={`eventsListSection ${styles.eventsListSection}`}>
              <div className={`eventsListHeader ${styles.eventsListHeader}`}>
                <h2 className={`sidebarTitle ${styles.sidebarTitle}`}>
                  <span>📋</span>
                  <span>لیست رویدادها</span>
                </h2>
                <span className={`eventsCount ${styles.eventsCount}`}>
                  {events.length}
                </span>
              </div>

              {error && (
                <div className={`error ${styles.error}`}>
                  <span>❌</span>
                  <p>{error}</p>
                </div>
              )}

              <div
                className={styles.eventsList}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  overflowY: "auto",
                  maxHeight: "calc(100vh - 300px)",
                  paddingLeft: "0.5rem",
                }}
              >
                {!loading && events.length === 0 && !error && (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🔍</div>
                    <h3 className={styles.emptyTitle}>
                      هیچ رویدادی در نقشه یافت نشد
                    </h3>
                    <p className={styles.emptyMessage}>
                      {filters.provinces.length > 0 ||
                      filters.cities.length > 0 ? (
                        <>
                          در{" "}
                          {filters.cities.length > 0 && (
                            <strong>{filters.cities.join("، ")}</strong>
                          )}
                          {filters.provinces.length > 0 &&
                            !filters.cities.length && (
                              <strong>{filters.provinces.join("، ")}</strong>
                            )}{" "}
                          رویدادی یافت نشد.
                        </>
                      ) : searchQuery ? (
                        <>
                          نتیجه‌ای برای جستجوی <strong>"{searchQuery}"</strong>{" "}
                          یافت نشد.
                        </>
                      ) : filters.categories.length > 0 ? (
                        <>
                          در دسته‌بندی{" "}
                          <strong>{filters.categories.join("، ")}</strong>{" "}
                          رویدادی یافت نشد.
                        </>
                      ) : (
                        "در حال حاضر رویدادی در نقشه موجود نیست."
                      )}
                    </p>
                    {(filters.provinces.length > 0 ||
                      filters.cities.length > 0 ||
                      filters.categories.length > 0 ||
                      filters.subCategories.length > 0 ||
                      filters.formatModes.length > 0 ||
                      filters.participationTypes.length > 0 ||
                      searchQuery) && (
                      <button
                        className={styles.clearFiltersBtn}
                        onClick={() => {
                          console.log("🔄 پاک کردن فیلترها توسط کاربر");
                          setManualFilterClear(true);
                          setFilters({
                            cities: [],
                            provinces: [],
                            categories: [],
                            subCategories: [],
                            formatModes: [],
                            participationTypes: [],
                            ticketTypes: [],
                          });
                          setSearchQuery("");
                          setIsFilterInitialized(false);
                        }}
                      >
                        🔄 پاک کردن فیلترها
                      </button>
                    )}
                  </div>
                )}
                {events.map((event) => {
                  // تبدیل صحیح تاریخ میلادی به شمسی
                  let persianDate = "";
                  if (event.startDate) {
                    try {
                      const date = new Date(event.startDate);
                      persianDate = new Intl.DateTimeFormat("fa-IR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }).format(date);
                    } catch (e) {
                      persianDate = event.startDate;
                    }
                  }

                  return (
                    <article
                      key={event._id}
                      ref={(el) => (eventCardsRef.current[event._id] = el)}
                      onClick={() => handleEventCardClick(event)}
                      style={{
                        backgroundColor:
                          selectedEvent?._id === event._id
                            ? "rgba(13, 76, 87, 0.05)"
                            : event.status === "finished" ||
                              event.status === "expired"
                            ? "rgba(148, 163, 184, 0.1)"
                            : "#ffffff",
                        border:
                          selectedEvent?._id === event._id
                            ? "2px solid #0D4C57"
                            : event.status === "finished" ||
                              event.status === "expired"
                            ? "2px solid #cbd5e1"
                            : "2px solid #E8D5B5",
                        borderRadius: "12px",
                        overflow: "hidden",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                        display: "flex",
                        flexDirection: "row",
                        width: "100%",
                        height: "180px",
                        minHeight: "180px",
                        maxHeight: "180px",
                        opacity:
                          event.status === "finished" ||
                          event.status === "expired"
                            ? 0.85
                            : 1,
                      }}
                    >
                      {/* Image Section - گوشه چپ بالا */}
                      <div
                        style={{
                          position: "relative",
                          width: "120px",
                          minWidth: "120px",
                          height: "100%",
                          backgroundColor: "#F5E6C8",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        {event.coverImage ||
                        (event.images && event.images.length > 0) ? (
                          <img
                            src={
                              event.coverImage ||
                              event.images[0]?.url ||
                              event.images[0]
                            }
                            alt={event.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.parentElement.innerHTML =
                                '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem;">📅</div>';
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "2rem",
                            }}
                          >
                            📅
                          </div>
                        )}

                        {/* Status Badge */}
                        {(event.status === "finished" ||
                          event.status === "expired") && (
                          <div
                            style={{
                              position: "absolute",
                              top: "0.5rem",
                              left: "0",
                              right: "0",
                              textAlign: "center",
                              background:
                                "linear-gradient(135deg, #64748b 0%, #475569 100%)",
                              color: "white",
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.65rem",
                              fontWeight: "bold",
                              boxShadow: "0 2px 8px rgba(100, 116, 139, 0.4)",
                              zIndex: 10,
                            }}
                          >
                            {event.status === "finished"
                              ? "✅ پایان یافته"
                              : "⏰ منقضی"}
                          </div>
                        )}
                      </div>

                      {/* Content Section */}
                      <div
                        style={{
                          padding: "0.75rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.4rem",
                          flex: 1,
                          overflow: "hidden",
                          justifyContent: "space-between",
                        }}
                      >
                        {/* Title */}
                        <h3
                          style={{
                            fontSize: "0.9375rem",
                            fontWeight: "700",
                            color: "#0D4C57",
                            margin: 0,
                            lineHeight: "1.4",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            maxHeight: "2.8em",
                          }}
                        >
                          {event.title}
                        </h3>

                        {/* Meta Info - فقط مهم‌ترین فیلدها */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.3rem",
                          }}
                        >
                          {/* موضوع رویداد */}
                          {event.topicCategory?.title && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                fontSize: "0.75rem",
                                color: "#6b7280",
                              }}
                            >
                              <span>🏷️</span>
                              <span
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {event.topicCategory.title}
                              </span>
                            </div>
                          )}

                          {/* تاریخ */}
                          {persianDate && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                fontSize: "0.75rem",
                                color: "#6b7280",
                              }}
                            >
                              <span>📅</span>
                              <span style={{ fontSize: "0.7rem" }}>
                                {persianDate}
                              </span>
                            </div>
                          )}

                          {/* شهر و ظرفیت */}
                          <div
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                              alignItems: "center",
                            }}
                          >
                            {event.location?.city && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  fontSize: "0.75rem",
                                  color: "#6b7280",
                                }}
                              >
                                <span>📍</span>
                                <span>{event.location.city}</span>
                              </div>
                            )}

                            {event.capacity && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  fontSize: "0.75rem",
                                  color: "#6b7280",
                                }}
                              >
                                <span>👥</span>
                                <span>{event.capacity}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price & Button - همیشه در پایین */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.5rem",
                            paddingTop: "0.5rem",
                            borderTop: "1px solid #E8D5B5",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: "700",
                              color: "#0D4C57",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                            }}
                          >
                            {event.ticket?.type === "free"
                              ? "🆓 رایگان"
                              : event.ticket?.price
                              ? `💰 ${event.ticket.price.toLocaleString(
                                  "fa-IR"
                                )}`
                              : "📞 تماس"}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/events/${event._id}`);
                            }}
                            style={{
                              padding: "0.5rem 0.875rem",
                              backgroundColor: "#0D4C57",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              fontSize: "0.8125rem",
                              fontWeight: "600",
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                            onMouseOver={(e) => {
                              e.target.style.backgroundColor = "#0a3d45";
                            }}
                            onMouseOut={(e) => {
                              e.target.style.backgroundColor = "#0D4C57";
                            }}
                          >
                            مشاهده
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>

        {/* Floating Toolbar */}
        <div className={styles.floatingToolbar}>
          <button className={styles.toolbarBtn} title="لیست رویدادها">
            <span>📋</span>
            <span>لیست رویدادها</span>
          </button>
          <button
            className={styles.toolbarBtn}
            onClick={() => router.push("/meetwall")}
          >
            <span>☰</span>
            <span>تغییر نمایش</span>
          </button>
        </div>
      </div>
    </div>
  );
}
