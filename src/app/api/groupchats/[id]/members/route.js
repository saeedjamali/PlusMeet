import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { protectAPI } from '@/lib/middleware/auth';
import GroupChat from '@/lib/models/GroupChat.model';
import GroupChatMember from '@/lib/models/GroupChatMember.model';
import GroupChatMessage from '@/lib/models/GroupChatMessage.model';

/**
 * GET /api/groupchats/[id]/members
 * دریافت اعضای گروه
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
    
    const status = searchParams.get('status') || 'active';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // دریافت گروه
    const groupChat = await GroupChat.findById(id);

    if (!groupChat || !groupChat.isActive) {
      return NextResponse.json({ error: 'Group chat not found' }, { status: 404 });
    }

    // چک دسترسی
    const isAdmin = groupChat.isAdmin(userId);
    const isMember = await GroupChatMember.findOne({
      groupChat: id,
      user: userId,
      status: 'active',
    });

    if (!isAdmin && !isMember) {
      return NextResponse.json(
        { error: 'You do not have access to view members' },
        { status: 403 }
      );
    }

    // Query اعضا
    let query = { groupChat: id };
    
    if (status !== 'all') {
      query.status = status;
    }

    const [members, total] = await Promise.all([
      GroupChatMember.find(query)
        .populate('user', 'firstName lastName username avatar email status')
        .populate('addedBy', 'firstName lastName username')
        .populate('bannedBy', 'firstName lastName username')
        .sort({ joinedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      GroupChatMember.countDocuments(query),
    ]);

    // افزودن اطلاعات اضافی
    const enrichedMembers = members.map((member) => {
      const isOwner = groupChat.owner.toString() === member.user._id.toString();
      const isAdminMember = groupChat.admins.some(
        (a) => a.toString() === member.user._id.toString()
      );

      return {
        ...member,
        role: isOwner ? 'owner' : isAdminMember ? 'admin' : member.role,
        isOwner,
        isAdmin: isAdminMember || isOwner,
      };
    });

    return NextResponse.json({
      members: enrichedMembers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total: groupChat.stats.totalMembers,
        active: groupChat.stats.activeMembers,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/groupchats/[id]/members
 * افزودن عضو جدید (فقط مدیر)
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
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    // دریافت گروه
    const groupChat = await GroupChat.findById(id);

    if (!groupChat || !groupChat.isActive) {
      return NextResponse.json({ error: 'Group chat not found' }, { status: 404 });
    }

    // چک مدیریت
    if (!groupChat.isAdmin(userId)) {
      return NextResponse.json(
        { error: 'Only admins can add members' },
        { status: 403 }
      );
    }

    // افزودن عضو
    const member = await groupChat.addMember(targetUserId, userId);

    await member.populate('user', 'firstName lastName username avatar');

    // ثبت پیام سیستمی
    await GroupChatMessage.createSystemMessage(id, 'member_joined', {
      userId: targetUserId,
      addedBy: userId,
    });

    return NextResponse.json(
      {
        message: 'Member added successfully',
        member,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error adding member:', error);
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/groupchats/[id]/members/[memberId]
 * حذف/مسدود کردن عضو (فقط مدیر)
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
    const { searchParams } = new URL(request.url);
    
    const targetUserId = searchParams.get('userId');
    const action = searchParams.get('action') || 'remove'; // remove, ban
    const reason = searchParams.get('reason');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    // دریافت گروه
    const groupChat = await GroupChat.findById(id);

    if (!groupChat || !groupChat.isActive) {
      return NextResponse.json({ error: 'Group chat not found' }, { status: 404 });
    }

    // چک مدیریت
    if (!groupChat.isAdmin(userId)) {
      return NextResponse.json(
        { error: 'Only admins can remove/ban members' },
        { status: 403 }
      );
    }

    // نمی‌توان مالک را حذف کرد
    if (groupChat.owner.toString() === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot remove owner' },
        { status: 400 }
      );
    }

    let member;
    let systemAction;

    if (action === 'ban') {
      // مسدود کردن
      member = await groupChat.banMember(targetUserId, userId, reason);
      systemAction = 'member_banned';
    } else {
      // حذف
      member = await groupChat.removeMember(targetUserId, userId);
      systemAction = 'member_removed';
    }

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // ثبت پیام سیستمی
    await GroupChatMessage.createSystemMessage(id, systemAction, {
      userId: targetUserId,
      removedBy: userId,
      reason,
    });

    return NextResponse.json({
      message: `Member ${action === 'ban' ? 'banned' : 'removed'} successfully`,
      member,
    });
  } catch (error) {
    console.error('❌ Error removing/banning member:', error);
    return NextResponse.json(
      { error: 'Failed to remove/ban member' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/groupchats/[id]/members
 * رفع مسدودیت عضو (فقط مدیر)
 */
export async function PATCH(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectAPI(request);
    if (!protection.authenticated) {
      return NextResponse.json({ error: protection.message }, { status: 401 });
    }

    const { id } = params;
    const userId = protection.user.id;
    const body = await request.json();
    const { targetUserId, action } = body;

    if (!targetUserId || !action) {
      return NextResponse.json(
        { error: 'Target user ID and action are required' },
        { status: 400 }
      );
    }

    // دریافت گروه
    const groupChat = await GroupChat.findById(id);

    if (!groupChat || !groupChat.isActive) {
      return NextResponse.json({ error: 'Group chat not found' }, { status: 404 });
    }

    // چک مدیریت
    if (!groupChat.isAdmin(userId)) {
      return NextResponse.json(
        { error: 'Only admins can update members' },
        { status: 403 }
      );
    }

    let member;
    let systemAction;

    if (action === 'unban') {
      // رفع مسدودیت
      member = await groupChat.unbanMember(targetUserId);
      systemAction = 'member_unbanned';
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // ثبت پیام سیستمی
    await GroupChatMessage.createSystemMessage(id, systemAction, {
      userId: targetUserId,
      unbannedBy: userId,
    });

    await member.populate('user', 'firstName lastName username avatar');

    return NextResponse.json({
      message: 'Member unbanned successfully',
      member,
    });
  } catch (error) {
    console.error('❌ Error unbanning member:', error);
    return NextResponse.json(
      { error: 'Failed to unban member' },
      { status: 500 }
    );
  }
}



