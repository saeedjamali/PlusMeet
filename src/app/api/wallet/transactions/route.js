import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Transaction from '@/lib/models/Transaction.model';
import Wallet from '@/lib/models/Wallet.model';
import { authenticate } from '@/lib/middleware/auth';
import { protectAPI } from '@/lib/middleware/apiProtection';

/**
 * GET /api/wallet/transactions
 * دریافت لیست تراکنش‌های کاربر
 */
export async function GET(request) {
  try {
    // API Protection
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    await dbConnect();

    // احراز هویت
    const authResult = await authenticate(request, { requireCSRF: false });
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'لطفا وارد شوید' },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;
    const { searchParams } = new URL(request.url);

    // پارامترهای فیلتر و صفحه‌بندی
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const type = searchParams.get('type'); // deposit, withdraw, payment, etc.
    const status = searchParams.get('status'); // pending, completed, failed
    const direction = searchParams.get('direction'); // in, out
    const dateFrom = searchParams.get('dateFrom'); // YYYY-MM-DD
    const dateTo = searchParams.get('dateTo'); // YYYY-MM-DD

    // ساخت query
    const query = { userId };

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    if (direction) {
      query.direction = direction;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
      }
    }

    // دریافت تراکنش‌ها با pagination
    const skip = (page - 1) * limit;
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // شمارش کل
    const total = await Transaction.countDocuments(query);

    // آمار
    const stats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$direction',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const statsFormatted = {
      totalIn: 0,
      totalOut: 0,
      countIn: 0,
      countOut: 0,
    };

    stats.forEach((stat) => {
      if (stat._id === 'in') {
        statsFormatted.totalIn = stat.total;
        statsFormatted.countIn = stat.count;
      } else if (stat._id === 'out') {
        statsFormatted.totalOut = stat.total;
        statsFormatted.countOut = stat.count;
      }
    });

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: statsFormatted,
    });
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در دریافت تراکنش‌ها',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

