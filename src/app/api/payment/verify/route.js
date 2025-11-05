import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db/mongodb';
import Wallet from '@/lib/models/Wallet.model';
import Transaction from '@/lib/models/Transaction.model';
import { protectAPI } from '@/lib/middleware/apiProtection';
import { logActivity } from '@/lib/models/ActivityLog.model';
import { verifyPayment } from '@/lib/services/zarinpal.service';

/**
 * GET /api/payment/verify
 * تایید پرداخت بعد از بازگشت از درگاه زرین‌پال
 * زرین‌پال کاربر رو به این URL redirect می‌کنه
 */
export async function GET(request) {
  try {
    // API Protection  
    const protection = await protectAPI(request, { publicEndpoint: true });
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const authority = searchParams.get('Authority');
    const status = searchParams.get('Status');

    console.log('💳 Payment Callback:', { authority, status });

    // بررسی وضعیت
    if (status !== 'OK') {
      // پرداخت لغو شده توسط کاربر یا ناموفق
      if (authority) {
        const transaction = await Transaction.findOne({ authority });
        if (transaction) {
          await transaction.fail('پرداخت توسط کاربر لغو شد یا ناموفق بود');
        }
      }

      // Redirect به صفحه wallet با خطا
      return redirect('/dashboard/wallet?payment=failed&reason=cancelled');
    }

    if (!authority) {
      return redirect('/dashboard/wallet?payment=failed&reason=invalid');
    }

    // پیدا کردن تراکنش
    const transaction = await Transaction.findOne({ authority });

    if (!transaction) {
      console.error('❌ Transaction not found:', authority);
      return redirect('/dashboard/wallet?payment=failed&reason=not_found');
    }

    // اگر قبلاً تایید شده
    if (transaction.status === 'completed') {
      return redirect(`/dashboard/wallet?payment=success&ref_id=${transaction.refId}`);
    }

    // تایید پرداخت با زرین‌پال
    const verifyResult = await verifyPayment({
      authority,
      amount: transaction.amount,
    });

    if (!verifyResult.success) {
      // تایید ناموفق
      await transaction.fail(verifyResult.error);
      return redirect(`/dashboard/wallet?payment=failed&reason=${encodeURIComponent(verifyResult.error)}`);
    }

    // پرداخت موفق!
    // به‌روزرسانی تراکنش
    await transaction.complete({
      refId: verifyResult.refId,
      cardPan: verifyResult.cardPan ? verifyResult.cardPan.substring(verifyResult.cardPan.length - 4) : null,
      gatewayTransactionId: verifyResult.refId,
    });

    // افزایش موجودی کیف پول
    const wallet = await Wallet.findById(transaction.walletId);
    if (wallet) {
      await wallet.deposit(transaction.amount, {
        transactionId: transaction._id,
        refId: verifyResult.refId,
      });
    }

    // Redirect به صفحه wallet با موفقیت
    return redirect(`/dashboard/wallet?payment=success&ref_id=${verifyResult.refId}&amount=${transaction.amount}`);
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    return redirect('/dashboard/wallet?payment=failed&reason=error');
  }
}

