/**
 * Mongoose Model: TicketReply
 * مدل پاسخ‌های تیکت
 */

import mongoose from "mongoose";

const ticketReplySchema = new mongoose.Schema(
  {
    // تیکت مربوطه
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },

    // فرستنده پیام
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // متن پیام
    message: {
      type: String,
      required: [true, "متن پیام الزامی است"],
      trim: true,
    },

    // تصاویر پیوست
    attachments: [
      {
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["image", "file"],
          default: "image",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // آیا پیام داخلی است (فقط بین کارشناسان)
    isInternal: {
      type: Boolean,
      default: false,
    },

    // نوع پاسخ براساس رابطه با تیکت
    replyType: {
      type: String,
      enum: ["creator", "assigned", "other"],
      default: "other",
      // creator: سازنده تیکت
      // assigned: کارشناس مسئول (assignedTo)
      // other: سایر پاسخگویان
    },

    // آیا خوانده شده
    isRead: {
      type: Boolean,
      default: false,
    },

    // زمان خوانده شدن
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
ticketReplySchema.index({ ticket: 1, createdAt: -1 });
ticketReplySchema.index({ sender: 1 });
ticketReplySchema.index({ isRead: 1 });

// Pre-save: بروزرسانی تیکت
ticketReplySchema.pre("save", async function (next) {
  if (this.isNew) {
    const Ticket = mongoose.model("Ticket");
    
    // فقط replyCount و lastResponseAt را update کن
    await Ticket.findByIdAndUpdate(this.ticket, {
      $inc: { replyCount: 1 },
      lastResponseAt: new Date(),
    });
  }
  next();
});

// Post-save: محاسبه مجدد counter ها
ticketReplySchema.post("save", async function (doc) {
  if (doc) {
    try {
      const Ticket = mongoose.model("Ticket");
      
      console.log(`\n🔄 Post-save hook triggered for reply ${doc._id}`);
      console.log(`   Reply type: ${doc.replyType}`);
      console.log(`   Ticket: ${doc.ticket}`);
      
      // محاسبه counter های جدید براساس آخرین پاسخ‌ها
      const counts = await Ticket.calculateUnreadCounts(doc.ticket);
      
      console.log(`   📊 Calculated counts:`);
      console.log(`      Creator: ${counts.unreadCountForCreator}`);
      console.log(`      Staff: ${counts.unreadCountForStaff}`);
      
      // Update کردن تیکت
      await Ticket.findByIdAndUpdate(doc.ticket, {
        $set: {
          unreadCountForCreator: counts.unreadCountForCreator,
          unreadCountForStaff: counts.unreadCountForStaff,
          hasUnreadUserReply: counts.hasUnreadUserReply,
          hasUnreadStaffReply: counts.hasUnreadStaffReply,
        },
      });
      
      console.log(`   ✅ Ticket counters updated successfully\n`);
    } catch (error) {
      console.error(`   ❌ Error in post-save hook:`, error);
    }
  }
});

const TicketReply =
  mongoose.models.TicketReply || mongoose.model("TicketReply", ticketReplySchema);

export default TicketReply;

