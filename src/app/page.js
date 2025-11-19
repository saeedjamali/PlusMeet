/**
 * Home Page
 * صفحه اصلی PlusMeet
 */

"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/NewAuthContext";
import { useState } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Logo from "@/components/ui/Logo";
import PublicNotifications from "@/components/home/PublicNotifications";
import styles from "./home.module.css";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={styles.homepage}>
      {/* Mobile Header - فقط در موبایل */}
      <div className={styles.mobileHeader}>
        <div className={styles.mobileHeaderContent}>
          <div
            className={styles.mobileHeaderLogo}
            onClick={() => router.push("/")}
          >
            <Logo type="icon" width={40} height={40} priority={true} />
          </div>

          <div className={styles.mobileHeaderActions}>
            {isAuthenticated && (
              <button
                className={styles.mobileLogoutBtn}
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                title="خروج"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            )}
            {/* <button
              className={styles.mobileHeaderMenuBtn}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="منو"
            >
              <div
                className={`${styles.mobileHeaderHamburger} ${
                  mobileMenuOpen ? styles.open : ""
                }`}
              >
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button> */}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navContainer}>
          <div className={styles.navLogo} onClick={() => router.push("/")}>
            <Logo
              type="horizontal"
              width={120}
              height={35}
              priority={true}
              className={styles.navLogoImage}
            />
          </div>

          {/* Desktop Navigation */}
          <div className={styles.navLinks}>
            {isAuthenticated ? (
              <>
                <button
                  className={styles.navLink}
                  onClick={() => router.push("/dashboard")}
                >
                  📊 داشبورد
                </button>
                <button
                  className={styles.navLink}
                  onClick={() => router.push("/profile")}
                >
                  👤 پروفایل
                </button>
                <button
                  className={styles.navBtn}
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                >
                  خروج
                </button>
              </>
            ) : (
              <>
                <button
                  className={styles.navLink}
                  onClick={() => router.push("/login")}
                >
                  ورود
                </button>
                <button
                  className={styles.navBtn}
                  onClick={() => router.push("/login")}
                >
                  ثبت‌نام
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="منو"
          >
            <div
              className={`${styles.hamburger} ${
                mobileMenuOpen ? styles.open : ""
              }`}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <>
            <div
              className={styles.mobileMenuOverlay}
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className={styles.mobileMenu}>
              {isAuthenticated ? (
                <>
                  <button
                    className={styles.mobileNavLink}
                    onClick={() => {
                      router.push("/dashboard");
                      setMobileMenuOpen(false);
                    }}
                  >
                    📊 داشبورد
                  </button>
                  <button
                    className={styles.mobileNavLink}
                    onClick={() => {
                      router.push("/profile");
                      setMobileMenuOpen(false);
                    }}
                  >
                    👤 پروفایل
                  </button>
                  <button
                    className={styles.mobileNavBtn}
                    onClick={() => {
                      logout();
                      router.push("/login");
                      setMobileMenuOpen(false);
                    }}
                  >
                    خروج
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={styles.mobileNavLink}
                    onClick={() => {
                      router.push("/login");
                      setMobileMenuOpen(false);
                    }}
                  >
                    ورود
                  </button>
                  <button
                    className={styles.mobileNavBtn}
                    onClick={() => {
                      router.push("/login");
                      setMobileMenuOpen(false);
                    }}
                  >
                    ثبت‌نام
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </nav>

      {/* Theme Toggle */}
      <ThemeToggle variant="floating" />

      {/* Public Notifications - اعلانات عمومی */}
      <PublicNotifications />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              با هم، بهتر
            </div>

            <h1 className={styles.title}>
              <span className={styles.gradient}>پلاس میت</span>
              <br />
              پلتفرم هوشمند اشتراک‌گذاری رویدادها
            </h1>

            <p className={styles.description}>
              رویدادهای خود را به اشتراک بگذارید، همراهان جدید بیابید و
              تجربه‌های فراموش‌نشدنی بسازید.
              <br />
              از ورزش و سفر تا آموزش و سرگرمی، همه چیز در یک مکان.
            </p>

            <div className={styles.actions}>
              <button
                className={styles.primaryBtn}
                onClick={() => router.push("/login")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                ورود به پنل
              </button>
              <button className={styles.secondaryBtn}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                درباره ما
              </button>
            </div>

            {/* آمارها */}
            <div className={styles.stats}>
              <div className={styles.stat}>
                <div className={styles.statValue}>1,234+</div>
                <div className={styles.statLabel}>کاربر فعال</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>856+</div>
                <div className={styles.statLabel}>رویداد</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>320+</div>
                <div className={styles.statLabel}>شهر</div>
              </div>
            </div>

            {/* دکمه‌های مشاهده رویدادها */}
            <div className={styles.viewModesContainer}>
              <button
                className={styles.viewModeCard}
                onClick={() => router.push("/meetwall")}
              >
                <div className={styles.viewModeIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
                <h3 className={styles.viewModeTitle}>نمایش لیستی</h3>
                <p className={styles.viewModeDesc}>مشاهده رویدادها در قالب لیست</p>
              </button>

              <button
                className={styles.viewModeCard}
                onClick={() => router.push("/meetmap")}
              >
                <div className={styles.viewModeIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                </div>
                <h3 className={styles.viewModeTitle}>نمایش روی نقشه</h3>
                <p className={styles.viewModeDesc}>مشاهده موقعیت رویدادها</p>
              </button>

              <button
                className={styles.viewModeCard}
                onClick={() => router.push("/meetboard")}
              >
                <div className={styles.viewModeIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <h3 className={styles.viewModeTitle}>تابلوی رویدادها</h3>
                <p className={styles.viewModeDesc}>نمایش تحلیلی و دسته‌بندی شده</p>
              </button>
            </div>
          </div>

          <div className={styles.heroImage}>
            <div className={styles.heroMainLogo}>
              <Logo
                type="icon"
                width={250}
                height={300}
                priority={true}
                className={styles.heroMainLogoImage}
              />
            </div>
            <div
              className={styles.floatingCard}
              style={{ top: "10%", right: "10%" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>رویداد جدید</span>
            </div>
            <div
              className={styles.floatingCard}
              style={{ bottom: "20%", left: "5%" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>یافتن همراه</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>چرا پلاس میت؟</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3>مبتنی بر موقعیت</h3>
              <p>رویدادها و همراهان نزدیک به شما را پیدا کنید</p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3>امن و قابل اعتماد</h3>
              <p>سیستم تایید هویت و احراز سطح اعتماد</p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3>پرداخت آنلاین</h3>
              <p>کیف پول هوشمند و تقسیم شفاف هزینه‌ها</p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3>چت گروهی</h3>
              <p>ارتباط آسان با اعضای رویداد</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2>آماده برای شروع هستید؟</h2>
            <p>همین حالا به پلاس میت بپیوندید و تجربه جدیدی را شروع کنید</p>
            <button
              className={styles.ctaBtn}
              onClick={() => router.push("/login")}
            >
              شروع کنید - رایگان است
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>
                <Logo
                  type="horizontal"
                  width={120}
                  height={35}
                  className={styles.footerLogoImage}
                />
              </div>
              {/* <p>با هم، بهتر</p> */}
            </div>
            <div className={styles.footerLinks}>
              <a href="/about">درباره ما</a>
              <a href="/contact">تماس با ما</a>
              <a href="/terms">قوانین</a>
              <a href="/privacy">حریم خصوصی</a>
            </div>
          </div>
          <div className={styles.copyright}>
            © 2025 PlusMeet. تمامی حقوق محفوظ است.
          </div>
        </div>
      </footer>
    </div>
  );
}










