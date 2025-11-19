import { NextResponse } from 'next/server';
import path from 'path';
import { authenticate } from '@/lib/middleware/auth';
import { protectAPI } from '@/lib/middleware/apiProtection';
import { logActivity } from '@/lib/models/ActivityLog.model';
import { saveFormDataFile, ensureUploadDirectories } from '@/lib/utils/fileUpload';

// POST - آپلود تصویر رویداد
export async function POST(request) {
  try {
    // احراز هویت
    const authResult = await authenticate(request, { requireCSRF: false });
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'لطفا وارد شوید' },
        { status: 401 }
      );
    }

    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'فایلی انتخاب نشده است' },
        { status: 400 }
      );
    }

    // تضمین وجود پوشه‌های uploads
    await ensureUploadDirectories();

    // ذخیره فایل با استفاده از utility function
    let fileUrl;
    try {
      fileUrl = await saveFormDataFile(file, 'events', 5); // max 5MB
      console.log(`✅ Event image uploaded: ${fileUrl}`);
    } catch (error) {
      return NextResponse.json(
        { error: error.message || 'خطا در ذخیره فایل' },
        { status: 400 }
      );
    }

    // استخراج نام فایل از URL
    const fileName = fileUrl.split('/').pop();

    // لاگ فعالیت
    await logActivity({
      user: authResult.user.id,
      action: 'event_image_upload',
      category: 'event',
      description: `تصویر رویداد آپلود شد: ${fileName}`,
      metadata: {
        fileName,
        fileSize: file.size,
        fileType: file.type,
      },
      ipAddress: protection.ipAddress,
      userAgent: protection.userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'فایل با موفقیت آپلود شد',
      data: {
        url: fileUrl,
        fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    return NextResponse.json(
      {
        error: 'خطا در آپلود فایل',
        details: error.message,
      },
      { status: 500 }
    );
  }
}


