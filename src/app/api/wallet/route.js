import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Wallet from '@/lib/models/Wallet.model';
import { authenticate } from '@/lib/middleware/auth';
import { protectAPI } from '@/lib/middleware/apiProtection';

/**
 * GET /api/wallet
 * دریافت اطلاعات کیف پول کاربر
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

    // پیدا کردن یا ایجاد کیف پول
    const wallet = await Wallet.findOrCreateForUser(userId);

    return NextResponse.json({
      success: true,
      data: wallet.toPublicJSON(),
    });
  } catch (error) {
    console.error('❌ Error fetching wallet:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در دریافت اطلاعات کیف پول',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

