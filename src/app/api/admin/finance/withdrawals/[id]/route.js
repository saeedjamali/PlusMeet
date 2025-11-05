import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Transaction from '@/lib/models/Transaction.model';
import Wallet from '@/lib/models/Wallet.model';
import { authenticate } from '@/lib/middleware/auth';
import { protectAPI } from '@/lib/middleware/apiProtection';
import { logActivity } from '@/lib/models/ActivityLog.model';

/**
 * PUT /api/admin/finance/withdrawals/:id
 * تایید یا رد درخواست برداشت
 */
export async function PUT(request, { params }) {
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

    const { id } = params;
    const body = await request.json();
    const { action, note } = body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'عملیات نامعتبر است' },
        { status: 400 }
      );
    }

    // پیدا کردن تراکنش
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return NextResponse.json(
        { error: 'تراکنش یافت نشد' },
        { status: 404 }
      );
    }

    // چک نوع تراکنش
    if (transaction.type !== 'withdraw') {
      return NextResponse.json(
        { error: 'این تراکنش برداشت نیست' },
        { status: 400 }
      );
    }

    // چک وضعیت
    if (transaction.status !== 'pending') {
      return NextResponse.json(
        { error: 'این درخواست قبلاً پردازش شده است' },
        { status: 400 }
      );
    }

    // پیدا کردن کیف پول
    const wallet = await Wallet.findById(transaction.walletId);

    if (!wallet) {
      return NextResponse.json(
        { error: 'کیف پول یافت نشد' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      // ✅ تایید برداشت
      
      // کاهش موجودی
      await wallet.withdraw(transaction.amount);
      
      // آزادسازی مبلغ مسدود شده
      await wallet.unfreeze(transaction.amount);

      // تکمیل تراکنش
      await transaction.complete({
        processedAt: new Date(),
        internalNote: note || '',
        metadata: {
          ...transaction.metadata,
          approvedBy: authResult.user.id,
          approvedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'درخواست برداشت تایید و پردازش شد',
        data: transaction,
      });

    } else {
      // ❌ رد برداشت
      
      // آزادسازی مبلغ مسدود شده
      await wallet.unfreeze(transaction.amount);

      // لغو تراکنش
      await transaction.cancel(note || 'درخواست توسط مدیر رد شد');
      
      transaction.metadata = {
        ...transaction.metadata,
        rejectedBy: authResult.user.id,
        rejectedAt: new Date(),
        rejectionReason: note || '',
      };
      await transaction.save();

      return NextResponse.json({
        success: true,
        message: 'درخواست برداشت رد شد',
        data: transaction,
      });
    }

  } catch (error) {
    console.error('❌ Error processing withdrawal:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در پردازش درخواست برداشت',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

