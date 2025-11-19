import mongoose from 'mongoose';

const GroupChatMemberSchema = new mongoose.Schema(
  {
    // ═══════════════════════════════════════════════════════════
    // ارتباطات
    // ═══════════════════════════════════════════════════════════
    groupChat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupChat',
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ═══════════════════════════════════════════════════════════
    // وضعیت عضویت
    // ═══════════════════════════════════════════════════════════
    status: {
      type: String,
      enum: ['pending', 'active', 'left', 'removed', 'banned'],
      default: 'active',
      index: true,
    },

    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member',
    },

    // ═══════════════════════════════════════════════════════════
    // تاریخ‌ها
    // ═══════════════════════════════════════════════════════════
    joinedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    leftAt: {
      type: Date,
    },

    lastSeenAt: {
      type: Date,
      index: true,
    },

    lastReadMessageAt: {
      type: Date,
    },

    // ═══════════════════════════════════════════════════════════
    // محدودیت‌ها
    // ═══════════════════════════════════════════════════════════
    isMuted: {
      type: Boolean,
      default: false, // آیا کاربر خاموش کرده است؟ (توسط خودش)
    },

    mutedUntil: {
      type: Date, // تا چه زمانی خاموش است؟
    },

    isBanned: {
      type: Boolean,
      default: false,
      index: true,
    },

    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    bannedAt: {
      type: Date,
    },

    banReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // ═══════════════════════════════════════════════════════════
    // اضافه کننده
    // ═══════════════════════════════════════════════════════════
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // ═══════════════════════════════════════════════════════════
    // تنظیمات شخصی
    // ═══════════════════════════════════════════════════════════
    notifications: {
      enabled: {
        type: Boolean,
        default: true,
      },
      mentions: {
        type: Boolean,
        default: true,
      },
      allMessages: {
        type: Boolean,
        default: false,
      },
    },

    // ═══════════════════════════════════════════════════════════
    // آمار
    // ═══════════════════════════════════════════════════════════
    stats: {
      messagesSent: {
        type: Number,
        default: 0,
      },
      unreadCount: {
        type: Number,
        default: 0,
      },
    },

    // ═══════════════════════════════════════════════════════════
    // متادیتا
    // ═══════════════════════════════════════════════════════════
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// ═══════════════════════════════════════════════════════════
// Indexes
// ═══════════════════════════════════════════════════════════
GroupChatMemberSchema.index({ groupChat: 1, user: 1 }, { unique: true });
GroupChatMemberSchema.index({ groupChat: 1, status: 1 });
GroupChatMemberSchema.index({ user: 1, status: 1 });
GroupChatMemberSchema.index({ groupChat: 1, isBanned: 1 });

// ═══════════════════════════════════════════════════════════
// Methods
// ═══════════════════════════════════════════════════════════

/**
 * آیا عضو فعال است؟
 */
GroupChatMemberSchema.methods.isActive = function () {
  return this.status === 'active' && !this.isBanned;
};

/**
 * آیا عضو می‌تواند پیام بفرستد؟
 */
GroupChatMemberSchema.methods.canSendMessage = function () {
  if (!this.isActive()) return false;
  if (this.isMuted) {
    // چک کن که مدت mute گذشته باشد
    if (this.mutedUntil && new Date() > this.mutedUntil) {
      this.isMuted = false;
      this.mutedUntil = null;
      return true;
    }
    return false;
  }
  return true;
};

/**
 * خاموش کردن نوتیفیکیشن‌ها (توسط خود کاربر)
 */
GroupChatMemberSchema.methods.mute = async function (duration = null) {
  this.isMuted = true;
  if (duration) {
    this.mutedUntil = new Date(Date.now() + duration);
  }
  await this.save();
};

/**
 * روشن کردن نوتیفیکیشن‌ها
 */
GroupChatMemberSchema.methods.unmute = async function () {
  this.isMuted = false;
  this.mutedUntil = null;
  await this.save();
};

/**
 * علامت‌گذاری پیام‌ها به عنوان خوانده شده
 */
GroupChatMemberSchema.methods.markAsRead = async function (messageId = null) {
  this.lastSeenAt = new Date();
  if (messageId) {
    this.lastReadMessageAt = new Date();
  }
  this.stats.unreadCount = 0;
  await this.save();
};

/**
 * افزایش تعداد پیام‌های خوانده نشده
 */
GroupChatMemberSchema.methods.incrementUnread = async function () {
  this.stats.unreadCount += 1;
  await this.save();
};

/**
 * افزایش تعداد پیام‌های ارسالی
 */
GroupChatMemberSchema.methods.incrementMessagesSent = async function () {
  this.stats.messagesSent += 1;
  await this.save();
};

// ═══════════════════════════════════════════════════════════
// Statics
// ═══════════════════════════════════════════════════════════

/**
 * دریافت اعضای فعال یک گروه
 */
GroupChatMemberSchema.statics.getActiveMembers = async function (groupChatId) {
  return this.find({
    groupChat: groupChatId,
    status: 'active',
    isBanned: false,
  })
    .populate('user', 'firstName lastName username avatar email')
    .sort({ joinedAt: 1 });
};

/**
 * چک کردن عضویت کاربر در گروه
 */
GroupChatMemberSchema.statics.isMember = async function (groupChatId, userId) {
  const member = await this.findOne({
    groupChat: groupChatId,
    user: userId,
    status: 'active',
  });
  return !!member;
};

/**
 * دریافت گروه‌های یک کاربر
 */
GroupChatMemberSchema.statics.getUserGroups = async function (userId, status = 'active') {
  return this.find({
    user: userId,
    status,
  })
    .populate({
      path: 'groupChat',
      populate: {
        path: 'event',
        select: 'title slug startDate endDate',
      },
    })
    .sort({ lastSeenAt: -1, joinedAt: -1 });
};

// ═══════════════════════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════════════════════

// به‌روزرسانی lastSeenAt در هر بار save
GroupChatMemberSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'active') {
    this.lastSeenAt = new Date();
  }
  next();
});

// ═══════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════

const GroupChatMember =
  mongoose.models.GroupChatMember ||
  mongoose.model('GroupChatMember', GroupChatMemberSchema);

export default GroupChatMember;



