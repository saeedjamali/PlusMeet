/**
 * User Profile Page
 * صفحه پروفایل کاربر
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/NewAuthContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ChangePasswordModal from "@/components/user/ChangePasswordModal";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const {
    isAuthenticated,
    user: authUser,
    fetchWithAuth,
    refreshUser,
    loading: authLoading,
  } = useAuth();

  // State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    bio: "",
    email: "",
    userType: "individual",
    organizationName: "",
    nationalId: "",
    website: "",
    socialLinks: {
      instagram: "",
      telegram: "",
      twitter: "",
      linkedin: "",
    },
    location: {
      city: "",
      state: "",
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch profile
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetchWithAuth("/api/user/profile");

      if (!response.ok) {
        throw new Error("خطا در دریافت اطلاعات پروفایل");
      }

      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        setFormData({
          firstName: data.data.firstName || "",
          lastName: data.data.lastName || "",
          displayName: data.data.displayName || "",
          bio: data.data.bio || "",
          email: data.data.email || "",
          userType: data.data.userType || "individual",
          organizationName: data.data.organizationName || "",
          nationalId: data.data.nationalId || "",
          website: data.data.website || "",
          socialLinks: {
            instagram: data.data.socialLinks?.instagram || "",
            telegram: data.data.socialLinks?.telegram || "",
            twitter: data.data.socialLinks?.twitter || "",
            linkedin: data.data.socialLinks?.linkedin || "",
          },
          location: {
            city: data.data.location?.city || "",
            state: data.data.location?.state || "",
          },
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("خطا در دریافت اطلاعات پروفایل");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // بررسی نوع فایل
    if (!file.type.startsWith("image/")) {
      setError("فقط فایل‌های تصویری مجاز هستند");
      return;
    }

    // بررسی حجم (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("حجم تصویر نباید بیشتر از 2 مگابایت باشد");
      return;
    }

    try {
      setUploadingAvatar(true);
      setError("");

      // تبدیل به base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;

        const response = await fetchWithAuth("/api/user/upload-avatar", {
          method: "POST",
          body: JSON.stringify({
            image: base64,
            type: formData.userType === "individual" ? "avatar" : "logo",
          }),
        });

        const data = await response.json();

        if (data.success) {
          setSuccess("تصویر با موفقیت آپلود شد");
          // به‌روزرسانی پروفایل
          await fetchProfile();
          setTimeout(() => setSuccess(""), 3000);
        } else {
          setError(data.message || "خطا در آپلود تصویر");
        }
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setError("خطا در آپلود تصویر");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetchWithAuth("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("پروفایل با موفقیت به‌روزرسانی شد");
        setProfile(data.data);
        setIsEditing(false);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "خطا در به‌روزرسانی پروفایل");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("خطا در به‌روزرسانی پروفایل");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>در حال بارگذاری...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.errorContainer}>
        <p>خطا در بارگذاری پروفایل</p>
        <button onClick={() => router.push("/")} className={styles.backBtn}>
          بازگشت به صفحه اصلی
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ThemeToggle variant="floating" />

      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>پروفایل کاربری</h1>
            <p className={styles.phoneNumber}>{profile.phoneNumber}</p>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.backBtn} onClick={() => router.push("/")}>
              ← بازگشت
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className={styles.error}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.success}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            {success}
          </div>
        )}

        <div className={styles.profileGrid}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            {/* Avatar/Logo Card */}
            <div className={styles.avatarCard}>
              <div className={styles.avatarWrapper}>
                {profile.avatar || profile.organizationLogo ? (
                  <img
                    src={profile.avatar || profile.organizationLogo}
                    alt="Avatar"
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {formData.userType === "individual" ? "👤" : "🏢"}
                  </div>
                )}
                {uploadingAvatar && (
                  <div className={styles.uploadingOverlay}>
                    <div className={styles.spinner}></div>
                  </div>
                )}
              </div>
              <label className={styles.uploadBtn}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  style={{ display: "none" }}
                />
                📷 {uploadingAvatar ? "در حال آپلود..." : "تغییر تصویر"}
              </label>
            </div>

            {/* Info Card */}
            <div className={styles.infoCard}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>نوع حساب:</span>
                <span className={styles.infoBadge}>
                  {formData.userType === "individual" && "👤 شخصی"}
                  {formData.userType === "organization" && "🏢 سازمانی"}
                  {formData.userType === "government" && "🏛 دولتی"}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>وضعیت:</span>
                <span
                  className={`${styles.statusBadge} ${styles[profile.state]}`}
                >
                  {profile.state === "active" && "فعال"}
                  {profile.state === "verified" && "✓ تایید شده"}
                  {profile.state === "pending_verification" &&
                    "در انتظار تایید"}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>نقش‌ها:</span>
                <div className={styles.roles}>
                  {profile.roles?.map((role) => (
                    <span key={role} className={styles.roleBadge}>
                      {role === "user" && "کاربر"}
                      {role === "event_owner" && "مالک رویداد"}
                      {role === "moderator" && "ناظر"}
                      {role === "admin" && "مدیر"}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Upgrade Role Card */}
            {!profile.roles?.includes("event_owner") && (
              <div className={styles.upgradeCard}>
                <div className={styles.upgradeIcon}>⭐</div>
                <h3 className={styles.upgradeTitle}>مالک رویداد شوید</h3>
                <p className={styles.upgradeText}>
                  با فعال‌سازی نقش مالک رویداد، می‌توانید رویدادهای خود را ایجاد
                  و مدیریت کنید.
                </p>
                <button
                  className={styles.upgradeBtn}
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const response = await fetchWithAuth(
                        "/api/user/upgrade-role",
                        {
                          method: "POST",
                          body: JSON.stringify({ role: "event_owner" }),
                        }
                      );

                      const data = await response.json();

                      if (data.success) {
                        setSuccess("نقش شما با موفقیت ارتقا یافت!");
                        await fetchProfile(); // به‌روزرسانی پروفایل
                        await refreshUser(); // به‌روزرسانی user در AuthContext
                        setTimeout(() => setSuccess(""), 3000);
                      } else {
                        setError(data.message || "خطا در ارتقا نقش");
                      }
                    } catch (err) {
                      setError("خطا در ارتقا نقش");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  ⭐ فعال‌سازی نقش مالک رویداد
                </button>
              </div>
            )}

            {/* Change Password Button */}
            <button
              className={styles.changePasswordBtn}
              onClick={() => setShowPasswordModal(true)}
            >
              🔒 تغییر رمز عبور
            </button>
          </div>

          {/* Main Content */}
          <div className={styles.mainContent}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>اطلاعات شخصی</h2>
                {!isEditing ? (
                  <button
                    className={styles.editBtn}
                    onClick={() => setIsEditing(true)}
                  >
                    ✏️ ویرایش
                  </button>
                ) : (
                  <div className={styles.editActions}>
                    <button
                      className={styles.cancelBtn}
                      onClick={() => {
                        setIsEditing(false);
                        fetchProfile(); // بازگردانی به حالت قبل
                      }}
                    >
                      لغو
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                {/* نوع حساب */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    نوع حساب کاربری <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.userTypeButtons}>
                    <button
                      type="button"
                      className={`${styles.userTypeBtn} ${
                        formData.userType === "individual" ? styles.active : ""
                      }`}
                      onClick={() => {
                        if (isEditing) {
                          setFormData({ ...formData, userType: "individual" });
                        }
                      }}
                      disabled={!isEditing}
                    >
                      <span className={styles.userTypeIcon}>👤</span>
                      <span>شخصی</span>
                      <span className={styles.userTypeDesc}>فرد حقیقی</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.userTypeBtn} ${
                        formData.userType === "organization"
                          ? styles.active
                          : ""
                      }`}
                      onClick={() => {
                        if (isEditing) {
                          setFormData({
                            ...formData,
                            userType: "organization",
                          });
                        }
                      }}
                      disabled={!isEditing}
                    >
                      <span className={styles.userTypeIcon}>🏢</span>
                      <span>سازمانی</span>
                      <span className={styles.userTypeDesc}>برند / شرکت</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.userTypeBtn} ${
                        formData.userType === "government" ? styles.active : ""
                      }`}
                      onClick={() => {
                        if (isEditing) {
                          setFormData({ ...formData, userType: "government" });
                        }
                      }}
                      disabled={!isEditing}
                    >
                      <span className={styles.userTypeIcon}>🏛</span>
                      <span>دولتی</span>
                      <span className={styles.userTypeDesc}>سازمان عمومی</span>
                    </button>
                  </div>
                </div>

                {/* فیلدهای مشترک برای همه */}
                {formData.userType === "individual" ? (
                  <>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>نام</label>
                        <input
                          type="text"
                          name="firstName"
                          className={styles.input}
                          value={formData.firstName}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>نام خانوادگی</label>
                        <input
                          type="text"
                          name="lastName"
                          className={styles.input}
                          value={formData.lastName}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* فیلدهای سازمانی */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        نام سازمان / برند{" "}
                        <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        name="organizationName"
                        className={styles.input}
                        value={formData.organizationName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required={formData.userType !== "individual"}
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>نام مدیر</label>
                        <input
                          type="text"
                          name="firstName"
                          className={styles.input}
                          value={formData.firstName}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>
                          نام خانوادگی مدیر
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          className={styles.input}
                          value={formData.lastName}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>شناسه ملی / ثبت</label>
                      <input
                        type="text"
                        name="nationalId"
                        className={styles.input}
                        value={formData.nationalId}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="10 یا 11 رقم"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>وب‌سایت</label>
                      <input
                        type="url"
                        name="website"
                        className={styles.input}
                        value={formData.website}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="https://example.com"
                      />
                    </div>
                  </>
                )}

                {/* فیلدهای مشترک */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>نام نمایشی</label>
                  <input
                    type="text"
                    name="displayName"
                    className={styles.input}
                    value={formData.displayName}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>ایمیل</label>
                  <input
                    type="email"
                    name="email"
                    className={styles.input}
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="example@email.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>بیوگرافی</label>
                  <textarea
                    name="bio"
                    className={styles.textarea}
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="درباره خودتان بنویسید..."
                  />
                </div>

                {/* لوکیشن */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>استان</label>
                    <input
                      type="text"
                      name="location.state"
                      className={styles.input}
                      value={formData.location.state}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>شهر</label>
                    <input
                      type="text"
                      name="location.city"
                      className={styles.input}
                      value={formData.location.city}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* شبکه‌های اجتماعی */}
                <div className={styles.socialLinksSection}>
                  <h3>شبکه‌های اجتماعی</h3>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>📸 اینستاگرام</label>
                    <input
                      type="text"
                      name="socialLinks.instagram"
                      className={styles.input}
                      value={formData.socialLinks.instagram}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="username"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>✈️ تلگرام</label>
                    <input
                      type="text"
                      name="socialLinks.telegram"
                      className={styles.input}
                      value={formData.socialLinks.telegram}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="@username"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>🐦 توییتر</label>
                    <input
                      type="text"
                      name="socialLinks.twitter"
                      className={styles.input}
                      value={formData.socialLinks.twitter}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="@username"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>💼 لینکدین</label>
                    <input
                      type="text"
                      name="socialLinks.linkedin"
                      className={styles.input}
                      value={formData.socialLinks.linkedin}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="username"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                {isEditing && (
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className={styles.spinner}></span>
                        در حال ذخیره...
                      </>
                    ) : (
                      "💾 ذخیره تغییرات"
                    )}
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          fetchWithAuth={fetchWithAuth}
        />
      )}
    </div>
  );
}
