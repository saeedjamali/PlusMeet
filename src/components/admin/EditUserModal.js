/**
 * EditUserModal Component
 * مدال ویرایش اطلاعات کاربر
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/NewAuthContext";
import styles from "./EditUserModal.module.css";

export default function EditUserModal({ user, isOpen, onClose, onSuccess }) {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Form State
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: "",
    lastName: "",
    displayName: "",
    email: "",
    nationalId: "",
    bio: "",
    state: "active",
    userType: "individual",

    // Individual Info
    dateOfBirth: "",
    gender: "",
    city: "",
    personalAddress: "",

    // Organization Info
    organizationName: "",
    registrationNumber: "",
    taxId: "",
    website: "",
    organizationEmail: "",
    description: "",

    // Address
    addressCity: "",
    addressProvince: "",
    postalCode: "",
    fullAddress: "",

    // Contact Person
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    contactPosition: "",

    // Social Links
    instagram: "",
    telegram: "",
    linkedin: "",
    twitter: "",
    facebook: "",
    websiteLink: "",
  });

  // Load user data when modal opens
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        displayName: user.displayName || "",
        email: user.email || "",
        nationalId: user.nationalId || "",
        bio: user.bio || "",
        state: user.state || "active",
        userType: user.userType || "individual",

        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: user.gender || "",
        city: user.city || "",
        personalAddress: user.personalAddress || "",

        organizationName: user.organizationName || "",
        registrationNumber: user.registrationNumber || "",
        taxId: user.taxId || "",
        website: user.website || "",
        organizationEmail: user.organizationEmail || "",
        description: user.description || "",

        addressCity: user.address?.city || "",
        addressProvince: user.address?.province || "",
        postalCode: user.address?.postalCode || "",
        fullAddress: user.address?.fullAddress || "",

        contactName: user.contactPerson?.name || "",
        contactPhone: user.contactPerson?.phone || "",
        contactEmail: user.contactPerson?.email || "",
        contactPosition: user.contactPerson?.position || "",

        instagram: user.socialLinks?.instagram || "",
        telegram: user.socialLinks?.telegram || "",
        linkedin: user.socialLinks?.linkedin || "",
        twitter: user.socialLinks?.twitter || "",
        facebook: user.socialLinks?.facebook || "",
        websiteLink: user.socialLinks?.website || "",
      });
      setActiveTab("basic");
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ساخت payload بر اساس userType
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: formData.displayName,
        email: formData.email,
        nationalId: formData.nationalId,
        bio: formData.bio,
        state: formData.state,
        userType: formData.userType,
      };

      // فیلدهای فردی
      if (formData.userType.startsWith("individual")) {
        if (formData.dateOfBirth) payload.dateOfBirth = formData.dateOfBirth;
        if (formData.gender) payload.gender = formData.gender;
        if (formData.city) payload.city = formData.city;
        if (formData.personalAddress)
          payload.personalAddress = formData.personalAddress;
      }

      // فیلدهای سازمانی
      if (
        formData.userType.startsWith("organization") ||
        formData.userType === "government"
      ) {
        if (formData.organizationName)
          payload.organizationName = formData.organizationName;
        if (formData.registrationNumber)
          payload.registrationNumber = formData.registrationNumber;
        if (formData.taxId) payload.taxId = formData.taxId;
        if (formData.website) payload.website = formData.website;
        if (formData.organizationEmail)
          payload.organizationEmail = formData.organizationEmail;
        if (formData.description) payload.description = formData.description;

        // Address
        if (
          formData.addressCity ||
          formData.addressProvince ||
          formData.postalCode ||
          formData.fullAddress
        ) {
          payload.address = {
            city: formData.addressCity,
            province: formData.addressProvince,
            postalCode: formData.postalCode,
            fullAddress: formData.fullAddress,
          };
        }

        // Contact Person
        if (
          formData.contactName ||
          formData.contactPhone ||
          formData.contactEmail ||
          formData.contactPosition
        ) {
          payload.contactPerson = {
            name: formData.contactName,
            phone: formData.contactPhone,
            email: formData.contactEmail,
            position: formData.contactPosition,
          };
        }
      }

      // Social Links (برای همه)
      if (
        formData.instagram ||
        formData.telegram ||
        formData.linkedin ||
        formData.twitter ||
        formData.facebook ||
        formData.websiteLink
      ) {
        payload.socialLinks = {
          instagram: formData.instagram,
          telegram: formData.telegram,
          linkedin: formData.linkedin,
          twitter: formData.twitter,
          facebook: formData.facebook,
          website: formData.websiteLink,
        };
      }

      const response = await fetchWithAuth(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert("اطلاعات کاربر با موفقیت به‌روزرسانی شد");
        onSuccess();
        onClose();
      } else {
        alert(data.error || "خطا در به‌روزرسانی اطلاعات");
      }
    } catch (err) {
      console.error("Error updating user:", err);
      alert("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const isOrganization =
    formData.userType.startsWith("organization") ||
    formData.userType === "government";
  const isIndividual = formData.userType.startsWith("individual");

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2>ویرایش اطلاعات کاربر</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "basic" ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab("basic")}
          >
            اطلاعات پایه
          </button>
          {isIndividual && (
            <button
              className={`${styles.tab} ${
                activeTab === "personal" ? styles.tabActive : ""
              }`}
              onClick={() => setActiveTab("personal")}
            >
              اطلاعات شخصی
            </button>
          )}
          {isOrganization && (
            <>
              <button
                className={`${styles.tab} ${
                  activeTab === "organization" ? styles.tabActive : ""
                }`}
                onClick={() => setActiveTab("organization")}
              >
                اطلاعات سازمانی
              </button>
              <button
                className={`${styles.tab} ${
                  activeTab === "address" ? styles.tabActive : ""
                }`}
                onClick={() => setActiveTab("address")}
              >
                آدرس و تماس
              </button>
            </>
          )}
          <button
            className={`${styles.tab} ${
              activeTab === "social" ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab("social")}
          >
            شبکه‌های اجتماعی
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            {/* Tab: Basic Info */}
            {activeTab === "basic" && (
              <div className={styles.tabContent}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>
                      نام <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>
                      نام خانوادگی <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>نام نمایشی</label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      placeholder="نام‌ای که در سایت نمایش داده می‌شود"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>ایمیل</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>نوع کاربر</label>
                    <select
                      name="userType"
                      value={formData.userType}
                      onChange={handleChange}
                    >
                      <option value="individual">فردی</option>
                      <option value="individual_freelancer">
                        فردی - فریلنسر/مدرس
                      </option>
                      <option value="organization">سازمانی</option>
                      <option value="organization_team">
                        سازمانی - تیم/گروه غیررسمی
                      </option>
                      <option value="organization_private">
                        سازمانی - شرکت خصوصی
                      </option>
                      <option value="organization_public">
                        سازمانی - دولتی/عمومی
                      </option>
                      <option value="organization_ngo">
                        سازمانی - NGO/خیریه
                      </option>
                      <option value="organization_edu">
                        سازمانی - مدرسه/دانشگاه
                      </option>
                      <option value="organization_media">
                        سازمانی - رسانه/خبرگزاری
                      </option>
                      <option value="government">دولتی</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>وضعیت</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                    >
                      <option value="active">فعال</option>
                      <option value="pending_verification">
                        در انتظار تایید
                      </option>
                      <option value="verified">تایید شده</option>
                      <option value="suspended">معلق</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>کد ملی</label>
                  <input
                    type="text"
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleChange}
                    maxLength={10}
                    dir="ltr"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>بیوگرافی</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    maxLength={500}
                    placeholder="توضیحات کوتاه درباره کاربر..."
                  />
                  <small>{formData.bio.length}/500</small>
                </div>
              </div>
            )}

            {/* Tab: Personal Info (Individual only) */}
            {activeTab === "personal" && isIndividual && (
              <div className={styles.tabContent}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>تاریخ تولد</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>جنسیت</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">انتخاب کنید</option>
                      <option value="male">مرد</option>
                      <option value="female">زن</option>
                      <option value="other">سایر</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>شهر</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>آدرس</label>
                  <textarea
                    name="personalAddress"
                    value={formData.personalAddress}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Tab: Organization Info */}
            {activeTab === "organization" && isOrganization && (
              <div className={styles.tabContent}>
                <div className={styles.formGroup}>
                  <label>نام سازمان</label>
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>شماره ثبت</label>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      dir="ltr"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>شناسه ملی</label>
                    <input
                      type="text"
                      name="taxId"
                      value={formData.taxId}
                      onChange={handleChange}
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>وب‌سایت</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      dir="ltr"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>ایمیل سازمان</label>
                    <input
                      type="email"
                      name="organizationEmail"
                      value={formData.organizationEmail}
                      onChange={handleChange}
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>توضیحات</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="توضیحات کامل درباره سازمان..."
                  />
                </div>
              </div>
            )}

            {/* Tab: Address & Contact */}
            {activeTab === "address" && isOrganization && (
              <div className={styles.tabContent}>
                <h3 className={styles.sectionTitle}>آدرس</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>شهر</label>
                    <input
                      type="text"
                      name="addressCity"
                      value={formData.addressCity}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>استان</label>
                    <input
                      type="text"
                      name="addressProvince"
                      value={formData.addressProvince}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>کد پستی</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    maxLength={10}
                    dir="ltr"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>آدرس کامل</label>
                  <textarea
                    name="fullAddress"
                    value={formData.fullAddress}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>

                <h3 className={styles.sectionTitle}>شخص تماس</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>نام</label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>سمت</label>
                    <input
                      type="text"
                      name="contactPosition"
                      value={formData.contactPosition}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>شماره تماس</label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      dir="ltr"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>ایمیل</label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Social Links */}
            {activeTab === "social" && (
              <div className={styles.tabContent}>
                <div className={styles.formGroup}>
                  <label>Instagram</label>
                  <input
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    dir="ltr"
                    placeholder="@username"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Telegram</label>
                  <input
                    type="text"
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleChange}
                    dir="ltr"
                    placeholder="@username"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>LinkedIn</label>
                  <input
                    type="text"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    dir="ltr"
                    placeholder="username"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Twitter/X</label>
                  <input
                    type="text"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                    dir="ltr"
                    placeholder="@username"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Facebook</label>
                  <input
                    type="text"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                    dir="ltr"
                    placeholder="username"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>وب‌سایت شخصی</label>
                  <input
                    type="url"
                    name="websiteLink"
                    value={formData.websiteLink}
                    onChange={handleChange}
                    dir="ltr"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              انصراف
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

