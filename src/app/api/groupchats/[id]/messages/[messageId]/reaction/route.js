import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { protectAPI } from '@/lib/middleware/auth';
import GroupChat from '@/lib/models/GroupChat.model';
import GroupChatMessage from '@/lib/models/GroupChatMessage.model';
import GroupChatMember from '@/lib/models/GroupChatMember.model';

/**
 * POST /api/groupchats/[id]/messages/[messageId]/reaction
 * افزودن/حذف ری‌اکشن
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
    const body = await request.json();
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400 }
      );
    }

    // دریافت گروه
    const groupChat = await GroupChat.findById(id);

    if (!groupChat || !groupChat.isActive) {
      return NextResponse.json({ error: 'Group chat not found' }, { status: 404 });
    }

    // چک عضویت
    const isMember = await GroupChatMember.findOne({
      groupChat: id,
      user: userId,
      status: 'active',
    });

    const isAdmin = groupChat.isAdmin(userId);

    if (!isMember && !isAdmin) {
      return NextResponse.json(
        { error: 'You must be a member to react' },
        { status: 403 }
      );
    }

    // دریافت پیام
    const message = await GroupChatMessage.findById(messageId);

    if (!message || message.isDeleted) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // افزودن/حذف ری‌اکشن
    await message.addReaction(emoji, userId);

    await message.populate('sender', 'firstName lastName username avatar');

    return NextResponse.json({
      message: 'Reaction updated successfully',
      data: message,
    });
  } catch (error) {
    console.error('❌ Error updating reaction:', error);
    return NextResponse.json(
      { error: 'Failed to update reaction' },
      { status: 500 }
    );
  }
}



