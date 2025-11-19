import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import EventReport from "@/lib/models/EventReport.model";
import { protectApi } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";

// Import models برای populate
import "@/lib/models/User.model";
import "@/lib/models/Event.model";

/**
 * GET /api/dashboard/eventsReport
 * دریافت لیست گزارشات (برای مدیران)
 */
export async function GET(request) {
  try {
    await dbConnect();

    const protection = await protectApi(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    // TODO: بررسی نقش مدیر
    const userId = protection.user.id;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    let query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    const reports = await EventReport.find(query)
      .populate("reporter", "firstName lastName displayName avatar email")
      .populate("event", "title slug status creator")
      .populate("adminResponse.respondedBy", "firstName lastName displayName")
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await EventReport.countDocuments(query);

    // آمار
    const stats = {
      pending: await EventReport.countDocuments({ status: "pending" }),
      reviewing: await EventReport.countDocuments({ status: "reviewing" }),
      resolved: await EventReport.countDocuments({ status: "resolved" }),
      rejected: await EventReport.countDocuments({ status: "rejected" }),
      closed: await EventReport.countDocuments({ status: "closed" }),
      total: await EventReport.countDocuments(),
    };

    // تبدیل _id به string
    const reportsData = reports.map((report) => ({
      ...report,
      _id: report._id.toString(),
      reporter: report.reporter
        ? {
            ...report.reporter,
            _id: report.reporter._id.toString(),
          }
        : null,
      event: report.event
        ? {
            ...report.event,
            _id: report.event._id.toString(),
          }
        : null,
    }));

    // لاگ فعالیت
    await logActivity(userId, "report.list", {
      targetType: "EventReport",
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: { total, page, limit, status, priority, category },
    });

    return NextResponse.json({
      success: true,
      data: reportsData,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("❌ Error fetching reports:", error);
    return NextResponse.json(
      { error: "خطا در دریافت گزارشات", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dashboard/eventsReport
 * پاسخ به گزارش و تغییر وضعیت
 */
export async function PUT(request) {
  try {
    await dbConnect();

    const protection = await protectApi(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    // TODO: بررسی نقش مدیر
    const userId = protection.user.id;

    const body = await request.json();
    const { reportId, status, priority, responseMessage, action, note } = body;

    if (!reportId) {
      return NextResponse.json(
        { error: "شناسه گزارش الزامی است" },
        { status: 400 }
      );
    }

    const report = await EventReport.findById(reportId);
    if (!report) {
      return NextResponse.json(
        { error: "گزارش یافت نشد" },
        { status: 404 }
      );
    }

    const updateData = {};

    if (status) {
      updateData.status = status;
    }

    if (priority) {
      updateData.priority = priority;
    }

    if (responseMessage || action) {
      updateData.adminResponse = {
        respondedBy: userId,
        respondedAt: new Date(),
        message: responseMessage || "",
        action: action || "no_action",
      };
    }

    if (note) {
      if (!report.notes) {
        report.notes = [];
      }
      report.notes.push({
        addedBy: userId,
        addedAt: new Date(),
        text: note,
      });
      updateData.notes = report.notes;
    }

    const updatedReport = await EventReport.findByIdAndUpdate(
      reportId,
      { $set: updateData },
      { new: true }
    )
      .populate("reporter", "firstName lastName displayName")
      .populate("event", "title slug")
      .lean();

    // لاگ فعالیت
    await logActivity(userId, "report.respond", {
      targetType: "EventReport",
      targetId: reportId,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: {
        newStatus: status,
        action,
        reportCategory: report.category,
      },
    });

    return NextResponse.json({
      success: true,
      message: "پاسخ با موفقیت ارسال شد",
      data: {
        ...updatedReport,
        _id: updatedReport._id.toString(),
      },
    });
  } catch (error) {
    console.error("❌ Error responding to report:", error);
    return NextResponse.json(
      { error: "خطا در پاسخ به گزارش", details: error.message },
      { status: 500 }
    );
  }
}


