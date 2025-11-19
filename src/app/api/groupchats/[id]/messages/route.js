import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { protectAPI } from '@/lib/middleware/auth';
import GroupChat from '@/lib/models/GroupChat.model';
import GroupChatMessage from '@/lib/models/GroupChatMessage.model';
import GroupChatMember from '@/lib/models/GroupChatMember.model';
import JoinRequest from '@/lib/models/JoinRequest.model';

/**
 * GET /api/groupchats/[id]/messages
 * دریافت پیام‌های یک گروه
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectAPI(request);
    if (!protection.authenticated) {
      return NextResponse.json({ error: protection.message }, { status: 401 });
    }

    const { id } = params;
    const userId = protection.user.id;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const before = searchParams.get('before'); // برای pagination بهتر

    // دریافت گروه
    const groupChat = await GroupChat.findById(id);

    if (!groupChat || !groupChat.isActive) {
      return NextResponse.json({ error: 'Group chat not found' }, { status: 404 });
    }

    // چک دسترسی
    const canView = await groupChat.canView(userId);
    const isAdmin = groupChat.isAdmin(userId);

    if (!canView && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have access to this group' },
        { status: 403 }
      );
    }

    // Query پیام‌ها
    let query = {
      groupChat: id,
      isDeleted: false,
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const [messages, total] = await Promise.all([
      GroupChatMessage.find(query)
        .populate('sender', 'firstName lastName username avatar')
        .populate({
          path: 'replyTo',
          select: 'content sender messageType',
          populate: {
            path: 'sender',
            select: 'firstName lastName username',
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      GroupChatMessage.countDocuments({ groupChat: id, isDeleted: false }),
    ]);

    // به‌روزرسانی unread برای کاربر
    const membership = await GroupChatMember.findOne({
      groupChat: id,
      user: userId,
    });

    if (membership) {
      await membership.markAsRead();
    }

    // معکوس کردن ترتیب (جدیدترین در آخر)
    messages.reverse();

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + messages.length < total,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/groupchats/[id]/messages
 * ارسال پیام جدید
 */
export async function POST(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectAPI(request);
    if (!protection.authenticated) {
      return NextResponse.json({ error: protection.message }, { status: 401 });
    }

    const { id } = params;
    const userId = protection.user.id;
    const body = await request.json();

    const {
      content,
      messageType = 'text',
      attachments = [],
      replyTo = null,
      mentions = [],
    } = body;

    // Validation
    if (!content && attachments.length === 0) {
      return NextResponse.json(
        { error: 'Message content or attachments required' },
        { status: 400 }
      );
    }

    // دریافت گروه
    const groupChat = await GroupChat.findById(id);

    if (!groupChat || !groupChat.isActive) {
      return NextResponse.json({ error: 'Group chat not found' }, { status: 404 });
    }

    // چک بسته بودن گروه
    if (groupChat.isClosed) {
      return NextResponse.json(
        { error: 'Group chat is closed' },
        { status: 403 }
      );
    }

    // چک اینکه کاربر می‌تواند پیام بفرستد
    const canSend = await groupChat.canSendMessage(userId);

    if (!canSend) {
      return NextResponse.json(
        { error: 'You do not have permission to send messages' },
        { status: 403 }
      );
    }

    // چک slow mode
    if (groupChat.settings.slowMode?.enabled) {
      const lastMessage = await GroupChatMessage.findOne({
        groupChat: id,
        sender: userId,
        messageType: { $ne: 'system' },
      })
        .sort({ createdAt: -1 })
        .lean();

      if (lastMessage) {
        const timeSinceLastMessage = Date.now() - new Date(lastMessage.createdAt).getTime();
        const slowModeInterval = groupChat.settings.slowMode.interval * 1000;

        if (timeSinceLastMessage < slowModeInterval) {
          const remainingSeconds = Math.ceil((slowModeInterval - timeSinceLastMessage) / 1000);
          return NextResponse.json(
            {
              error: `Slow mode enabled. Please wait ${remainingSeconds} seconds`,
            },
            { status: 429 }
          );
        }
      }
    }

    // چک طول پیام
    if (content && content.length > groupChat.settings.maxMessageLength) {
      return NextResponse.json(
        {
          error: `Message too long. Max length: ${groupChat.settings.maxMessageLength}`,
        },
        { status: 400 }
      );
    }

    // ساخت پیام
    const message = await GroupChatMessage.create({
      groupChat: id,
      sender: userId,
      content,
      messageType,
      attachments,
      replyTo: replyTo || undefined,
      mentions: mentions || [],
    });

    await message.populate([
      { path: 'sender', select: 'firstName lastName username avatar' },
      {
        path: 'replyTo',
        select: 'content sender messageType',
        populate: {
          path: 'sender',
          select: 'firstName lastName username',
        },
      },
    ]);

    // افزایش تعداد پیام‌های ارسالی توسط کاربر
    const membership = await GroupChatMember.findOne({
      groupChat: id,
      user: userId,
    });

    if (membership) {
      await membership.incrementMessagesSent();
    }

    return NextResponse.json(
      {
        message: 'Message sent successfully',
        data: message,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}



