import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import TopicCategory from '@/lib/models/TopicCategory.model';
import { authenticate } from '@/lib/middleware/auth';
import { protectAPI } from '@/lib/middleware/apiProtection';
import { logActivity } from '@/lib/models/ActivityLog.model';
import { checkPermission } from '@/lib/middleware/rbac';

// GET - لیست دسته‌بندی‌ها
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

    // بررسی احراز هویت
    const authResult = await authenticate(request, { requireCSRF: false });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'لطفا وارد شوید' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'tree'; // tree, flat, table
    const parentId = searchParams.get('parentId');
    const level = searchParams.get('level');
    const isActive = searchParams.get('isActive');
    const isVisible = searchParams.get('isVisible');
    const search = searchParams.get('search');

    // ساخت query
    const query = {};

    if (parentId === 'root') {
      query.parentId = null;
    } else if (parentId) {
      query.parentId = parentId;
    }

    if (level) {
      query.level = parseInt(level);
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (isVisible !== null && isVisible !== undefined) {
      query.isVisible = isVisible === 'true';
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    if (view === 'tree') {
      // دریافت تمام دسته‌بندی‌ها
      const allCategories = await TopicCategory.find(query)
        .populate('createdBy', 'firstName lastName email phoneNumber userType state')
        .populate('updatedBy', 'firstName lastName email phoneNumber userType state')
        .sort({ level: 1, order: 1, createdAt: -1 })
        .lean();

      // ساخت ساختار درختی
      const buildTree = (items, parentId = null) => {
        return items
          .filter((item) => {
            if (parentId === null) {
              return item.parentId === null || item.parentId === undefined;
            }
            return item.parentId && item.parentId.toString() === parentId.toString();
          })
          .map((item) => ({
            ...item,
            children: buildTree(items, item._id),
          }));
      };

      const tree = buildTree(allCategories);

      return NextResponse.json({
        success: true,
        data: tree,
        count: allCategories.length,
        view: 'tree',
      });
    } else {
      // نمایش صاف (flat)
      const categories = await TopicCategory.find(query)
        .populate('createdBy', 'firstName lastName email phoneNumber userType state')
        .populate('updatedBy', 'firstName lastName email phoneNumber userType state')
        .populate('parentId', 'title slug')
        .sort({ level: 1, order: 1, createdAt: -1 })
        .lean();

      return NextResponse.json({
        success: true,
        data: categories,
        count: categories.length,
        view: 'flat',
      });
    }
  } catch (error) {
    console.error('❌ Error fetching topic categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در دریافت دسته‌بندی‌ها',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - ایجاد دسته‌بندی جدید
export async function POST(request) {
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
      'topic_categories',
      'create'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'شما دسترسی به ایجاد دسته‌بندی ندارید' }, { status: 403 });
    }

    const body = await request.json();

    // اعتبارسنجی
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json({ error: 'عنوان دسته‌بندی الزامی است' }, { status: 400 });
    }

    // بررسی parent اگر وجود داشته باشد
    if (body.parentId) {
      const parentExists = await TopicCategory.findById(body.parentId);
      if (!parentExists) {
        return NextResponse.json({ error: 'دسته‌بندی والد یافت نشد' }, { status: 404 });
      }
      if (!parentExists.isActive) {
        return NextResponse.json(
          { error: 'دسته‌بندی والد غیرفعال است' },
          { status: 400 }
        );
      }
    }

    // ایجاد دسته‌بندی جدید
    const categoryData = {
      title: body.title.trim(),
      description: body.description?.trim() || '',
      parentId: body.parentId || null,
      icon: body.icon || '📁',
      baseColor: body.baseColor || '#F4A325',
      mood: body.mood || 'خلاقیت',
      usage: body.usage?.trim() || '',
      isActive: body.isActive !== undefined ? body.isActive : true,
      isVisible: body.isVisible !== undefined ? body.isVisible : true,
      order: body.order || 0,
      createdBy: authResult.user.id,
    };

    // کد (اختیاری - اگر وارد نشده، در pre-validate hook ساخته می‌شود)
    if (body.code && body.code.trim()) {
      categoryData.code = body.code.toUpperCase().trim();
    }

    // گرادیانت (اختیاری)
    if (body.gradient) {
      categoryData.gradient = {
        start: body.gradient.start || body.baseColor,
        end: body.gradient.end || body.baseColor,
        direction: body.gradient.direction || 'to-right',
      };
    }

    // تگ‌ها (اختیاری)
    if (body.tags && Array.isArray(body.tags)) {
      categoryData.metadata = {
        tags: body.tags,
      };
    }

    const newCategory = new TopicCategory(categoryData);
    await newCategory.save();

    // Populate برای نمایش اطلاعات کامل
    await newCategory.populate('createdBy', 'firstName lastName email phoneNumber userType state');
    if (newCategory.parentId) {
      await newCategory.populate('parentId', 'title slug level');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'دسته‌بندی با موفقیت ایجاد شد',
        data: newCategory,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating topic category:', error);

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
        error: 'خطا در ایجاد دسته‌بندی',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

