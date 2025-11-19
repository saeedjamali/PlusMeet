"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/NewAuthContext";
import Logo from "@/components/ui/Logo";
import LocationBanner from "@/components/LocationBanner";
import { MultiSelectFilter } from "@/components/filters";
import PersianDatePicker from "@/components/PersianDatePicker/PersianDatePicker";
import styles from "./meetwall.module.css";
import { loadInitialTheme } from "@/lib/utils/themeManager";
import iranProvinces from "@/lib/data/iranProvincesComplete.json";
import "./meetwallDark.css";

export default function MeetWallPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterInitialized, setIsFilterInitialized] = useState(false);
  const [manualFilterClear, setManualFilterClear] = useState(false);

  // فیلترها - تغییر به array برای multi-select
  const [filters, setFilters] = useState({
    cities: [],
    provinces: [],
    categories: [],
    subCategories: [],
    formatModes: [],
    participationTypes: [],
    ticketTypes: [],
    dateFrom: "",
    dateTo: "",
  });

  // دسته‌بندی‌ها و گزینه‌های فیلتر
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
        console.log("🗺️ تنظیم فیلتر پیش‌فرض:", { userState, userCity });

        setFilters((prev) => ({
          ...prev,
          provinces: userState ? [userState] : [],
          cities: userCity ? [userCity] : [],
        }));

        // بارگذاری شهرهای استان کاربر
        if (userState) {
          const province = iranProvinces.find(
            (p) => p.province_name === userState
          );
          if (province && province.cities) {
            setCities(province.cities);
          }
        }

        setIsFilterInitialized(true);
      }
    } else if (!isFilterInitialized && manualFilterClear) {
      // اگر کاربر دستی فیلترها را پاک کرده، بدون تنظیم فیلتر پیش‌فرض، initialize را true کن
      setIsFilterInitialized(true);
    }
  }, [user, isFilterInitialized, manualFilterClear]);

  useEffect(() => {
    // فقط بعد از اینکه فیلتر initialize شد، رویدادها را fetch کن
    if (isFilterInitialized || !user) {
      fetchEvents();
      fetchFilterOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters, searchQuery, isFilterInitialized]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 12,
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
      if (filters.formatModes.length > 0) {
        queryParams.append("formatModes", filters.formatModes.join(","));
      }
      if (filters.participationTypes.length > 0) {
        queryParams.append(
          "participationTypes",
          filters.participationTypes.join(",")
        );
      }
      if (filters.ticketTypes.length > 0) {
        queryParams.append("ticketTypes", filters.ticketTypes.join(","));
      }

      // فیلتر تاریخ
      if (filters.dateFrom) {
        queryParams.append("dateFrom", filters.dateFrom);
      }
      if (filters.dateTo) {
        queryParams.append("dateTo", filters.dateTo);
      }

      const response = await fetch(`/api/events?${queryParams}`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch events");
      }

      setEvents(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
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

      // دریافت انواع فرمت
      const formatModesRes = await fetch("/api/dashboard/format_mode", {
        credentials: "include",
      });
      if (formatModesRes.ok) {
        const formatModesData = await formatModesRes.json();
        setFormatModes(formatModesData.data || []);
      }

      // دریافت انواع مشارکت
      const participationTypesRes = await fetch(
        "/api/dashboard/participationType",
        { credentials: "include" }
      );
      if (participationTypesRes.ok) {
        const participationTypesData = await participationTypesRes.json();
        setParticipationTypes(participationTypesData.data || []);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
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
        // fetch all subcategories for selected categories
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

    setCurrentPage(1); // بازگشت به صفحه اول
  };

  const handleResetFilters = () => {
    setFilters({
      cities: [],
      provinces: [],
      categories: [],
      subCategories: [],
      formatModes: [],
      participationTypes: [],
      ticketTypes: [],
      dateFrom: "",
      dateTo: "",
    });
    setCities([]);
    setSubCategories([]);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEvents();
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
    <div className="meetWallPage">
      <div className={`container ${styles.container}`}>
        {/* Header */}
        <div className={`header ${styles.header}`}>
          <div className={`headerContent ${styles.headerContent}`}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Logo type="icon" width={45} height={45} priority={true} />
              <h1 className={`title ${styles.title}`}>رویدادهای عمومی</h1>
            </div>
            <div className={`viewToggle ${styles.viewToggle}`}>
              <button
                className={`viewBtn viewBtnActive ${styles.viewBtn} ${styles.viewBtnActive}`}
                title="نمایش لیستی"
              >
                <span>☰</span>
                <span>لیست</span>
              </button>
              <button
                className={`viewBtn ${styles.viewBtn}`}
                onClick={() => router.push("/meetmap")}
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
        <div className={`mainContent ${styles.mainContent}`}>
          {/* Filters Sidebar */}
          <aside className={`filtersSidebar ${styles.filtersSidebar}`}>
            <div className={`filtersHeader ${styles.filtersHeader}`}>
              <h2>فیلتر رویدادها</h2>
              <button
                className={`resetBtn ${styles.resetBtn}`}
                onClick={handleResetFilters}
              >
                پاک کردن
              </button>
            </div>

            {/* Search Box */}
            <div className={`filterSection ${styles.filterSection}`}>
              <label className={`filterLabel ${styles.filterLabel}`}>
                <span>🔍</span>
                <span>جستجو</span>
              </label>
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  className={`searchInput ${styles.searchInput}`}
                  placeholder="جستجوی عنوان رویداد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>

            {/* Province Filter */}
            <div className={`filterSection ${styles.filterSection}`}>
              <MultiSelectFilter
                label="🗺️ استان"
                options={provinces.map((p) => ({
                  value: p.province_name,
                  label: p.province_name,
                }))}
                selectedValues={filters.provinces}
                onChange={(values) => handleFilterChange("provinces", values)}
                placeholder="همه استان‌ها"
              />
            </div>

            {/* City Filter */}
            {filters.provinces.length > 0 && cities.length > 0 && (
              <div className={`filterSection ${styles.filterSection}`}>
                <MultiSelectFilter
                  label="🏙️ شهر"
                  options={cities.map((c) => ({
                    value: c.city_name,
                    label: c.city_name,
                  }))}
                  selectedValues={filters.cities}
                  onChange={(values) => handleFilterChange("cities", values)}
                  placeholder="همه شهرها"
                />
              </div>
            )}

            {/* Category Filter */}
            <div className={`filterSection ${styles.filterSection}`}>
              <MultiSelectFilter
                label="📊 دسته‌بندی"
                options={categories.map((cat) => ({
                  value: cat._id,
                  label: `${cat.icon ? cat.icon + " " : ""}${cat.title}`,
                }))}
                selectedValues={filters.categories}
                onChange={(values) => handleFilterChange("categories", values)}
                placeholder="همه دسته‌ها"
              />
            </div>

            {/* SubCategory Filter */}
            {filters.categories.length > 0 && (
              <div className={`filterSection ${styles.filterSection}`}>
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

            {/* Ticket Type - فقط وقتی زیردسته انتخاب شده یا دسته‌بندی انتخاب شده باشد */}
            {(filters.subCategories.length > 0 ||
              (filters.categories.length > 0 &&
                subCategories.length === 0)) && (
              <div className={`filterSection ${styles.filterSection}`}>
                <MultiSelectFilter
                  label="🎫 نوع بلیط ورودی"
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
            )}

            {/* Format Mode Filter */}
            <div className={`filterSection ${styles.filterSection}`}>
              <MultiSelectFilter
                label="📍 نوع برگزاری"
                options={formatModes.map((mode) => ({
                  value: mode._id,
                  label: `${mode.icon ? mode.icon + " " : ""}${mode.title}`,
                }))}
                selectedValues={filters.formatModes}
                onChange={(values) => handleFilterChange("formatModes", values)}
                placeholder="همه"
              />
            </div>

            {/* Participation Type */}
            <div className={`filterSection ${styles.filterSection}`}>
              <MultiSelectFilter
                label="👥 نوع مشارکت"
                options={participationTypes.map((type) => ({
                  value: type._id,
                  label: `${type.icon ? type.icon + " " : ""}${type.title}`,
                }))}
                selectedValues={filters.participationTypes}
                onChange={(values) =>
                  handleFilterChange("participationTypes", values)
                }
                placeholder="همه"
              />
            </div>

            {/* Date Range */}
            <div className={`filterSection ${styles.filterSection}`}>
              <label className={`filterLabel ${styles.filterLabel}`}>
                <span>📅</span>
                <span>از تاریخ</span>
              </label>
              <PersianDatePicker
                value={filters.dateFrom}
                onChange={(dateString) =>
                  handleFilterChange("dateFrom", dateString)
                }
                placeholder="انتخاب تاریخ شروع"
                format="YYYY-MM-DD"
              />
            </div>

            <div className={`filterSection ${styles.filterSection}`}>
              <label className={`filterLabel ${styles.filterLabel}`}>
                <span>📅</span>
                <span>تا تاریخ</span>
              </label>
              <PersianDatePicker
                value={filters.dateTo}
                onChange={(dateString) =>
                  handleFilterChange("dateTo", dateString)
                }
                placeholder="انتخاب تاریخ پایان"
                format="YYYY-MM-DD"
              />
            </div>
          </aside>

          {/* Events List */}
          <main className={styles.eventsContent}>
            {/* Results Info */}
            <div className={styles.resultsInfo}>
              <div className={styles.resultsCount}>
                <span>نتایج جستجو</span>
                <span className={styles.count}>
                  {events.length > 0
                    ? `${events.length} رویداد یافت شد`
                    : "هیچ رویدادی یافت نشد"}
                </span>
              </div>
              <div className={styles.sortOptions}>
                <label>نمایش بر اساس:</label>
                <div className={styles.sortBtns}>
                  <button
                    className={`${styles.sortBtn} ${styles.sortBtnActive}`}
                  >
                    بیش‌ترین قیمت
                  </button>
                  <button className={styles.sortBtn}>بیش‌ترین قیمت</button>
                  <button className={styles.sortBtn}>بالاترین امتیاز</button>
                </div>
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                <span className={styles.errorIcon}>❌</span>
                <p>{error}</p>
                <button className={styles.retryBtn} onClick={fetchEvents}>
                  تلاش مجدد
                </button>
              </div>
            )}

            {/* Events Grid */}
            <div className={styles.eventsGrid}>
              {!loading && events.length === 0 && !error && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🔍</div>
                  <h3 className={styles.emptyTitle}>هیچ رویدادی یافت نشد</h3>
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
                        <strong>{filters.categories.join("، ")}</strong> رویدادی
                        یافت نشد.
                      </>
                    ) : (
                      "در حال حاضر رویدادی موجود نیست."
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
                          dateFrom: "",
                          dateTo: "",
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
              {events.map((event) => (
                <div
                  key={event._id}
                  className={`eventCard ${styles.eventCard}`}
                >
                  {/* Event Image */}
                  <div className={`eventImage ${styles.eventImage}`}>
                    {event.coverImage ||
                    (event.images && event.images.length > 0) ? (
                      <img
                        src={
                          event.coverImage ||
                          event.images[0]?.url ||
                          event.images[0]
                        }
                        alt={event.title}
                        onError={(e) => {
                          e.target.src = "/images/default-event.jpg";
                        }}
                      />
                    ) : (
                      <div className={styles.noImage}>
                        <span>📅</span>
                      </div>
                    )}

                    {/* Status Badge برای رویدادهای پایان یافته یا منقضی */}
                    {(event.status === "finished" ||
                      event.status === "expired") && (
                      <div className={styles.statusBadge}>
                        {event.status === "finished"
                          ? "✅ پایان یافته"
                          : "⏰ منقضی شده"}
                      </div>
                    )}

                    {/* Discount Badge */}
                    {event.ticket?.discount && (
                      <div className={styles.discountBadge}>
                        تا {event.ticket.discount}% تخفیف
                      </div>
                    )}

                    {/* Special Offer Badge */}
                    {event.featured && (
                      <div className={styles.specialBadge}>🔥 پیشنهاد ویژه</div>
                    )}
                  </div>

                  {/* Event Info */}
                  <div className={`eventInfo ${styles.eventInfo}`}>
                    <div className={styles.eventHeader}>
                      <h3 className={`eventTitle ${styles.eventTitle}`}>
                        {event.title}
                      </h3>
                      <div className={styles.eventRating}>
                        <span className={styles.ratingStars}>
                          {event.rating && event.rating > 0
                            ? "⭐".repeat(Math.round(event.rating))
                            : "☆☆☆☆☆"}
                        </span>
                        <span className={styles.ratingText}>
                          {event.rating && event.rating > 0
                            ? `(${event.rating.toFixed(1)})`
                            : "(بدون امتیاز)"}
                        </span>
                        {event.reviewCount > 0 && (
                          <span className={styles.reviewCountText}>
                            {event.reviewCount} نظر
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    {event.location?.city && (
                      <div className={styles.eventLocation}>
                        <span>📍</span>
                        <span>
                          {event.location.city}, {event.location.province}
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    <p className={styles.eventDescription}>
                      {event.description?.substring(0, 100)}...
                    </p>

                    {/* Event Details */}
                    <div className={styles.eventDetails}>
                      {event.topicCategory && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailIcon}>
                            {event.topicCategory.icon || "📊"}
                          </span>
                          <span>{event.topicCategory.title}</span>
                        </div>
                      )}
                      {event.formatMode && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailIcon}>
                            {event.formatMode.icon || "📍"}
                          </span>
                          <span>{event.formatMode.title}</span>
                        </div>
                      )}
                      {event.schedule?.startDate && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailIcon}>📅</span>
                          <span>{formatDate(event.schedule.startDate)}</span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className={styles.eventFeatures}>
                      {event.createGroupChat && (
                        <span className={styles.featureTag}>💬 گروه چت</span>
                      )}
                      {event.hasCertificate && (
                        <span className={styles.featureTag}>🏆 گواهی</span>
                      )}
                      {event.ticket?.type === "free" && (
                        <span className={styles.featureTag}>🆓 رایگان</span>
                      )}
                    </div>

                    {/* Price and Action */}
                    <div className={`eventFooter ${styles.eventFooter}`}>
                      <div className={`priceSection ${styles.priceSection}`}>
                        {event.ticket?.type === "free" ? (
                          <div className={styles.priceInfo}>
                            <span className={styles.priceLabel}>نوع بلیط:</span>
                            <span className={styles.freePrice}>🆓 رایگان</span>
                          </div>
                        ) : event.ticket?.type === "paid" &&
                          event.ticket?.price > 0 ? (
                          <div className={styles.priceInfo}>
                            <span className={styles.priceLabel}>قیمت:</span>
                            <div className={styles.priceAmount}>
                              {event.ticket.originalPrice && (
                                <span className={styles.originalPrice}>
                                  {event.ticket.originalPrice.toLocaleString(
                                    "fa-IR"
                                  )}{" "}
                                  تومان
                                </span>
                              )}
                              <span className={styles.currentPrice}>
                                {event.ticket.price.toLocaleString("fa-IR")}{" "}
                                تومان
                              </span>
                            </div>
                          </div>
                        ) : event.ticket?.type === "mixed" ? (
                          <div className={styles.priceInfo}>
                            <span className={styles.priceLabel}>نوع بلیط:</span>
                            <span className={styles.mixedPrice}>
                              🎫 رایگان و پولی
                            </span>
                          </div>
                        ) : (
                          <div className={styles.priceInfo}>
                            <span className={styles.priceLabel}>نوع بلیط:</span>
                            <span className={styles.freePrice}>🆓 رایگان</span>
                          </div>
                        )}
                      </div>
                      <button
                        className={`viewDetailsBtn ${styles.viewDetailsBtn}`}
                        onClick={() => router.push(`/events/${event._id}`)}
                      >
                        مشاهده جزئیات
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  قبلی
                </button>

                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    className={`${styles.pageBtn} ${
                      currentPage === index + 1 ? styles.pageBtnActive : ""
                    }`}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}

                <button
                  className={styles.pageBtn}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  بعدی
                </button>
              </div>
            )}

            {/* Quick Create Event */}
            <div className={styles.quickView}>
              <button
                className={styles.quickViewBtn}
                onClick={() => router.push("/dashboard/events/create")}
              >
                <span>➕</span>
                <span>ثبت رویداد جدید</span>
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
