import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import FormatModeCategory from '@/lib/models/FormatModeCategory.model';
import { authenticate } from '@/lib/middleware/auth';
import { protectAPI } from '@/lib/middleware/apiProtection';
import { logActivity } from '@/lib/models/ActivityLog.model';
import { checkPermission } from '@/lib/middleware/rbac';

// GET - دریافت یک نوع برگزاری
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

    const { id } = params;

    const category = await FormatModeCategory.findById(id)
      .populate('createdBy', 'firstName lastName email phoneNumber')
      .populate('updatedBy', 'firstName lastName email phoneNumber');

    if (!category) {
      return NextResponse.json({ error: 'نوع برگزاری یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('❌ Error fetching format/mode category:', error);
    return NextResponse.json(
      {
        error: 'خطا در دریافت نوع برگزاری',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - ویرایش نوع برگزاری
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    // بررسی احراز هویت
    const authResult = await authenticate(request, { requireCSRF: false });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'لطفا وارد شوید' }, { status: 401 });
    }

    // بررسی دسترسی
    const hasPermission = await checkPermission(
      authResult.user.id,
      'format_mode_categories',
      'update'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'شما دسترسی به ویرایش نوع برگزاری ندارید' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    const category = await FormatModeCategory.findById(id);

    if (!category) {
      return NextResponse.json({ error: 'نوع برگزاری یافت نشد' }, { status: 404 });
    }

    // بررسی یکتا بودن کد (اگر تغییر کرده)
    if (body.code && body.code.toUpperCase().trim() !== category.code) {
      const existingCode = await FormatModeCategory.findOne({
        code: body.code.toUpperCase().trim(),
        _id: { $ne: id },
      });

      if (existingCode) {
        return NextResponse.json({ error: 'این کد قبلاً استفاده شده است' }, { status: 400 });
      }
    }

    // به‌روزرسانی فیلدها
    if (body.title !== undefined) category.title = body.title.trim();
    if (body.code !== undefined) category.code = body.code.toUpperCase().trim();
    if (body.description !== undefined) category.description = body.description.trim();
    if (body.examples !== undefined) {
      category.examples = Array.isArray(body.examples) 
        ? body.examples.filter(e => e?.trim()) 
        : [];
    }
    if (body.icon !== undefined) category.icon = body.icon;
    if (body.isActive !== undefined) category.isActive = body.isActive;
    if (body.isVisible !== undefined) category.isVisible = body.isVisible;
    if (body.order !== undefined) category.order = body.order;

    category.updatedBy = authResult.user.id;
    await category.save();

    // Populate برای نمایش
    await category.populate('createdBy', 'firstName lastName email phoneNumber');
    await category.populate('updatedBy', 'firstName lastName email phoneNumber');

    return NextResponse.json({
      success: true,
      message: 'نوع برگزاری با موفقیت به‌روزرسانی شد',
      data: category,
    });
  } catch (error) {
    console.error('❌ Error updating format/mode category:', error);

    if (error.code === 11000) {
      return NextResponse.json({ error: 'کد تکراری است' }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: 'خطا در به‌روزرسانی نوع برگزاری',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - حذف نوع برگزاری
export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    // بررسی احراز هویت
    const authResult = await authenticate(request, { requireCSRF: false });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'لطفا وارد شوید' }, { status: 401 });
    }

    // بررسی دسترسی
    const hasPermission = await checkPermission(
      authResult.user.id,
      'format_mode_categories',
      'delete'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'شما دسترسی به حذف نوع برگزاری ندارید' }, { status: 403 });
    }

    const { id } = params;

    const category = await FormatModeCategory.findById(id);

    if (!category) {
      return NextResponse.json({ error: 'نوع برگزاری یافت نشد' }, { status: 404 });
    }

    // بررسی اینکه آیا رویدادی استفاده می‌کند
    if (category.eventsCount > 0) {
      return NextResponse.json(
        {
          error: `این نوع برگزاری در ${category.eventsCount} رویداد استفاده شده است و نمی‌توان آن را حذف کرد`,
        },
        { status: 400 }
      );
    }

    await FormatModeCategory.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'نوع برگزاری با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('❌ Error deleting format/mode category:', error);
    return NextResponse.json(
      {
        error: 'خطا در حذف نوع برگزاری',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

