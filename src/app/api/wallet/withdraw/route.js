import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Wallet from '@/lib/models/Wallet.model';
import Transaction from '@/lib/models/Transaction.model';
import User from '@/lib/models/User.model';
import { authenticate } from '@/lib/middleware/auth';
import { protectAPI } from '@/lib/middleware/apiProtection';
import { logActivity } from '@/lib/models/ActivityLog.model';

/**
 * POST /api/wallet/withdraw
 * درخواست برداشت پول از کیف پول
 */
export async function POST(request) {
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
    const body = await request.json();
    const { amount, bankAccount, description } = body;

    // اعتبارسنجی
    if (!amount || amount < 10000) {
      return NextResponse.json(
        { error: 'مبلغ برداشت باید حداقل 10,000 ریال باشد' },
        { status: 400 }
      );
    }

    if (amount > 50000000) {
      // حداکثر 50 میلیون ریال
      return NextResponse.json(
        { error: 'مبلغ برداشت نباید بیشتر از 50 میلیون ریال باشد' },
        { status: 400 }
      );
    }

    if (!bankAccount || !bankAccount.iban || !bankAccount.accountHolder) {
      return NextResponse.json(
        { error: 'اطلاعات حساب بانکی الزامی است' },
        { status: 400 }
      );
    }

    // اعتبارسنجی شبا
    const ibanPattern = /^IR\d{24}$/;
    if (!ibanPattern.test(bankAccount.iban)) {
      return NextResponse.json(
        { error: 'شماره شبا نامعتبر است' },
        { status: 400 }
      );
    }

    // پیدا کردن کیف پول
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return NextResponse.json(
        { error: 'کیف پول یافت نشد' },
        { status: 404 }
      );
    }

    // چک وضعیت کیف پول
    if (wallet.status !== 'active') {
      return NextResponse.json(
        { error: 'کیف پول شما غیرفعال است' },
        { status: 403 }
      );
    }

    // چک موجودی
    if (wallet.availableBalance < amount) {
      return NextResponse.json(
        { error: `موجودی قابل برداشت شما کافی نیست. موجودی: ${wallet.availableBalance} ریال` },
        { status: 400 }
      );
    }

    // ایجاد تراکنش برداشت با وضعیت pending
    const transaction = await Transaction.create({
      userId,
      walletId: wallet._id,
      type: 'withdraw',
      amount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance - amount, // موقتی
      direction: 'out',
      paymentMethod: 'bank_transfer',
      description: description || `درخواست برداشت ${amount} ریال`,
      status: 'pending', // منتظر تایید مدیر
      metadata: {
        bankAccount: {
          iban: bankAccount.iban,
          accountHolder: bankAccount.accountHolder,
          bankName: bankAccount.bankName || '',
        },
        requestedAt: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    // مسدود کردن مبلغ تا تایید شود
    await wallet.freeze(amount);

    // ثبت لاگ
    try {
      await logActivity(authResult.user.phoneNumber, 'withdraw_request', {
        targetType: 'Transaction',
        targetId: transaction._id.toString(),
        metadata: {
          amount,
          bankAccount: bankAccount.iban,
          status: 'pending',
        },
      });
    } catch (logError) {
      console.error('Error logging withdraw request:', logError);
    }

    return NextResponse.json({
      success: true,
      data: {
        transactionId: transaction._id,
        amount: transaction.amount,
        status: transaction.status,
      },
      message: 'درخواست برداشت با موفقیت ثبت شد و منتظر تایید مدیریت است',
    });
  } catch (error) {
    console.error('❌ Error creating withdraw request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در ثبت درخواست برداشت',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

