import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import TopicCategory from '@/lib/models/TopicCategory.model';
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

    const category = await TopicCategory.findById(id)
      .populate('createdBy', 'firstName lastName email phoneNumber userType state')
      .populate('updatedBy', 'firstName lastName email phoneNumber userType state')
      .populate('parentId', 'title slug level icon')
      .lean();

    if (!category) {
      return NextResponse.json({ error: 'دسته‌بندی یافت نشد' }, { status: 404 });
    }

    // دریافت فرزندان
    const children = await TopicCategory.find({ parentId: id })
      .select('title slug level icon isActive isVisible')
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // دریافت مسیر کامل (breadcrumb)
    const path = [];
    let current = category;
    path.push(current);

    while (current.parentId) {
      current = await TopicCategory.findById(current.parentId).lean();
      if (current) {
        path.unshift(current);
      } else {
        break;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...category,
        children,
        path,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching topic category:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در دریافت دسته‌بندی',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - به‌روزرسانی دسته‌بندی
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;

    // بررسی احراز هویت
    const authResult = await authenticate(request, { requireCSRF: false });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'لطفا وارد شوید' }, { status: 401 });
    }

    // بررسی دسترسی
    const hasPermission = await checkPermission(
      authResult.user.id,
      'topic_categories',
      'update'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'شما دسترسی به ویرایش دسته‌بندی ندارید' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // یافتن دسته‌بندی
    const category = await TopicCategory.findById(id);
    if (!category) {
      return NextResponse.json({ error: 'دسته‌بندی یافت نشد' }, { status: 404 });
    }

    // اعتبارسنجی parent جدید
    if (body.parentId && body.parentId !== category.parentId?.toString()) {
      // جلوگیری از انتساب به خودش
      if (body.parentId === id) {
        return NextResponse.json(
          { error: 'نمی‌توان دسته‌بندی را به خودش متصل کرد' },
          { status: 400 }
        );
      }

      // بررسی وجود parent جدید
      const newParent = await TopicCategory.findById(body.parentId);
      if (!newParent) {
        return NextResponse.json({ error: 'دسته‌بندی والد یافت نشد' }, { status: 404 });
      }

      // جلوگیری از ایجاد حلقه (circular reference)
      const allChildren = await category.getAllChildren();
      const childrenIds = allChildren.map((c) => c._id.toString());
      if (childrenIds.includes(body.parentId)) {
        return NextResponse.json(
          { error: 'نمی‌توان دسته‌بندی را به یکی از زیردسته‌های خود متصل کرد' },
          { status: 400 }
        );
      }
    }

    // به‌روزرسانی فیلدها
    const updateFields = {
      updatedBy: authResult.user.id,
    };

    if (body.title !== undefined && body.title.trim() !== '') {
      updateFields.title = body.title.trim();
    }
    if (body.description !== undefined) {
      updateFields.description = body.description.trim();
    }
    if (body.parentId !== undefined) {
      updateFields.parentId = body.parentId || null;
    }
    if (body.icon !== undefined) {
      updateFields.icon = body.icon;
    }
    if (body.baseColor !== undefined) {
      updateFields.baseColor = body.baseColor;
    }
    if (body.mood !== undefined) {
      updateFields.mood = body.mood;
    }
    if (body.usage !== undefined) {
      updateFields.usage = body.usage.trim();
    }
    if (body.isActive !== undefined) {
      updateFields.isActive = body.isActive;
    }
    if (body.isVisible !== undefined) {
      updateFields.isVisible = body.isVisible;
    }
    if (body.order !== undefined) {
      updateFields.order = body.order;
    }
    if (body.code !== undefined) {
      // اگر code خالی باشه، null می‌ذاریم (pre-validate hook دوباره می‌سازه)
      updateFields.code = body.code && body.code.trim() 
        ? body.code.toUpperCase().trim() 
        : null;
    }

    // گرادیانت
    if (body.gradient !== undefined) {
      if (body.gradient === null) {
        updateFields.gradient = null;
      } else {
        updateFields.gradient = {
          start: body.gradient.start || updateFields.baseColor || category.baseColor,
          end: body.gradient.end || updateFields.baseColor || category.baseColor,
          direction: body.gradient.direction || 'to-right',
        };
      }
    }

    // تگ‌ها
    if (body.tags !== undefined) {
      updateFields['metadata.tags'] = body.tags;
    }

    // اگر دسته code نداره (رکورد قدیمی)، null بذار تا pre-validate hook code بسازه
    if (!category.code) {
      updateFields.code = null;
    }

    // اعمال تغییرات
    Object.assign(category, updateFields);
    await category.save();

    // Populate برای نمایش
    await category.populate('createdBy', 'firstName lastName email phoneNumber userType state');
    await category.populate('updatedBy', 'firstName lastName email phoneNumber userType state');
    if (category.parentId) {
      await category.populate('parentId', 'title slug level');
    }

    return NextResponse.json({
      success: true,
      message: 'دسته‌بندی با موفقیت به‌روزرسانی شد',
      data: category,
    });
  } catch (error) {
    console.error('❌ Error updating topic category:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: 'دسته‌بندی با این نام قبلاً ثبت شده است',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'خطا در به‌روزرسانی دسته‌بندی',
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

    const { id } = params;

    // بررسی احراز هویت
    const authResult = await authenticate(request, { requireCSRF: false });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'لطفا وارد شوید' }, { status: 401 });
    }

    // بررسی دسترسی
    const hasPermission = await checkPermission(
      authResult.user.id,
      'topic_categories',
      'delete'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'شما دسترسی به حذف دسته‌بندی ندارید' },
        { status: 403 }
      );
    }

    // یافتن دسته‌بندی
    const category = await TopicCategory.findById(id);
    if (!category) {
      return NextResponse.json({ error: 'دسته‌بندی یافت نشد' }, { status: 404 });
    }

    // بررسی وجود زیردسته
    const childrenCount = await TopicCategory.countDocuments({ parentId: id });
    if (childrenCount > 0) {
      return NextResponse.json(
        {
          error: 'نمی‌توان دسته‌بندی با زیردسته حذف کرد. ابتدا زیردسته‌ها را حذف کنید.',
        },
        { status: 400 }
      );
    }

    // TODO: بررسی وجود رویداد با این دسته‌بندی
    // const eventsCount = await Event.countDocuments({ topicCategory: id });

    await TopicCategory.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'دسته‌بندی با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('❌ Error deleting topic category:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در حذف دسته‌بندی',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

