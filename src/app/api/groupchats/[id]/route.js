import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { protectAPI } from '@/lib/middleware/auth';
import GroupChat from '@/lib/models/GroupChat.model';
import GroupChatMember from '@/lib/models/GroupChatMember.model';
import JoinRequest from '@/lib/models/JoinRequest.model';

/**
 * GET /api/groupchats/[id]
 * دریافت جزئیات یک گروه چت
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

    // دریافت گروه
    const groupChat = await GroupChat.findById(id)
      .populate('event', 'title slug description startDate endDate status images coverImage')
      .populate('owner', 'firstName lastName username avatar email')
      .populate('admins', 'firstName lastName username avatar')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'firstName lastName username avatar',
        },
      })
      .lean();

    if (!groupChat) {
      return NextResponse.json({ error: 'Group chat not found' }, { status: 404 });
    }

    // چک دسترسی
    let canAccess = false;
    let joinRequestStatus = null;

    if (groupChat.visibility === 'public') {
      // گروه عمومی - همه می‌توانند ببینند
      const User = (await import('@/lib/models/User.model')).default;
      const user = await User.findById(userId);
      canAccess = user && ['active', 'verified'].includes(user.status);
    } else if (groupChat.visibility === 'private') {
      // گروه خصوصی - فقط شرکت‌کنندگان فعال
      const joinRequest = await JoinRequest.findOne({
        event: groupChat.event._id,
        user: userId,
      }).lean();

      if (joinRequest) {
        joinRequestStatus = joinRequest.status;
        const { isActiveParticipant } = require('@/lib/utils/joinRequestHelpers');
        canAccess = isActiveParticipant(joinRequest.status);
      }
    }

    // مدیران همیشه دسترسی دارند
    const isAdmin =
      groupChat.owner._id.toString() === userId ||
      groupChat.admins.some((a) => a._id.toString() === userId);

    if (isAdmin) {
      canAccess = true;
    }

    if (!canAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this group' },
        { status: 403 }
      );
    }

    // دریافت عضویت کاربر
    const membership = await GroupChatMember.findOne({
      groupChat: id,
      user: userId,
    }).lean();

    // اگر کاربر عضو نیست و دسترسی دارد، اضافه‌اش کن
    if (!membership && canAccess && !isAdmin) {
      const newMember = await GroupChatMember.create({
        groupChat: id,
        user: userId,
        addedBy: groupChat.owner._id,
        status: 'active',
      });
      
      // به‌روزرسانی آمار گروه
      await GroupChat.findByIdAndUpdate(id, {
        $inc: {
          'stats.totalMembers': 1,
          'stats.activeMembers': 1,
        },
      });
    }

    // به‌روزرسانی lastSeenAt
    if (membership) {
      await GroupChatMember.findByIdAndUpdate(membership._id, {
        lastSeenAt: new Date(),
      });
    }

    return NextResponse.json({
      groupChat: {
        ...groupChat,
        membership,
        isAdmin,
        canAccess,
        joinRequestStatus,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching group chat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group chat' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/groupchats/[id]
 * به‌روزرسانی تنظیمات گروه (فقط مدیر)
 */
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectAPI(request);
    if (!protection.authenticated) {
      return NextResponse.json({ error: protection.message }, { status: 401 });
    }

    const { id } = params;
    const userId = protection.user.id;
    const body = await request.json();

    // دریافت گروه
    const groupChat = await GroupChat.findById(id);

    if (!groupChat) {
      return NextResponse.json({ error: 'Group chat not found' }, { status: 404 });
    }

    // چک مدیریت
    if (!groupChat.isAdmin(userId)) {
      return NextResponse.json(
        { error: 'Only admins can update group settings' },
        { status: 403 }
      );
    }

    // فیلدهای قابل به‌روزرسانی
    const allowedFields = [
      'name',
      'description',
      'avatar',
      'visibility',
      'isClosed',
      'settings',
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        if (field === 'settings') {
          // به‌روزرسانی تنظیمات
          groupChat.settings = {
            ...groupChat.settings,
            ...body[field],
          };
        } else {
          groupChat[field] = body[field];
        }
      }
    });

    await groupChat.save();

    // ثبت پیام سیستمی
    if (body.visibility && body.visibility !== groupChat.visibility) {
      const GroupChatMessage = (await import('@/lib/models/GroupChatMessage.model')).default;
      await GroupChatMessage.createSystemMessage(id, 'visibility_changed', {
        from: groupChat.visibility,
        to: body.visibility,
        changedBy: userId,
      });
    }

    if (body.isClosed !== undefined) {
      const GroupChatMessage = (await import('@/lib/models/GroupChatMessage.model')).default;
      await GroupChatMessage.createSystemMessage(
        id,
        body.isClosed ? 'group_closed' : 'group_opened',
        {
          changedBy: userId,
        }
      );
    }

    await groupChat.populate([
      { path: 'event', select: 'title slug startDate endDate' },
      { path: 'owner', select: 'firstName lastName username avatar' },
      { path: 'admins', select: 'firstName lastName username avatar' },
    ]);

    return NextResponse.json({
      message: 'Group chat updated successfully',
      groupChat,
    });
  } catch (error) {
    console.error('❌ Error updating group chat:', error);
    return NextResponse.json(
      { error: 'Failed to update group chat' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/groupchats/[id]
 * حذف گروه (فقط مالک)
 */
export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectAPI(request);
    if (!protection.authenticated) {
      return NextResponse.json({ error: protection.message }, { status: 401 });
    }

    const { id } = params;
    const userId = protection.user.id;

    // دریافت گروه
    const groupChat = await GroupChat.findById(id);

    if (!groupChat) {
      return NextResponse.json({ error: 'Group chat not found' }, { status: 404 });
    }

    // فقط مالک می‌تواند حذف کند
    if (groupChat.owner.toString() !== userId) {
      return NextResponse.json(
        { error: 'Only owner can delete group chat' },
        { status: 403 }
      );
    }

    // حذف نرم (غیرفعال کردن)
    groupChat.isActive = false;
    await groupChat.save();

    return NextResponse.json({
      message: 'Group chat deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting group chat:', error);
    return NextResponse.json(
      { error: 'Failed to delete group chat' },
      { status: 500 }
    );
  }
}



