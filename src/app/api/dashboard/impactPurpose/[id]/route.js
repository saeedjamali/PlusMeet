import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import ImpactPurposeCategory from '@/lib/models/ImpactPurposeCategory.model';
import { authenticate } from '@/lib/middleware/auth';
import { protectAPI } from '@/lib/middleware/apiProtection';
import { logActivity } from '@/lib/models/ActivityLog.model';
import { checkPermission } from '@/lib/middleware/rbac';

// GET - دریافت یک دسته‌بندی
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

    const category = await ImpactPurposeCategory.findById(id)
      .populate('createdBy', 'firstName lastName email phoneNumber')
      .populate('updatedBy', 'firstName lastName email phoneNumber');

    if (!category) {
      return NextResponse.json({ error: 'دسته‌بندی یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('❌ Error fetching impact/purpose category:', error);
    return NextResponse.json(
      {
        error: 'خطا در دریافت دسته‌بندی تأثیر و ارزش',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - ویرایش دسته‌بندی
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
      'impact_purpose_categories',
      'update'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'شما دسترسی به ویرایش دسته‌بندی تأثیر و ارزش ندارید' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    const category = await ImpactPurposeCategory.findById(id);

    if (!category) {
      return NextResponse.json({ error: 'دسته‌بندی یافت نشد' }, { status: 404 });
    }

    // بررسی یکتا بودن کد (اگر تغییر کرده)
    if (body.code && body.code.toUpperCase().trim() !== category.code) {
      const existingCode = await ImpactPurposeCategory.findOne({
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
      message: 'دسته‌بندی تأثیر و ارزش با موفقیت به‌روزرسانی شد',
      data: category,
    });
  } catch (error) {
    console.error('❌ Error updating impact/purpose category:', error);

    if (error.code === 11000) {
      return NextResponse.json({ error: 'کد تکراری است' }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: 'خطا در به‌روزرسانی دسته‌بندی تأثیر و ارزش',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - حذف دسته‌بندی
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
      'impact_purpose_categories',
      'delete'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'شما دسترسی به حذف دسته‌بندی تأثیر و ارزش ندارید' }, { status: 403 });
    }

    const { id } = params;

    const category = await ImpactPurposeCategory.findById(id);

    if (!category) {
      return NextResponse.json({ error: 'دسته‌بندی یافت نشد' }, { status: 404 });
    }

    // بررسی اینکه آیا رویدادی استفاده می‌کند
    if (category.eventsCount > 0) {
      return NextResponse.json(
        {
          error: `این دسته‌بندی در ${category.eventsCount} رویداد استفاده شده است و نمی‌توان آن را حذف کرد`,
        },
        { status: 400 }
      );
    }

    await ImpactPurposeCategory.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'دسته‌بندی تأثیر و ارزش با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('❌ Error deleting impact/purpose category:', error);
    return NextResponse.json(
      {
        error: 'خطا در حذف دسته‌بندی تأثیر و ارزش',
        details: error.message,
      },
      { status: 500 }
    );
  }
}



