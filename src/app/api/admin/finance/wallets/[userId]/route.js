import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Wallet from '@/lib/models/Wallet.model';
import User from '@/lib/models/User.model';
import { authenticate } from '@/lib/middleware/auth';
import { protectAPI } from '@/lib/middleware/apiProtection';
import { logActivity } from '@/lib/models/ActivityLog.model';

/**
 * GET /api/admin/finance/wallets/:userId
 * دریافت اطلاعات کیف پول یک کاربر
 */
export async function GET(request, { params }) {
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

    const { userId } = params;

    const wallet = await Wallet.findOne({ userId }).populate('userId', 'firstName lastName email phoneNumber userType');

    if (!wallet) {
      return NextResponse.json(
        { error: 'کیف پول یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    console.error('❌ Error fetching wallet:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در دریافت کیف پول',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/finance/wallets/:userId
 * مدیریت کیف پول (مسدود سازی/آزادسازی/تعلیق)
 */
export async function PUT(request, { params }) {
  try {
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

    const { userId } = params;
    const body = await request.json();
    const { action, amount, reason } = body;
    // action: 'freeze' | 'unfreeze' | 'suspend' | 'activate'

    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return NextResponse.json(
        { error: 'کیف پول یافت نشد' },
        { status: 404 }
      );
    }

    let message = '';

    switch (action) {
      case 'freeze':
        if (!amount || amount <= 0) {
          return NextResponse.json(
            { error: 'مبلغ نامعتبر است' },
            { status: 400 }
          );
        }
        await wallet.freeze(amount);
        message = `${amount} ریال از کیف پول مسدود شد`;
        break;

      case 'unfreeze':
        if (!amount || amount <= 0) {
          return NextResponse.json(
            { error: 'مبلغ نامعتبر است' },
            { status: 400 }
          );
        }
        await wallet.unfreeze(amount);
        message = `${amount} ریال از کیف پول آزاد شد`;
        break;

      case 'suspend':
        await wallet.suspend();
        message = 'کیف پول تعلیق شد';
        break;

      case 'activate':
        await wallet.activate();
        message = 'کیف پول فعال شد';
        break;

      default:
        return NextResponse.json(
          { error: 'عملیات نامعتبر است' },
          { status: 400 }
        );
    }

    // ثبت لاگ
    wallet.metadata = {
      ...wallet.metadata,
      lastAction: {
        action,
        amount: amount || null,
        reason: reason || '',
        by: authResult.user.id,
        at: new Date(),
      },
    };
    await wallet.save();

    return NextResponse.json({
      success: true,
      message,
      data: wallet,
    });
  } catch (error) {
    console.error('❌ Error managing wallet:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در مدیریت کیف پول',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

