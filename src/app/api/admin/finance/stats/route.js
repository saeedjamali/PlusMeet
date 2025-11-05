import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Wallet from '@/lib/models/Wallet.model';
import Transaction from '@/lib/models/Transaction.model';
import { authenticate } from '@/lib/middleware/auth';
import { protectAPI } from '@/lib/middleware/apiProtection';
import { checkPermission } from '@/lib/middleware/rbac';

/**
 * GET /api/admin/finance/stats
 * آمار مالی کلی سیستم
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

    // چک دسترسی (فقط admin یا finance_manager)
    const hasPermission = authResult.user.roles?.includes('admin') || 
                         authResult.user.roles?.includes('finance_manager');

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'شما دسترسی به بخش مالی ندارید' },
        { status: 403 }
      );
    }

    // آمار کیف پول‌ها
    const walletStats = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$balance' },
          totalAvailable: { $sum: '$availableBalance' },
          totalFrozen: { $sum: '$frozenBalance' },
          activeWallets: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          suspendedWallets: {
            $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] }
          },
        },
      },
    ]);

    // آمار تراکنش‌ها - 30 روز گذشته
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactionStats = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
    ]);

    // تراکنش‌های pending
    const pendingTransactions = await Transaction.countDocuments({
      status: 'pending',
    });

    // درخواست‌های برداشت pending
    const pendingWithdrawals = await Transaction.countDocuments({
      type: 'withdraw',
      status: 'pending',
    });

    // آمار امروز
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: '$direction',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
    ]);

    // فرمت کردن نتایج
    const stats = {
      wallets: {
        totalBalance: walletStats[0]?.totalBalance || 0,
        totalAvailable: walletStats[0]?.totalAvailable || 0,
        totalFrozen: walletStats[0]?.totalFrozen || 0,
        activeWallets: walletStats[0]?.activeWallets || 0,
        suspendedWallets: walletStats[0]?.suspendedWallets || 0,
      },
      transactions: {
        pending: pendingTransactions,
        pendingWithdrawals,
        last30Days: transactionStats.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            total: item.total,
          };
          return acc;
        }, {}),
      },
      today: {
        deposits: todayStats.find(s => s._id === 'in')?.total || 0,
        withdrawals: todayStats.find(s => s._id === 'out')?.total || 0,
        depositCount: todayStats.find(s => s._id === 'in')?.count || 0,
        withdrawalCount: todayStats.find(s => s._id === 'out')?.count || 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('❌ Error fetching finance stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در دریافت آمار مالی',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

