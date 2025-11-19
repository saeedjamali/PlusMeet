import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    // ═══════════════════════════════════════════════════════════
    // اطلاعات پایه
    // ═══════════════════════════════════════════════════════════
    title: {
      type: String,
      required: [true, "عنوان رویداد الزامی است"],
      trim: true,
      maxlength: [200, "عنوان نباید بیشتر از 200 کاراکتر باشد"],
    },

    slug: {
      type: String,
      unique: true,
      sparse: true, // برای پیش‌نویس‌ها که slug ندارند
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: [true, "توضیحات الزامی است"],
      trim: true,
    },

    // ═══════════════════════════════════════════════════════════
    // دسته‌بندی‌ها
    // ═══════════════════════════════════════════════════════════
    topicCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TopicCategory",
      required: [true, "دسته‌بندی موضوع الزامی است"],
      index: true,
    },

    topicSubcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TopicCategory",
      index: true,
    },

    formatMode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FormatModeCategory",
      index: true,
    },

    impactPurpose: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ImpactPurposeCategory",
      index: true,
    },

    socialDynamics: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocialDynamicsCategory",
      index: true,
    },

    audienceType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AudienceTypeCategory",
      index: true,
    },

    emotional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmotionalCategory",
      index: true,
    },

    intent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IntentCategory",
      index: true,
    },

    participationType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParticipationTypeCategory",
      index: true,
    },

    // ═══════════════════════════════════════════════════════════
    // نمایش و دسترسی
    // ═══════════════════════════════════════════════════════════
    visibility: {
      level: {
        type: String,
        enum: ["public", "unlisted", "private"],
        default: "public",
        index: true,
      },
    },

    eligibility: [
      {
        type: String,
        enum: ["active", "verified"],
      },
    ],

    targetAudience: {
      gender: {
        type: String,
        enum: ["all", "male", "female"],
        default: "all",
      },
      ageRanges: [
        {
          type: String,
          enum: ["all", "0-17", "18-25", "26-35", "36-50", "51+"],
        },
      ],
      educationLevels: [
        {
          type: String,
          enum: ["all", "diploma", "associate", "bachelor", "master", "phd"],
        },
      ],
      skillLevels: [
        {
          type: String,
          enum: ["all", "beginner", "intermediate", "advanced", "expert"],
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // تصاویر
    // ═══════════════════════════════════════════════════════════
    images: [
      {
        url: String,
        alt: String,
        order: Number,
      },
    ],

    coverImage: {
      type: String,
      default: null,
    },

    // ═══════════════════════════════════════════════════════════
    // اطلاعات زمانی
    // ═══════════════════════════════════════════════════════════
    startDate: {
      type: Date,
      index: true,
    },

    endDate: {
      type: Date,
      index: true,
    },

    // اطلاعات زمان‌بندی تکمیلی
    schedule: {
      eventDuration: {
        type: String,
        enum: ["day", "week", "month"],
        default: "day",
      },
      recurrence: {
        type: String,
        enum: ["one-time", "recurring", "ongoing"],
        default: "one-time",
      },
      daysOfWeek: [
        {
          type: String,
          enum: [
            "saturday",
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
          ],
        },
      ],
      sessionDuration: {
        type: Number, // دقیقه
        min: 0,
      },
      durationCategory: {
        type: String,
        enum: ["short", "medium", "long"],
      },
    },

    registrationDeadline: {
      type: Date,
      index: true,
    },

    // ═══════════════════════════════════════════════════════════
    // اطلاعات مکانی
    // ═══════════════════════════════════════════════════════════
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        index: "2dsphere",
      },
      address: String,
      city: String,
      city_code: {
        type: String,
        index: true, // برای فیلتر سریع
      },
      province: String,
      province_code: {
        type: String,
        index: true, // برای فیلتر سریع
      },
      latitude: Number,
      longitude: Number,
      postalCode: String,
      venue: String, // نام مکان
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    onlineLink: {
      type: String,
      trim: true,
    },

    onlinePlatform: {
      type: String,
      trim: true,
    },

    // ═══════════════════════════════════════════════════════════
    // بلیط و قیمت‌گذاری
    // ═══════════════════════════════════════════════════════════
    ticket: {
      type: {
        type: String,
        enum: ["free", "paid", "mixed"],
        default: "free",
      },
      price: {
        type: Number,
        min: 0,
        default: 0,
      },
      discountCodes: [
        {
          code: String,
          discountPercent: {
            type: Number,
            min: 0,
            max: 100,
          },
        },
      ],
      refundable: {
        type: Boolean,
        default: false,
      },
      saleEndDate: Date,
    },

    // ═══════════════════════════════════════════════════════════
    // تایید و پیام‌ها
    // ═══════════════════════════════════════════════════════════
    approval: {
      pendingMessage: String,
      approvedMessage: String,
    },

    // ═══════════════════════════════════════════════════════════
    // دعوت‌نامه (برای رویدادهای خصوصی)
    // ═══════════════════════════════════════════════════════════
    invitation: {
      inviteLink: String,
      inviteCode: String,
    },

    // ═══════════════════════════════════════════════════════════
    // ظرفیت و شرکت‌کنندگان
    // ═══════════════════════════════════════════════════════════
    capacity: {
      type: Number,
      min: [0, "ظرفیت نمی‌تواند منفی باشد"],
      default: null,
    },

    registeredCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    waitingListCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ═══════════════════════════════════════════════════════════
    // اطلاعات مالی
    // ═══════════════════════════════════════════════════════════
    isFree: {
      type: Boolean,
      default: true,
    },

    price: {
      amount: {
        type: Number,
        min: [0, "قیمت نمی‌تواند منفی باشد"],
        default: 0,
      },
      currency: {
        type: String,
        default: "IRR",
        enum: ["IRR", "USD", "EUR"],
      },
    },

    // ═══════════════════════════════════════════════════════════
    // وضعیت رویداد
    // ═══════════════════════════════════════════════════════════
    status: {
      type: String,
      enum: [
        "draft", // پیش‌نویس
        "pending", // در انتظار تایید
        "approved", // تایید شده
        "rejected", // رد شده
        "suspended", // تعلیق
        "deleted", // حذف شده
        "finished", // خاتمه یافته (توسط مالک)
        "expired", // منقضی شده (خودکار)
      ],
      default: "draft",
      index: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    // ═══════════════════════════════════════════════════════════
    // فیلدهای داینامیک (بر اساس دسته‌بندی)
    // ═══════════════════════════════════════════════════════════
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ═══════════════════════════════════════════════════════════
    // مراحل تکمیل فرم
    // ═══════════════════════════════════════════════════════════
    completedSteps: {
      type: [String],
      default: [],
      // ['general', 'details', 'datetime', 'location', 'registration']
    },

    currentStep: {
      type: String,
      default: "general",
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },

    // ═══════════════════════════════════════════════════════════
    // سازنده و مدیریت
    // ═══════════════════════════════════════════════════════════
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    organizer: {
      name: String,
      email: String,
      phone: String,
      website: String,
      logo: String,
    },

    // ═══════════════════════════════════════════════════════════
    // سخنرانان / منتورها / مجریان (اختیاری)
    // ═══════════════════════════════════════════════════════════
    speakers: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        role: {
          type: String,
          enum: [
            "speaker",
            "mentor",
            "host",
            "instructor",
            "moderator",
            "other",
          ],
          default: "speaker",
        },
        bio: {
          type: String,
          trim: true,
          maxlength: 500,
        },
        image: String,
        socialLinks: {
          linkedin: String,
          twitter: String,
          instagram: String,
          website: String,
        },
      },
    ],

    // ═══════════════════════════════════════════════════════════
    // اطلاعات تماس عمومی (برای نمایش به شرکت‌کنندگان)
    // ═══════════════════════════════════════════════════════════
    contactInfo: {
      phone: String,
      email: String,
      showPhone: {
        type: Boolean,
        default: false, // پیش‌فرض: نمایش نده
      },
      showEmail: {
        type: Boolean,
        default: true, // پیش‌فرض: نمایش بده
      },
    },

    // ═══════════════════════════════════════════════════════════
    // تایید و بررسی
    // ═══════════════════════════════════════════════════════════
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: {
      type: Date,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: {
      type: Date,
    },

    // ═══════════════════════════════════════════════════════════
    // آمار و تحلیل
    // ═══════════════════════════════════════════════════════════
    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    shares: {
      type: Number,
      default: 0,
      min: 0,
    },

    bookmarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ═══════════════════════════════════════════════════════════
    // متادیتا
    // ═══════════════════════════════════════════════════════════
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    keywords: [
      {
        type: String,
        trim: true,
      },
    ],

    // ═══════════════════════════════════════════════════════════
    // لینک دعوت خصوصی (برای رویدادهای private)
    // ═══════════════════════════════════════════════════════════
    inviteToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    publishedAt: {
      type: Date,
      index: true,
    },

    finishedAt: {
      type: Date,
      index: true,
    },

    // امتیاز و نظرات
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    deletedAt: {
      type: Date,
      index: true,
    },

    // ═══════════════════════════════════════════════════════════
    // تنظیمات گروه چت
    // ═══════════════════════════════════════════════════════════
    createGroupChat: {
      type: Boolean,
      default: false, // پیش‌فرض: گروه چت ساخته نمی‌شود
    },

    groupChatCreated: {
      type: Boolean,
      default: false, // آیا گروه چت ساخته شده است؟
    },

    // ═══════════════════════════════════════════════════════════
    // تنظیمات گواهی‌نامه
    // ═══════════════════════════════════════════════════════════
    hasCertificate: {
      type: Boolean,
      default: false, // پیش‌فرض: گواهی‌نامه صادر نمی‌شود
    },

    certificateSettings: {
      title: {
        type: String,
        trim: true,
        default: "", // عنوان گواهی‌نامه (مثلاً: "گواهی شرکت در...")
      },
      description: {
        type: String,
        trim: true,
        default: "", // توضیحات گواهی‌نامه
      },
      issuerName: {
        type: String,
        trim: true,
        default: "", // نام صادرکننده (مثلاً: نام سازمان)
      },
      minAttendancePercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 80, // حداقل درصد حضور برای دریافت گواهی
      },
      requiresCompletion: {
        type: Boolean,
        default: true, // آیا باید رویداد تکمیل شود؟
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ═══════════════════════════════════════════════════════════
// Indexes
// ═══════════════════════════════════════════════════════════
EventSchema.index({ title: "text", description: "text", tags: "text" });
EventSchema.index({ status: 1, publishedAt: -1 });
EventSchema.index({ creator: 1, status: 1 });
EventSchema.index({ startDate: 1, status: 1 });
EventSchema.index({ topicCategory: 1, status: 1 });
EventSchema.index({ featured: 1, status: 1, publishedAt: -1 });

// ═══════════════════════════════════════════════════════════
// Virtuals
// ═══════════════════════════════════════════════════════════
EventSchema.virtual("isExpired").get(function () {
  if (!this.endDate) return false;
  return new Date() > this.endDate;
});

EventSchema.virtual("isFull").get(function () {
  if (!this.capacity) return false;
  return this.registeredCount >= this.capacity;
});

EventSchema.virtual("availableSeats").get(function () {
  if (!this.capacity) return null;
  return Math.max(0, this.capacity - this.registeredCount);
});

EventSchema.virtual("registrationOpen").get(function () {
  if (this.status !== "approved") return false;
  if (this.isFull) return false;
  if (this.registrationDeadline && new Date() > this.registrationDeadline)
    return false;
  return true;
});

// ═══════════════════════════════════════════════════════════
// Methods
// ═══════════════════════════════════════════════════════════
EventSchema.methods.canEdit = function (userId) {
  return this.creator.toString() === userId.toString();
};

EventSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

EventSchema.methods.incrementShares = function () {
  this.shares += 1;
  return this.save();
};

EventSchema.methods.incrementBookmarks = function () {
  this.bookmarks += 1;
  return this.save();
};

EventSchema.methods.approve = function (userId) {
  this.status = "approved";
  this.approvedBy = userId;
  this.approvedAt = new Date();
  this.publishedAt = new Date();
  return this.save();
};

EventSchema.methods.finish = function (userId) {
  this.status = "finished";
  this.finishedAt = new Date();
  return this.save();
};

EventSchema.methods.reject = function (userId, reason) {
  this.status = "rejected";
  this.reviewedBy = userId;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

EventSchema.methods.suspend = function (userId, reason) {
  this.status = "suspended";
  this.reviewedBy = userId;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

EventSchema.methods.completeStep = function (step) {
  if (!this.completedSteps.includes(step)) {
    this.completedSteps.push(step);
  }
  return this.save();
};

// ═══════════════════════════════════════════════════════════
// Statics
// ═══════════════════════════════════════════════════════════
EventSchema.statics.findPublished = function () {
  return this.find({
    status: "approved",
    publishedAt: { $lte: new Date() },
  }).sort({
    publishedAt: -1,
  });
};

EventSchema.statics.findUpcoming = function () {
  return this.find({
    status: "approved",
    startDate: { $gte: new Date() },
  }).sort({ startDate: 1 });
};

EventSchema.statics.findByCreator = function (creatorId) {
  return this.find({ creator: creatorId }).sort({ createdAt: -1 });
};

// ═══════════════════════════════════════════════════════════
// Pre-save hooks
// ═══════════════════════════════════════════════════════════
EventSchema.pre("save", async function (next) {
  // تولید slug
  if (this.isModified("title") && this.status !== "draft") {
    const slugify = (str) => {
      // تبدیل فارسی به انگلیسی (transliteration ساده)
      const persianToEnglish = {
        ا: "a",
        آ: "a",
        ب: "b",
        پ: "p",
        ت: "t",
        ث: "s",
        ج: "j",
        چ: "ch",
        ح: "h",
        خ: "kh",
        د: "d",
        ذ: "z",
        ر: "r",
        ز: "z",
        ژ: "zh",
        س: "s",
        ش: "sh",
        ص: "s",
        ض: "z",
        ط: "t",
        ظ: "z",
        ع: "a",
        غ: "gh",
        ف: "f",
        ق: "gh",
        ک: "k",
        گ: "g",
        ل: "l",
        م: "m",
        ن: "n",
        و: "v",
        ه: "h",
        ی: "i",
        ي: "i",
        "۰": "0",
        "۱": "1",
        "۲": "2",
        "۳": "3",
        "۴": "4",
        "۵": "5",
        "۶": "6",
        "۷": "7",
        "۸": "8",
        "۹": "9",
      };

      let result = str.toLowerCase().trim();

      // تبدیل کاراکترهای فارسی
      result = result
        .split("")
        .map((char) => persianToEnglish[char] || char)
        .join("");

      // حذف کاراکترهای نامعتبر و جایگزینی spaces با dash
      result = result
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      return result;
    };

    let baseSlug = slugify(this.title);

    // ✅ اگر slug خالی شد، از _id استفاده کن
    if (!baseSlug || baseSlug.length === 0) {
      baseSlug = this._id.toString().substring(0, 8);
    }

    let slug = baseSlug;
    let counter = 1;

    while (await this.constructor.exists({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }

  // چک کردن انقضا
  if (this.endDate && new Date() > this.endDate && this.status === "approved") {
    this.status = "expired";
  }

  // ✅ تولید inviteToken برای رویدادهای private (فقط اگر وجود نداشت)
  // اگر کاربر در فرم inviteCode تولید کرده، از همان استفاده می‌شود
  if (
    this.visibility?.level === "private" &&
    !this.inviteToken &&
    this.status !== "draft"
  ) {
    // اگر کاربر قبلاً در فرم inviteCode تولید نکرده، یکی تولید کن
    const crypto = require("crypto");
    this.inviteToken = crypto.randomBytes(16).toString("hex");
  }

  next();
});

// ═══════════════════════════════════════════════════════════
// Post-save hooks
// ═══════════════════════════════════════════════════════════

// ساخت گروه چت بعد از تایید رویداد
EventSchema.post("save", async function (doc) {
  // فقط زمانی که رویداد تایید شده و مالک درخواست ساخت گروه داده
  if (
    this.status === "approved" &&
    this.createGroupChat === true &&
    this.groupChatCreated === false
  ) {
    try {
      const GroupChat = mongoose.model("GroupChat");

      // چک کن که گروه چت قبلاً ساخته نشده باشد
      const existingChat = await GroupChat.findOne({ event: this._id });

      if (!existingChat) {
        // ساخت گروه چت
        await GroupChat.createForEvent(
          this._id,
          this.creator, // مالک رویداد ✅ فیلد صحیح: creator
          this.creator // سازنده (در اینجا همان مالک است)
        );

        // علامت‌گذاری که گروه چت ساخته شده (بدون trigger کردن Hook)
        await mongoose
          .model("Event")
          .updateOne({ _id: this._id }, { $set: { groupChatCreated: true } });

        console.log(`✅ گروه چت برای رویداد ${this.title} ساخته شد`);
      }
    } catch (error) {
      console.error("❌ خطا در ساخت گروه چت:", error.message);
      // خطا را رد نمی‌کنیم تا رویداد ساخته شود
    }
  }
});

const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

export default Event;
