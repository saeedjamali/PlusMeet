import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import Event from "@/lib/models/Event.model";
import JoinRequest from "@/lib/models/JoinRequest.model";
import User from "@/lib/models/User.model";
import Wallet from "@/lib/models/Wallet.model";
import { canFinishEvent } from "@/lib/helpers/eventExpiry";
import { canFinishEventWithRequests } from "@/lib/utils/joinRequestHelpers";
import { getStatusLabel } from "@/lib/helpers/joinRequestStatus";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * POST /api/events/[id]/finish
 * پایان رویداد توسط مالک
 */
export async function POST(request, { params }) {
  try {
    await dbConnect();

    // احراز هویت الزامی
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: "لطفاً وارد سیستم شوید" },
        { status: 401 }
      );
    }

    const userId = protection.user.id;
    const eventId = params.id;

    // یافتن رویداد
    const event = await Event.findById(eventId)
      .select("title status endDate creator participationType")
      .populate("participationType", "code");

    if (!event) {
      return NextResponse.json(
        { error: "رویداد یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی مالکیت
    if (event.creator.toString() !== userId) {
      return NextResponse.json(
        { error: "شما مالک این رویداد نیستید" },
        { status: 403 }
      );
    }

    // بررسی امکان پایان رویداد
    const finishCheck = canFinishEvent(event);
    if (!finishCheck.canFinish) {
      return NextResponse.json(
        {
          error: finishCheck.reason,
          remainingHours: finishCheck.remainingHours,
        },
        { status: 400 }
      );
    }

    // بررسی اینکه رویداد قبلاً پایان نیافته باشد
    if (event.status === "finished") {
      return NextResponse.json(
        { error: "این رویداد قبلاً پایان یافته است" },
        { status: 400 }
      );
    }

    if (event.status === "expired") {
      return NextResponse.json(
        { error: "این رویداد منقضی شده است" },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // بررسی وضعیت درخواست‌های پیوستن
    // ═══════════════════════════════════════════════════════════
    const joinRequests = await JoinRequest.find({ event: eventId })
      .populate("user", "firstName lastName email phoneNumber")
      .select("user status createdAt payment");

    console.log(`📋 Found ${joinRequests.length} join requests for event`);

    // چک کردن اینکه همه درخواست‌ها در وضعیت نهایی باشند
    const requestCheck = canFinishEventWithRequests(joinRequests);

    if (!requestCheck.canFinish) {
      console.log(
        `⚠️ Event has ${requestCheck.count} pending requests that need resolution`
      );

      // آماده‌سازی لیست درخواست‌های معلق با اطلاعات کاربر
      const pendingRequestsInfo = requestCheck.pendingRequests.map((req) => ({
        _id: req._id,
        user: {
          id: req.user?._id,
          firstName: req.user?.firstName,
          lastName: req.user?.lastName,
          email: req.user?.email,
          phoneNumber: req.user?.phoneNumber,
        },
        status: req.status,
        statusLabel: getStatusLabel(req.status),
        createdAt: req.createdAt,
        hasPayment: !!req.payment,
      }));

      return NextResponse.json(
        {
          error: "وضعیت برخی از درخواست‌های پیوستن هنوز نهایی نشده است",
          message: `${requestCheck.count} درخواست نیاز به تعیین وضعیت نهایی دارند. لطفاً ابتدا وضعیت تمام درخواست‌ها را مشخص کنید.`,
          hasPendingRequests: true,
          pendingCount: requestCheck.count,
          pendingRequests: pendingRequestsInfo,
        },
        { status: 400 }
      );
    }

    console.log("✅ All join requests are in final status");

    // پایان رویداد
    await event.finish(userId);

    // ═══════════════════════════════════════════════════════════
    // آزادسازی frozenBalance مالک رویداد
    // ═══════════════════════════════════════════════════════════
    let unfrozenAmount = 0;
    try {
      const ownerWallet = await Wallet.findOne({ userId });
      
      if (ownerWallet && ownerWallet.frozenBalance > 0) {
        // محاسبه مجموع مبالغ فریز شده مربوط به این رویداد
        // از روی transactions این رویداد
        const freezeTransactions = ownerWallet.transactions.filter(
          (t) =>
            t.type === "freeze" &&
            t.relatedTo &&
            t.relatedTo.model === "Event" &&
            t.relatedTo.id &&
            t.relatedTo.id.toString() === eventId
        );

        const unfreezeTransactions = ownerWallet.transactions.filter(
          (t) =>
            t.type === "unfreeze" &&
            t.relatedTo &&
            t.relatedTo.model === "Event" &&
            t.relatedTo.id &&
            t.relatedTo.id.toString() === eventId
        );

        const totalFrozen = freezeTransactions.reduce(
          (sum, t) => sum + (t.amount || 0),
          0
        );
        const totalUnfrozen = unfreezeTransactions.reduce(
          (sum, t) => sum + (t.amount || 0),
          0
        );

        const remainingFrozen = totalFrozen - totalUnfrozen;

        if (remainingFrozen > 0 && ownerWallet.frozenBalance >= remainingFrozen) {
          await ownerWallet.unfreezeAmount(remainingFrozen, {
            description: `آزادسازی درآمد به دلیل پایان رویداد: ${event.title}`,
            eventId: eventId,
          });
          unfrozenAmount = remainingFrozen;
          console.log(`💰 Unfroze ${remainingFrozen} from owner wallet`);
        }
      }
    } catch (err) {
      console.error("⚠️ Error unfreezing owner balance:", err);
      // Don't fail the whole request if unfreezing fails
    }

    // لاگ فعالیت
    await logActivity(userId, "event.finish", {
      targetType: "Event",
      targetId: eventId,
      details: {
        eventTitle: event.title,
        endDate: event.endDate,
        finishedAt: event.finishedAt,
        unfrozenAmount,
      },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    console.log(`✅ Event finished: ${event.title} (${eventId})`);

    // تعیین پیام بر اساس نوع رویداد
    const participationType = event.participationType?.code;
    const isTicketed =
      participationType === "TICKETED" ||
      participationType === "APPROVAL_TICKETED";

    let message = isTicketed
      ? "رویداد با موفقیت پایان یافت. تسویه‌حساب‌های مالی انجام شد"
      : "رویداد با موفقیت پایان یافت";

    if (unfrozenAmount > 0) {
      message += `. مبلغ ${unfrozenAmount.toLocaleString("fa-IR")} ریال از موجودی فریز شده آزاد و به موجودی قابل استفاده شما اضافه شد`;
    }

    return NextResponse.json({
      success: true,
      message,
      event: {
        id: event._id,
        title: event.title,
        status: event.status,
        finishedAt: event.finishedAt,
      },
      unfrozenAmount,
    });
  } catch (error) {
    console.error("❌ Error finishing event:", error);
    return NextResponse.json(
      { error: "خطا در پایان رویداد", details: error.message },
      { status: 500 }
    );
  }
}

