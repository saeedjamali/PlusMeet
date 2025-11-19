import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/auth";
import GroupChat from "@/lib/models/GroupChat.model";
import GroupChatMember from "@/lib/models/GroupChatMember.model";
import { isActiveParticipant } from "@/lib/utils/joinRequestHelpers";
import JoinRequest from "@/lib/models/JoinRequest.model";

/**
 * GET /api/groupchats
 * دریافت لیست گروه‌های چت (عمومی + گروه‌های کاربر)
 */
export async function GET(request) {
  try {
    await dbConnect();

    const protection = await protectAPI(request);
    if (!protection.authenticated) {
      return NextResponse.json({ error: protection.message }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // all, public, my, managed
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const userId = protection.user.id;
    let query = { isActive: true };
    let populateOptions = [
      {
        path: "event",
        select: "title slug startDate endDate status images coverImage",
      },
      {
        path: "owner",
        select: "firstName lastName username avatar",
      },
    ];

    if (type === "public") {
      // فقط گروه‌های عمومی
      query.visibility = "public";
      query.isClosed = false;
    } else if (type === "my") {
      // گروه‌هایی که کاربر عضو آن‌هاست
      const myMemberships = await GroupChatMember.find({
        user: userId,
        status: "active",
      }).select("groupChat");

      const myGroupIds = myMemberships.map((m) => m.groupChat);
      query._id = { $in: myGroupIds };
    } else if (type === "managed") {
      // گروه‌هایی که کاربر مدیر آن‌هاست
      query.$or = [{ owner: userId }, { admins: userId }];
    }

    // دریافت گروه‌ها
    const [groups, total] = await Promise.all([
      GroupChat.find(query)
        .populate(populateOptions)
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      GroupChat.countDocuments(query),
    ]);

    // افزودن اطلاعات عضویت کاربر
    const enrichedGroups = await Promise.all(
      groups.map(async (group) => {
        const membership = await GroupChatMember.findOne({
          groupChat: group._id,
          user: userId,
        }).lean();

        // چک دسترسی
        let canAccess = false;
        let joinRequestStatus = null;

        if (group.visibility === "public") {
          canAccess = true;
        } else if (group.visibility === "private") {
          // چک کن که کاربر در رویداد باشد
          const joinRequest = await JoinRequest.findOne({
            event: group.event._id,
            user: userId,
          }).lean();

          if (joinRequest) {
            joinRequestStatus = joinRequest.status;
            canAccess = isActiveParticipant(joinRequest.status);
          }
        }

        return {
          ...group,
          membership,
          canAccess,
          isAdmin:
            group.owner.toString() === userId ||
            group.admins.some((a) => a.toString() === userId),
        };
      })
    );

    return NextResponse.json({
      groups: enrichedGroups,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching group chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch group chats" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/groupchats
 * ساخت گروه جدید (فقط برای رویدادهای جدید - معمولاً خودکار است)
 */
export async function POST(request) {
  try {
    await dbConnect();

    const protection = await protectAPI(request);
    if (!protection.authenticated) {
      return NextResponse.json({ error: protection.message }, { status: 401 });
    }

    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const userId = protection.user.id;

    // چک کن که رویداد وجود داشته باشد
    const Event = (await import("@/lib/models/Event.model")).default;
    const event = await Event.findById(eventId);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // چک کن که کاربر مالک رویداد باشد
    if (event.createdBy.toString() !== userId) {
      return NextResponse.json(
        { error: "Only event owner can create group chat" },
        { status: 403 }
      );
    }

    // ساخت گروه چت
    const groupChat = await GroupChat.createForEvent(eventId, userId, userId);

    await groupChat.populate([
      { path: "event", select: "title slug startDate endDate" },
      { path: "owner", select: "firstName lastName username avatar" },
    ]);

    return NextResponse.json(
      {
        message: "Group chat created successfully",
        groupChat,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating group chat:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create group chat" },
      { status: 500 }
    );
  }
}


