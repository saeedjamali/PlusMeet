import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import Event from "@/lib/models/Event.model";
import JoinRequest from "@/lib/models/JoinRequest.model";

/**
 * GET /api/events/my
 * دریافت رویدادهای کاربر (به عنوان سازنده و شرکت‌کننده)
 */
export async function GET(request) {
  try {
    await dbConnect();

    // احراز هویت الزامی
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        {
          error: "لطفاً وارد سیستم شوید",
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    const userId = protection.user.id;

    // دریافت فیلترها
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // all, owned, participating
    const status = searchParams.get("status"); // approved, pending, rejected, draft, etc.
    const role = searchParams.get("role"); // creator

    // ═══════════════════════════════════════════════════════════
    // برای type=all: هم رویدادهای مالکیت و هم شرکت‌کننده
    // ═══════════════════════════════════════════════════════════
    if (type === "all") {
      // 1️⃣ دریافت رویدادهای مالکیت
      const ownedQuery = { creator: userId };
      if (status && status !== "all") {
        if (status.includes(",")) {
          // چند وضعیت با کاما جدا شده: finished,expired
          ownedQuery.status = { $in: status.split(",").map((s) => s.trim()) };
        } else {
          ownedQuery.status = status;
        }
      }

      const ownedEvents = await Event.find(ownedQuery)
        .populate("topicCategory", "title")
        .populate("formatMode", "title")
        .populate("participationType", "title code")
        .populate("creator", "firstName lastName")
        .sort({ createdAt: -1 })
        .lean();

      // محاسبه آمار برای هر رویداد
      const eventsWithStats = await Promise.all(
        ownedEvents.map(async (event) => {
          const stats = await JoinRequest.aggregate([
            { $match: { event: event._id } },
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ]);

          const statsObj = {
            totalRequests: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            confirmed: 0,
            paid: 0,
            paymentReserved: 0,
            attended: 0,
            completed: 0,
          };

          stats.forEach((stat) => {
            statsObj.totalRequests += stat.count;
            if (stat._id === "PENDING") statsObj.pending = stat.count;
            if (stat._id === "APPROVED") statsObj.approved = stat.count;
            if (stat._id === "REJECTED") statsObj.rejected = stat.count;
            if (stat._id === "CONFIRMED") statsObj.confirmed = stat.count;
            if (stat._id === "PAID") statsObj.paid = stat.count;
            if (stat._id === "PAYMENT_RESERVED")
              statsObj.paymentReserved = stat.count;
            if (stat._id === "ATTENDED") statsObj.attended = stat.count;
            if (stat._id === "COMPLETED") statsObj.completed = stat.count;
          });

          return {
            ...event,
            stats: statsObj,
          };
        })
      );

      // 2️⃣ دریافت رویدادهایی که کاربر شرکت‌کننده است
      const joinRequests = await JoinRequest.find({ user: userId })
        .populate({
          path: "event",
          populate: [
            { path: "topicCategory", select: "title" },
            { path: "formatMode", select: "title" },
            { path: "participationType", select: "title code" },
            { path: "creator", select: "firstName lastName" },
          ],
        })
        .sort({ createdAt: -1 })
        .lean();

      // فیلتر کردن join requests که event آنها null نیست
      const participatingEvents = joinRequests
        .filter((jr) => jr.event)
        .map((jr) => ({
          ...jr.event,
          joinRequest: {
            _id: jr._id,
            status: jr.status,
            createdAt: jr.createdAt,
            updatedAt: jr.updatedAt,
          },
        }));

      return NextResponse.json({
        success: true,
        ownedEvents: eventsWithStats,
        participatingEvents,
        totalOwned: eventsWithStats.length,
        totalParticipating: participatingEvents.length,
      });
    }

    // ═══════════════════════════════════════════════════════════
    // برای سایر موارد: فقط رویدادهای مالکیت (برای eComment)
    // ═══════════════════════════════════════════════════════════
    const query = {};

    // فیلتر نقش
    if (role === "creator" || !type) {
      query.creator = userId;
    }

    // فیلتر وضعیت (پشتیبانی از چند وضعیت با کاما جدا شده)
    if (status && status !== "all") {
      if (status.includes(",")) {
        // چند وضعیت با کاما جدا شده: finished,expired
        query.status = { $in: status.split(",").map((s) => s.trim()) };
      } else {
        query.status = status;
      }
    }

    // دریافت رویدادها
    const events = await Event.find(query)
      .select(
        "_id title slug images status reviewCount rating createdAt startDate endDate"
      )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      events,
      total: events.length,
    });
  } catch (error) {
    console.error("❌ Error fetching user events:", error);
    return NextResponse.json(
      { error: "خطا در دریافت رویدادها", details: error.message },
      { status: 500 }
    );
  }
}
