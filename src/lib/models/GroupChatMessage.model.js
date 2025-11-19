import mongoose from 'mongoose';

const GroupChatMessageSchema = new mongoose.Schema(
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

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ═══════════════════════════════════════════════════════════
    // محتوای پیام
    // ═══════════════════════════════════════════════════════════
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'link', 'system', 'announcement'],
      default: 'text',
      index: true,
    },

    content: {
      type: String,
      trim: true,
      maxlength: 5000,
    },

    // برای پیام‌های تصویر/فایل
    attachments: [
      {
        type: {
          type: String,
          enum: ['image', 'file', 'video', 'audio'],
        },
        url: String,
        name: String,
        size: Number, // bytes
        mimeType: String,
      },
    ],

    // ═══════════════════════════════════════════════════════════
    // پاسخ به پیام
    // ═══════════════════════════════════════════════════════════
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupChatMessage',
    },

    // ═══════════════════════════════════════════════════════════
    // منشن‌ها
    // ═══════════════════════════════════════════════════════════
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],

    // ═══════════════════════════════════════════════════════════
    // وضعیت پیام
    // ═══════════════════════════════════════════════════════════
    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },

    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    pinnedAt: {
      type: Date,
    },

    // ═══════════════════════════════════════════════════════════
    // آمار و تعاملات
    // ═══════════════════════════════════════════════════════════
    reactions: [
      {
        emoji: String,
        users: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
        count: {
          type: Number,
          default: 0,
        },
      },
    ],

    stats: {
      readBy: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          readAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      readCount: {
        type: Number,
        default: 0,
      },
    },

    // ═══════════════════════════════════════════════════════════
    // پیام سیستمی
    // ═══════════════════════════════════════════════════════════
    systemMessage: {
      action: {
        type: String,
        enum: [
          'member_joined',
          'member_left',
          'member_removed',
          'member_banned',
          'member_unbanned',
          'group_created',
          'group_updated',
          'visibility_changed',
          'group_closed',
          'group_opened',
        ],
      },
      data: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
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
GroupChatMessageSchema.index({ groupChat: 1, createdAt: -1 });
GroupChatMessageSchema.index({ groupChat: 1, sender: 1 });
GroupChatMessageSchema.index({ groupChat: 1, isDeleted: 1, createdAt: -1 });
GroupChatMessageSchema.index({ groupChat: 1, isPinned: 1 });
GroupChatMessageSchema.index({ sender: 1, createdAt: -1 });

// Full-text search
GroupChatMessageSchema.index({ content: 'text' });

// ═══════════════════════════════════════════════════════════
// Virtuals
// ═══════════════════════════════════════════════════════════

// تعداد ری‌اکشن‌ها
GroupChatMessageSchema.virtual('totalReactions').get(function () {
  return this.reactions.reduce((sum, r) => sum + r.count, 0);
});

// ═══════════════════════════════════════════════════════════
// Methods
// ═══════════════════════════════════════════════════════════

/**
 * ویرایش پیام
 */
GroupChatMessageSchema.methods.edit = async function (newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  await this.save();
};

/**
 * حذف پیام
 */
GroupChatMessageSchema.methods.softDelete = async function (deletedBy = null) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy || this.sender;
  await this.save();
};

/**
 * پین کردن پیام
 */
GroupChatMessageSchema.methods.pin = async function (pinnedBy) {
  this.isPinned = true;
  this.pinnedBy = pinnedBy;
  this.pinnedAt = new Date();
  await this.save();
};

/**
 * آنپین کردن پیام
 */
GroupChatMessageSchema.methods.unpin = async function () {
  this.isPinned = false;
  this.pinnedBy = null;
  this.pinnedAt = null;
  await this.save();
};

/**
 * افزودن ری‌اکشن
 */
GroupChatMessageSchema.methods.addReaction = async function (emoji, userId) {
  const reactionIndex = this.reactions.findIndex((r) => r.emoji === emoji);

  if (reactionIndex > -1) {
    // اگر قبلاً این ری‌اکشن وجود دارد
    const reaction = this.reactions[reactionIndex];
    const userIndex = reaction.users.findIndex(
      (u) => u.toString() === userId.toString()
    );

    if (userIndex > -1) {
      // کاربر قبلاً این ری‌اکشن را داده → حذف
      reaction.users.splice(userIndex, 1);
      reaction.count -= 1;
      if (reaction.count === 0) {
        this.reactions.splice(reactionIndex, 1);
      }
    } else {
      // افزودن کاربر به ری‌اکشن
      reaction.users.push(userId);
      reaction.count += 1;
    }
  } else {
    // ری‌اکشن جدید
    this.reactions.push({
      emoji,
      users: [userId],
      count: 1,
    });
  }

  await this.save();
};

/**
 * علامت‌گذاری به عنوان خوانده شده
 */
GroupChatMessageSchema.methods.markAsRead = async function (userId) {
  const alreadyRead = this.stats.readBy.some(
    (r) => r.user.toString() === userId.toString()
  );

  if (!alreadyRead) {
    this.stats.readBy.push({
      user: userId,
      readAt: new Date(),
    });
    this.stats.readCount += 1;
    await this.save();
  }
};

// ═══════════════════════════════════════════════════════════
// Statics
// ═══════════════════════════════════════════════════════════

/**
 * ساخت پیام سیستمی
 */
GroupChatMessageSchema.statics.createSystemMessage = async function (
  groupChatId,
  action,
  data = {}
) {
  const GroupChat = mongoose.model('GroupChat');
  const groupChat = await GroupChat.findById(groupChatId);

  if (!groupChat) {
    throw new Error('GroupChat not found');
  }

  return this.create({
    groupChat: groupChatId,
    sender: groupChat.creator, // سیستم
    messageType: 'system',
    systemMessage: {
      action,
      data,
    },
  });
};

/**
 * دریافت پیام‌های پین شده
 */
GroupChatMessageSchema.statics.getPinnedMessages = async function (groupChatId) {
  return this.find({
    groupChat: groupChatId,
    isPinned: true,
    isDeleted: false,
  })
    .populate('sender', 'firstName lastName username avatar')
    .populate('pinnedBy', 'firstName lastName username')
    .sort({ pinnedAt: -1 });
};

/**
 * جستجو در پیام‌ها
 */
GroupChatMessageSchema.statics.searchMessages = async function (
  groupChatId,
  query,
  options = {}
) {
  const { limit = 20, skip = 0 } = options;

  return this.find({
    groupChat: groupChatId,
    $text: { $search: query },
    isDeleted: false,
  })
    .populate('sender', 'firstName lastName username avatar')
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// ═══════════════════════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════════════════════

// بعد از ساخت پیام، به‌روزرسانی گروه
GroupChatMessageSchema.post('save', async function (doc) {
  if (this.isNew && !this.isDeleted) {
    const GroupChat = mongoose.model('GroupChat');
    await GroupChat.findByIdAndUpdate(this.groupChat, {
      lastMessage: this._id,
      lastMessageAt: this.createdAt,
      $inc: { 'stats.totalMessages': 1 },
    });

    // افزایش unread برای سایر اعضا
    if (this.messageType !== 'system') {
      const GroupChatMember = mongoose.model('GroupChatMember');
      await GroupChatMember.updateMany(
        {
          groupChat: this.groupChat,
          user: { $ne: this.sender },
          status: 'active',
        },
        {
          $inc: { 'stats.unreadCount': 1 },
        }
      );
    }
  }
});

// ═══════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════

const GroupChatMessage =
  mongoose.models.GroupChatMessage ||
  mongoose.model('GroupChatMessage', GroupChatMessageSchema);

export default GroupChatMessage;



