"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./eventCreate.module.css";
import "./eventCreateDark.css";
import Step2Details from "./Step2Details";
import Step3Details from "./Step3Details";
import Step4Details from "./Step4Details";
import Step5Details from "./Step5Details";
import Step6Details from "./Step6Details";
import Step7Details from "./Step7Details";

export default function CreateEventPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [eventId, setEventId] = useState(null);
  const [allCategories, setAllCategories] = useState({
    formatMode: [],
    impactPurpose: [],
    socialDynamics: [],
    audienceType: [],
    emotional: [],
    intent: [],
    participationType: [],
  });

  // State مرحله اول
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [formData, setFormData] = useState({
    // مرحله 1: اطلاعات عمومی
    title: "",
    description: "",
    topicCategory: null,
    topicSubcategory: null,
    images: [],
    coverImage: null,
    speakers: [], // سخنرانان، منتورها، مجریان (اختیاری)

    // مرحله 2: جزئیات بیشتر
    formatMode: null,
    location: {
      venue: "",
      address: "",
      city: "",
      province: "",
      coordinates: [0, 0],
      hideAddressUntilApproved: false,
    },
    onlinePlatform: "",
    onlineLink: "",
    capacity: null,
    impactPurpose: null,
    socialDynamics: null,
    audienceType: null,
    emotional: null,
    intent: null,
    participationType: null,
    tags: [],
    keywords: [],
    organizer: {
      name: "",
      email: "",
      phone: "",
      website: "",
    },

    // مرحله 3: نحوه شرکت و تاریخ
    approval: {
      pendingMessage: "",
      approvedMessage: "",
    },
    ticket: {
      type: "free", // free, paid, mixed
      price: 0,
      refundable: false,
      saleEndDate: "",
    },
    invitation: {
      inviteLink: "",
      inviteCode: "",
    },

    // مرحله 4: زمان برگزاری
    schedule: {
      eventDuration: "day", // day, week, month
      recurrence: "one-time", // one-time, recurring, ongoing
      startDate: "",
      endDate: "",
      daysOfWeek: [], // for recurring: ["saturday", "sunday", ...]
      sessionDuration: 0, // minutes, for recurring
      durationCategory: "medium", // short, medium, long
    },

    // مرحله 5: نمایش و دسترسی
    // مرحله 5: نمایش و دسترسی و اطلاعات تماس
    visibility: {
      level: "public", // public, unlisted, private
    },
    eligibility: ["active"], // ["active", "verified"]
    targetAudience: {
      gender: "all", // all, male, female
      ageRanges: ["all"], // ["all", "0-17", "18-25", "26-35", "36-50", "51+"]
      educationLevels: ["all"], // ["all", "diploma", "associate", "bachelor", "master", "phd"]
      skillLevels: ["all"], // ["all", "beginner", "intermediate", "advanced", "expert"]
    },
    contactInfo: {
      phone: "",
      email: "",
      showPhone: false, // پیش‌فرض: نمایش نده
      showEmail: true, // پیش‌فرض: نمایش بده
    },

    // تنظیمات گروه چت
    createGroupChat: false, // آیا گروه چت ساخته شود؟

    // تنظیمات گواهی‌نامه
    hasCertificate: false, // آیا گواهی‌نامه صادر شود؟
    certificateSettings: {
      title: "", // عنوان گواهی‌نامه
      issuerName: "", // نام صادرکننده
      minAttendancePercent: 80, // حداقل درصد حضور
      requiresCompletion: true, // نیاز به اتمام کامل رویداد
    },
  });

  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [formatModesLoading, setFormatModesLoading] = useState(false);
  const [error, setError] = useState(null);

  // State مرحله دوم
  const [formatModes, setFormatModes] = useState([]);
  const [selectedFormatMode, setSelectedFormatMode] = useState(null);

  // State مرحله سوم
  const [participationTypes, setParticipationTypes] = useState([]);
  const [selectedParticipationType, setSelectedParticipationType] =
    useState(null);
  const [participationTypesLoading, setParticipationTypesLoading] =
    useState(false);

  // دریافت دسته‌بندی‌ها
  useEffect(() => {
    fetchCategories();
    if (currentStep === 2) {
      fetchFormatModes();
    }
    if (currentStep === 3) {
      fetchParticipationTypes();
    }
  }, [currentStep]);

  // دریافت زیردسته‌ها وقتی دسته انتخاب میشه
  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory._id);
    } else {
      setSubcategories([]);
      setSelectedSubcategory(null);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      // فقط isVisible=true (دسته‌های فعال و غیرفعال هر دو نمایش داده می‌شوند)
      const response = await fetch("/api/topic-categories?parent=null", {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در دریافت دسته‌بندی‌ها");
      }

      setCategories(data.data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(err.message);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchFormatModes = async () => {
    try {
      setFormatModesLoading(true);
      const response = await fetch("/api/dashboard/format_mode", {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در دریافت نوع برگزاری");
      }

      setFormatModes(data.data || []);
    } catch (err) {
      console.error("Error fetching format modes:", err);
      setError(err.message);
    } finally {
      setFormatModesLoading(false);
    }
  };

  const fetchParticipationTypes = async () => {
    try {
      setParticipationTypesLoading(true);
      const response = await fetch("/api/dashboard/participationType", {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در دریافت نحوه شرکت");
      }

      setParticipationTypes(data.data || []);
    } catch (err) {
      console.error("Error fetching participation types:", err);
      setError(err.message);
    } finally {
      setParticipationTypesLoading(false);
    }
  };

  const fetchSubcategories = async (parentId) => {
    try {
      // دریافت زیردسته‌ها (فعال و غیرفعال)
      const response = await fetch(`/api/topic-categories?parent=${parentId}`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در دریافت زیردسته‌ها");
      }

      setSubcategories(data.data || []);
    } catch (err) {
      console.error("Error fetching subcategories:", err);
    }
  };

  const handleCategorySelect = (category) => {
    // چک کردن فعال بودن دسته
    if (!category.isActive) {
      setError(
        `دسته "${category.title}" در حال حاضر غیرفعال است و قابل انتخاب نیست`
      );
      return;
    }
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setError(null);
  };

  const handleSubcategorySelect = (subcategory) => {
    // چک کردن فعال بودن زیردسته
    if (!subcategory.isActive) {
      setError(
        `زیردسته "${subcategory.title}" در حال حاضر غیرفعال است و قابل انتخاب نیست`
      );
      return;
    }
    setSelectedSubcategory(subcategory);
    setError(null);
  };

  const handleChange = (field, value) => {
    // Support both formats: handleChange('field', value) AND handleChange({ target: { name, value } })
    if (typeof field === "object" && field.target) {
      const { name, value: val } = field.target;
      setFormData((prev) => ({ ...prev, [name]: val }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    setError(null);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    // محدودیت 10 تصویر
    const remainingSlots = 10 - formData.images.length;
    if (remainingSlots <= 0) {
      setError("حداکثر 10 تصویر می‌توانید بارگذاری کنید");
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setError(
        `فقط ${remainingSlots} تصویر باقی مانده. ${filesToUpload.length} تصویر آپلود می‌شود.`
      );
    }

    setLoading(true);

    try {
      const uploadedImages = [];

      for (const file of filesToUpload) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const response = await fetch("/api/events/upload-image", {
          method: "POST",
          credentials: "include",
          body: uploadFormData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "خطا در آپلود تصویر");
        }

        uploadedImages.push({
          url: data.data.url,
          alt: data.data.originalName,
          order: formData.images.length + uploadedImages.length,
        });
      }

      const newImages = [...formData.images, ...uploadedImages];
      setFormData((prev) => ({
        ...prev,
        images: newImages,
        // اگر تصویر اصلی نداریم، اولین تصویر رو به عنوان اصلی تنظیم کن
        coverImage:
          prev.coverImage || (newImages.length > 0 ? newImages[0].url : null),
      }));

      console.log("✅ تصاویر با موفقیت آپلود شدند:", uploadedImages);
    } catch (err) {
      console.error("❌ Error uploading images:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // آپلود تصویر برای سخنران / منتورها / مجریان
  const handleSpeakerImageUpload = async (e, speakerIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    // بررسی نوع فایل
    if (!file.type.startsWith('image/')) {
      setError("فقط فایل‌های تصویری مجاز هستند");
      return;
    }

    // بررسی حجم فایل (حداکثر 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("حجم فایل نباید بیشتر از 2 مگابایت باشد");
      return;
    }

    setLoading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch("/api/events/upload-image", {
        method: "POST",
        credentials: "include",
        body: uploadFormData,
        });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در آپلود تصویر");
      }

      // به‌روزرسانی تصویر speaker
      const newSpeakers = [...formData.speakers];
      newSpeakers[speakerIndex] = {
        ...newSpeakers[speakerIndex],
        image: data.data.url,
      };
      handleChange("speakers", newSpeakers);

      console.log("✅ تصویر سخنران با موفقیت آپلود شد:", data.data.url);
    } catch (err) {
      console.error("❌ Error uploading speaker image:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // حذف تصویر سخنران
  const handleRemoveSpeakerImage = (speakerIndex) => {
    const newSpeakers = [...formData.speakers];
    newSpeakers[speakerIndex] = {
      ...newSpeakers[speakerIndex],
      image: "",
    };
    handleChange("speakers", newSpeakers);
  };

  const handleRemoveImage = (index) => {
    const imageToRemove = formData.images[index];
    const newImages = formData.images.filter((_, i) => i !== index);

    setFormData((prev) => ({
      ...prev,
      images: newImages,
      // اگر تصویر حذف شده، cover بود، اولین تصویر رو cover کن
      coverImage:
        prev.coverImage === imageToRemove.url
          ? newImages.length > 0
            ? newImages[0].url
            : null
          : prev.coverImage,
    }));
  };

  const handleSetCoverImage = (imageUrl) => {
    setFormData((prev) => ({
      ...prev,
      coverImage: imageUrl,
    }));
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/html"));

    if (dragIndex === dropIndex) return;

    const newImages = [...formData.images];
    const [draggedImage] = newImages.splice(dragIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    // به‌روزرسانی order
    const updatedImages = newImages.map((img, idx) => ({
      ...img,
      order: idx,
    }));

    setFormData((prev) => ({
      ...prev,
      images: updatedImages,
    }));
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError(null);

    // اعتبارسنجی
    if (!formData.title.trim()) {
      setError("عنوان رویداد الزامی است");
      return;
    }

    if (!formData.description.trim()) {
      setError("توضیحات رویداد الزامی است");
      return;
    }

    if (!selectedCategory) {
      setError("انتخاب دسته‌بندی موضوع الزامی است");
      return;
    }

    // اگر زیردسته‌ها نمایش داده شده، باید یکی انتخاب بشه
    if (subcategories.length > 0 && !selectedSubcategory) {
      setError("انتخاب زیردسته الزامی است");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // به مرحله 2 برو
    setCurrentStep(2);
    window.scrollTo(0, 0);
  };

  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1);
    window.scrollTo(0, 0);
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo(0, 0);
  };

  const handleSaveDraft = async () => {
    // اعتبارسنجی حداقلی برای ذخیره پیش‌نویس
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !selectedCategory
    ) {
      alert("لطفاً حداقل عنوان، توضیحات و دسته‌بندی را وارد کنید");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // آماده‌سازی داده برای ذخیره پیش‌نویس
      const eventData = {
        ...formData,
        topicCategory: selectedCategory?._id,
        topicSubcategory: selectedSubcategory?._id,
        formatMode: selectedFormatMode?._id,
        participationType: selectedParticipationType?._id,
        status: "draft", // ✅ وضعیت: پیش‌نویس
        currentStep: currentStep, // ✅ ذخیره مرحله فعلی
        completedSteps: Array.from({ length: currentStep - 1 }, (_, i) => i + 1), // مراحل تکمیل شده
      };

      console.log("💾 Saving draft with currentStep:", currentStep, eventData);

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در ذخیره پیش‌نویس");
      }

      console.log("✅ Draft saved successfully:", data);

      alert("✅ پیش‌نویس با موفقیت ذخیره شد!");
      
      // انتقال به صفحه رویدادهای من
      router.push("/dashboard/myEvents");
    } catch (err) {
      console.error("❌ Error saving draft:", err);
      setError(err.message);
      alert(`خطا در ذخیره پیش‌نویس: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // آماده‌سازی داده برای ارسال
      const eventData = {
        ...formData,
        topicCategory: selectedCategory?._id,
        topicSubcategory: selectedSubcategory?._id,
        formatMode: selectedFormatMode?._id,
        participationType: selectedParticipationType?._id,
        status: "pending", // وضعیت: در انتظار تایید (پیش‌فرض برای submit نهایی)
      };

      console.log("📤 Sending event data:", eventData);

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در ثبت رویداد");
      }

      console.log("✅ Event created successfully:", data);

      // نمایش پیام موفقیت و انتقال به صفحه رویدادهای من
      alert("✅ رویداد با موفقیت ثبت شد و در انتظار تایید است");
      router.push("/dashboard/myEvents");
    } catch (err) {
      console.error("❌ Error creating event:", err);
      setError(err.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>🎉</span>
            ایجاد رویداد جدید
          </h1>
          <p className={styles.subtitle}>
            مرحله {currentStep}:{" "}
            {currentStep === 1
              ? "اطلاعات عمومی"
              : currentStep === 2
              ? "نوع برگزاری"
              : currentStep === 3
              ? "نحوه شرکت"
              : currentStep === 4
              ? "زمان برگزاری"
              : currentStep === 5
              ? "نمایش و دسترسی"
              : currentStep === 6
              ? "سایر دسته‌بندی‌ها"
              : "پیش‌نمایش و ثبت"}
          </p>
        </div>

        <button
          type="button"
          className={styles.draftBtn}
          onClick={handleSaveDraft}
          disabled={loading}
        >
          💾 ذخیره پیش‌نویس
        </button>
      </div>

      {/* Progress Steps */}
      <div className={styles.steps}>
        <div
          className={`${styles.step} ${
            currentStep >= 1 ? styles.stepActive : ""
          }`}
        >
          <div className={styles.stepNumber}>1</div>
          <span>اطلاعات عمومی</span>
        </div>
        <div className={styles.stepLine}></div>
        <div
          className={`${styles.step} ${
            currentStep >= 2 ? styles.stepActive : ""
          }`}
        >
          <div className={styles.stepNumber}>2</div>
          <span>نوع تعامل</span>
        </div>
        <div className={styles.stepLine}></div>
        <div
          className={`${styles.step} ${
            currentStep >= 3 ? styles.stepActive : ""
          }`}
        >
          <div className={styles.stepNumber}>3</div>
          <span>نحوه شرکت در رویداد</span>
        </div>
        <div className={styles.stepLine}></div>
        <div
          className={`${styles.step} ${
            currentStep >= 4 ? styles.stepActive : ""
          }`}
        >
          <div className={styles.stepNumber}>4</div>
          <span>زمان رویداد</span>
        </div>
        <div className={styles.stepLine}></div>
        <div
          className={`${styles.step} ${
            currentStep >= 5 ? styles.stepActive : ""
          }`}
        >
          <div className={styles.stepNumber}>5</div>
          <span>نمایش و دسترسی</span>
        </div>
        <div className={styles.stepLine}></div>
        <div
          className={`${styles.step} ${
            currentStep >= 6 ? styles.stepActive : ""
          }`}
        >
          <div className={styles.stepNumber}>6</div>
          <span>سایر دسته‌بندی‌ها</span>
        </div>
        <div className={styles.stepLine}></div>
        <div
          className={`${styles.step} ${
            currentStep >= 7 ? styles.stepActive : ""
          }`}
        >
          <div className={styles.stepNumber}>7</div>
          <span>پیش‌نمایش و ثبت</span>
        </div>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <span>⚠️</span>
          {error}
        </div>
      )}

      {/* مرحله 1: اطلاعات عمومی */}
      {currentStep === 1 && (
        <form className={styles.form} onSubmit={handleStep1Submit}>
          {/* انتخاب دسته‌بندی موضوع */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📂</span>
              انتخاب دسته‌بندی موضوع <span className={styles.required}>*</span>
            </h2>
            <p className={styles.sectionHint}>
              رویداد شما در چه حوزه‌ای قرار می‌گیرد؟
            </p>

            {categoriesLoading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>در حال بارگذاری دسته‌بندی‌ها...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📂</span>
                <p>هیچ دسته‌بندی فعالی یافت نشد</p>
                <p className={styles.emptyHint}>
                  لطفاً ابتدا از پنل مدیریت، دسته‌بندی‌های موضوع را ایجاد کنید
                </p>
              </div>
            ) : (
              <>
                {/* Grid فشرده دسته‌ها */}
                <div className={styles.compactCategoriesGrid}>
                  {categories.map((cat) => (
                    <div key={cat._id} className={styles.categoryWrapper}>
                      <button
                        type="button"
                        className={`${styles.compactCategoryCard} ${
                          selectedCategory?._id === cat._id
                            ? styles.compactCategoryCardSelected
                            : ""
                        } ${
                          !cat.isActive
                            ? styles.compactCategoryCardDisabled
                            : ""
                        }`}
                        onClick={() => handleCategorySelect(cat)}
                        disabled={!cat.isActive}
                        title={
                          !cat.isActive
                            ? "این دسته در حال حاضر غیرفعال است"
                            : cat.title
                        }
                      >
                        <span className={styles.compactCategoryIcon}>
                          {cat.icon}
                        </span>
                        <span className={styles.compactCategoryTitle}>
                          {cat.title}
                        </span>
                        {!cat.isActive && (
                          <span className={styles.disabledBadge}>غیرفعال</span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                {/* نمایش توضیحات دسته انتخاب شده */}
                {/* {selectedCategory && (
                  <div className={styles.categoryDetails}>
                    <div className={styles.categoryDetailsHeader}>
                      <span className={styles.categoryDetailsIcon}>
                        {selectedCategory.icon}
                      </span>
                      <h3 className={styles.categoryDetailsTitle}>
                        {selectedCategory.title}
                      </h3>
                    </div>
                    {selectedCategory.description && (
                      <p className={styles.categoryDetailsDesc}>
                        {selectedCategory.description}
                      </p>
                    )}
                    {selectedCategory.examples &&
                      selectedCategory.examples.length > 0 && (
                        <div className={styles.categoryDetailsExamples}>
                          <strong>💡 مثال‌ها:</strong>
                          <ul>
                            {selectedCategory.examples.map((example, idx) => (
                              <li key={idx}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                )} */}
              </>
            )}
          </section>

          {/* انتخاب زیردسته (اگر وجود داشت) */}
          {selectedCategory && subcategories.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>📌</span>
                انتخاب زیردسته <span className={styles.required}>*</span>
              </h2>
              <p className={styles.sectionHint}>
                رویداد شما دقیقاً در کدام زیرمجموعه قرار می‌گیرد؟
              </p>

              <div className={styles.subcategoriesGrid}>
                {subcategories.map((sub) => (
                  <button
                    key={sub._id}
                    type="button"
                    className={`${styles.subcategoryCard} ${
                      selectedSubcategory?._id === sub._id
                        ? styles.subcategoryCardSelected
                        : ""
                    } ${!sub.isActive ? styles.subcategoryCardDisabled : ""}`}
                    onClick={() => handleSubcategorySelect(sub)}
                    disabled={!sub.isActive}
                    title={
                      !sub.isActive
                        ? "این زیردسته در حال حاضر غیرفعال است"
                        : sub.title
                    }
                  >
                    <span className={styles.subcategoryIcon}>{sub.icon}</span>
                    <span className={styles.subcategoryTitle}>
                      {sub.title}
                      {!sub.isActive && (
                        <span className={styles.disabledText}> (غیرفعال)</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* عنوان رویداد */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>✏️</span>
              عنوان رویداد <span className={styles.required}>*</span>
            </h2>
            <input
              type="text"
              className={styles.input}
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder={
                (selectedSubcategory && selectedSubcategory.usage
                  ? `مثلاً: ${selectedSubcategory.usage}`
                  : null) ||
                (selectedCategory && selectedCategory.usage
                  ? `مثلاً: ${selectedCategory.usage}`
                  : null) ||
                "مثلاً: کارگاه آموزش برنامه‌نویسی Python"
              }
              maxLength={200}
              required
            />
            <span className={styles.charCount}>
              {formData.title.length}/200
            </span>
          </section>

          {/* توضیحات رویداد */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📝</span>
              توضیحات رویداد <span className={styles.required}>*</span>
            </h2>
            <p className={styles.sectionHint}>
              رویداد خود را به طور کامل توضیح دهید. چه چیزی یاد می‌گیرند؟ چه
              کسانی باید شرکت کنند؟
            </p>
            <textarea
              className={styles.textarea}
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="توضیحات کامل رویداد خود را بنویسید..."
              rows={8}
              required
            />
          </section>

          {/* تصاویر */}
          {/* سخنرانان / منتورها / مجریان (اختیاری) */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>👥</span>
              سخنرانان / منتورها / مجریان
              <span className={styles.optional}>(اختیاری)</span>
            </h2>
            <p className={styles.sectionHint}>
              معرفی افراد کلیدی رویداد (سخنران، منتور، مجری و...)
            </p>

            {formData.speakers.map((speaker, index) => (
              <div key={index} className={styles.speakerCard}>
                <div className={styles.speakerCardHeader}>
                  <h4>فرد {index + 1}</h4>
                  <button
                    type="button"
                    className={styles.removeSpeakerBtn}
                    onClick={() => {
                      const newSpeakers = formData.speakers.filter(
                        (_, i) => i !== index
                      );
                      handleChange("speakers", newSpeakers);
                    }}
                    title="حذف"
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      نام و نام خانوادگی{" "}
                      <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      value={speaker.name || ""}
                      onChange={(e) => {
                        const newSpeakers = [...formData.speakers];
                        newSpeakers[index] = {
                          ...newSpeakers[index],
                          name: e.target.value,
                        };
                        handleChange("speakers", newSpeakers);
                      }}
                      placeholder="مثلاً: دکتر علی محمدی"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>نقش</label>
                    <select
                      className={styles.input}
                      value={speaker.role || "speaker"}
                      onChange={(e) => {
                        const newSpeakers = [...formData.speakers];
                        newSpeakers[index] = {
                          ...newSpeakers[index],
                          role: e.target.value,
                        };
                        handleChange("speakers", newSpeakers);
                      }}
                    >
                      <option value="speaker">سخنران</option>
                      <option value="mentor">منتور</option>
                      <option value="host">مجری</option>
                      <option value="instructor">مدرس</option>
                      <option value="moderator">مدیر جلسه</option>
                      <option value="other">سایر</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>بیوگرافی کوتاه</label>
                  <textarea
                    className={styles.textarea}
                    rows={3}
                    value={speaker.bio || ""}
                    onChange={(e) => {
                      const newSpeakers = [...formData.speakers];
                      newSpeakers[index] = {
                        ...newSpeakers[index],
                        bio: e.target.value,
                      };
                      handleChange("speakers", newSpeakers);
                    }}
                    placeholder="توضیحات کوتاهی درباره تخصص و سوابق (حداکثر 500 کاراکتر)"
                    maxLength={500}
                  />
                  <span className={styles.charCounter}>
                    {speaker.bio?.length || 0}/500
                  </span>
                </div>

                {/* تصویر سخنران */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    تصویر{" "}
                    <span className={styles.optional}>(اختیاری)</span>
                  </label>
                  
                  {speaker.image ? (
                    <div className={styles.speakerImagePreview}>
                      <img
                        src={speaker.image}
                        alt={speaker.name || "تصویر"}
                        className={styles.speakerImage}
                      />
                      <button
                        type="button"
                        className={styles.removeSpeakerImageBtn}
                        onClick={() => handleRemoveSpeakerImage(index)}
                        title="حذف تصویر"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className={styles.speakerImageUploadArea}>
                      <input
                        type="file"
                        id={`speakerImage-${index}`}
                        accept="image/*"
                        onChange={(e) => handleSpeakerImageUpload(e, index)}
                        className={styles.fileInput}
                        disabled={loading}
                      />
                      <label
                        htmlFor={`speakerImage-${index}`}
                        className={styles.speakerUploadLabel}
                      >
                        <span className={styles.uploadIcon}>📸</span>
                        <span>انتخاب تصویر</span>
                        <span className={styles.uploadHint}>
                          JPG, PNG (حداکثر 2MB)
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              className={styles.addSpeakerBtn}
              onClick={() => {
                handleChange("speakers", [
                  ...formData.speakers,
                  {
                    name: "",
                    role: "speaker",
                    bio: "",
                    image: "",
                    socialLinks: {},
                  },
                ]);
              }}
            >
              <span>➕</span>
              افزودن سخنران / منتور / مجری
            </button>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🖼️</span>
              تصاویر رویداد
              <span className={styles.imageCounter}>
                ({formData.images.length}/10)
              </span>
            </h2>
            <p className={styles.sectionHint}>
              حداکثر 10 تصویر - تصاویر را با کشیدن می‌توانید مرتب کنید
            </p>

            {formData.images.length < 10 && (
              <div className={styles.imageUploadArea}>
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className={styles.fileInput}
                  disabled={loading}
                />
                <label htmlFor="imageUpload" className={styles.uploadLabel}>
                  <span className={styles.uploadIcon}>📸</span>
                  <span>
                    انتخاب تصاویر ({10 - formData.images.length} باقی‌مانده)
                  </span>
                  <span className={styles.uploadHint}>
                    JPG, PNG یا GIF (حداکثر 5MB)
                  </span>
                </label>
              </div>
            )}

            {formData.images.length > 0 && (
              <div className={styles.imagesPreview}>
                {formData.images.map((img, index) => (
                  <div
                    key={index}
                    className={`${styles.imagePreviewCard} ${
                      formData.coverImage === img.url
                        ? styles.coverImageCard
                        : ""
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <img
                      src={img.url}
                      alt={img.alt}
                      className={styles.previewImage}
                    />

                    {/* Overlay برای انتخاب تصویر اصلی */}
                    <div
                      className={styles.coverOverlay}
                      onClick={() => handleSetCoverImage(img.url)}
                    >
                      <div className={styles.coverCheckbox}>
                        <input
                          type="radio"
                          name="coverImage"
                          checked={formData.coverImage === img.url}
                          onChange={() => handleSetCoverImage(img.url)}
                          className={styles.coverRadio}
                        />
                        <span className={styles.coverLabel}>تصویر اصلی</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.removeImageBtn}
                      onClick={() => handleRemoveImage(index)}
                      title="حذف تصویر"
                    >
                      ✕
                    </button>

                    <span className={styles.dragHandle}>⋮⋮</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* دکمه‌های عملیات */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => router.push("/dashboard/events")}
            >
              انصراف
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              مرحله بعد
              <span>→</span>
            </button>
          </div>
        </form>
      )}

      {/* مرحله 2: جزئیات بیشتر */}
      {currentStep === 2 && (
        <Step2Details
          formData={formData}
          handleChange={handleChange}
          loading={loading}
          error={error}
          setError={setError}
          allCategories={allCategories}
          formatModes={formatModes}
          selectedFormatMode={selectedFormatMode}
          setSelectedFormatMode={setSelectedFormatMode}
          formatModesLoading={formatModesLoading}
          onPrev={handlePrevStep}
          onNext={handleNextStep}
        />
      )}

      {/* مرحله 3: نحوه شرکت و تاریخ */}
      {currentStep === 3 && (
        <Step3Details
          formData={formData}
          handleChange={handleChange}
          loading={loading}
          error={error}
          setError={setError}
          participationTypes={participationTypes}
          selectedParticipationType={selectedParticipationType}
          setSelectedParticipationType={setSelectedParticipationType}
          participationTypesLoading={participationTypesLoading}
          onPrev={handlePrevStep}
          onNext={handleNextStep}
        />
      )}

      {/* مرحله 4: زمان برگزاری */}
      {currentStep === 4 && (
        <Step4Details
          formData={formData}
          handleChange={handleChange}
          loading={loading}
          error={error}
          setError={setError}
          onPrev={handlePrevStep}
          onNext={handleNextStep}
        />
      )}

      {/* مرحله 5: نمایش و دسترسی */}
      {currentStep === 5 && (
        <Step5Details
          formData={formData}
          handleChange={handleChange}
          loading={loading}
          error={error}
          setError={setError}
          selectedParticipationType={selectedParticipationType}
          onPrev={handlePrevStep}
          onNext={handleNextStep}
        />
      )}

      {/* مرحله 6: سایر دسته‌بندی‌ها */}
      {currentStep === 6 && (
        <Step6Details
          formData={formData}
          handleChange={handleChange}
          loading={loading}
          error={error}
          setError={setError}
          onPrev={handlePrevStep}
          onNext={handleNextStep}
        />
      )}

      {/* مرحله 7: پیش‌نمایش و ثبت نهایی */}
      {currentStep === 7 && (
        <Step7Details
          formData={formData}
          loading={loading}
          error={error}
          setError={setError}
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          selectedFormatMode={selectedFormatMode}
          selectedParticipationType={selectedParticipationType}
          onPrev={handlePrevStep}
          onSubmit={handleFinalSubmit}
        />
      )}
    </div>
  );
}










