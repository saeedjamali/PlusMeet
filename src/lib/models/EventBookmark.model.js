import mongoose from "mongoose";

const eventBookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// ایندکس ترکیبی برای جلوگیری از نشان کردن تکراری
eventBookmarkSchema.index({ user: 1, event: 1 }, { unique: true });

const EventBookmark =
  mongoose.models.EventBookmark ||
  mongoose.model("EventBookmark", eventBookmarkSchema);

export default EventBookmark;


