import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { protectAPI } from "@/lib/middleware/apiProtection";
import Wallet from "@/lib/models/Wallet.model";
import Event from "@/lib/models/Event.model";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * GET /api/wallet/transactions
 * دریافت لیست تراکنش‌های کاربر
 * 
 * Query params:
 * - type: all | income | expense (پیش‌فرض: all)
 * - eventId: فیلتر بر اساس رویداد خاص
 * - limit: تعداد تراکنش (پیش‌فرض: 50)
 * - offset: شروع از کجا (پیش‌فرض: 0)
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
          requiresAuth: true
        },
        { status: 401 }
      );
    }

    const userId = protection.user.id;
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get("type") || "all"; // all | income | expense
    const eventId = searchParams.get("eventId");
    const limit = parseInt(searchParams.get("limit")) || 50;
    const offset = parseInt(searchParams.get("offset")) || 0;

    // دریافت کیف پول کاربر
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return NextResponse.json(
        { 
          error: "کیف پول یافت نشد",
          transactions: [],
          summary: {
            balance: 0,
            availableBalance: 0,
            frozenBalance: 0,
            reservedBalance: 0,
          },
          counts: {
            total: 0,
            income: 0,
            expense: 0,
          }
        },
        { status: 404 }
      );
    }

    // فیلتر کردن تراکنش‌ها
    let transactions = [...wallet.transactions];

    // فیلتر بر اساس نوع
    if (type === "income") {
      transactions = transactions.filter(t => 
        ["payment", "refund", "event_ticket_income", "event_refund", "unfreeze"].includes(t.type)
      );
    } else if (type === "expense") {
      transactions = transactions.filter(t => 
        ["deduction", "event_ticket_purchase", "event_ticket_approved", "event_ticket_reserve", "freeze"].includes(t.type)
      );
    }

    // فیلتر بر اساس رویداد
    if (eventId) {
      transactions = transactions.filter(t => 
        t.relatedTo && 
        t.relatedTo.model === "Event" && 
        t.relatedTo.id && 
        t.relatedTo.id.toString() === eventId
      );
    }

    // مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // محاسبه آمار
    const totalCount = transactions.length;
    const incomeTransactions = transactions.filter(t => 
      ["payment", "refund", "event_ticket_income", "event_refund", "unfreeze"].includes(t.type)
    );
    const expenseTransactions = transactions.filter(t => 
      ["deduction", "event_ticket_purchase", "event_ticket_approved", "event_ticket_reserve", "freeze"].includes(t.type)
    );

    // پیجینیشن
    const paginatedTransactions = transactions.slice(offset, offset + limit);

    // دریافت اطلاعات رویدادها
    const eventIds = [...new Set(
      paginatedTransactions
        .filter(t => t.relatedTo && t.relatedTo.model === "Event" && t.relatedTo.id)
        .map(t => t.relatedTo.id.toString())
    )];

    const events = await Event.find({ _id: { $in: eventIds } })
      .select("title slug status")
      .lean();

    const eventsMap = {};
    events.forEach(e => {
      eventsMap[e._id.toString()] = e;
    });

    // آماده‌سازی تراکنش‌ها برای ارسال
    const enrichedTransactions = paginatedTransactions.map(t => {
      const transaction = {
        _id: t._id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        balanceBefore: t.balanceBefore,
        balanceAfter: t.balanceAfter,
        createdAt: t.createdAt,
      };

      // اگر مربوط به رویداد باشد
      if (t.relatedTo && t.relatedTo.model === "Event" && t.relatedTo.id) {
        const eventId = t.relatedTo.id.toString();
        transaction.event = eventsMap[eventId] || null;
      }

      return transaction;
    });

    // لاگ فعالیت
    await logActivity(userId, "wallet.view_transactions", {
      targetType: "Wallet",
      targetId: wallet._id,
      details: {
        type,
        eventId,
        limit,
        offset,
        resultCount: paginatedTransactions.length,
      },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      transactions: enrichedTransactions,
      summary: {
        balance: wallet.balance,
        availableBalance: wallet.availableBalance,
        frozenBalance: wallet.frozenBalance,
        reservedBalance: wallet.reservedBalance,
        currency: wallet.currency,
      },
      counts: {
        total: totalCount,
        income: incomeTransactions.length,
        expense: expenseTransactions.length,
      },
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < totalCount,
        total: totalCount,
      },
    });

  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    return NextResponse.json(
      { error: "خطا در دریافت تراکنش‌ها", details: error.message },
      { status: 500 }
    );
  }
}
