import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import TopicCategory from '@/lib/models/TopicCategory.model';
import { protectAPI } from '@/lib/middleware/apiProtection';

// GET - دریافت لیست دسته‌بندی‌های موضوع
export async function GET(request) {
  try {
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    
    // فیلترها
    const isActive = searchParams.get('isActive');
    const isVisible = searchParams.get('isVisible');
    const parent = searchParams.get('parent');

    let query = {};

    // فیلتر وضعیت فعال/غیرفعال (اختیاری)
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // فیلتر نمایش عمومی (پیش‌فرض: فقط visible ها)
    if (isVisible !== null && isVisible !== undefined) {
      query.isVisible = isVisible === 'true';
    } else {
      // اگر مشخص نشده، فقط دسته‌های قابل نمایش رو برگردون
      query.isVisible = true;
    }

    // فیلتر دسته اصلی یا زیردسته
    if (parent === 'null' || parent === null) {
      query.parentId = null;
    } else if (parent) {
      query.parentId = parent;
    }

    const categories = await TopicCategory.find(query)
      .populate('parentId', 'title code icon')
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: categories,
      total: categories.length,
    });
  } catch (error) {
    console.error('❌ Error fetching topic categories:', error);
    return NextResponse.json(
      {
        error: 'خطا در دریافت دسته‌بندی‌ها',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

