/**
 * UserNotification Model
 * مدل ردیابی وضعیت اعلانات برای هر کاربر
 */

import mongoose from "mongoose";

const UserNotificationSchema = new mongoose.Schema(
  {
    // کاربر
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // اعلان
    notification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
      required: true,
    },

    // خوانده شده؟
    isRead: {
      type: Boolean,
      default: false,
    },

    // زمان خواندن
    readAt: {
      type: Date,
      default: null,
    },

    // کلیک شده؟
    isClicked: {
      type: Boolean,
      default: false,
    },

    // زمان کلیک
    clickedAt: {
      type: Date,
      default: null,
    },

    // حذف شده؟ (soft delete)
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // زمان حذف
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserNotificationSchema.index({ user: 1, notification: 1 }, { unique: true });
UserNotificationSchema.index({ user: 1, isRead: 1 });
UserNotificationSchema.index({ user: 1, isDeleted: 1 });

// Method: علامت‌گذاری به عنوان خوانده شده
UserNotificationSchema.methods.markAsRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
};

// Method: علامت‌گذاری به عنوان کلیک شده
UserNotificationSchema.methods.markAsClicked = async function () {
  if (!this.isClicked) {
    this.isClicked = true;
    this.clickedAt = new Date();
    await this.save();
  }
};

// Method: حذف نرم
UserNotificationSchema.methods.softDelete = async function () {
  if (!this.isDeleted) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    await this.save();
  }
};

// Static method: دریافت یا ایجاد
UserNotificationSchema.statics.getOrCreate = async function (
  userId,
  notificationId
) {
  let userNotif = await this.findOne({
    user: userId,
    notification: notificationId,
  });

  if (!userNotif) {
    userNotif = await this.create({
      user: userId,
      notification: notificationId,
    });
  }

  return userNotif;
};

// Static method: علامت‌گذاری همه به عنوان خوانده شده
UserNotificationSchema.statics.markAllAsRead = async function (userId) {
  return await this.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

// Static method: شمارش خوانده نشده‌ها
UserNotificationSchema.statics.countUnread = async function (userId) {
  return await this.countDocuments({
    user: userId,
    isRead: false,
    isDeleted: false,
  });
};

const UserNotification =
  mongoose.models.UserNotification ||
  mongoose.model("UserNotification", UserNotificationSchema);

export default UserNotification;




