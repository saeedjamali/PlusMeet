import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import TopicCategory from '@/lib/models/TopicCategory.model';
import { authenticate } from '@/lib/middleware/auth';
import { protectAPI } from '@/lib/middleware/apiProtection';
import { logActivity } from '@/lib/models/ActivityLog.model';
import { checkPermission } from '@/lib/middleware/rbac';
import * as XLSX from 'xlsx';

// POST - آپلود دسته‌بندی‌ها از Excel
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
      return NextResponse.json({ error: authResult.error || 'لطفا وارد شوید' }, { status: 401 });
    }

    // بررسی دسترسی
    const hasPermission = await checkPermission(
      authResult.user.id,
      'topic_categories',
      'create'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'شما دسترسی به ایجاد دسته‌بندی ندارید' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'فایل Excel یافت نشد' }, { status: 400 });
    }

    // بررسی فرمت فایل
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'فقط فایل‌های Excel (.xlsx, .xls) مجاز هستند' },
        { status: 400 }
      );
    }

    // خواندن فایل Excel
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'فایل Excel خالی است یا فرمت آن اشتباه است' },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // پردازش هر ردیف
    for (const row of data) {
      try {
        // اعتبارسنجی
        if (!row.title || row.title.toString().trim() === '') {
          throw new Error('عنوان الزامی است');
        }

        // پیدا کردن parent اگر وجود دارد
        let parentId = null;
        if (row.parentTitle && row.parentTitle.toString().trim() !== '') {
          const parent = await TopicCategory.findOne({ 
            title: row.parentTitle.toString().trim() 
          });
          if (parent) {
            parentId = parent._id;
          } else {
            throw new Error(`والد "${row.parentTitle}" یافت نشد`);
          }
        }

        // ساخت داده دسته‌بندی
        const categoryData = {
          title: row.title.toString().trim(),
          description: row.description ? row.description.toString().trim() : '',
          parentId,
          icon: row.icon ? row.icon.toString() : '📁',
          baseColor: row.baseColor ? row.baseColor.toString() : '#F4A325',
          mood: row.mood ? row.mood.toString() : 'خلاقیت',
          usage: row.usage ? row.usage.toString().trim() : '',
          isActive: row.isActive !== 'false' && row.isActive !== false,
          isVisible: row.isVisible !== 'false' && row.isVisible !== false,
          order: row.order ? parseInt(row.order) : 0,
          createdBy: authResult.user.id,
        };

        // کد (اختیاری - اگر وارد نشده، در pre-validate hook ساخته می‌شود)
        if (row.code && row.code.toString().trim()) {
          categoryData.code = row.code.toString().toUpperCase().trim();
        }

        // گرادیانت (اختیاری)
        if (row.gradientStart && row.gradientEnd) {
          categoryData.gradient = {
            start: row.gradientStart.toString(),
            end: row.gradientEnd.toString(),
            direction: row.gradientDirection ? row.gradientDirection.toString() : 'to-right',
          };
        }

        // تگ‌ها (اختیاری)
        if (row.tags) {
          const tagsString = row.tags.toString();
          const tagsArray = tagsString.split(',').map((tag) => tag.trim()).filter((tag) => tag);
          if (tagsArray.length > 0) {
            categoryData.metadata = {
              tags: tagsArray,
            };
          }
        }

        // ایجاد دسته‌بندی
        const newCategory = new TopicCategory(categoryData);
        await newCategory.save();
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: row.title ? row.title.toString() : 'ردیف نامشخص',
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.success} دسته‌بندی با موفقیت ایجاد شد`,
      results,
    });
  } catch (error) {
    console.error('❌ Error uploading Excel:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در آپلود فایل',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET - دانلود template Excel
export async function GET(request) {
  try {
    // داده‌های نمونه برای template
    const sampleData = [
      {
        title: 'فرهنگی و هنری',
        code: 'CULTURE_ART',
        description: 'رویدادهای فرهنگی، هنری و ادبی',
        parentTitle: '',
        icon: '🎭',
        baseColor: '#F4A325',
        gradientStart: '#F4A325',
        gradientEnd: '#F59E0B',
        gradientDirection: 'to-right',
        mood: 'خلاقیت',
        usage: 'رویدادهای فرهنگی و هنری',
        isActive: 'true',
        isVisible: 'true',
        order: '0',
        tags: 'فرهنگی,هنری,ادبی',
      },
      {
        title: 'موسیقی',
        code: 'MUSIC',
        description: 'کنسرت، اجرا، موسیقی سنتی و مدرن',
        parentTitle: 'فرهنگی و هنری',
        icon: '🎵',
        baseColor: '#10B981',
        gradientStart: '',
        gradientEnd: '',
        gradientDirection: '',
        mood: 'هیجان',
        usage: 'کنسرت‌ها و اجراهای موسیقی',
        isActive: 'true',
        isVisible: 'true',
        order: '1',
        tags: 'موسیقی,کنسرت',
      },
      {
        title: 'سینما و فیلم',
        code: '',
        description: 'اکران، نقد، آموزش فیلمسازی',
        parentTitle: 'فرهنگی و هنری',
        icon: '🎬',
        baseColor: '#3B82F6',
        gradientStart: '',
        gradientEnd: '',
        gradientDirection: '',
        mood: 'تفکر',
        usage: 'اکران و نقد فیلم',
        isActive: 'true',
        isVisible: 'true',
        order: '2',
        tags: 'سینما,فیلم,اکران',
      },
    ];

    // ساخت workbook
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories');

    // تنظیم عرض ستون‌ها
    const columnWidths = [
      { wch: 20 }, // title
      { wch: 15 }, // code
      { wch: 40 }, // description
      { wch: 20 }, // parentTitle
      { wch: 5 },  // icon
      { wch: 10 }, // baseColor
      { wch: 10 }, // gradientStart
      { wch: 10 }, // gradientEnd
      { wch: 15 }, // gradientDirection
      { wch: 12 }, // mood
      { wch: 30 }, // usage
      { wch: 8 },  // isActive
      { wch: 8 },  // isVisible
      { wch: 8 },  // order
      { wch: 20 }, // tags
    ];
    worksheet['!cols'] = columnWidths;

    // تبدیل به buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // برگرداندن فایل
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="topic-categories-template.xlsx"',
      },
    });
  } catch (error) {
    console.error('❌ Error generating template:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در ساخت template',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

