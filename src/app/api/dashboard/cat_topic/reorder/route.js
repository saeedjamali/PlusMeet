import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import TopicCategory from '@/lib/models/TopicCategory.model';
import { authenticate } from '@/lib/middleware/auth';
import { protectAPI } from '@/lib/middleware/apiProtection';
import { logActivity } from '@/lib/models/ActivityLog.model';
import { checkPermission } from '@/lib/middleware/rbac';

/**
 * POST /api/dashboard/cat_topic/reorder
 * جابجایی و تغییر ترتیب دسته‌بندی‌ها (Drag & Drop)
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
    const { categoryId, newParentId, newOrder, action } = body;

    // اعتبارسنجی
    if (!categoryId) {
      return NextResponse.json(
        { error: 'شناسه دسته‌بندی الزامی است' },
        { status: 400 }
      );
    }

    const category = await TopicCategory.findById(categoryId);
    if (!category) {
      return NextResponse.json(
        { error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      );
    }

    // اگر action مشخص نیست، از تغییرات استنباط می‌کنیم
    const isMoving = newParentId !== undefined && newParentId !== category.parentId?.toString();
    const isReordering = newOrder !== undefined && newOrder !== category.order;

    if (!isMoving && !isReordering) {
      return NextResponse.json(
        { error: 'هیچ تغییری ایجاد نشده است' },
        { status: 400 }
      );
    }

    // بررسی circular reference (اگر parent تغییر می‌کند)
    if (isMoving && newParentId) {
      // بررسی اینکه newParent خود category یا فرزندان آن نباشد
      if (newParentId === categoryId) {
        return NextResponse.json(
          { error: 'دسته‌بندی نمی‌تواند والد خودش باشد' },
          { status: 400 }
        );
      }

      // پیدا کردن همه فرزندان
      const getAllDescendants = async (parentId) => {
        const descendants = [];
        const children = await TopicCategory.find({ parentId });
        
        for (const child of children) {
          descendants.push(child._id.toString());
          const grandChildren = await getAllDescendants(child._id);
          descendants.push(...grandChildren);
        }
        
        return descendants;
      };

      const descendants = await getAllDescendants(categoryId);
      if (descendants.includes(newParentId)) {
        return NextResponse.json(
          { error: 'دسته‌بندی نمی‌تواند به زیرمجموعه خود منتقل شود' },
          { status: 400 }
        );
      }

      // بررسی وجود parent جدید
      const newParent = await TopicCategory.findById(newParentId);
      if (!newParent) {
        return NextResponse.json(
          { error: 'دسته‌بندی والد یافت نشد' },
          { status: 404 }
        );
      }

      if (!newParent.isActive) {
        return NextResponse.json(
          { error: 'دسته‌بندی والد غیرفعال است' },
          { status: 400 }
        );
      }
    }

    // ذخیره مقادیر قبلی برای rollback
    const oldParentId = category.parentId;
    const oldOrder = category.order;

    try {
      // تغییر parent
      if (isMoving) {
        category.parentId = newParentId || null;
        // level به صورت خودکار در pre-save hook محاسبه می‌شود
      }

      // تغییر order
      if (isReordering) {
        // ابتدا order های بین oldOrder و newOrder را جابجا می‌کنیم
        const minOrder = Math.min(oldOrder, newOrder);
        const maxOrder = Math.max(oldOrder, newOrder);
        
        if (oldOrder < newOrder) {
          // حرکت به پایین - سایر آیتم‌ها یک واحد بالا می‌روند
          await TopicCategory.updateMany(
            {
              parentId: category.parentId,
              order: { $gt: oldOrder, $lte: newOrder },
              _id: { $ne: categoryId },
            },
            { $inc: { order: -1 } }
          );
        } else {
          // حرکت به بالا - سایر آیتم‌ها یک واحد پایین می‌روند
          await TopicCategory.updateMany(
            {
              parentId: category.parentId,
              order: { $gte: newOrder, $lt: oldOrder },
              _id: { $ne: categoryId },
            },
            { $inc: { order: 1 } }
          );
        }

        category.order = newOrder;
      }

      // اگر parent تغییر کرده، order در parent جدید تنظیم می‌شود
      if (isMoving) {
        // پیدا کردن بیشترین order در parent جدید
        const siblingsInNewParent = await TopicCategory.find({
          parentId: newParentId || null,
          _id: { $ne: categoryId },
        }).sort({ order: -1 }).limit(1);

        if (siblingsInNewParent.length > 0) {
          category.order = siblingsInNewParent[0].order + 1;
        } else {
          category.order = 0;
        }

        // نرمال‌سازی order های parent قبلی
        await normalizeOrders(oldParentId);
      }

      category.updatedBy = authResult.user.id;
      await category.save();

      // نرمال‌سازی order های parent جدید
      await normalizeOrders(category.parentId);

      // Populate برای نمایش
      await category.populate('createdBy', 'firstName lastName email phoneNumber userType state');
      await category.populate('updatedBy', 'firstName lastName email phoneNumber userType state');
      if (category.parentId) {
        await category.populate('parentId', 'title slug level');
      }

      return NextResponse.json({
        success: true,
        message: 'دسته‌بندی با موفقیت جابجا شد',
        data: category,
      });
    } catch (error) {
      console.error('❌ Error during reorder:', error);
      
      // Rollback در صورت خطا
      category.parentId = oldParentId;
      category.order = oldOrder;
      await category.save();

      throw error;
    }
  } catch (error) {
    console.error('❌ Error reordering category:', error);

    return NextResponse.json(
      {
        error: 'خطا در جابجایی دسته‌بندی',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * نرمال‌سازی order های یک parent (0, 1, 2, 3, ...)
 */
async function normalizeOrders(parentId) {
  const siblings = await TopicCategory.find({
    parentId: parentId || null,
  }).sort({ order: 1 });

  for (let i = 0; i < siblings.length; i++) {
    if (siblings[i].order !== i) {
      siblings[i].order = i;
      await siblings[i].save();
    }
  }
}

