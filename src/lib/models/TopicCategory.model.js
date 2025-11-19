import mongoose from "mongoose";

const TopicCategorySchema = new mongoose.Schema(
  {
    // اطلاعات اصلی
    title: {
      type: String,
      required: [true, "عنوان دسته‌بندی الزامی است"],
      trim: true,
    },
    slug: {
      type: String,
      required: true, // slug توسط pre-validate hook ساخته می‌شود
      unique: true,
      trim: true,
      lowercase: true,
    },
    code: {
      type: String,
      required: false, // code توسط pre-validate hook ساخته می‌شود
      unique: true,
      trim: true,
      uppercase: true,
      sparse: true, // اجازه می‌دهد که null/undefined هم باشد
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    examples: [
      {
        type: String,
        trim: true,
      },
    ],

    // سلسله مراتب
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TopicCategory",
      default: null,
    },
    level: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    order: {
      type: Number,
      default: 0,
    },

    // ظاهر و نمایش
    icon: {
      type: String,
      default: "📁",
    },
    baseColor: {
      type: String,
      default: "#F4A325",
      match: [/^#[0-9A-F]{6}$/i, "رنگ باید به فرمت HEX باشد"],
    },
    gradient: {
      type: {
        start: {
          type: String,
          match: [/^#[0-9A-F]{6}$/i, "رنگ باید به فرمت HEX باشد"],
        },
        end: {
          type: String,
          match: [/^#[0-9A-F]{6}$/i, "رنگ باید به فرمت HEX باشد"],
        },
        direction: {
          type: String,
          enum: [
            "to-right",
            "to-left",
            "to-top",
            "to-bottom",
            "to-top-right",
            "to-bottom-right",
          ],
          default: "to-right",
        },
      },
      default: null,
    },

    // حس و کاربرد (Mood & Usage)
    mood: {
      type: String,
      trim: true,
      default: "",
    },
    usage: {
      type: String,
      trim: true,
      default: "",
    },

    // وضعیت
    isActive: {
      type: Boolean,
      default: true,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },

    // متادیتا
    metadata: {
      eventsCount: {
        type: Number,
        default: 0,
      },
      viewCount: {
        type: Number,
        default: 0,
      },
      tags: [
        {
          type: String,
          trim: true,
        },
      ],
    },

    // ایجاد و به‌روزرسانی
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual برای زیردسته‌ها
TopicCategorySchema.virtual("children", {
  ref: "TopicCategory",
  localField: "_id",
  foreignField: "parentId",
});

// Index ها (slug and code already have unique index from schema definition)
TopicCategorySchema.index({ parentId: 1 });
TopicCategorySchema.index({ level: 1 });
TopicCategorySchema.index({ isActive: 1, isVisible: 1 });
TopicCategorySchema.index({ createdAt: -1 });
TopicCategorySchema.index({ code: 1 }, { sparse: true });

// متد برای گرفتن مسیر کامل (breadcrumb)
TopicCategorySchema.methods.getFullPath = async function () {
  const path = [this];
  let current = this;

  while (current.parentId) {
    current = await this.model("TopicCategory").findById(current.parentId);
    if (current) {
      path.unshift(current);
    } else {
      break;
    }
  }

  return path;
};

// متد برای گرفتن تمام فرزندان (به صورت بازگشتی)
TopicCategorySchema.methods.getAllChildren = async function () {
  const children = await this.model("TopicCategory").find({
    parentId: this._id,
  });
  const allChildren = [...children];

  for (const child of children) {
    const grandChildren = await child.getAllChildren();
    allChildren.push(...grandChildren);
  }

  return allChildren;
};

// Static method برای ساخت slug یکتا
TopicCategorySchema.statics.generateUniqueSlug = async function (
  title,
  id = null
) {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\u0600-\u06FF\w-]/g, "")
    .replace(/--+/g, "-");

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (id) query._id = { $ne: id };

    const existing = await this.findOne(query);
    if (!existing) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// استاتیک متد برای تولید کد یکتا
TopicCategorySchema.statics.generateUniqueCode = async function (
  baseCode,
  id = null
) {
  // تبدیل حروف فارسی به انگلیسی (transliteration ساده)
  const persianToEnglish = {
    آ: "A",
    ا: "A",
    ب: "B",
    پ: "P",
    ت: "T",
    ث: "S",
    ج: "J",
    چ: "CH",
    ح: "H",
    خ: "KH",
    د: "D",
    ذ: "Z",
    ر: "R",
    ز: "Z",
    ژ: "ZH",
    س: "S",
    ش: "SH",
    ص: "S",
    ض: "Z",
    ط: "T",
    ظ: "Z",
    ع: "A",
    غ: "GH",
    ف: "F",
    ق: "GH",
    ک: "K",
    گ: "G",
    ل: "L",
    م: "M",
    ن: "N",
    و: "V",
    ه: "H",
    ی: "Y",
    ئ: "Y",
    ة: "H",
    ى: "Y",
  };

  let transliterated = "";
  for (const char of baseCode) {
    transliterated += persianToEnglish[char] || char;
  }

  let code = transliterated
    .toUpperCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "")
    .replace(/_+/g, "_") // حذف underscoreهای متوالی
    .replace(/^_|_$/g, ""); // حذف underscore از اول و آخر

  // اگر code خالی شد، از timestamp استفاده کن
  if (!code || code.length === 0) {
    code = `CAT_${Date.now().toString(36).toUpperCase()}`;
  }

  // محدود کردن طول به 50 کاراکتر
  if (code.length > 50) {
    code = code.substring(0, 50);
  }

  let counter = 1;
  let finalCode = code;

  while (true) {
    const query = { code: finalCode };
    if (id) query._id = { $ne: id };

    const existing = await this.findOne(query);
    if (!existing) break;

    finalCode = `${code}_${counter}`;
    counter++;
  }

  return finalCode;
};

// Pre-validate middleware (قبل از validation اجرا میشه)
TopicCategorySchema.pre("validate", async function (next) {
  // تولید slug اگر جدید است یا عنوان تغییر کرده
  if ((this.isNew || this.isModified("title")) && this.title) {
    this.slug = await this.constructor.generateUniqueSlug(this.title, this._id);
  }

  // تولید code اگر وجود ندارد
  if (!this.code && this.title) {
    // برای رکوردهای جدید یا قدیمی که code ندارند
    this.code = await this.constructor.generateUniqueCode(this.title, this._id);
  } else if (this.isModified("code") && this.code) {
    // اگر code تغییر کرده، uppercase کن
    this.code = this.code.toUpperCase().trim();
  }

  next();
});

// Pre-save middleware
TopicCategorySchema.pre("save", async function (next) {
  // محاسبه level بر اساس parent
  if (this.parentId) {
    const parent = await this.model("TopicCategory").findById(this.parentId);
    if (parent) {
      this.level = parent.level + 1;
    }
  } else {
    this.level = 1;
  }

  next();
});

// Pre-remove middleware برای جلوگیری از حذف دسته‌ای که فرزند دارد
TopicCategorySchema.pre("remove", async function (next) {
  const childCount = await this.model("TopicCategory").countDocuments({
    parentId: this._id,
  });

  if (childCount > 0) {
    throw new Error(
      "نمی‌توان دسته‌بندی با زیردسته حذف کرد. ابتدا زیردسته‌ها را حذف کنید."
    );
  }

  next();
});

const TopicCategory =
  mongoose.models.TopicCategory ||
  mongoose.model("TopicCategory", TopicCategorySchema);

export default TopicCategory;
