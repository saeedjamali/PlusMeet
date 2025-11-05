import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import TopicCategory from '@/lib/models/TopicCategory.model';
import { authenticate } from '@/lib/middleware/auth';
import { protectAPI } from '@/lib/middleware/apiProtection';
import { logActivity } from '@/lib/models/ActivityLog.model';
import { checkPermission } from '@/lib/middleware/rbac';

/**
 * POST /api/dashboard/cat_topic/migrate-codes
 * Migration یکباره برای اضافه کردن code به دسته‌های قدیمی
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

    // بررسی احراز هویت
    const authResult = await authenticate(request, { requireCSRF: false });
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'لطفا وارد شوید' },
        { status: 401 }
      );
    }

    // بررسی دسترسی (فقط admin)
    const hasPermission = await checkPermission(
      authResult.user.id,
      'topic_categories',
      'update'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'شما دسترسی به این عملیات ندارید' },
        { status: 403 }
      );
    }

    // پیدا کردن دسته‌هایی که code ندارند
    const categoriesWithoutCode = await TopicCategory.find({
      $or: [
        { code: { $exists: false } },
        { code: null },
        { code: '' }
      ]
    });

    console.log(`🔍 Found ${categoriesWithoutCode.length} categories without code`);

    const results = {
      total: categoriesWithoutCode.length,
      updated: 0,
      failed: 0,
      errors: [],
    };

    // به‌روزرسانی هر دسته
    for (const category of categoriesWithoutCode) {
      try {
        // فقط save می‌کنیم - pre-validate hook خودش code می‌سازه
        await category.save();
        results.updated++;
        console.log(`✅ Updated: ${category.title} → ${category.code}`);
      } catch (error) {
        results.failed++;
        results.errors.push({
          id: category._id,
          title: category.title,
          error: error.message,
        });
        console.error(`❌ Failed: ${category.title}`, error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration کامل شد. ${results.updated} دسته به‌روز شدند.`,
      results,
    });
  } catch (error) {
    console.error('❌ Error in migration:', error);
    return NextResponse.json(
      {
        error: 'خطا در migration',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

