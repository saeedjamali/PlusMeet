import mongoose from 'mongoose';

const GroupChatSchema = new mongoose.Schema(
  {
    // ═══════════════════════════════════════════════════════════
    // ارتباط با رویداد
    // ═══════════════════════════════════════════════════════════
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      unique: true, // هر رویداد فقط یک گروه چت دارد
      index: true,
    },

    // ═══════════════════════════════════════════════════════════
    // اطلاعات پایه
    // ═══════════════════════════════════════════════════════════
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    avatar: {
      type: String, // URL تصویر گروه (پیش‌فرض از رویداد)
    },

    // ═══════════════════════════════════════════════════════════
    // مدیریت دسترسی
    // ═══════════════════════════════════════════════════════════
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isClosed: {
      type: Boolean,
      default: false, // آیا گروه بسته است؟
      index: true,
    },

    // ═══════════════════════════════════════════════════════════
    // مدیران و سازنده
    // ═══════════════════════════════════════════════════════════
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // سیستم (یا admin)
    },

    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // مالک رویداد
      index: true,
    },

    // ═══════════════════════════════════════════════════════════
    // آمار و اطلاعات
    // ═══════════════════════════════════════════════════════════
    stats: {
      totalMembers: {
        type: Number,
        default: 0,
      },
      totalMessages: {
        type: Number,
        default: 0,
      },
      activeMembers: {
        type: Number,
        default: 0,
      },
    },

    lastMessageAt: {
      type: Date,
      index: true,
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupChatMessage',
    },

    // ═══════════════════════════════════════════════════════════
    // تنظیمات گروه
    // ═══════════════════════════════════════════════════════════
    settings: {
      allowMemberInvite: {
        type: Boolean,
        default: false, // آیا اعضا می‌توانند دیگران را دعوت کنند؟
      },
      requireApproval: {
        type: Boolean,
        default: false, // آیا پیوستن نیاز به تایید دارد؟
      },
      allowFileSharing: {
        type: Boolean,
        default: true,
      },
      allowImageSharing: {
        type: Boolean,
        default: true,
      },
      allowLinkSharing: {
        type: Boolean,
        default: true,
      },
      maxMessageLength: {
        type: Number,
        default: 2000,
      },
      slowMode: {
        enabled: {
          type: Boolean,
          default: false,
        },
        interval: {
          type: Number,
          default: 0, // ثانیه
        },
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ═══════════════════════════════════════════════════════════
// Indexes
// ═══════════════════════════════════════════════════════════
GroupChatSchema.index({ event: 1, isActive: 1 });
GroupChatSchema.index({ owner: 1, isActive: 1 });
GroupChatSchema.index({ visibility: 1, isActive: 1, isClosed: 1 });
GroupChatSchema.index({ lastMessageAt: -1 });

// ═══════════════════════════════════════════════════════════
// Virtuals
// ═══════════════════════════════════════════════════════════

// دریافت اعضا
GroupChatSchema.virtual('members', {
  ref: 'GroupChatMember',
  localField: '_id',
  foreignField: 'groupChat',
});

// دریافت پیام‌ها
GroupChatSchema.virtual('messages', {
  ref: 'GroupChatMessage',
  localField: '_id',
  foreignField: 'groupChat',
});

// ═══════════════════════════════════════════════════════════
// Methods
// ═══════════════════════════════════════════════════════════

/**
 * چک کردن اینکه آیا کاربر مدیر است
 */
GroupChatSchema.methods.isAdmin = function (userId) {
  const userIdString = userId.toString();
  return (
    this.owner.toString() === userIdString ||
    this.admins.some((adminId) => adminId.toString() === userIdString)
  );
};

/**
 * چک کردن اینکه آیا کاربر می‌تواند پیام بفرستد
 */
GroupChatSchema.methods.canSendMessage = async function (userId) {
  // گروه بسته است؟
  if (this.isClosed) return false;

  // گروه غیرفعال است؟
  if (!this.isActive) return false;

  // مدیر است؟ (همیشه می‌تواند)
  if (this.isAdmin(userId)) return true;

  // چک عضویت
  const GroupChatMember = mongoose.model('GroupChatMember');
  const member = await GroupChatMember.findOne({
    groupChat: this._id,
    user: userId,
    status: 'active',
  });

  if (!member) return false;

  // مسدود است؟
  if (member.isBanned) return false;

  // خاموش کرده؟ (muted)
  if (member.isMuted) return false;

  return true;
};

/**
 * چک کردن اینکه آیا کاربر می‌تواند گروه را ببیند
 */
GroupChatSchema.methods.canView = async function (userId, userJoinRequestStatus = null) {
  // گروه غیرفعال است؟
  if (!this.isActive) return false;

  // مدیر است؟
  if (this.isAdmin(userId)) return true;

  // گروه عمومی است؟
  if (this.visibility === 'public') {
    // کاربر باید active یا verified باشد
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    return user && ['active', 'verified'].includes(user.status);
  }

  // گروه خصوصی است؟
  if (this.visibility === 'private') {
    // باید isActiveParticipant باشد
    const { isActiveParticipant } = require('@/lib/utils/joinRequestHelpers');
    return userJoinRequestStatus && isActiveParticipant(userJoinRequestStatus);
  }

  return false;
};

/**
 * افزودن عضو جدید
 */
GroupChatSchema.methods.addMember = async function (userId, addedBy = null) {
  const GroupChatMember = mongoose.model('GroupChatMember');

  // چک کن که قبلاً عضو نشده باشد
  const existingMember = await GroupChatMember.findOne({
    groupChat: this._id,
    user: userId,
  });

  if (existingMember) {
    // اگر banned یا left بود، فعالش کن
    if (['banned', 'left'].includes(existingMember.status)) {
      existingMember.status = 'active';
      existingMember.joinedAt = new Date();
      await existingMember.save();
      return existingMember;
    }
    return existingMember;
  }

  // ایجاد عضو جدید
  const member = await GroupChatMember.create({
    groupChat: this._id,
    user: userId,
    addedBy: addedBy || this.owner,
    status: 'active',
  });

  // به‌روزرسانی آمار
  this.stats.totalMembers += 1;
  this.stats.activeMembers += 1;
  await this.save();

  return member;
};

/**
 * حذف عضو
 */
GroupChatSchema.methods.removeMember = async function (userId, removedBy = null) {
  const GroupChatMember = mongoose.model('GroupChatMember');

  const member = await GroupChatMember.findOne({
    groupChat: this._id,
    user: userId,
  });

  if (!member) return null;

  member.status = 'removed';
  member.leftAt = new Date();
  await member.save();

  // به‌روزرسانی آمار
  if (this.stats.activeMembers > 0) {
    this.stats.activeMembers -= 1;
  }
  await this.save();

  return member;
};

/**
 * مسدود کردن عضو
 */
GroupChatSchema.methods.banMember = async function (userId, bannedBy, reason = null) {
  const GroupChatMember = mongoose.model('GroupChatMember');

  const member = await GroupChatMember.findOne({
    groupChat: this._id,
    user: userId,
  });

  if (!member) return null;

  member.isBanned = true;
  member.bannedBy = bannedBy;
  member.bannedAt = new Date();
  member.banReason = reason;
  member.status = 'banned';
  await member.save();

  // به‌روزرسانی آمار
  if (this.stats.activeMembers > 0) {
    this.stats.activeMembers -= 1;
  }
  await this.save();

  return member;
};

/**
 * رفع مسدودیت
 */
GroupChatSchema.methods.unbanMember = async function (userId) {
  const GroupChatMember = mongoose.model('GroupChatMember');

  const member = await GroupChatMember.findOne({
    groupChat: this._id,
    user: userId,
  });

  if (!member) return null;

  member.isBanned = false;
  member.bannedBy = null;
  member.bannedAt = null;
  member.banReason = null;
  member.status = 'active';
  await member.save();

  // به‌روزرسانی آمار
  this.stats.activeMembers += 1;
  await this.save();

  return member;
};

// ═══════════════════════════════════════════════════════════
// Statics
// ═══════════════════════════════════════════════════════════

/**
 * ساخت گروه برای رویداد
 */
GroupChatSchema.statics.createForEvent = async function (eventId, ownerId, creatorId = null) {
  const Event = mongoose.model('Event');
  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error('Event not found');
  }

  // چک کن که قبلاً ساخته نشده باشد
  const existing = await this.findOne({ event: eventId });
  if (existing) return existing;

  // ساخت گروه
  const groupChat = await this.create({
    event: eventId,
    name: `گفتگوی ${event.title}`,
    description: `گروه چت رویداد: ${event.title}`,
    avatar: event.images?.[0]?.url || event.coverImage,
    creator: creatorId || ownerId,
    owner: ownerId,
    admins: [ownerId],
    visibility: 'public', // پیش‌فرض عمومی
  });

  // افزودن مالک به عنوان اولین عضو
  await groupChat.addMember(ownerId, creatorId);

  return groupChat;
};

// ═══════════════════════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════════════════════

// قبل از حذف، همه پیام‌ها و اعضا را حذف کن
GroupChatSchema.pre('remove', async function (next) {
  const GroupChatMessage = mongoose.model('GroupChatMessage');
  const GroupChatMember = mongoose.model('GroupChatMember');

  await GroupChatMessage.deleteMany({ groupChat: this._id });
  await GroupChatMember.deleteMany({ groupChat: this._id });

  next();
});

// ═══════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════

const GroupChat =
  mongoose.models.GroupChat || mongoose.model('GroupChat', GroupChatSchema);

export default GroupChat;



