/**
 * Mongoose Model: TicketCategory
 * مدل موضوعات تیکت
 */

import mongoose from "mongoose";

const ticketCategorySchema = new mongoose.Schema(
  {
    // عنوان موضوع
    title: {
      type: String,
      required: [true, "عنوان موضوع الزامی است"],
      trim: true,
      maxLength: [100, "عنوان نمی‌تواند بیشتر از 100 کاراکتر باشد"],
    },

    // توضیحات موضوع
    description: {
      type: String,
      trim: true,
      maxLength: [500, "توضیحات نمی‌تواند بیشتر از 500 کاراکتر باشد"],
    },

    // آیکون (ایموجی یا نام آیکون)
    icon: {
      type: String,
      default: "🎫",
    },

    // نقش پیش‌فرض برای تیکت‌های این موضوع
    assignedRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "نقش پیش‌فرض الزامی است"],
    },

    // کاربر پیش‌فرض (اختیاری)
    assignedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // وضعیت فعال/غیرفعال
    isActive: {
      type: Boolean,
      default: true,
    },

    // ترتیب نمایش
    order: {
      type: Number,
      default: 0,
    },

    // رنگ موضوع (برای UI)
    color: {
      type: String,
      default: "#3b82f6",
    },

    // ایجادکننده
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // آخرین ویرایش‌کننده
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

// Indexes
ticketCategorySchema.index({ isActive: 1, order: 1 });
ticketCategorySchema.index({ assignedRole: 1 });

// Virtual: تعداد تیکت‌های این موضوع
ticketCategorySchema.virtual("ticketCount", {
  ref: "Ticket",
  localField: "_id",
  foreignField: "category",
  count: true,
});

const TicketCategory =
  mongoose.models.TicketCategory ||
  mongoose.model("TicketCategory", ticketCategorySchema);

export default TicketCategory;

