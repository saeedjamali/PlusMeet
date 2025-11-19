import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { protectAPI } from '@/lib/middleware/auth';
import GroupChat from '@/lib/models/GroupChat.model';
import GroupChatMessage from '@/lib/models/GroupChatMessage.model';

/**
 * POST /api/groupchats/[id]/messages/[messageId]/pin
 * پین کردن پیام (فقط مدیر)
 */
export async function POST(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectAPI(request);
    if (!protection.authenticated) {
      return NextResponse.json({ error: protection.message }, { status: 401 });
    }

    const { id, messageId } = params;
    const userId = protection.user.id;

    // دریافت گروه
    const groupChat = await GroupChat.findById(id);

    if (!groupChat || !groupChat.isActive) {
      return NextResponse.json({ error: 'Group chat not found' }, { status: 404 });
    }

    // چک مدیریت
    if (!groupChat.isAdmin(userId)) {
      return NextResponse.json(
        { error: 'Only admins can pin messages' },
        { status: 403 }
      );
    }

    // دریافت پیام
    const message = await GroupChatMessage.findById(messageId);

    if (!message || message.isDeleted) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // پین کردن
    await message.pin(userId);

    await message.populate('sender', 'firstName lastName username avatar');
    await message.populate('pinnedBy', 'firstName lastName username');

    return NextResponse.json({
      message: 'Message pinned successfully',
      data: message,
    });
  } catch (error) {
    console.error('❌ Error pinning message:', error);
    return NextResponse.json(
      { error: 'Failed to pin message' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/groupchats/[id]/messages/[messageId]/pin
 * آنپین کردن پیام (فقط مدیر)
 */
export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectAPI(request);
    if (!protection.authenticated) {
      return NextResponse.json({ error: protection.message }, { status: 401 });
    }

    const { id, messageId } = params;
    const userId = protection.user.id;

    // دریافت گروه
    const groupChat = await GroupChat.findById(id);

    if (!groupChat || !groupChat.isActive) {
      return NextResponse.json({ error: 'Group chat not found' }, { status: 404 });
    }

    // چک مدیریت
    if (!groupChat.isAdmin(userId)) {
      return NextResponse.json(
        { error: 'Only admins can unpin messages' },
        { status: 403 }
      );
    }

    // دریافت پیام
    const message = await GroupChatMessage.findById(messageId);

    if (!message || message.isDeleted) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // آنپین کردن
    await message.unpin();

    await message.populate('sender', 'firstName lastName username avatar');

    return NextResponse.json({
      message: 'Message unpinned successfully',
      data: message,
    });
  } catch (error) {
    console.error('❌ Error unpinning message:', error);
    return NextResponse.json(
      { error: 'Failed to unpin message' },
      { status: 500 }
    );
  }
}



