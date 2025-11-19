import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { protectAPI } from '@/lib/middleware/auth';
import GroupChat from '@/lib/models/GroupChat.model';
import GroupChatMessage from '@/lib/models/GroupChatMessage.model';

/**
 * PATCH /api/groupchats/[id]/messages/[messageId]
 * ویرایش پیام
 */
export async function PATCH(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectAPI(request);
    if (!protection.authenticated) {
      return NextResponse.json({ error: protection.message }, { status: 401 });
    }

    const { id, messageId } = params;
    const userId = protection.user.id;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // دریافت پیام
    const message = await GroupChatMessage.findById(messageId);

    if (!message || message.isDeleted) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // چک اینکه پیام مال خود کاربر باشد
    if (message.sender.toString() !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own messages' },
        { status: 403 }
      );
    }

    // چک اینکه پیام سیستمی نباشد
    if (message.messageType === 'system') {
      return NextResponse.json(
        { error: 'Cannot edit system messages' },
        { status: 400 }
      );
    }

    // ویرایش پیام
    await message.edit(content);

    await message.populate('sender', 'firstName lastName username avatar');

    return NextResponse.json({
      message: 'Message updated successfully',
      data: message,
    });
  } catch (error) {
    console.error('❌ Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/groupchats/[id]/messages/[messageId]
 * حذف پیام
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

    // دریافت پیام
    const message = await GroupChatMessage.findById(messageId);

    if (!message || message.isDeleted) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // چک مجوز حذف: فرستنده یا مدیر
    const isOwner = message.sender.toString() === userId;
    const isAdmin = groupChat.isAdmin(userId);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this message' },
        { status: 403 }
      );
    }

    // حذف نرم
    await message.softDelete(userId);

    return NextResponse.json({
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}



