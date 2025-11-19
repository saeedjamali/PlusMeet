import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    // رویداد مورد نظر
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    // کاربر نظردهنده
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // درخواست پیوستن مرتبط
    joinRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JoinRequest",
      required: true,
    },

    // امتیاز کلی (1-5)
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // نظر متنی
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    // امتیازات جزئی (5 سوال)
    detailedRatings: {
      // 1. کیفیت محتوا
      contentQuality: {
        type: Number,
        min: 1,
        max: 5,
      },
      
      // 2. کیفیت ارائه
      presentationQuality: {
        type: Number,
        min: 1,
        max: 5,
      },
      
      // 3. سازماندهی رویداد
      organization: {
        type: Number,
        min: 1,
        max: 5,
      },
      
      // 4. ارزش در برابر هزینه
      valueForMoney: {
        type: Number,
        min: 1,
        max: 5,
      },
      
      // 5. توصیه به دیگران
      recommendation: {
        type: Number,
        min: 1,
        max: 5,
      },
    },

    // وضعیت نظر
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending", // پیش‌فرض: منتظر تایید مالک
      index: true,
    },

    // دلیل رد (در صورت reject)
    rejectionReason: {
      type: String,
      trim: true,
    },

    // آیا مفید بوده؟ (تعداد لایک)
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // آیا غیرمفید بوده؟ (تعداد دیسلایک)
    notHelpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // پاسخ مالک رویداد
    ownerResponse: {
      text: {
        type: String,
        trim: true,
        maxlength: 500,
      },
      respondedAt: {
        type: Date,
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending", // پیش‌فرض: منتظر تایید مدیر
      },
      // ID مالکی که پاسخ داده
      responderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  },
  {
    timestamps: true,
  }
);

// ایندکس‌های ترکیبی
ReviewSchema.index({ event: 1, user: 1 }, { unique: true }); // هر کاربر فقط یک نظر برای هر رویداد
ReviewSchema.index({ event: 1, status: 1, createdAt: -1 }); // برای دریافت نظرات یک رویداد
ReviewSchema.index({ user: 1, createdAt: -1 }); // برای دریافت نظرات یک کاربر

// محاسبه میانگین امتیاز جزئی
ReviewSchema.virtual("averageDetailedRating").get(function () {
  if (!this.detailedRatings) return null;

  const ratings = [
    this.detailedRatings.contentQuality,
    this.detailedRatings.presentationQuality,
    this.detailedRatings.organization,
    this.detailedRatings.valueForMoney,
    this.detailedRatings.recommendation,
  ].filter((r) => r != null);

  if (ratings.length === 0) return null;

  const sum = ratings.reduce((acc, r) => acc + r, 0);
  return (sum / ratings.length).toFixed(2);
});

// متد برای بررسی اینکه آیا کاربر قبلاً نظر داده
ReviewSchema.statics.hasUserReviewed = async function (eventId, userId) {
  const review = await this.findOne({ event: eventId, user: userId });
  return !!review;
};

// متد برای دریافت آمار نظرات یک رویداد
ReviewSchema.statics.getEventStats = async function (eventId) {
  const stats = await this.aggregate([
    { $match: { event: new mongoose.Types.ObjectId(eventId), status: "approved" } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
        rating5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
        rating4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
        rating3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
        rating2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
        rating1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        avgContentQuality: { $avg: "$detailedRatings.contentQuality" },
        avgPresentationQuality: { $avg: "$detailedRatings.presentationQuality" },
        avgOrganization: { $avg: "$detailedRatings.organization" },
        avgValueForMoney: { $avg: "$detailedRatings.valueForMoney" },
        avgRecommendation: { $avg: "$detailedRatings.recommendation" },
      },
    },
  ]);

  return stats.length > 0 ? stats[0] : null;
};

// متد برای بروزرسانی امتیاز رویداد
ReviewSchema.statics.updateEventRating = async function (eventId) {
  const Event = mongoose.model("Event");
  
  const stats = await this.getEventStats(eventId);
  
  if (stats) {
    await Event.findByIdAndUpdate(eventId, {
      rating: stats.averageRating,
      reviewCount: stats.totalReviews,
    });
  }
};

// Hook: بعد از ذخیره، امتیاز رویداد را بروز کن
ReviewSchema.post("save", async function () {
  await this.constructor.updateEventRating(this.event);
});

// Hook: بعد از حذف، امتیاز رویداد را بروز کن
ReviewSchema.post("remove", async function () {
  await this.constructor.updateEventRating(this.event);
});

const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema);

export default Review;

