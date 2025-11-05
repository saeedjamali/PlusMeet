import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Transaction from '@/lib/models/Transaction.model';
import { authenticate } from '@/lib/middleware/auth';
import { protectAPI } from '@/lib/middleware/apiProtection';

/**
 * GET /api/admin/finance/transactions
 * لیست تمام تراکنش‌های سیستم
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

    const authResult = await authenticate(request, { requireCSRF: false });
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'لطفا وارد شوید' },
        { status: 401 }
      );
    }

    const hasPermission = authResult.user.roles?.includes('admin') || 
                         authResult.user.roles?.includes('finance_manager');

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'شما دسترسی ندارید' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const direction = searchParams.get('direction');
    const userId = searchParams.get('userId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search'); // جستجو در شماره تلفن یا نام

    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (direction) query.direction = direction;
    if (userId) query.userId = userId;

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    const skip = (page - 1) * limit;
    
    let transactions = await Transaction.find(query)
      .populate('userId', 'firstName lastName email phoneNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // جستجو در نام یا شماره تلفن
    if (search) {
      transactions = transactions.filter(t => 
        t.userId?.phoneNumber?.includes(search) ||
        t.userId?.firstName?.includes(search) ||
        t.userId?.lastName?.includes(search)
      );
    }

    const total = await Transaction.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
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

