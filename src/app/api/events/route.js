import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Event from '@/lib/models/Event.model';
import { authenticate } from '@/lib/middleware/auth';
import { protectAPI } from '@/lib/middleware/apiProtection';
import { logActivity } from '@/lib/models/ActivityLog.model';
import { convertDatesInObject } from '@/lib/utils/dateConverter';
import {
  buildPublicEventsQuery,
  parseEventFilters,
  defaultEventPopulate,
  publicEventFields,
} from '@/lib/helpers/eventQueries';

// GET - لیست رویدادها (با فیلتر و جستجو)
export async function GET(request) {
  try {
    // API Protection (بدون authentication اجباری برای لیست عمومی)
    const protection = await protectAPI(request);
    if (!protection.success) {
      // اگر API protection fail شد، ادامه می‌دهیم (برای لیست عمومی)
      // فقط برای rate limiting و امنیت پایه
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    
    // پارامترهای صفحه‌بندی
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    // پارامترهای خاص (برای APIهای داخلی - نیاز به authentication دارند)
    const status = searchParams.get('status');
    const creator = searchParams.get('creator');

    // برای query های خاص (status یا creator) نیاز به authentication داریم
    if ((status && status !== 'approved') || creator) {
      if (!protection.success) {
        return NextResponse.json(
          { error: 'لطفاً وارد سیستم شوید' },
          { status: 401 }
        );
      }
    }

    let query = {};

    // اگر status یا creator مشخص شده باشد (برای APIهای داخلی)
    if (status || creator) {
      if (status) query.status = status;
      if (creator) query.creator = creator;
    } else {
      // برای لیست عمومی (meetmap, meetwall) فقط رویدادهای public
      const filters = parseEventFilters(searchParams);
      query = buildPublicEventsQuery(filters);
    }

    // اجرای query
    const events = await Event.find(query)
      .populate(defaultEventPopulate)
      .select(publicEventFields)
      .sort({ 'schedule.startDate': 1, createdAt: -1 }) // مرتب‌سازی بر اساس تاریخ شروع
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Event.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        applied: Object.keys(parseEventFilters(searchParams)).length > 0,
        count: Object.keys(parseEventFilters(searchParams)).length,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    return NextResponse.json(
      {
        error: 'خطا در دریافت رویدادها',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - ایجاد رویداد جدید (مرحله اول)
export async function POST(request) {
  try {
    await dbConnect();

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

    const body = await request.json();

    // اعتبارسنجی مرحله اول
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json(
        { error: 'عنوان رویداد الزامی است' },
        { status: 400 }
      );
    }

    if (!body.description || body.description.trim() === '') {
      return NextResponse.json(
        { error: 'توضیحات رویداد الزامی است' },
        { status: 400 }
      );
    }

    if (!body.topicCategory) {
      return NextResponse.json(
        { error: 'انتخاب دسته‌بندی موضوع الزامی است' },
        { status: 400 }
      );
    }

    // ایجاد رویداد
    // توجه: status باید از body بیاد. اگر نیومد، پیش‌فرض "draft" است (برای ذخیره پیش‌نویس)
    const eventData = {
      title: body.title.trim(),
      description: body.description.trim(),
      topicCategory: body.topicCategory,
      topicSubcategory: body.topicSubcategory || null,
      images: body.images || [],
      coverImage: body.coverImage || null,
      creator: authResult.user.id,
      status: body.status || 'draft', // ✅ از body می‌گیریم (pending برای submit نهایی، draft برای پیش‌نویس)
      currentStep: body.currentStep || 'general',
      completedSteps: body.completedSteps || ['general'],
      
      // تمام فیلدهای اضافی
      speakers: body.speakers || [],
      organizer: body.organizer,
      contactInfo: body.contactInfo,
      createGroupChat: body.createGroupChat || false,
      hasCertificate: body.hasCertificate || false,
      certificateSettings: body.certificateSettings,
      formatMode: body.formatMode,
      location: body.location,
      onlinePlatform: body.onlinePlatform,
      onlineLink: body.onlineLink,
      capacity: body.capacity,
      participationType: body.participationType,
      ticket: body.ticket,
      approval: body.approval,
      invitation: body.invitation,
      schedule: body.schedule,
      startDate: body.schedule?.startDate || body.startDate,
      endDate: body.schedule?.endDate || body.endDate,
      registrationDeadline: body.registrationDeadline,
      visibility: body.visibility,
      eligibility: body.eligibility,
      targetAudience: body.targetAudience,
      tags: body.tags,
      keywords: body.keywords,
      intent: body.intent,
      emotional: body.emotional,
      audienceType: body.audienceType,
      socialDynamics: body.socialDynamics,
      impactPurpose: body.impactPurpose,
    };

    // ✅ فقط اگر inviteCode وجود داشت، inviteToken را set کن
    // اگر نداشت، اصلاً فیلد را set نکن (تا null ذخیره نشود)
    if (body.invitation?.inviteCode) {
      eventData.inviteToken = body.invitation.inviteCode;
    }

    // تبدیل تاریخ‌های فارسی به میلادی
    const dateFields = [
      'startDate',
      'endDate',
      'registrationDeadline',
      'ticket.saleEndDate',
      'schedule.startDate',
      'schedule.endDate',
    ];
    
    const convertedEventData = convertDatesInObject(eventData, dateFields);

    const event = new Event(convertedEventData);
    await event.save();

    // لاگ فعالیت
    await logActivity(authResult.user.id, 'event.create', {
      targetType: 'Event',
      targetId: event._id.toString(),
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: {
        eventTitle: event.title,
        status: event.status,
      },
    });

    // Populate برای نمایش
    await event.populate('topicCategory', 'title code icon');
    if (event.topicSubcategory) {
      await event.populate('topicSubcategory', 'title code icon');
    }
    await event.populate('formatMode', 'title code icon');
    await event.populate('participationType', 'title code icon');

    // ✅ تبدیل به plain object و اطمینان از وجود _id
    const eventResponse = event.toObject();
    eventResponse._id = event._id.toString();

    console.log("✅ Event created with ID:", eventResponse._id);

    return NextResponse.json(
      {
        success: true,
        message: 'رویداد با موفقیت ایجاد شد',
        data: eventResponse,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating event:', error);
    return NextResponse.json(
      {
        error: 'خطا در ایجاد رویداد',
        details: error.message,
      },
      { status: 500 }
    );
  }
}












