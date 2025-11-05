import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Transaction from '@/lib/models/Transaction.model';
import { authenticate } from '@/lib/middleware/auth';
import { protectAPI } from '@/lib/middleware/apiProtection';

/**
 * GET /api/admin/finance/withdrawals
 * لیست درخواست‌های برداشت
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

    // چک دسترسی
    const hasPermission = authResult.user.roles?.includes('admin') || 
                         authResult.user.roles?.includes('finance_manager');

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'شما دسترسی به بخش مالی ندارید' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // پارامترها
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status'); // pending, completed, rejected
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // ساخت query
    const query = { type: 'withdraw' };

    if (status) {
      query.status = status;
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

    // دریافت درخواست‌ها
    const skip = (page - 1) * limit;
    const withdrawals = await Transaction.find(query)
      .populate('userId', 'firstName lastName email phoneNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // شمارش کل
    const total = await Transaction.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: withdrawals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching withdrawals:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در دریافت درخواست‌های برداشت',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

