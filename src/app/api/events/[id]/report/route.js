import { NextResponse } from "next/server";
import path from "path";
import dbConnect from "@/lib/db/mongodb";
import EventReport from "@/lib/models/EventReport.model";
import Event from "@/lib/models/Event.model";
import { protectApi } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";
import { saveFormDataFile, ensureUploadDirectories } from "@/lib/utils/fileUpload";

/**
 * POST /api/events/[id]/report
 * ارسال گزارش تخلف
 */
export async function POST(request, { params }) {
  try {
    await dbConnect();

    const protection = await protectApi(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    const userId = protection.user.id;
    const eventId = params.id;

    // بررسی وجود رویداد
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "رویداد یافت نشد" },
        { status: 404 }
      );
    }

    // دریافت فرم data
    const formData = await request.formData();
    const category = formData.get("category");
    const title = formData.get("title");
    const description = formData.get("description");
    const images = formData.getAll("images");

    // اعتبارسنجی
    if (!category || !title || !description) {
      return NextResponse.json(
        { error: "دسته‌بندی، عنوان و توضیحات الزامی است" },
        { status: 400 }
      );
    }

    // تضمین وجود پوشه‌های uploads
    await ensureUploadDirectories();

    // آپلود تصاویر
    const uploadedImages = [];
    if (images && images.length > 0) {
      for (const image of images) {
        if (image && image.size > 0) {
          try {
            const imageUrl = await saveFormDataFile(image, 'reports', 3); // max 3MB
            uploadedImages.push({
              url: imageUrl,
              alt: title,
            });
            console.log(`✅ Report image uploaded: ${imageUrl}`);
          } catch (error) {
            console.error("Error uploading report image:", error);
            // ادامه می‌دهیم حتی اگر یک تصویر آپلود نشد
          }
        }
      }
    }

    // ایجاد گزارش
    const report = await EventReport.create({
      reporter: userId,
      event: eventId,
      category,
      title,
      description,
      images: uploadedImages,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    // لاگ فعالیت
    await logActivity(userId, "event.report", {
      targetType: "Event",
      targetId: eventId,
      ipAddress: report.ipAddress,
      userAgent: report.userAgent,
      metadata: {
        eventTitle: event.title,
        reportCategory: category,
        reportId: report._id.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "گزارش شما با موفقیت ارسال شد و به زودی بررسی خواهد شد",
      data: {
        _id: report._id.toString(),
        status: report.status,
      },
    });
  } catch (error) {
    console.error("❌ Error creating report:", error);
    return NextResponse.json(
      { error: "خطا در ارسال گزارش", details: error.message },
      { status: 500 }
    );
  }
}

